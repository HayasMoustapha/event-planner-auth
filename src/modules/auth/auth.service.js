const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usersRepository = require('../users/users.repository');
const usersRepositoryExtension = require('../users/users-repository-extension');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const emailService = require('../../services/email.service');
const sessionService = require('../sessions/sessions.service');
const permissionsService = require('../../services/permissions.service');
const notificationClient = require('../../../../shared/clients/notification-client');

/**
 * Service métier pour l'authentification et le login
 * Gère la connexion, la génération de tokens JWT et la validation des identifiants
 */
class AuthService {
  resolveCanonicalEmail(user) {
    if (user?.person_email && String(user.person_email).trim()) {
      return String(user.person_email).trim().toLowerCase();
    }

    if (user?.email && String(user.email).trim()) {
      return String(user.email).trim().toLowerCase();
    }

    return user?.email || null;
  }

  /**
   * Authentifie un utilisateur avec email et mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise<Object>} Utilisateur authentifié avec token JWT
   */
  async authenticate(email, password, remember_me = false) {
    // Validation des entrées
    if (!email || !email.trim()) {
      throw new Error('Email requis');
    }

    if (!password || !password.trim()) {
      throw new Error('Mot de passe requis');
    }

    // Validation du format de l'email
    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Format d\'email invalide');
    }

    // Vérifier les identifiants dans la base de données
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

    // 🔥 SUPER ADMIN AUTO-ROLE ASSIGNMENT
    // Si l'utilisateur est un super admin, s'assurer qu'il a TOUS les rôles
    if (user.email === 'admin@eventplanner.com' || user.email?.includes('admin@')) {
      try {
        const rbacSeeder = require('../database/seeders/rbac-seeder');
        await rbacSeeder.ensureSuperAdminCompleteAccess(user.id);
        logger.info(`👑 Super admin ${user.email} automatically granted all roles`);
      } catch (error) {
        logger.warn(`⚠️ Failed to auto-assign roles to super admin ${user.email}:`, error.message);
        // Ne pas bloquer la connexion si l'assignment échoue
      }
    }

    // Générer le token JWT
    let dbRoles = null;
    let dbPermissions = null;
    try {
      if (permissionsService.cache) {
        permissionsService.cache.delete(`user_roles_${user.id}`);
        permissionsService.cache.delete(`user_permissions_${user.id}`);
      }
      dbRoles = await permissionsService.getUserRoles(user.id);
      dbPermissions = await permissionsService.getUserPermissions(user.id);
    } catch (error) {
      logger.warn('Failed to load roles/permissions from DB, using fallback', {
        userId: user.id,
        error: error.message
      });
    }

    const token = this.generateToken(user, {
      roles: Array.isArray(dbRoles) && dbRoles.length > 0 ? dbRoles : null,
      permissions: Array.isArray(dbPermissions) && dbPermissions.length > 0 ? dbPermissions : null
    });

    // Créer une session pour le token
    let sessionData = null;
    try {
      const refreshToken = this.generateRefreshTokenFromUser(user);
      const sessionResult = await sessionService.createSession({
        accessToken: token,
        refreshToken: refreshToken,
        userId: user.id,
        ipAddress: null, // Sera ajouté par le middleware
        userAgent: null,  // Sera ajouté par le middleware
        expiresIn: 24 * 60 * 60 // 24 heures
      });
      
      if (sessionResult.success) {
        sessionData = sessionResult.session;
      }
    } catch (sessionError) {
      logger.warn('Failed to create session during login', {
        error: sessionError.message,
        userId: user.id
      });
      // Continuer même si la session échoue
    }

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = { ...user };
    delete userResponse.password;

    // Générer le remember token si demandé
    let rememberToken = null;
    if (remember_me) {
      try {
        rememberToken = await this.generateRememberToken(user.id);
      } catch (error) {
        logger.warn("Failed to generate remember token", { userId: user.id, error: error.message });
      }
    }

    const responseData = {
      user: userResponse,
      token: token,
      remember_me: remember_me,
      remember_token: rememberToken
    };

    // Ajouter les tokens de session si disponibles
    if (sessionData && sessionData.tokens) {
      responseData.tokens = sessionData.tokens;
    }

    return {
      success: true,
      message: 'Connexion réussie',
      data: responseData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Génère un token JWT pour un utilisateur
   * @param {Object} user - Données de l'utilisateur
   * @returns {string} Token JWT
   */
  generateToken(user, overrides = {}) {
    const now = Math.floor(Date.now() / 1000);
    const canonicalEmail = this.resolveCanonicalEmail(user);
    
    // CORRECTION : Utiliser le service de permissions pour charger depuis la base de données
    const userRoles = overrides.roles || this.getUserRolesSync(user);
    const userPermissions = overrides.permissions || this.getUserPermissionsSync(user);
    
    const payload = {
      id: user.id,
      email: canonicalEmail,
      username: user.username,
      status: user.status,
      type: 'access',
      
      // Rôles et permissions depuis la base de données
      roles: userRoles,
      permissions: userPermissions,
      
      // Claims standards
      iat: now,
      exp: now + (24 * 60 * 60), // 24h
      iss: 'auth-service',        // CORRECTION : Bon émetteur
      aud: 'event-planner'         // CORRECTION : Bonne audience
    };

    // CORRECTION : Ne pas spécifier expiresIn dans options si exp est déjà dans payload
    return jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: 'HS256'
    });
  }

  /**
   * Récupère les rôles de l'utilisateur (sync avec fallback)
   * @param {Object} user - Données utilisateur
   * @returns {Array} Tableau des rôles
   */
  getUserRolesSync(user) {
    // Fallback basé sur l'email ou le rôle simple pour éviter les erreurs
    if (user.email === 'admin@eventplanner.com' || user.role === 'super_admin') {
      return ['super_admin', 'organizer', 'designer', 'user'];
    }
    
    // Fallback pour les autres rôles
    if (user.role) {
      return [user.role];
    }
    
    // Rôle par défaut
    return ['user'];
  }

  /**
   * Récupère les permissions de l'utilisateur (sync avec fallback)
   * @param {Object} user - Données utilisateur
   * @returns {Array} Tableau des permissions
   */
  getUserPermissionsSync(user) {
    const roles = this.getUserRolesSync(user);
    const permissions = new Set();
    
    // SUPER ADMIN : TOUS LES DROITS SANS RESTRICTION
    if (user.email === 'admin@eventplanner.com' || roles.includes('super_admin')) {
      // Le super admin a TOUTES les permissions possibles
      // On retourne un wildcard ou une permission spéciale qui sera gérée dans le middleware
      return ['*']; // Wildcard pour toutes les permissions
    }
    
    // Permissions basées sur les rôles (fallback)
    roles.forEach(role => {
      switch (role) {
        case 'organizer':
          permissions.add('events.create');
          permissions.add('events.read');
          permissions.add('events.update');
          permissions.add('events.delete');
          permissions.add('tickets.generate');
          permissions.add('tickets.read');
          permissions.add('tickets.validate');
          permissions.add('guests.manage');
          permissions.add('guests.read');
          permissions.add('notifications.email.send');
          permissions.add('notifications.sms.send');
          permissions.add('payments.process');
          permissions.add('marketplace.read');
          permissions.add('marketplace.purchase');
          break;
          
        case 'designer':
          permissions.add('marketplace.create');
          permissions.add('marketplace.read');
          permissions.add('marketplace.update');
          break;
          
        case 'user':
          permissions.add('events.read');
          permissions.add('guests.read');
          permissions.add('tickets.read');
          break;
      }
    });
    
    return Array.from(permissions);
  }

  /**
   * Récupère les rôles de l'utilisateur depuis la base de données (async)
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Tableau des rôles
   */
  async getUserRoles(userId) {
    try {
      return await permissionsService.getUserRoles(userId);
    } catch (error) {
      logger.error(`Error loading roles from database for user ${userId}:`, error);
      // Fallback vers une méthode synchrone simple
      return ['user'];
    }
  }

  /**
   * Récupère les permissions de l'utilisateur depuis la base de données (async)
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Tableau des permissions
   */
  async getUserPermissions(userId) {
    try {
      return await permissionsService.getUserPermissions(userId);
    } catch (error) {
      logger.error(`Error loading permissions from database for user ${userId}:`, error);
      // Fallback vers une méthode synchrone simple
      return ['guests.read'];
    }
  }

  /**
   * Vérifie un token JWT
   * @param {string} token - Token JWT à vérifier
   * @returns {Object} Payload décodé
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  /**
   * Génère un refresh token pour un utilisateur
   * @param {Object} user - Données utilisateur
   * @returns {string} Refresh token
   */
  generateRefreshTokenFromUser(user) {
    try {
      const canonicalEmail = this.resolveCanonicalEmail(user);
      const payload = {
        id: user.id,
        email: canonicalEmail,
        username: user.username,
        type: 'refresh'
      };

      const options = {
        expiresIn: '7d', // 7 jours pour le rafraîchissement
        issuer: process.env.JWT_ISSUER || 'event-planner-auth',
        audience: process.env.JWT_AUDIENCE || 'event-planner-users'
      };

      return jwt.sign(payload, process.env.JWT_SECRET, options);
    } catch (error) {
      throw new Error('Erreur lors de la génération du refresh token');
    }
  }

  /**
   * Rafraîchi un token JWT
   * @param {string} token - Token à rafraîchir
   * @returns {string} Nouveau token JWT
   */
  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur depuis la base de données
      const user = await usersRepository.findById(decoded.id);

      if (!user || user.status !== 'active') {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      // Générer un nouveau token
      return this.generateToken(user);
    } catch (error) {
      throw new Error('Token de rafraîchissement invalide');
    }
  }

  /**
   * Déconnecte un utilisateur (révoque le token)
   * @param {string} token - Token JWT à révoquer
   * @returns {Object} Message de déconnexion
   */
  async logout(token) {
    try {
      // Ajouter le token à une liste noire (optionnel)
      // Dans une implémentation réelle, vous pourriez gérer une liste noire
      console.log('🔐 Déconnexion de l\'utilisateur');

      return {
        success: true,
        message: 'Déconnexion réussie',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Vérifie si un token est valide et non expiré
   * @param {string} token - Token JWT à vérifier
   * @returns {Object} Résultat de la vérification
   */
  validateToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const now = Math.floor(Date.now() / 1000);

      // Vérifier si le token est expiré
      if (decoded.exp < now) {
        return {
          valid: false,
          expired: true,
          message: 'Token expiré'
        };
      }

      return {
        valid: true,
        expired: false,
        decoded
      };
    } catch (error) {
      return {
        valid: false,
        expired: false,
        error: error.message
      };
    }
  }

  /**
   * Récupère les informations d'un utilisateur à partir d'un token
   * @param {string} token - Token JWT
   * @returns {Promise<Object>} Utilisateur
   */
  async getUserFromToken(token) {
    try {
      const decoded = this.verifyToken(token);

      if (!decoded.valid) {
        throw new Error('Token invalide');
      }

      const user = await usersRepository.findById(decoded.id);

      if (!user || user.status !== 'active') {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      // Retourner l'utilisateur sans le mot de passe
      const userResponse = { ...user };
      delete userResponse.password;

      return {
        ...userResponse,
        decoded
      };
    } catch (error) {
      throw new Error('Erreur lors de la récupération de l\'utilisateur');
    }
  }

  /**
   * Change le mot de passe d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @param {number} updatedBy - ID de l'utilisateur qui modifie
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async changePassword(userId, currentPassword, newPassword, updatedBy = null) {
    // Validation des paramètres
    if (!userId || userId <= 0) {
      throw new Error('ID utilisateur invalide');
    }

    if (!currentPassword || !currentPassword.trim()) {
      throw new Error('Mot de passe actuel requis');
    }

    if (!newPassword || !newPassword.trim()) {
      throw new Error('Nouveau mot de passe requis');
    }

    if (currentPassword === newPassword) {
      throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
    }

    // Validation du nouveau mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    // Récupérer l'utilisateur pour vérifier le mot de passe actuel
    const user = await usersRepository.findById(userId, true);

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw new Error('Mot de passe actuel incorrect');
    }

    // Mettre à jour le mot de passe
    const updatedUser = await usersRepository.updatePassword(userId, newPassword, updatedBy);

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = { ...updatedUser };
    delete userResponse.password;

    return {
      success: true,
      message: 'Mot de passe modifié avec succès',
      data: userResponse,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Vérifie si un utilisateur existe par son email
   * @param {string} email - Email à vérifier
   * @returns {Promise<boolean>} True si l'utilisateur existe
   */
  async userExists(email) {
    try {
      const user = await usersRepository.findByEmail(email);
      return !!user;
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifie si un username est disponible
   * @param {string} username - Username à vérifier
   * @returns {Promise<boolean>} True si le username est disponible
   */
  async isUsernameAvailable(username) {
    try {
      const user = await usersRepository.findByUsername(username);
      return !user;
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupère les permissions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des permissions
   */
  async getUserPermissions(userId) {
    try {
      const user = await usersRepository.findById(userId);

      if (!user) {
        return [];
      }

      // Pour l'instant, nous retournons les permissions basées sur le rôle
      // Dans une implémentation complète, vous pourriez utiliser un système de permissions
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Active un compte utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} activatedBy - ID de l'utilisateur qui active
   * @returns {Promise<Object>} Utilisateur activé
   */
  async activateUser(userId, activatedBy = null) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.status === 'active') {
      throw new Error('Le compte est déjà actif');
    }

    return await usersRepository.updateStatus(userId, 'active', activatedBy);
  }

  /**
   * Génère un remember token pour "Remember me"
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<string>} Remember token généré
   */
  async generateRememberToken(userId) {
    try {
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');

      // Sauvegarder le token dans la base de données
      await usersRepositoryExtension.updateRememberToken(userId, token);

      logger.info('Remember token generated', { userId });
      return token;
    } catch (error) {
      logger.error('Error generating remember token', { userId, error: error.message });
      throw new Error('Erreur lors de la génération du remember token');
    }
  }

  /**
   * Vérifie un remember token
   * @param {string} token - Remember token à vérifier
   * @returns {Promise<Object|null>} Utilisateur si token valide
   */
  async verifyRememberToken(token) {
    try {
      const user = await usersRepositoryExtension.findByRememberToken(token);

      if (!user) {
        return null;
      }

      // Vérifier si le token n'est pas expiré (optionnel: 30 jours)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      if (user.updated_at < thirtyDaysAgo) {
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Error verifying remember token', { error: error.message });
      throw new Error('Erreur lors de la vérification du remember token');
    }
  }

  /**
   * Authentifie un utilisateur avec remember token
   * @param {string} token - Remember token
   * @returns {Promise<Object>} Utilisateur authentifié avec token JWT
   */
  async loginWithRememberToken(token) {
    if (!token || !token.trim()) {
      throw new Error('Remember token requis');
    }

    // Vérifier le remember token
    const user = await this.verifyRememberToken(token);

    if (!user) {
      throw new Error('Remember token invalide ou expiré');
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

    // Générer un nouveau remember token (rotation de sécurité)
    const newRememberToken = await this.generateRememberToken(user.id);

    // Générer le token JWT
    const jwtToken = this.generateToken(user);

    // Créer une session pour le token
    let sessionData = null;
    try {
      const refreshToken = this.generateRefreshTokenFromUser(user);
      const sessionResult = await sessionService.createSession({
        accessToken: jwtToken,
        refreshToken: refreshToken,
        userId: user.id,
        ipAddress: null,
        userAgent: null,
        expiresIn: 24 * 60 * 60 // 24 heures
      });
      
      if (sessionResult.success) {
        sessionData = sessionResult.session;
      }
    } catch (sessionError) {
      logger.warn('Failed to create session during remember token login', {
        error: sessionError.message,
        userId: user.id
      });
    }

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = { ...user };
    delete userResponse.password;

    const responseData = {
      user: userResponse,
      token: jwtToken,
      remember_me: true,
      remember_token: newRememberToken
    };

    // Ajouter les tokens de session si disponibles
    if (sessionData && sessionData.tokens) {
      responseData.tokens = sessionData.tokens;
    }

    return {
      success: true,
      message: 'Connexion réussie avec remember token',
      data: responseData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Désactive un compte utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} deactivatedBy - ID de l'utilisateur qui désactive
   * @returns {Promise<Object>} Utilisateur désactivé
   */
  async deactivateUser(userId, deactivatedBy = null) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.status === 'inactive') {
      throw new Error('Le compte est déjà désactivé');
    }

    return await usersRepository.updateStatus(userId, 'inactive', deactivatedBy);
  }

  /**
   * Verrouille un compte utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} lockBy - ID de l'utilisateur qui verrouille
   * @returns {Promise<Object>} Utilisateur verrouillé
   */
  async lockUser(userId, lockBy = null) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.status === 'lock') {
      throw new Error('Le compte est déjà verrouillé');
    }

    return await usersRepository.updateStatus(userId, 'lock', lockBy);
  }

  /**
   * Déverrouille un compte utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} unlockBy - ID de l'utilisateur qui déverrouille
   * @returns {Promise<Object>} Utilisateur déverrouillé
   */
  async unlockUser(userId, unlockBy = null) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.status !== 'lock') {
      throw new Error('Le compte n\'est pas verrouillé');
    }

    return await usersRepository.updateStatus(userId, 'active', unlockBy);
  }

  /**
   * Récupère les statistiques de connexion
   * @param {number} userId - ID de l'utilisateur (optionnel)
   * @returns {Promise<Object>} Statistiques de connexion
   */
  async getLoginStats(userId = null) {
    try {
      // Pour l'instant, nous pourrions retourner des statistiques globales
      return {
        totalLogins: 0,
        activeUsers: 0,
        recentLogins: []
      };
    } catch (error) {
      throw new Error('Erreur lors de la récupération des statistiques de connexion');
    }
  }

  /**
   * Valide les identifiants avant la connexion
   * @param {string} email - Email à valider
   * @param {string} password - Mot de passe à valider
   * @returns {Object} Résultat de la validation
   */
  validateCredentials(email, password) {
    const errors = [];

    // Validation de l'email
    if (!email || !email.trim()) {
      errors.push('L\'email est requis');
    } else {
      const emailRegex = /^[^\s*[^@\s]+@[^@\s]+\.[^@\s]+\s*$/;
      if (!emailRegex.test(email)) {
        errors.push('Format d\'email invalide');
      }
    }

    // Validation du mot de passe
    if (!password || !password.trim()) {
      errors.push('Le mot de passe est requis');
    } else {
      if (password.length < 8) {
        errors.push('Le mot de passe doit contenir au moins 8 caractères');
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Génère un token de rafraîchissement
   * @param {string} token - Token à rafraîchir
   * @returns {string} Nouveau token
   */
  async generateRefreshToken(token) {
    try {
      const tokenValidation = this.validateToken(token);

      if (!tokenValidation.valid) {
        throw new Error('Token de rafraîchissement invalide');
      }

      const decoded = tokenValidation.decoded;

      // Récupérer l'utilisateur depuis la base de données
      const user = await usersRepository.findById(decoded.id);

      if (!user || user.status !== 'active') {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      // Générer un nouveau token avec une durée plus courte pour le rafraîchissement
      const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status
      };

      const options = {
        expiresIn: '7d', // 7 jours pour le rafraîchissement
        issuer: process.env.JWT_ISSUER || 'event-planner-auth',
        audience: process.env.JWT_AUDIENCE || 'event-planner-users'
      };

      return jwt.sign(payload, process.env.JWT_SECRET, options);
    } catch (error) {
      throw new Error('Token de rafraîchissement invalide');
    }
  }

  /**
   * Vérifie si un token de rafraîchissement est valide
   * @param {string} refreshToken - Token de rafraîchissement
   * @returns {Object} Résultat de la vérification
   */
  validateRefreshToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const now = Math.floor(Date.now() / 1000);

      // Vérifier si le token de rafraîchissement est expiré
      if (decoded.exp < now) {
        return {
          valid: false,
          expired: true,
          message: 'Token de rafraîchissement expiré'
        };
      }

      return {
        valid: true,
        expired: false,
        decoded
      };
    } catch (error) {
      return {
        valid: false,
        expired: false,
        error: error.message
      };
    }
  }

  /**
   * Envoie une notification de bienvenue après inscription réussie
   * @param {Object} user - Données de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendWelcomeNotification(user) {
    try {
      const result = await notificationClient.sendWelcomeEmail(user.email, {
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username
      });

      if (!result.success) {
        logger.error('Failed to send welcome notification:', result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error sending welcome notification:', error);
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
      const result = await notificationClient.sendAccountActivationEmail(user.email, {
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username
      });

      if (!result.success) {
        logger.error('Failed to send account activation notification:', result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error sending account activation notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie une notification de réinitialisation de mot de passe
   * @param {Object} user - Données de l'utilisateur
   * @param {string} resetToken - Token de réinitialisation
   * @param {Date} expiresAt - Date d'expiration
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendPasswordResetNotification(user, resetToken, expiresAt) {
    try {
      const result = await notificationClient.sendPasswordResetEmail(user.email, {
        resetToken,
        expiresAt,
        firstName: user.first_name
      });

      if (!result.success) {
        logger.error('Failed to send password reset notification:', result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error sending password reset notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie une alerte de sécurité
   * @param {Object} user - Données de l'utilisateur
   * @param {Object} alertData - Données de l'alerte
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendSecurityAlert(user, alertData) {
    try {
      const result = await notificationClient.sendSecurityAlert(user.email, {
        type: alertData.type,
        description: alertData.description,
        ipAddress: alertData.ipAddress,
        location: alertData.location,
        timestamp: alertData.timestamp,
        actionRequired: alertData.actionRequired
      });

      if (!result.success) {
        logger.error('Failed to send security alert:', result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error sending security alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie une notification OTP par SMS
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {string} code - Code OTP
   * @param {string} purpose - But de l'OTP
   * @param {Date} validUntil - Date de validité
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendOTPNotification(phoneNumber, code, purpose, validUntil) {
    try {
      const result = await notificationClient.sendOTPSMS(phoneNumber, {
        code,
        purpose,
        validUntil
      });

      if (!result.success) {
        logger.error('Failed to send OTP notification:', result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error sending OTP notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie une notification de changement de mot de passe
   * @param {Object} user - Données de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendPasswordChangeNotification(user) {
    try {
      const result = await notificationClient.sendEmail({
        to: user.email,
        template: 'password-changed',
        subject: 'Votre mot de passe a été modifié',
        data: {
          firstName: user.first_name,
          lastName: user.last_name,
          changeDate: new Date().toLocaleDateString('fr-FR'),
          changeTime: new Date().toLocaleTimeString('fr-FR')
        },
        priority: 'high'
      });

      if (!result.success) {
        logger.error('Failed to send password change notification:', result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error sending password change notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie une notification de blocage de compte
   * @param {Object} user - Données de l'utilisateur
   * @param {string} reason - Raison du blocage
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendAccountLockedNotification(user, reason) {
    try {
      const result = await notificationClient.sendEmail({
        to: user.email,
        template: 'account-locked',
        subject: '⚠️ Votre compte a été verrouillé',
        data: {
          firstName: user.first_name,
          lastName: user.last_name,
          lockReason: reason,
          lockDate: new Date().toLocaleDateString('fr-FR'),
          supportEmail: 'support@eventplanner.com'
        },
        priority: 'high'
      });

      if (!result.success) {
        logger.error('Failed to send account locked notification:', result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error sending account locked notification:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AuthService();
