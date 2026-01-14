const otpService = require('./otp.service');
const authService = require('./auth.service');
const { createResponse } = require('../../utils/response');

/**
 * Controller HTTP pour la gestion de l'authentification et des OTP
 * Gère les requêtes et réponses HTTP avec validation et gestion d'erreurs
 */
class AuthController {
  /**
   * Authentifie un utilisateur avec email et mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.authenticate(email, password);
      
      res.status(200).json(createResponse(
        true,
        result.message,
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Déconnecte un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      const result = await authService.logout(token);
      
      res.status(200).json(createResponse(
        true,
        result.message
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rafraîchi un token JWT
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json(createResponse(
          false,
          'Token de rafraîchissement requis'
        ));
      }

      const newToken = authService.refreshToken(refreshToken);
      
      res.status(200).json(createResponse(
        true,
        'Token rafraîchi avec succès',
        { token: newToken }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Génère un OTP pour l'email
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async generateEmailOtp(req, res, next) {
    try {
      const { email, userId, expiresInMinutes = 15 } = req.body;
      
      if (!email && !userId) {
        return res.status(400).json(createResponse(
          false,
          'Email ou ID utilisateur requis'
        ));
      }

      let targetUserId = userId;
      
      // Si seul l'email est fourni, récupérer l'utilisateur
      if (!userId && email) {
        const usersRepository = require('../users/users.repository');
        const user = await usersRepository.findByEmail(email);
        if (!user) {
          return res.status(404).json(createResponse(
            false,
            'Utilisateur non trouvé pour cet email'
          ));
        }
        targetUserId = user.id;
      }

      const otp = await otpService.generateEmailOtp(targetUserId, email, expiresInMinutes, req.user?.id);
      
      // TODO: Envoyer l'OTP par email (service d'envoi)
      console.log(`📧 OTP généré pour ${email}: ${otp.code}`);
      
      res.status(201).json(createResponse(
        true,
        'OTP généré avec succès',
        {
          identifier: email,
          expiresAt: otp.expires_at,
          expiresInMinutes
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Génère un OTP pour le téléphone
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async generatePhoneOtp(req, res, next) {
    try {
      const { phone, userId, expiresInMinutes = 15 } = req.body;
      
      if (!phone && !userId) {
        return res.status(400).json(createResponse(
          false,
          'Téléphone ou ID utilisateur requis'
        ));
      }

      let targetUserId = userId;
      
      // Si seul le téléphone est fourni, récupérer l'utilisateur
      if (!userId && phone) {
        const usersRepository = require('../users/users.repository');
        const user = await usersRepository.findByPhone(phone);
        if (!user) {
          return res.status(404).json(createResponse(
            false,
            'Utilisateur non trouvé pour ce numéro de téléphone'
          ));
        }
        targetUserId = user.id;
      }

      const otp = await otpService.generatePhoneOtp(targetUserId, phone, expiresInMinutes, req.user?.id);
      
      // TODO: Envoyer l'OTP par SMS (service SMS)
      console.log(`📱 OTP généré pour ${phone}: ${otp.code}`);
      
      res.status(201).json(createResponse(
        true,
        'OTP généré avec succès',
        {
          identifier: phone,
          expiresAt: otp.expires_at,
          expiresInMinutes
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie un code OTP pour l'email
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async verifyEmailOtp(req, res, next) {
    try {
      const { email, code, userId } = req.body;
      
      if (!email || !code) {
        return res.status(400).json(createResponse(
          false,
          'Email et code OTP requis'
        ));
      }

      const result = await otpService.verifyEmailOtp(code, email, userId);
      
      res.status(200).json(createResponse(
        true,
        'OTP vérifié avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie un code OTP pour le téléphone
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async verifyPhoneOtp(req, res, next) {
    try {
      const { phone, code, userId } = req.body;
      
      if (!phone || !code) {
        return res.status(400).json(createResponse(
          false,
          'Téléphone et code OTP requis'
        ));
      }

      const result = await otpService.verifyPhoneOtp(code, phone, userId);
      
      res.status(200).json(createResponse(
        true,
        'OTP vérifié avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authentifie un utilisateur avec OTP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async loginWithOtp(req, res, next) {
    try {
      const { identifier, code, type = 'email' } = req.body;
      
      if (!identifier || !code) {
        return res.status(400).json(createResponse(
          false,
          'Identifiant et code OTP requis'
        ));
      }

      // Vérifier l'OTP
      const otpResult = await otpService.verifyOtp(code, identifier, type);
      
      // Récupérer l'utilisateur
      const usersRepository = require('../users/users.repository');
      let user;
      
      if (type === 'email') {
        user = await usersRepository.findByEmail(identifier);
      } else if (type === 'phone') {
        user = await usersRepository.findByPhone(identifier);
      }
      
      if (!user) {
        return res.status(404).json(createResponse(
          false,
          'Utilisateur non trouvé'
        ));
      }

      // Vérifier si le compte est actif
      if (user.status !== 'active') {
        if (user.status === 'locked') {
          return res.status(403).json(createResponse(
            false,
            'Ce compte est verrouillé'
          ));
        }
        if (user.status === 'inactive') {
          return res.status(403).json(createResponse(
            false,
            'Ce compte est désactivé'
          ));
        }
      }

      // Mettre à jour la date de dernière connexion
      await usersRepository.updateLastLogin(user.id);

      // Générer le token JWT
      const token = authService.generateToken(user);

      // Retourner l'utilisateur sans le mot de passe
      const userResponse = { ...user };
      delete userResponse.password_hash;

      res.status(200).json(createResponse(
        true,
        'Connexion avec OTP réussie',
        {
          user: userResponse,
          token: token,
          otpVerified: otpResult
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Génère un OTP pour la réinitialisation de mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async generatePasswordResetOtp(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json(createResponse(
          false,
          'Email requis'
        ));
      }

      const usersRepository = require('../users/users.repository');
      const user = await usersRepository.findByEmail(email);
      
      if (!user) {
        return res.status(404).json(createResponse(
          false,
          'Utilisateur non trouvé pour cet email'
        ));
      }

      const otp = await otpService.generatePasswordResetOtp(user.id, email);
      
      // TODO: Envoyer l'OTP par email
      console.log(`🔐 OTP de réinitialisation généré pour ${email}: ${otp.code}`);
      
      res.status(201).json(createResponse(
        true,
        'OTP de réinitialisation généré avec succès',
        {
          identifier: email,
          expiresAt: otp.expires_at
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Réinitialise le mot de passe avec OTP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async resetPasswordWithOtp(req, res, next) {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json(createResponse(
          false,
          'Email, code OTP et nouveau mot de passe requis'
        ));
      }

      // Vérifier l'OTP de réinitialisation
      const otpResult = await otpService.verifyPasswordResetOtp(code, email);
      
      // Récupérer l'utilisateur
      const usersRepository = require('../users/users.repository');
      const user = await usersRepository.findByEmail(email);
      
      if (!user) {
        return res.status(404).json(createResponse(
          false,
          'Utilisateur non trouvé'
        ));
      }

      // Mettre à jour le mot de passe
      const updatedUser = await usersRepository.updatePassword(user.id, newPassword, user.id);
      
      // Retourner l'utilisateur sans le mot de passe
      const userResponse = { ...updatedUser };
      delete userResponse.password_hash;

      res.status(200).json(createResponse(
        true,
        'Mot de passe réinitialisé avec succès',
        {
          user: userResponse,
          otpVerified: otpResult
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les OTP d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getUserOtps(req, res, next) {
    try {
      const { userId } = req.params;
      const { type } = req.query;
      
      if (!userId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const otps = await otpService.getUserOtps(parseInt(userId), type);
      
      res.status(200).json(createResponse(
        true,
        'OTP récupérés avec succès',
        otps
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invalide tous les OTP d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async invalidateUserOtps(req, res, next) {
    try {
      const { userId } = req.params;
      const { type } = req.body;
      
      if (!userId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const invalidatedCount = await otpService.invalidateUserOtps(parseInt(userId), type);
      
      res.status(200).json(createResponse(
        true,
        `${invalidatedCount} OTP invalidés avec succès`,
        { invalidatedCount }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur a des OTP actifs
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async hasActiveOtp(req, res, next) {
    try {
      const { userId } = req.params;
      const { type } = req.query;
      
      if (!userId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const hasActive = await otpService.hasActiveOtp(parseInt(userId), type);
      
      res.status(200).json(createResponse(
        true,
        'Vérification des OTP actifs',
        { hasActiveOtp: hasActive }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Nettoie les OTP expirés
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async cleanupExpiredOtps(req, res, next) {
    try {
      const deletedCount = await otpService.cleanupExpiredOtps();
      
      res.status(200).json(createResponse(
        true,
        `${deletedCount} OTP expirés supprimés`,
        { deletedCount }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les statistiques sur les OTP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getOtpStats(req, res, next) {
    try {
      const stats = await otpService.getOtpStats();
      
      res.status(200).json(createResponse(
        true,
        'Statistiques OTP récupérées avec succès',
        stats
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change le mot de passe d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id || req.body.userId;
      
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur, mot de passe actuel et nouveau mot de passe requis'
        ));
      }

      const result = await authService.changePassword(userId, currentPassword, newPassword, userId);
      
      res.status(200).json(createResponse(
        true,
        result.message,
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie la validité d'un token
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async validateToken(req, res, next) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json(createResponse(
          false,
          'Token requis'
        ));
      }

      const result = authService.validateToken(token);
      
      res.status(200).json(createResponse(
        true,
        'Validation du token',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les informations de l'utilisateur connecté
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json(createResponse(
          false,
          'Non authentifié'
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

      // Retourner l'utilisateur sans le mot de passe
      const userResponse = { ...user };
      delete userResponse.password_hash;

      res.status(200).json(createResponse(
        true,
        'Profil utilisateur récupéré',
        userResponse
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
