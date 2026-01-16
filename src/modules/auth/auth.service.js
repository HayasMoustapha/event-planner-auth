const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usersRepository = require('../users/users.repository');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const emailService = require('../../services/email.service');

/**
 * Service métier pour l'authentification et le login
 * Gère la connexion, la génération de tokens JWT et la validation des identifiants
 */
class AuthService {
  /**
   * Authentifie un utilisateur avec email et mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise<Object>} Utilisateur authentifié avec token JWT
   */
  async authenticate(email, password) {
    // Validation des entrées
    if (!email || !email.trim()) {
      throw new Error('Email requis');
    }
    
    if (!password || !password.trim()) {
      throw new Error('Mot de passe requis');
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s*[^@\s]+@[^@\s]+\.[^@\s]+\s*$/;
    if (!emailRegex.test(email)) {
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

    // Générer le token JWT
    const token = this.generateToken(user);

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = { ...user };
    delete userResponse.password;

    return {
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userResponse,
        token: token
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Génère un token JWT pour un utilisateur
   * @param {Object} user - Données de l'utilisateur
   * @returns {string} Token JWT
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      type: 'access' // Ajouter le type de token
    };

    const options = {
      expiresIn: '24h',
      issuer: process.env.JWT_ISSUER || 'event-planner-auth',
      audience: process.env.JWT_AUDIENCE || 'event-planner-users'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, options);
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
}

module.exports = new AuthService();
