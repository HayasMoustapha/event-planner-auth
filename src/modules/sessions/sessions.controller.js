const sessionService = require('./sessions.service');
const { createResponse } = require('../../utils/response');
const emailService = require('../../services/email.service');
const logger = require('../../utils/logger');

/**
 * Controller HTTP pour la gestion des sessions et tokens
 * Gère les requêtes et réponses HTTP avec validation et gestion d'erreurs
 */
class SessionController {
  /**
   * Crée une nouvelle session utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async createSession(req, res, next) {
    try {
      const { userId, deviceInfo, ipAddress, userAgent } = req.body;
      
      if (!userId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const sessionData = {
        userId,
        deviceInfo,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent')
      };

      const result = await sessionService.createSession(sessionData);
      
      res.status(201).json(createResponse(
        true,
        'Session créée avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rafraîchit les tokens d'une session
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async refreshSession(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const { expiresIn } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json(createResponse(
          false,
          'Refresh token requis'
        ));
      }

      const options = {};
      if (expiresIn) {
        options.expiresIn = parseInt(expiresIn);
      }

      const result = await sessionService.refreshSession(refreshToken, options);
      
      res.status(200).json(createResponse(
        true,
        'Tokens rafraîchis avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Déconnecte une session (logout)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async logoutSession(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(400).json(createResponse(
          false,
          'Token d\'accès requis'
        ));
      }

      const result = await sessionService.logoutSession(token);
      
      res.status(200).json(createResponse(
        true,
        result.message,
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Déconnecte toutes les sessions d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async logoutAllSessions(req, res, next) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { exceptSessionId } = req.body;
      
      if (!userId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const result = await sessionService.logoutAllSessions(userId, exceptSessionId);
      
      res.status(200).json(createResponse(
        true,
        result.message,
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les sessions actives d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getUserSessions(req, res, next) {
    try {
      const userId = req.user?.id || req.params.userId;
      const { page = 1, limit = 10 } = req.query;
      
      if (!userId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await sessionService.getUserSessions(userId, options);
      
      res.status(200).json(createResponse(
        true,
        'Sessions récupérées avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère l'historique des connexions
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getLoginHistory(req, res, next) {
    try {
      const userId = req.user?.id || req.params.userId;
      const { page = 1, limit = 20 } = req.query;
      
      if (!userId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await sessionService.getLoginHistory(userId, options);
      
      res.status(200).json(createResponse(
        true,
        'Historique des connexions récupéré avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les statistiques des sessions
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getSessionStats(req, res, next) {
    try {
      const userId = req.user?.id || req.query.userId;
      
      const result = await sessionService.getSessionStats(userId ? parseInt(userId) : null);
      
      res.status(200).json(createResponse(
        true,
        'Statistiques des sessions récupérées avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Nettoie les sessions et tokens expirés
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async cleanupExpired(req, res, next) {
    try {
      const result = await sessionService.cleanupExpired();
      
      res.status(200).json(createResponse(
        true,
        result.message,
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valide une session à partir d'un token
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async validateSession(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(400).json(createResponse(
          false,
          'Token d\'accès requis'
        ));
      }

      const result = await sessionService.validateSession(token);
      
      res.status(200).json(createResponse(
        true,
        'Session validée avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Génère un token de réinitialisation de mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async generatePasswordResetToken(req, res, next) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const usersRepository = require('../users/users.repository');
      const user = await usersRepository.findById(userId);
      
      if (!user) {
        return res.status(404).json(createResponse(
          false,
          'Utilisateur non trouvé'
        ));
      }

      const resetToken = sessionService.generatePasswordResetToken(user);

      // Construire l'URL de réinitialisation
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

      // Envoyer l'email de réinitialisation
      try {
        await emailService.sendPasswordResetEmail(user.email, resetToken, {
          resetUrl: resetUrl,
          ip: req.ip
        });

        logger.info('Password reset email sent via session controller', {
          userId: user.id,
          email: user.email
        });
      } catch (emailError) {
        logger.error('Failed to send password reset email', {
          userId: user.id,
          email: user.email,
          error: emailError.message
        });

        // En production, lever l'erreur
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json(createResponse(
            false,
            'Impossible d\'envoyer l\'email de réinitialisation'
          ));
        }
      }

      res.status(200).json(createResponse(
        true,
        'Email de réinitialisation envoyé avec succès',
        {
          userId: user.id,
          email: user.email,
          // En développement uniquement, retourner le token pour les tests
          ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl })
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie un token de réinitialisation de mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async verifyPasswordResetToken(req, res, next) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json(createResponse(
          false,
          'Token de réinitialisation requis'
        ));
      }

      const result = await sessionService.verifyPasswordResetToken(token);
      
      if (!result.valid) {
        return res.status(400).json(createResponse(
          false,
          result.message,
          { error: result.error }
        ));
      }
      
      res.status(200).json(createResponse(
        true,
        'Token de réinitialisation valide',
        {
          userId: result.decoded.id,
          email: result.decoded.email,
          expiresAt: result.expiresAt
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les informations de la session courante
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getCurrentSession(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(400).json(createResponse(
          false,
          'Token d\'accès requis'
        ));
      }

      const result = await sessionService.validateSession(token);
      
      res.status(200).json(createResponse(
        true,
        'Session courante récupérée avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Révoque un token spécifique
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async revokeToken(req, res, next) {
    try {
      const { token } = req.body;
      const { reason = 'manual_revocation' } = req.body;
      
      if (!token) {
        return res.status(400).json(createResponse(
          false,
          'Token à révoquer requis'
        ));
      }

      const sessionRepository = require('./sessions.repository');
      
      // Vérifier si le token est valide avant de le révoquer
      const tokenValidation = await sessionService.verifyAccessToken(token);
      
      if (tokenValidation.valid) {
        // Blacklister le token
        await sessionRepository.blacklistToken({
          token,
          userId: tokenValidation.decoded.id,
          reason,
          expiresAt: tokenValidation.expiresAt
        });
      }
      
      res.status(200).json(createResponse(
        true,
        'Token révoqué avec succès',
        { revoked: true }
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();
