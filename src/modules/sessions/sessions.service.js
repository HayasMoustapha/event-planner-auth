const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sessionRepository = require('./sessions.repository');
const usersRepository = require('../users/users.repository');
const { createResponse } = require('../../utils/response');

/**
 * Service métier pour la gestion des sessions et tokens
 * Gère la génération JWT, refresh tokens et cycle de vie des sessions
 */
class SessionService {
  /**
   * Génère un access token JWT
   * @param {Object} user - Données utilisateur
   * @param {Object} options - Options du token
   * @returns {string} Token JWT généré
   */
  generateAccessToken(user, options = {}) {
    const {
      expiresIn = '1h', // 1 heure par défaut
      issuer = process.env.JWT_ISSUER || 'event-planner-auth',
      audience = process.env.JWT_AUDIENCE || 'event-planner-users'
    } = options;

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      type: 'access'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      issuer,
      audience,
      algorithm: 'HS256'
    });
  }

  /**
   * Génère un refresh token
   * @param {Object} user - Données utilisateur
   * @param {Object} options - Options du token
   * @returns {string} Refresh token généré
   */
  generateRefreshToken(user, options = {}) {
    const {
      expiresIn = '7d', // 7 jours par défaut
      issuer = process.env.JWT_ISSUER || 'event-planner-auth',
      audience = process.env.JWT_AUDIENCE || 'event-planner-users'
    } = options;

    const payload = {
      id: user.id,
      email: user.email,
      type: 'refresh',
      jti: crypto.randomUUID() // Unique identifier pour le refresh token
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      expiresIn,
      issuer,
      audience,
      algorithm: 'HS256'
    });
  }

  /**
   * Vérifie et décode un access token
   * @param {string} token - Token à vérifier
   * @returns {Object} Token décodé et validé
   */
  async verifyAccessToken(token) {
    try {
      // Vérifier si le token est blacklisté
      const isBlacklisted = await sessionRepository.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token a été révoqué');
      }

      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || 'event-planner-auth',
        audience: process.env.JWT_AUDIENCE || 'event-planner-users',
        algorithms: ['HS256']
      });

      // Vérifier que c'est bien un access token
      if (decoded.type !== 'access') {
        throw new Error('Type de token invalide');
      }

      return {
        valid: true,
        decoded,
        expiresAt: new Date(decoded.exp * 1000)
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'TOKEN_EXPIRED',
          message: 'Token expiré',
          decoded: error.expiredData
        };
      }
      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'INVALID_TOKEN',
          message: 'Token invalide'
        };
      }
      return {
        valid: false,
        error: 'VERIFICATION_ERROR',
        message: error.message
      };
    }
  }

  /**
   * Vérifie et décode un refresh token
   * @param {string} token - Refresh token à vérifier
   * @returns {Object} Token décodé et validé
   */
  async verifyRefreshToken(token) {
    try {
      // Vérifier si le token est blacklisté
      const isBlacklisted = await sessionRepository.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Refresh token a été révoqué');
      }

      // Vérifier et décoder le token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        {
          issuer: process.env.JWT_ISSUER || 'event-planner-auth',
          audience: process.env.JWT_AUDIENCE || 'event-planner-users',
          algorithms: ['HS256']
        }
      );

      // Vérifier que c'est bien un refresh token
      if (decoded.type !== 'refresh') {
        throw new Error('Type de token invalide');
      }

      return {
        valid: true,
        decoded,
        expiresAt: new Date(decoded.exp * 1000)
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token expiré'
        };
      }
      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token invalide'
        };
      }
      return {
        valid: false,
        error: 'VERIFICATION_ERROR',
        message: error.message
      };
    }
  }

  /**
   * Crée une nouvelle session utilisateur
   * @param {Object} sessionData - Données de la session
   * @returns {Promise<Object>} Session créée avec tokens
   */
  async createSession(sessionData) {
    const {
      userId,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresIn = 3600 // 1 heure
    } = sessionData;

    // Récupérer les informations utilisateur
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.status !== 'active') {
      throw new Error('Utilisateur non actif');
    }

    // Générer les tokens
    const accessToken = this.generateAccessToken(user, { expiresIn: `${expiresIn}s` });
    const refreshToken = this.generateRefreshToken(user);

    // Créer la session en base de données
    const session = await sessionRepository.create({
      userId,
      accessToken,
      refreshToken,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresIn
    });

    // Retourner les tokens et les informations de session
    return {
      session: {
        id: session.id,
        userId: session.user_id,
        deviceInfo: session.device_info,
        ipAddress: session.ip_address,
        expiresAt: session.expires_at,
        createdAt: session.created_at
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: 'Bearer'
      },
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status
      }
    };
  }

  /**
   * Rafraîchit les tokens d'une session
   * @param {string} refreshToken - Refresh token actuel
   * @param {Object} options - Options de rafraîchissement
   * @returns {Promise<Object>} Nouveaux tokens
   */
  async refreshSession(refreshToken, options = {}) {
    const { expiresIn = 3600 } = options;

    // Vérifier le refresh token
    const tokenValidation = await this.verifyRefreshToken(refreshToken);
    if (!tokenValidation.valid) {
      throw new Error(tokenValidation.message);
    }

    // Récupérer la session associée
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    if (!session) {
      throw new Error('Session non trouvée ou expirée');
    }

    // Récupérer les informations utilisateur
    const user = await usersRepository.findById(session.user_id);
    if (!user || user.status !== 'active') {
      throw new Error('Utilisateur non trouvé ou inactif');
    }

    // Générer les nouveaux tokens
    const newAccessToken = this.generateAccessToken(user, { expiresIn: `${expiresIn}s` });
    const newRefreshToken = this.generateRefreshToken(user);

    // Mettre à jour la session
    const updatedSession = await sessionRepository.update(session.id, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn
    });

    // Blacklister l'ancien refresh token
    await sessionRepository.blacklistToken({
      token: refreshToken,
      userId: user.id,
      reason: 'refresh',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    });

    return {
      session: {
        id: updatedSession.id,
        userId: updatedSession.user_id,
        expiresAt: updatedSession.expires_at,
        updatedAt: updatedSession.updated_at
      },
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        tokenType: 'Bearer'
      }
    };
  }

  /**
   * Déconnecte une session (logout)
   * @param {string} accessToken - Access token à révoquer
   * @returns {Promise<Object>} Résultat de la déconnexion
   */
  async logoutSession(accessToken) {
    // Vérifier le token
    const tokenValidation = await this.verifyAccessToken(accessToken);
    if (!tokenValidation.valid) {
      throw new Error('Token invalide ou expiré');
    }

    // Récupérer la session
    const session = await sessionRepository.findByAccessToken(accessToken);
    if (!session) {
      throw new Error('Session non trouvée');
    }

    // Désactiver la session
    const deactivated = await sessionRepository.deactivate(session.id);

    // Blacklister le token
    await sessionRepository.blacklistToken({
      token: accessToken,
      userId: session.user_id,
      reason: 'logout',
      expiresAt: tokenValidation.expiresAt
    });

    return {
      success: true,
      message: 'Session terminée avec succès',
      sessionId: session.id,
      deactivated
    };
  }

  /**
   * Déconnecte toutes les sessions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} exceptSessionId - Session à conserver (optionnel)
   * @returns {Promise<Object>} Résultat de la déconnexion
   */
  async logoutAllSessions(userId, exceptSessionId = null) {
    // Récupérer toutes les sessions actives
    const sessions = await sessionRepository.findByUserId(userId, { limit: 100 });
    
    // Blacklister tous les tokens actifs
    const blacklistPromises = sessions.sessions
      .filter(session => !exceptSessionId || session.id !== exceptSessionId)
      .map(session => 
        sessionRepository.blacklistToken({
          token: session.access_token,
          userId: session.user_id,
          reason: 'logout_all',
          expiresAt: new Date(session.expires_at)
        })
      );

    await Promise.all(blacklistPromises);

    // Désactiver toutes les sessions
    const deactivatedCount = await sessionRepository.deactivateAllByUserId(userId, exceptSessionId);

    return {
      success: true,
      message: `${deactivatedCount} sessions terminées avec succès`,
      deactivatedCount
    };
  }

  /**
   * Récupère les sessions actives d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Sessions et pagination
   */
  async getUserSessions(userId, options = {}) {
    return await sessionRepository.findByUserId(userId, options);
  }

  /**
   * Récupère l'historique des connexions
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Historique et pagination
   */
  async getLoginHistory(userId, options = {}) {
    return await sessionRepository.getLoginHistory(userId, options);
  }

  /**
   * Récupère les statistiques des sessions
   * @param {number} userId - ID de l'utilisateur (optionnel)
   * @returns {Promise<Object>} Statistiques
   */
  async getSessionStats(userId = null) {
    return await sessionRepository.getStats(userId);
  }

  /**
   * Nettoie les sessions et tokens expirés
   * @returns {Promise<Object>} Résultat du nettoyage
   */
  async cleanupExpired() {
    const [sessionsCleaned, tokensCleaned] = await Promise.all([
      sessionRepository.cleanupExpiredSessions(),
      sessionRepository.cleanupExpiredBlacklist()
    ]);

    return {
      success: true,
      message: 'Nettoyage effectué avec succès',
      sessionsCleaned,
      tokensCleaned
    };
  }

  /**
   * Valide une session à partir d'un access token
   * @param {string} accessToken - Access token à valider
   * @returns {Promise<Object>} Session validée
   */
  async validateSession(accessToken) {
    // Vérifier le token
    const tokenValidation = await this.verifyAccessToken(accessToken);
    if (!tokenValidation.valid) {
      throw new Error(tokenValidation.message);
    }

    // Récupérer la session
    const session = await sessionRepository.findByAccessToken(accessToken);
    if (!session) {
      throw new Error('Session non trouvée ou expirée');
    }

    // Récupérer les informations utilisateur
    const user = await usersRepository.findById(session.user_id);
    if (!user || user.status !== 'active') {
      throw new Error('Utilisateur non trouvé ou inactif');
    }

    return {
      session: {
        id: session.id,
        userId: session.user_id,
        deviceInfo: session.device_info,
        ipAddress: session.ip_address,
        expiresAt: session.expires_at
      },
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status
      },
      token: {
        valid: true,
        expiresAt: tokenValidation.expiresAt
      }
    };
  }

  /**
   * Génère un token de réinitialisation de mot de passe
   * @param {Object} user - Données utilisateur
   * @returns {string} Token de réinitialisation
   */
  generatePasswordResetToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      type: 'password_reset',
      jti: crypto.randomUUID()
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h', // 1 heure pour la réinitialisation
      issuer: process.env.JWT_ISSUER || 'event-planner-auth',
      audience: process.env.JWT_AUDIENCE || 'event-planner-users',
      algorithm: 'HS256'
    });
  }

  /**
   * Vérifie un token de réinitialisation de mot de passe
   * @param {string} token - Token à vérifier
   * @returns {Object} Token décodé et validé
   */
  async verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || 'event-planner-auth',
        audience: process.env.JWT_AUDIENCE || 'event-planner-users',
        algorithms: ['HS256']
      });

      if (decoded.type !== 'password_reset') {
        throw new Error('Type de token invalide');
      }

      return {
        valid: true,
        decoded,
        expiresAt: new Date(decoded.exp * 1000)
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'RESET_TOKEN_EXPIRED',
          message: 'Token de réinitialisation expiré'
        };
      }
      return {
        valid: false,
        error: 'INVALID_RESET_TOKEN',
        message: 'Token de réinitialisation invalide'
      };
    }
  }
}

module.exports = new SessionService();
