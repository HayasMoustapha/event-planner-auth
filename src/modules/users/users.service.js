const usersRepository = require('./users.repository');
const accessesRepository = require('../accesses/accesses.repository');
const { validateEmail, validatePassword } = require('../../utils/validators');
const { ValidationError, NotFoundError, ConflictError, UnauthorizedError, ForbiddenError } = require('../../utils/app-errors');
const notificationClient = require('../../../../shared/clients/notification-client');
const authService = require('../auth/auth.service');

/**
 * Service métier pour la gestion des utilisateurs
 * Contient la logique business, validation et gestion des erreurs
 */
class UsersService {
  /**
   * Génère un user_code unique (format similaire au service d'identités)
   * @returns {Promise<string>} code unique
   */
  async generateUniqueUserCode() {
    const { connection } = require('../../config/database');
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const userCode = `U${Date.now()}${Math.floor(Math.random() * 100)}`;
      try {
        const result = await connection.query(
          'SELECT id FROM users WHERE user_code = $1 AND deleted_at IS NULL',
          [userCode]
        );
        if (result.rows.length === 0) {
          return userCode;
        }
      } catch (error) {
        // En cas d'erreur DB, retourner quand même un code probable
        return userCode;
      }
      attempts++;
    }

    return `U${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }
  /**
   * Récupère tous les utilisateurs avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Données paginées
   */
  async getAll(options = {}) {
    const { page = 1, limit = 10, search, status, userCode } = options;

    // Validation des paramètres
    if (page < 1) throw new ValidationError('Le numéro de page doit être supérieur à 0', 'PAGE_INVALID');
    if (limit < 1 || limit > 100) throw new ValidationError('La limite doit être entre 1 et 100', 'LIMIT_INVALID');

    // Validation du statut
    if (status && !['active', 'inactive', 'lock'].includes(status)) {
      throw new ValidationError('Statut invalide. Valeurs autorisées: active, inactive, lock', 'STATUS_INVALID');
    }

    // Validation du code utilisateur
    if (userCode !== undefined && userCode !== null && typeof userCode !== 'string') {
      throw new ValidationError('userCode doit être une chaîne de caractères', 'USER_CODE_INVALID');
    }

    // Le filtre par rôle est maintenant géré via la table accesses
    return await usersRepository.findAll({ page, limit, search, status, userCode });
  }

  /**
   * Récupère un utilisateur par son ID
   * @param {number} id - ID de l'utilisateur
   * @param {boolean} includePassword - Inclure le mot de passe (pour authentification)
   * @returns {Promise<Object>} Données de l'utilisateur
   */
  async getById(id, includePassword = false) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new ValidationError('ID d\'utilisateur invalide', 'USER_ID_INVALID');
    }

    const user = await usersRepository.findById(numericId, includePassword);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Récupère un utilisateur par son email
   * @param {string} email - Email de l'utilisateur
   * @param {boolean} includePassword - Inclure le mot de passe
   * @returns {Promise<Object>} Données de l'utilisateur
   */
  async getByEmail(email, includePassword = false) {
    if (!email) {
      throw new ValidationError('Email requis', 'EMAIL_REQUIRED');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Format d\'email invalide', 'EMAIL_INVALID');
    }

    const user = await usersRepository.findByEmail(email, includePassword);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé avec cet email', 'USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Récupère un utilisateur par son username
   * @param {string} username - Username de l'utilisateur
   * @param {boolean} includePassword - Inclure le mot de passe
   * @returns {Promise<Object>} Données de l'utilisateur
   */
  async getByUsername(username, includePassword = false) {
    if (!username) {
      throw new ValidationError('Username requis', 'USERNAME_REQUIRED');
    }

    // Validation du format du username
    if (username.length < 3 || username.length > 50) {
      throw new ValidationError('Le username doit contenir entre 3 et 50 caractères', 'USERNAME_INVALID');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new ValidationError('Le username ne peut contenir que des lettres, chiffres et underscores', 'USERNAME_FORMAT_INVALID');
    }

    const user = await usersRepository.findByUsername(username, includePassword);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé avec ce username', 'USER_NOT_FOUND');
    }

    return user;
  }

  async create(userData, createdBy = null) {
    const {
      username,
      email,
      password,
      phone = null,
      person_id: personIdInput,  // Ajout pour supporter person_id
      firstName = null,
      lastName = null
    } = userData;
    let person_id = personIdInput;

    // Validation des champs obligatoires
    if (!username || !username.trim()) {
      throw new ValidationError('Le username est obligatoire', 'USERNAME_REQUIRED');
    }
    if (!email || !email.trim()) {
      throw new ValidationError('L\'email est obligatoire', 'EMAIL_REQUIRED');
    }
    if (!password || !password.trim()) {
      throw new ValidationError('Le mot de passe est obligatoire', 'PASSWORD_REQUIRED');
    }
    // user_code est géré par le serveur (génération normalisée)
    const userCode = await this.generateUniqueUserCode();

    // Gestion obligatoire de person_id (contrainte NOT NULL)
    if (!person_id) {
      // Si finalPersonId n'est pas fourni, créer une personne automatiquement
      try {
        const peopleRepository = require('../people/people.repository');
        
        // Utiliser firstName/lastName ou des valeurs par défaut
        const defaultFirstName = firstName || username || 'Utilisateur';
        const defaultLastName = lastName || 'System';
        const defaultEmail = email || `user_${Date.now()}@system.local`;
        
        console.log(' Création automatique de personne pour utilisateur:', {
          firstName: defaultFirstName.trim(),
          lastName: defaultLastName.trim(),
          email: defaultEmail,
          phone: phone || null,
          createdBy
        });
        
        const person = await peopleRepository.create({
          first_name: defaultFirstName.trim(),
          last_name: defaultLastName.trim(),
          email: defaultEmail,
          phone: phone || null,
          createdBy
        });
        person_id = person.id;
        console.log(' Personne créée avec ID:', person_id);
        
      } catch (error) {
        console.error(' Erreur création personne:', error.message);
        throw new Error(`Impossible de créer une personne pour l'utilisateur: ${error.message}`);
      }
    } else {
      // Valider que la personne existe
      try {
        const peopleRepository = require('../people/people.repository');
        const existingPerson = await peopleRepository.findById(person_id);

        if (!existingPerson) {
          throw new ValidationError(`La personne avec ID ${person_id} n'existe pas`, 'PERSON_NOT_FOUND');
        }

        console.log(' Personne existante utilisée:', person_id  );

      } catch (error) {
        console.error(' Erreur validation personne:', error.message);
        // Conserver les erreurs client typées (ex: PERSON_NOT_FOUND) telles quelles
        if (error instanceof ValidationError || error instanceof NotFoundError) {
          throw error;
        }
        throw new Error(`Personne invalide: ${error.message}`);
      }
    }

    // Validation des formats
    if (!validateEmail(email)) {
      throw new ValidationError('Format d\'email invalide', 'EMAIL_INVALID');
    }
    if (!validatePassword(password)) {
      throw new ValidationError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre', 'PASSWORD_WEAK');
    }

    // Validation du username
    if (username.length < 3 || username.length > 50) {
      throw new ValidationError('Le username doit contenir entre 3 et 50 caractères', 'USERNAME_INVALID');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new ValidationError('Le username ne peut contenir que des lettres, chiffres et underscores', 'USERNAME_FORMAT_INVALID');
    }

    // Statut géré par le serveur
    const status = 'active';

    // Nettoyage des données
    const cleanData = {
      username: username.trim().toLowerCase(),
      email: email.toLowerCase().trim(),
      password: password.trim(),
      userCode: userCode.trim(),
      phone: phone ? phone.trim() : null,
      status,
      person_id,
      createdBy
    };

    // Vérification des doublons
    const existingEmail = await usersRepository.findByEmail(cleanData.email);
    if (existingEmail) {
      throw new ConflictError('Un utilisateur avec cet email existe déjà', 'EMAIL_ALREADY_EXISTS');
    }

    const existingUsername = await usersRepository.findByUsername(cleanData.username);
    if (existingUsername) {
      throw new ConflictError('Ce nom d\'utilisateur est déjà utilisé', 'USERNAME_ALREADY_EXISTS');
    }

    // Vérifier si le téléphone est déjà utilisé dans la table users
    if (cleanData.phone) {
      const existingPhone = await usersRepository.findByPhone(cleanData.phone);
      if (existingPhone) {
        throw new ConflictError('Ce numéro de téléphone est déjà utilisé par un autre utilisateur', 'PHONE_ALREADY_EXISTS');
      }
    }

    // Validation de la personne si spécifiée
    if (person_id) {
      const personExists = await this.checkPersonExists(person_id);
      if (!personExists) {
        throw new ValidationError('La personne spécifiée n\'existe pas', 'PERSON_NOT_FOUND');
      }
    }

    return await usersRepository.create(cleanData);
  }

  /**
   * Envoie une notification de bienvenue après création d'utilisateur
   * @param {Object} user - Données de l'utilisateur créé
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendWelcomeNotification(user) {
    try {
      const result = await authService.sendWelcomeNotification(user);
      
      if (!result.success) {
        console.error('Failed to send welcome notification:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending welcome notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie une notification d'activation de compte
   * @param {Object} user - Données de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendAccountActivationNotification(user) {
    try {
      const result = await authService.sendAccountActivationNotification(user);
      
      if (!result.success) {
        console.error('Failed to send account activation notification:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending account activation notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Met à jour un utilisateur avec validation
   * @param {number} id - ID de l'utilisateur
   * @param {Object} updateData - Données à mettre à jour
   * @param {number} updatedBy - ID de l'utilisateur qui modifie
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async update(id, updateData, updatedBy = null) {
    if (!id || id <= 0) {
      throw new ValidationError('ID d\'utilisateur invalide', 'USER_ID_INVALID');
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }

    const {
      username,
      email,
      password,
      phone,
      person_id,
      firstName,
      lastName,
      first_name,
      last_name,
      ui_preferences,
      profile_metadata
    } = updateData;

    // Validation des formats si fournis
    if (email && !validateEmail(email)) {
      throw new ValidationError('Format d\'email invalide', 'EMAIL_INVALID');
    }
    if (password && !validatePassword(password)) {
      throw new ValidationError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre', 'PASSWORD_WEAK');
    }
    if (username) {
      if (username.length < 3 || username.length > 50) {
        throw new ValidationError('Le username doit contenir entre 3 et 50 caractères', 'USERNAME_INVALID');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new ValidationError('Le username ne peut contenir que des lettres, chiffres et underscores', 'USERNAME_FORMAT_INVALID');
      }
    }
    // Nettoyage des données
    const cleanData = {};
    if (username !== undefined) cleanData.username = username.trim().toLowerCase();
    if (email !== undefined) cleanData.email = email.toLowerCase().trim();
    if (password !== undefined) cleanData.password = password.trim();
    if (phone !== undefined) cleanData.phone = phone ? phone.trim() : null;
    if (person_id !== undefined) cleanData.person_id = person_id;
    if (first_name !== undefined || firstName !== undefined) {
      cleanData.first_name = String(first_name ?? firstName ?? '').trim();
    }
    if (last_name !== undefined || lastName !== undefined) {
      cleanData.last_name = String(last_name ?? lastName ?? '').trim();
    }
    if (ui_preferences !== undefined) cleanData.ui_preferences = ui_preferences;
    if (profile_metadata !== undefined) cleanData.profile_metadata = profile_metadata;
    cleanData.updatedBy = updatedBy;

    // Vérification des doublons si email/username modifié
    if (cleanData.email && cleanData.email !== existingUser.email) {
      const existingEmail = await usersRepository.findByEmail(cleanData.email);
      if (existingEmail) {
        throw new ConflictError('Un utilisateur avec cet email existe déjà', 'EMAIL_ALREADY_EXISTS');
      }
    }

    if (cleanData.username && cleanData.username !== existingUser.username) {
      const existingUsername = await usersRepository.findByUsername(cleanData.username);
      if (existingUsername) {
        throw new ConflictError('Ce nom d\'utilisateur est déjà utilisé', 'USERNAME_ALREADY_EXISTS');
      }
    }

    // Vérification des doublons si téléphone modifié
    if (cleanData.phone !== undefined && cleanData.phone !== existingUser.phone) {
      if (cleanData.phone) {
        const existingPhone = await usersRepository.findByPhone(cleanData.phone);
        if (existingPhone) {
          throw new ConflictError('Ce numéro de téléphone est déjà utilisé par un autre utilisateur', 'PHONE_ALREADY_EXISTS');
        }
      }
    }

    // Vérification si le mot de passe a déjà été utilisé
    if (cleanData.password) {
      const passwordAlreadyUsed = await usersRepository.isPasswordAlreadyUsed(id, cleanData.password);
      if (passwordAlreadyUsed) {
        throw new ConflictError('Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.', 'PASSWORD_REUSED');
      }
    }

    return await usersRepository.update(id, cleanData);
  }

  /**
   * Supprime un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async delete(id, deletedBy = null) {
    if (!id || id <= 0) {
      throw new ValidationError('ID d\'utilisateur invalide', 'USER_ID_INVALID');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }

    // Empêcher l'auto-suppression
    return await usersRepository.softDelete(id, deletedBy);
  }

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @param {number} updatedBy - ID de l'utilisateur qui modifie
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async updatePassword(id, currentPassword, newPassword, updatedBy = null) {
    if (!id || id <= 0) {
      throw new ValidationError('ID d\'utilisateur invalide', 'USER_ID_INVALID');
    }
    if (!currentPassword || !currentPassword.trim()) {
      throw new ValidationError('Le mot de passe actuel est requis', 'CURRENT_PASSWORD_REQUIRED');
    }
    if (!newPassword || !newPassword.trim()) {
      throw new ValidationError('Le nouveau mot de passe est requis', 'NEW_PASSWORD_REQUIRED');
    }

    // Validation du nouveau mot de passe
    if (!validatePassword(newPassword)) {
      throw new ValidationError('Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre', 'PASSWORD_WEAK');
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (currentPassword === newPassword) {
      throw new ValidationError('Le nouveau mot de passe doit être différent de l\'ancien', 'PASSWORD_SAME_AS_OLD');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }

    // Vérifier le mot de passe actuel
    const verifiedUser = await usersRepository.verifyPassword(user.email, currentPassword);
    if (!verifiedUser) {
      throw new UnauthorizedError('Mot de passe actuel incorrect', 'CURRENT_PASSWORD_INCORRECT');
    }

    // Vérifier si le nouveau mot de passe a déjà été utilisé
    const passwordAlreadyUsed = await usersRepository.isPasswordAlreadyUsed(id, newPassword);
    if (passwordAlreadyUsed) {
      throw new ConflictError('Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.', 'PASSWORD_REUSED');
    }

    return await usersRepository.updatePassword(id, newPassword, updatedBy);
  }

  /**
   * Authentifie un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Utilisateur authentifié
   */
  async authenticate(email, password) {
    if (!email || !email.trim()) {
      throw new ValidationError('Email requis', 'EMAIL_REQUIRED');
    }
    if (!password || !password.trim()) {
      throw new ValidationError('Mot de passe requis', 'PASSWORD_REQUIRED');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Format d\'email invalide', 'EMAIL_INVALID');
    }

    const user = await usersRepository.verifyPassword(email, password);
    if (!user) {
      throw new UnauthorizedError('Email ou mot de passe incorrect', 'INVALID_CREDENTIALS');
    }

    // Vérifier si le compte est actif
    if (user.status !== 'active') {
      if (user.status === 'lock') {
        throw new ForbiddenError('Ce compte est verrouillé. Veuillez contacter l\'administrateur.', 'ACCOUNT_LOCKED');
      }
      if (user.status === 'inactive') {
        throw new ForbiddenError('Ce compte est désactivé. Veuillez contacter l\'administrateur.', 'ACCOUNT_DISABLED');
      }
    }

    // Mettre à jour la date de dernière connexion
    await usersRepository.updateLastLogin(user.id);

    return user;
  }

  /**
   * Active ou désactive un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {string} status - Nouveau statut
   * @param {number} updatedBy - ID de l'utilisateur qui modifie
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async updateStatus(id, status, updatedBy = null) {
    if (!id || id <= 0) {
      throw new ValidationError('ID d\'utilisateur invalide', 'USER_ID_INVALID');
    }

    if (!['active', 'inactive', 'lock'].includes(status)) {
      throw new ValidationError('Statut invalide. Valeurs autorisées: active, inactive, lock', 'STATUS_INVALID');
    }

    // Empêcher de verrouiller son propre compte
    if (updatedBy && updatedBy === id && status === 'lock') {
      throw new ForbiddenError('Impossible de verrouiller votre propre compte', 'CANNOT_LOCK_SELF');
    }

    return await usersRepository.updateStatus(id, status, updatedBy);
  }

  /**
   * Recherche des utilisateurs par critères multiples
   * @param {Object} criteria - Critères de recherche
   * @returns {Promise<Object>} Résultats paginés
   */
  async search(criteria) {
    const { search, status, userCode, page = 1, limit = 10 } = criteria;

    return await this.getAll({
      search: search?.trim(),
      status,
      userCode,
      page,
      limit
    });
  }

  /**
   * Vérifie si un utilisateur existe (pour validation externe)
   * @param {number} id - ID de l'utilisateur
   * @returns {Promise<boolean>} True si l'utilisateur existe
   */
  async exists(id) {
    if (!id || id <= 0) return false;

    try {
      return await usersRepository.exists(id);
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifie si une personne existe
   * @param {number} personId - ID de la personne
   * @returns {Promise<boolean>} True si la personne existe
   */
  async checkPersonExists(personId) {
    try {
      const peopleRepository = require('../people/people.repository');
      const person = await peopleRepository.findById(personId);
      return !!person;
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupère les statistiques sur les utilisateurs
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    try {
      return await usersRepository.getStats();
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} newPassword - Nouveau mot de passe
   * @param {number} updatedBy - ID de l'utilisateur qui modifie
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async resetPassword(email, newPassword, updatedBy = null) {
    if (!email || !email.trim()) {
      throw new ValidationError('Email requis', 'EMAIL_REQUIRED');
    }
    if (!newPassword || !newPassword.trim()) {
      throw new ValidationError('Le nouveau mot de passe est requis', 'NEW_PASSWORD_REQUIRED');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Format d\'email invalide', 'EMAIL_INVALID');
    }

    if (!validatePassword(newPassword)) {
      throw new ValidationError('Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre', 'PASSWORD_WEAK');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('Aucun utilisateur trouvé avec cet email', 'USER_NOT_FOUND');
    }

    // Vérifier si le nouveau mot de passe a déjà été utilisé
    const passwordAlreadyUsed = await usersRepository.isPasswordAlreadyUsed(user.id, newPassword);
    if (passwordAlreadyUsed) {
      throw new ConflictError('Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.', 'PASSWORD_REUSED');
    }

    return await usersRepository.updatePassword(user.id, newPassword, updatedBy);
  }

  /**
   * Ajoute un rôle à un utilisateur via la table accesses
   * @param {number} userId - ID de l'utilisateur
   * @param {number} roleId - ID du rôle
   * @param {number} createdBy - ID de l'utilisateur qui ajoute le rôle
   * @returns {Promise<Object>} Accès créé
   */
  async addRole(userId, roleId, createdBy = null) {
    if (!userId || userId <= 0) {
      throw new ValidationError('ID d\'utilisateur invalide', 'USER_ID_INVALID');
    }
    if (!roleId || roleId <= 0) {
      throw new ValidationError('ID de rôle invalide', 'ROLE_ID_INVALID');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }

    // Créer l'association utilisateur-rôle
    return await accessesRepository.create({
      userId,
      roleId,
      status: 'active',
      createdBy
    });
  }

  /**
   * Supprime un rôle d'un utilisateur via la table accesses
   * @param {number} userId - ID de l'utilisateur
   * @param {number} roleId - ID du rôle
   * @param {number} deletedBy - ID de l'utilisateur qui supprime le rôle
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async removeRole(userId, roleId, deletedBy = null) {
    if (!userId || userId <= 0) {
      throw new ValidationError('ID d\'utilisateur invalide', 'USER_ID_INVALID');
    }
    if (!roleId || roleId <= 0) {
      throw new ValidationError('ID de rôle invalide', 'ROLE_ID_INVALID');
    }

    // Récupérer l'access existant
    const accesses = await accessesRepository.findByUserId(userId);
    const userAccess = accesses.find(access => access.role_id === roleId);

    if (!userAccess) {
      throw new NotFoundError('L\'utilisateur n\'a pas ce rôle', 'USER_ROLE_NOT_FOUND');
    }

    // Supprimer l'association
    return await accessesRepository.softDelete(userAccess.id, deletedBy);
  }

  /**
   * Récupère les rôles d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {boolean} onlyActive - Uniquement les rôles actifs
   * @returns {Promise<Array>} Liste des rôles de l'utilisateur
   */
  async getUserRoles(userId, onlyActive = true) {
    if (!userId || userId <= 0) {
      throw new ValidationError('ID d\'utilisateur invalide', 'USER_ID_INVALID');
    }

    return await accessesRepository.findByUserId(userId, onlyActive);
  }

  async updateUserCode(userId, userCode, updatedBy = null) {
    if (!userId || userId <= 0) {
      throw new ValidationError('ID d\'utilisateur invalide', 'USER_ID_INVALID');
    }

    // Validation du code utilisateur
    if (!userCode || !userCode.trim()) {
      throw new ValidationError('userCode est requis', 'USER_CODE_REQUIRED');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé', 'USER_NOT_FOUND');
    }

    return await usersRepository.update(userId, { userCode, updatedBy });
  }

  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {number|string} role - ID du rôle ou code du rôle
   * @returns {Promise<boolean>} True si l'utilisateur a le rôle
   */
  async hasRole(userId, role) {
    if (!userId || userId <= 0) {
      return false;
    }

    try {
      // Si role est un string, nous devons d'abord trouver l'ID du rôle
      let roleId = role;
      if (typeof role === 'string') {
        const roleRepository = require('../roles/roles.repository');
        const roleData = await roleRepository.findByCode(role);
        if (!roleData) {
          return false;
        }
        roleId = roleData.id;
      }

      return await accessesRepository.userHasRole(userId, roleId);
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
      return false;
    }
  }
}

module.exports = new UsersService();
