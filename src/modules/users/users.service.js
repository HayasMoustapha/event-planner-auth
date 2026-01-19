const usersRepository = require('./users.repository');
const accessesRepository = require('../accesses/accesses.repository');
const { validateEmail, validatePassword } = require('../../utils/validators');

/**
 * Service métier pour la gestion des utilisateurs
 * Contient la logique business, validation et gestion des erreurs
 */
class UsersService {
  /**
   * Récupère tous les utilisateurs avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Données paginées
   */
  async getAll(options = {}) {
    const { page = 1, limit = 10, search, status, userCode } = options;

    // Validation des paramètres
    if (page < 1) throw new Error('Le numéro de page doit être supérieur à 0');
    if (limit < 1 || limit > 100) throw new Error('La limite doit être entre 1 et 100');

    // Validation du statut
    if (status && !['active', 'inactive', 'lock'].includes(status)) {
      throw new Error('Statut invalide. Valeurs autorisées: active, inactive, lock');
    }

    // Validation du code utilisateur
    if (userCode !== undefined && userCode !== null && typeof userCode !== 'string') {
      throw new Error('userCode doit être une chaîne de caractères');
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
    if (!id || id <= 0) {
      throw new Error('ID d\'utilisateur invalide');
    }

    const user = await usersRepository.findById(id, includePassword);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
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
      throw new Error('Email requis');
    }

    if (!validateEmail(email)) {
      throw new Error('Format d\'email invalide');
    }

    const user = await usersRepository.findByEmail(email, includePassword);
    if (!user) {
      throw new Error('Utilisateur non trouvé avec cet email');
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
      throw new Error('Username requis');
    }

    // Validation du format du username
    if (username.length < 3 || username.length > 50) {
      throw new Error('Le username doit contenir entre 3 et 50 caractères');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Le username ne peut contenir que des lettres, chiffres et underscores');
    }

    const user = await usersRepository.findByUsername(username, includePassword);
    if (!user) {
      throw new Error('Utilisateur non trouvé avec ce username');
    }

    return user;
  }

  async create(userData, createdBy = null) {
    const {
      username,
      email,
      password,
      userCode = null,
      phone = null,
      status = 'active',
      person_id ,  // Ajout pour supporter person_id
      firstName = null,
      lastName = null
    } = userData;

    
    // Gestion obligatoire de person_id (contrainte NOT NULL)
    if (!person_id) {
      throw new Error('La personne est obligatoire');
    }

    // Validation des champs obligatoires
    if (!username || !username.trim()) {
      throw new Error('Le username est obligatoire');
    }
    if (!email || !email.trim()) {
      throw new Error('L\'email est obligatoire');
    }
    if (!password || !password.trim()) {
      throw new Error('Le mot de passe est obligatoire');
    }
    if (!userCode || !userCode.trim()) {
      throw new Error('Le userCode est obligatoire');
    }

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
          throw new Error(`La personne avec ID ${person_id} n'existe pas`);
        }
        
        console.log(' Personne existante utilisée:', person_id  );
        
      } catch (error) {
        console.error(' Erreur validation personne:', error.message);
        throw new Error(`Personne invalide: ${error.message}`);
      }
    }

    // Validation des formats
    if (!validateEmail(email)) {
      throw new Error('Format d\'email invalide');
    }
    if (!validatePassword(password)) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    // Validation du username
    if (username.length < 3 || username.length > 50) {
      throw new Error('Le username doit contenir entre 3 et 50 caractères');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Le username ne peut contenir que des lettres, chiffres et underscores');
    }

    // Validation du statut
    if (!['active', 'inactive', 'lock'].includes(status)) {
      throw new Error('Statut invalide. Valeurs autorisées: active, inactive, lock');
    }

    // Nettoyage des données
    const cleanData = {
      username: username.trim().toLowerCase(),
      email: email.toLowerCase().trim(),
      password: password.trim(),
      userCode: userCode.trim(),
      phone: phone ? phone.trim() : null,
      status,
      person_id: person_id.trim(),  // Utiliser le personId final (créé ou fourni)
      createdBy
    };

    // Vérification des doublons
    const existingEmail = await usersRepository.findByEmail(cleanData.email);
    if (existingEmail) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    const existingUsername = await usersRepository.findByUsername(cleanData.username);
    if (existingUsername) {
      throw new Error('Ce nom d\'utilisateur est déjà utilisé');
    }

    // Validation de la personne si spécifiée
    if (person_id) {
      const personExists = await this.checkPersonExists(person_id);
      if (!personExists) {
        throw new Error('La personne spécifiée n\'existe pas');
      }
    }

    return await usersRepository.create(cleanData);
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
      throw new Error('ID d\'utilisateur invalide');
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await usersRepository.findById(id);
    if (!existingUser) {
      throw new Error('Utilisateur non trouvé');
    }

    const {
      username,
      email,
      password,
      userCode,
      phone,
      status,
      person_id
    } = updateData;

    // Validation des formats si fournis
    if (email && !validateEmail(email)) {
      throw new Error('Format d\'email invalide');
    }
    if (password && !validatePassword(password)) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }
    if (username) {
      if (username.length < 3 || username.length > 50) {
        throw new Error('Le username doit contenir entre 3 et 50 caractères');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Le username ne peut contenir que des lettres, chiffres et underscores');
      }
    }
    if (status && !['active', 'inactive', 'lock'].includes(status)) {
      throw new Error('Statut invalide. Valeurs autorisées: active, inactive, lock');
    }

    // Nettoyage des données
    const cleanData = {};
    if (username !== undefined) cleanData.username = username.trim().toLowerCase();
    if (email !== undefined) cleanData.email = email.toLowerCase().trim();
    if (password !== undefined) cleanData.password = password.trim();
    if (userCode !== undefined) cleanData.userCode = userCode.trim();
    if (phone !== undefined) cleanData.phone = phone ? phone.trim() : null;
    if (status !== undefined) cleanData.status = status;
    if (person_id !== undefined) cleanData.person_id = person_id;
    cleanData.updatedBy = updatedBy;

    // Vérification des doublons si email/username modifié
    if (cleanData.email && cleanData.email !== existingUser.email) {
      const existingEmail = await usersRepository.findByEmail(cleanData.email);
      if (existingEmail) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }
    }

    if (cleanData.username && cleanData.username !== existingUser.username) {
      const existingUsername = await usersRepository.findByUsername(cleanData.username);
      if (existingUsername) {
        throw new Error('Ce nom d\'utilisateur est déjà utilisé');
      }
    }

    // Vérification si le mot de passe a déjà été utilisé
    if (cleanData.password) {
      const passwordAlreadyUsed = await usersRepository.isPasswordAlreadyUsed(id, cleanData.password);
      if (passwordAlreadyUsed) {
        throw new Error('Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.');
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
      throw new Error('ID d\'utilisateur invalide');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Empêcher l'auto-suppression
    if (deletedBy && deletedBy === id) {
      throw new Error('Impossible de supprimer votre propre compte');
    }

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
      throw new Error('ID d\'utilisateur invalide');
    }
    if (!currentPassword || !currentPassword.trim()) {
      throw new Error('Le mot de passe actuel est requis');
    }
    if (!newPassword || !newPassword.trim()) {
      throw new Error('Le nouveau mot de passe est requis');
    }

    // Validation du nouveau mot de passe
    if (!validatePassword(newPassword)) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (currentPassword === newPassword) {
      throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const verifiedUser = await usersRepository.verifyPassword(user.email, currentPassword);
    if (!verifiedUser) {
      throw new Error('Mot de passe actuel incorrect');
    }

    // Vérifier si le nouveau mot de passe a déjà été utilisé
    const passwordAlreadyUsed = await usersRepository.isPasswordAlreadyUsed(id, newPassword);
    if (passwordAlreadyUsed) {
      throw new Error('Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.');
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
      throw new Error('Email requis');
    }
    if (!password || !password.trim()) {
      throw new Error('Mot de passe requis');
    }

    if (!validateEmail(email)) {
      throw new Error('Format d\'email invalide');
    }

    const user = await usersRepository.verifyPassword(email, password);
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est actif
    if (user.status !== 'active') {
      if (user.status === 'lock') {
        throw new Error('Ce compte est verrouillé. Veuillez contacter l\'administrateur.');
      }
      if (user.status === 'inactive') {
        throw new Error('Ce compte est désactivé. Veuillez contacter l\'administrateur.');
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
      throw new Error('ID d\'utilisateur invalide');
    }

    if (!['active', 'inactive', 'lock'].includes(status)) {
      throw new Error('Statut invalide. Valeurs autorisées: active, inactive, lock');
    }

    // Empêcher de verrouiller son propre compte
    if (updatedBy && updatedBy === id && status === 'lock') {
      throw new Error('Impossible de verrouiller votre propre compte');
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
      throw new Error('Email requis');
    }
    if (!newPassword || !newPassword.trim()) {
      throw new Error('Le nouveau mot de passe est requis');
    }

    if (!validateEmail(email)) {
      throw new Error('Format d\'email invalide');
    }

    if (!validatePassword(newPassword)) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      throw new Error('Aucun utilisateur trouvé avec cet email');
    }

    // Vérifier si le nouveau mot de passe a déjà été utilisé
    const passwordAlreadyUsed = await usersRepository.isPasswordAlreadyUsed(user.id, newPassword);
    if (passwordAlreadyUsed) {
      throw new Error('Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.');
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
      throw new Error('ID d\'utilisateur invalide');
    }
    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
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
      throw new Error('ID d\'utilisateur invalide');
    }
    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    // Récupérer l'access existant
    const accesses = await accessesRepository.findByUserId(userId);
    const userAccess = accesses.find(access => access.role_id === roleId);

    if (!userAccess) {
      throw new Error('L\'utilisateur n\'a pas ce rôle');
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
      throw new Error('ID d\'utilisateur invalide');
    }

    return await accessesRepository.findByUserId(userId, onlyActive);
  }

  async updateUserCode(userId, userCode, updatedBy = null) {
    if (!userId || userId <= 0) {
      throw new Error('ID d\'utilisateur invalide');
    }

    // Validation du code utilisateur
    if (!userCode || !userCode.trim()) {
      throw new Error('userCode est requis');
    }

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
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
