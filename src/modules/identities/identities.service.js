const identitiesRepository = require('./identities.repository');
const usersRepository = require('../users/users.repository');
const peopleRepository = require('../people/people.repository');
const accessesRepository = require('../accesses/accesses.repository');
const { validateEmail } = require('../../utils/validators');

/**
 * Service métier pour la gestion des identités OAuth
 * Contient la logique business pour Google Sign-In et Apple Sign-In
 */
class IdentitiesService {
  /**
   * Crée ou lie une identité OAuth à un utilisateur existant
   * @param {Object} identityData - Données de l'identité OAuth
   * @param {number} userId - ID utilisateur existant
   * @returns {Promise<Object>} Identité créée/liée
   */
  async linkIdentityToUser(identityData, userId) {
    const { provider, provider_user_id, email, provider_data } = identityData;

    // Validation du fournisseur
    if (!['google', 'apple'].includes(provider)) {
      throw new Error('Fournisseur OAuth non supporté');
    }

    // Validation de l'email
    if (!validateEmail(email)) {
      throw new Error('Email OAuth invalide');
    }

    // Vérifier que l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si cette identité existe déjà
    const existingIdentity = await identitiesRepository.findByProviderAndProviderId(
      provider, 
      provider_user_id
    );
    if (existingIdentity) {
      if (existingIdentity.user_id !== userId) {
        throw new Error(`Cette identité ${provider} est déjà liée à un autre compte`);
      }
      // Mettre à jour la dernière utilisation
      await identitiesRepository.updateLastUsed(existingIdentity.id);
      return existingIdentity;
    }

    // Vérifier si l'utilisateur a déjà une identité pour ce fournisseur
    const userHasProvider = await identitiesRepository.userHasProviderIdentity(userId, provider);
    if (userHasProvider) {
      throw new Error(`Cet utilisateur a déjà une identité ${provider} liée`);
    }

    // Créer la nouvelle identité
    return await identitiesRepository.create({
      user_id: userId,
      provider,
      provider_user_id,
      email,
      provider_data,
      created_by: userId
    });
  }

  /**
   * Crée un utilisateur complet avec identité OAuth (nouvel utilisateur)
   * @param {Object} oauthData - Données OAuth complètes
   * @returns {Promise<Object>} Utilisateur et identité créés
   */
  async createUserWithIdentity(oauthData) {
    const {
      provider,
      provider_user_id,
      email,
      first_name,
      last_name,
      provider_data,
      default_role = 'user' // Rôle par défaut pour les nouveaux utilisateurs OAuth
    } = oauthData;

    // Validation du fournisseur
    if (!['google', 'apple'].includes(provider)) {
      throw new Error('Fournisseur OAuth non supporté');
    }

    // Validation de l'email
    if (!validateEmail(email)) {
      throw new Error('Email OAuth invalide');
    }

    // Vérifier si l'email est déjà utilisé par un utilisateur existant
    const existingUser = await usersRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà. Veuillez vous connecter et lier votre compte.');
    }

    // Vérifier si cette identité OAuth existe déjà
    const existingIdentity = await identitiesRepository.findByProviderAndProviderId(
      provider,
      provider_user_id
    );
    if (existingIdentity) {
      throw new Error(`Cette identité ${provider} est déjà enregistrée`);
    }

    // Créer la personne
    const person = await peopleRepository.create({
      first_name: first_name || 'Utilisateur',
      last_name: last_name || provider.charAt(0).toUpperCase() + provider.slice(1),
      email,
      status: 'active'
    });

    // Générer un user_code unique
    const userCode = await this.generateUniqueUserCode();

    // Créer l'utilisateur avec mot de passe aléatoire (jamais utilisé)
    const tempPassword = this.generateTempPassword();

    const user = await usersRepository.create({
      username: this.generateUsernameFromEmail(email),
      email,
      password: tempPassword,
      user_code: userCode,
      status: 'active',
      person_id: person.id,
      email_verified_at: new Date() // Les emails OAuth sont pré-vérifiés
    });

    // Assigner le rôle par défaut
    try {
      const roleRepository = require('../roles/roles.repository');
      const defaultRole = await roleRepository.findByCode(default_role);
      if (defaultRole) {
        await accessesRepository.create({
          userId: user.id,
          roleId: defaultRole.id,
          status: 'active',
          createdBy: user.id
        });
      }
    } catch (roleError) {
      console.warn('Impossible d\'assigner le rôle par défaut:', roleError.message);
    }

    // Créer l'identité OAuth
    const identity = await identitiesRepository.create({
      user_id: user.id,
      provider,
      provider_user_id,
      email,
      provider_data,
      created_by: user.id
    });

    // Retourner les données sans mot de passe
    const userResponse = { ...user };
    delete userResponse.password;

    return {
      user: userResponse,
      person,
      identity
    };
  }

  /**
   * Authentifie un utilisateur via OAuth
   * @param {Object} oauthData - Données OAuth validées
   * @returns {Promise<Object>} Utilisateur authentifié
   */
  async authenticateWithOAuth(oauthData) {
    const { provider, provider_user_id, email } = oauthData;

    // Chercher l'identité OAuth
    const identity = await identitiesRepository.findByProviderAndProviderId(
      provider,
      provider_user_id
    );

    if (!identity) {
      // Premier login - créer nouvel utilisateur
      const result = await this.createUserWithIdentity(oauthData);
      
      // Mettre à jour la dernière utilisation
      await identitiesRepository.updateLastUsed(result.identity.id);
      
      return {
        isNewUser: true,
        user: result.user,
        identity: result.identity
      };
    }

    // Utilisateur existant - vérifier le statut
    const user = await usersRepository.findById(identity.user_id);
    if (!user) {
      throw new Error('Utilisateur associé à cette identité non trouvé');
    }

    if (user.status !== 'active') {
      if (user.status === 'lock') {
        throw new Error('Ce compte est verrouillé. Veuillez contacter l\'administrateur.');
      }
      if (user.status === 'inactive') {
        throw new Error('Ce compte est désactivé. Veuillez contacter l\'administrateur.');
      }
    }

    // Mettre à jour la dernière utilisation
    await identitiesRepository.updateLastUsed(identity.id);
    await usersRepository.updateLastLogin(user.id);

    // Retourner sans mot de passe
    const userResponse = { ...user };
    delete userResponse.password;

    return {
      isNewUser: false,
      user: userResponse,
      identity
    };
  }

  /**
   * Détache une identité OAuth d'un utilisateur
   * @param {number} userId - ID utilisateur
   * @param {string} provider - Fournisseur à détacher
   * @param {number} deletedBy - ID utilisateur qui détache
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async unlinkIdentity(userId, provider, deletedBy = null) {
    // Vérifier que l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si l'utilisateur a un mot de passe (pour éviter de perdre l'accès)
    if (!user.password || user.password === '') {
      // Compter les identités restantes
      const identityCount = await identitiesRepository.countByIdentity(userId);
      if (identityCount <= 1) {
        throw new Error('Impossible de détacher cette identité : vous n\'avez pas de mot de passe et ceci serait votre seule méthode de connexion');
      }
    }

    // Chercher et supprimer l'identité
    const identities = await identitiesRepository.findByUserId(userId, provider);
    if (identities.length === 0) {
      throw new Error(`Aucune identité ${provider} trouvée pour cet utilisateur`);
    }

    const success = await identitiesRepository.softDelete(identities[0].id, deletedBy);
    return success;
  }

  /**
   * Récupère toutes les identités d'un utilisateur
   * @param {number} userId - ID utilisateur
   * @returns {Promise<Array>} Liste des identités
   */
  async getUserIdentities(userId) {
    // Vérifier que l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return await identitiesRepository.findByUserId(userId);
  }

  /**
   * Génère un username unique à partir d'un email
   * @param {string} email - Email source
   * @returns {string} Username unique
   */
  generateUsernameFromEmail(email) {
    const baseUsername = email.split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    
    // Ajouter un suffixe numérique si nécessaire
    const suffix = Math.floor(Math.random() * 1000);
    return `${baseUsername}${suffix}`;
  }

  /**
   * Génère un user_code unique
   * @returns {string} User code unique
   */
  async generateUniqueUserCode() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const userCode = `U${Date.now()}${Math.floor(Math.random() * 100)}`;
      
      try {
        // Vérifier si le user_code existe déjà via une requête directe
        const db = require('../../config/database').getDatabase();
        const result = await db.query('SELECT id FROM users WHERE user_code = $1 AND deleted_at IS NULL', [userCode]);
        if (result.rows.length === 0) {
          return userCode;
        }
      } catch (error) {
        // Si erreur, le user_code est probablement disponible
        return userCode;
      }
      
      attempts++;
    }

    // Fallback si trop de tentatives
    return `U${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Génère un mot de passe temporaire sécurisé
   * @returns {string} Mot de passe temporaire
   */
  generateTempPassword() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Récupère les statistiques des identités OAuth
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    return await identitiesRepository.getStats();
  }

  /**
   * Vérifie si un email OAuth peut être utilisé
   * @param {string} email - Email à vérifier
   * @param {string} provider - Fournisseur OAuth
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async validateOAuthEmail(email, provider) {
    if (!validateEmail(email)) {
      return {
        valid: false,
        reason: 'INVALID_EMAIL',
        message: 'Format d\'email invalide'
      };
    }

    // Vérifier si l'email est déjà utilisé par un utilisateur sans cette identité
    const existingUser = await usersRepository.findByEmail(email);
    if (existingUser) {
      // Vérifier si l'utilisateur a déjà cette identité
      const hasIdentity = await identitiesRepository.userHasProviderIdentity(existingUser.id, provider);
      if (!hasIdentity) {
        return {
          valid: false,
          reason: 'EMAIL_ALREADY_USED',
          message: 'Cet email est déjà utilisé. Connectez-vous et liez votre compte.',
          requiresLinking: true,
          userId: existingUser.id
        };
      }
    }

    return {
      valid: true,
      message: 'Email disponible pour OAuth'
    };
  }
}

module.exports = new IdentitiesService();
