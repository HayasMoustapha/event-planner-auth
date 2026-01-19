const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const authService = require('./auth.service');
const otpService = require('./otp.service');
const usersService = require('../users/users.service');
const usersRepository = require('../users/users.repository');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const emailService = require('../../services/email.service');
const sessionService = require('../sessions/sessions.service');

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

      if (!token) {
        return res.status(401).json(createResponse(
          false,
          'Token requis pour la déconnexion',
          { code: 'TOKEN_REQUIRED' }
        ));
      }

      const result = await sessionService.logoutSession(token);

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
      const { email, personId, expiresInMinutes = 15 } = req.body;

      if (!email && !personId) {
        return res.status(400).json(createResponse(
          false,
          'Email ou ID personne requis'
        ));
      }

      let targetPersonId = personId;

      // Si seul l'email est fourni, récupérer la personne
      if (!personId && email) {
        const peopleRepository = require('../people/people.repository');
        const person = await peopleRepository.findByEmail(email);
        if (!person) {
          return res.status(404).json(createResponse(
            false,
            'Personne non trouvée pour cet email'
          ));
        }
        targetPersonId = person.id;
      }

      logger.info('generateEmailOtp - Requête reçue', {
        email,
        userId: req.body?.userId,
        personId: targetPersonId,
        expiresInMinutes
      });

      const otp = await otpService.generateEmailOtp(targetPersonId, email, expiresInMinutes, req.user?.id || null);

      // Envoyer l'OTP par email
      try {
        const emailSent = await emailService.sendOTP(email, otp.code, 'login', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        if (!emailSent) {
          throw new Error('Échec d\'envoi de l\'email OTP');
        }

        logger.auth('OTP email sent successfully', {
          email,
          personId: targetPersonId,
          otpId: otp.id,
          expiresInMinutes,
          ip: req.ip
        });
      } catch (emailError) {
        logger.error('Failed to send OTP email', {
          email,
          personId: targetPersonId,
          error: emailError.message,
          ip: req.ip
        });

        // Supprimer l'OTP généré si l'envoi échoue
        await otpService.invalidateOtp(otp.id);

        throw new Error(`Échec d'envoi de l'OTP par email: ${emailError.message}`);
      }

      res.status(201).json(createResponse(
        true,
        'OTP généré avec succès',
        {
          contactInfo: email,
          expiresAt: otp.expires_at,
          expiresInMinutes
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connexion avec remember token
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async loginWithRememberToken(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json(createResponse(
          false,
          'Token requis',
          null
        ));
      }

      const result = await authService.loginWithRememberToken(token);

      res.status(200).json(createResponse(
        true,
        'Connexion réussie',
        result
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
      const { phone, personId, expiresInMinutes = 15 } = req.body;

      if (!phone && !personId) {
        return res.status(400).json(createResponse(
          false,
          'Téléphone ou ID personne requis'
        ));
      }

      let targetPersonId = personId;

      // Si seul le téléphone est fourni, récupérer la personne
      if (!personId && phone) {
        const peopleRepository = require('../people/people.repository');
        const person = await peopleRepository.findByPhone(phone);
        if (!person) {
          return res.status(404).json(createResponse(
            false,
            'Personne non trouvée pour ce numéro de téléphone'
          ));
        }
        targetPersonId = person.id;
      }

      const otp = await otpService.generatePhoneOtp(targetPersonId, phone, expiresInMinutes, req.user?.id);

      // TODO: Envoyer l'OTP par SMS (service SMS)
      logger.auth('OTP phone generated', {
        phone,
        personId: targetPersonId,
        expiresInMinutes,
        ip: req.ip
      });

      res.status(201).json(createResponse(
        true,
        'OTP généré avec succès',
        {
          contactInfo: phone,
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
      const { email, code, personId } = req.body;

      if (!email || !code) {
        return res.status(400).json(createResponse(
          false,
          'Email et code OTP requis'
        ));
      }

      const result = await otpService.verifyEmailOtp(code, email, personId);

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
      const { phone, code, personId } = req.body;

      if (!phone || !code) {
        return res.status(400).json(createResponse(
          false,
          'Téléphone et code OTP requis'
        ));
      }

      const result = await otpService.verifyPhoneOtp(code, phone, personId);

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
      const { contactInfo, code, type = 'email' } = req.body;

      if (!contactInfo || !code) {
        return res.status(400).json(createResponse(
          false,
          'Contact et code OTP requis'
        ));
      }

      // Vérifier l'OTP
      const otpResult = await otpService.verifyOtp(code, contactInfo, type);

      // Récupérer l'utilisateur
      const usersRepository = require('../users/users.repository');
      let user;

      if (type === 'email') {
        user = await usersRepository.findByEmail(contactInfo);
      } else if (type === 'phone') {
        user = await usersRepository.findByPhone(contactInfo);
      }

      if (!user) {
        return res.status(404).json(createResponse(
          false,
          'Utilisateur non trouvé'
        ));
      }

      // Vérifier si le compte est actif
      if (user.status !== 'active') {
        if (user.status === 'lock') {
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
      delete userResponse.password;

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

      const peopleRepository = require('../people/people.repository');
      const person = await peopleRepository.findByEmail(email);

      if (!person) {
        return res.status(404).json(createResponse(
          false,
          'Personne non trouvée pour cet email'
        ));
      }

      const otp = await otpService.generatePasswordResetOtp(person.id, email);

      // Envoyer l'OTP par email
      await emailService.sendPasswordResetEmail(email, otp.code, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.security('Password reset OTP generated', {
        email,
        personId: person.id,
        ip: req.ip
      });

      res.status(201).json(createResponse(
        true,
        'OTP de réinitialisation généré avec succès',
        {
          contactInfo: email,
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
      const { email, code, token, newPassword } = req.body;
      const otpCode = code || token;

      if (!email || !otpCode || !newPassword) {
        return res.status(400).json(createResponse(
          false,
          'Email, code OTP et nouveau mot de passe requis'
        ));
      }

      // Récupérer la personne
      const peopleRepository = require('../people/people.repository');
      const person = await peopleRepository.findByEmail(email);

      if (!person) {
        return res.status(404).json(createResponse(
          false,
          'Personne non trouvée'
        ));
      }

      // Vérifier l'OTP de réinitialisation
      const otpResult = await otpService.verifyPasswordResetOtp(otpCode, email, person.id);

      // Récupérer l'utilisateur associé
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
      delete userResponse.password;

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
      const { personId } = req.params;
      const { type } = req.query;

      if (!personId) {
        return res.status(400).json(createResponse(
          false,
          'ID personne requis'
        ));
      }

      const otps = await otpService.getPersonOtps(parseInt(personId), type);

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
      const { personId } = req.params;
      const { type } = req.body;

      if (!personId) {
        return res.status(400).json(createResponse(
          false,
          'ID personne requis'
        ));
      }

      const invalidatedCount = await otpService.invalidatePersonOtps(parseInt(personId), type);

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
      delete userResponse.password;

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
