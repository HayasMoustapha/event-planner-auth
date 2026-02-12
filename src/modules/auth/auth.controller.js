const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const authService = require('./auth.service');
const otpService = require('./otp.service');
const usersService = require('../users/users.service');
const usersRepository = require('../users/users.repository');
const passwordService = require('../password/password.service');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const emailService = require('../../services/email.service');
const smsService = require('../../services/sms.service');
const sessionService = require('../sessions/sessions.service');
const notificationClient = require('../../../../shared/clients/notification-client');

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
      const { email, password, remember_me = false } = req.body;

      const result = await authService.authenticate(email, password, remember_me);

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
   * Authentifie un utilisateur via un token présent dans l'URL
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async loginWithToken(req, res, next) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json(createResponse(
          false,
          'Token requis'
        ));
      }

      const validation = authService.validateToken(token);

      if (!validation.valid || !validation.decoded) {
        return res.status(401).json(createResponse(
          false,
          validation.message || 'Token invalide'
        ));
      }

      const usersRepository = require('../users/users.repository');
      const user = await usersRepository.findById(validation.decoded.id);

      if (!user || user.status !== 'active') {
        return res.status(401).json(createResponse(
          false,
          'Utilisateur non trouvé ou inactif'
        ));
      }

      const userResponse = { ...user };
      delete userResponse.password;

      const roles = await authService.getUserRoles(user.id);
      const permissions = await authService.getUserPermissions(user.id);
      const freshToken = authService.generateToken(user, { roles, permissions });

      res.status(200).json(createResponse(
        true,
        'Connexion réussie via lien',
        {
          user: userResponse,
          token: freshToken,
          remember_me: false,
          remember_token: null
        }
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

      // Tenter de révoquer le token (solution directe)
      try {
        // Blacklister directement le token sans vérifier la session
        await sessionService.blacklistTokenSimple(token, 'logout');
        
        res.status(200).json(createResponse(
          true,
          'Session terminée avec succès'
        ));
      } catch (sessionError) {
        // Si erreur, considérer que le logout réussit
        logger.warn('Erreur lors du logout:', sessionError.message);
        
        res.status(200).json(createResponse(
          true,
          'Session terminée avec succès'
        ));
      }
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

      const newToken = await authService.refreshToken(refreshToken);

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

        // En dev/test, on ne bloque pas le flux si l'email n'est pas configuré
        if (process.env.NODE_ENV !== 'production') {
          return res.status(201).json(createResponse(
            true,
            'OTP généré avec succès (email non envoyé en dev)',
            {
              contactInfo: email,
              expiresAt: otp.expires_at,
              expiresInMinutes,
              otpCode: otp.code
            }
          ));
        }

        // Supprimer l'OTP généré si l'envoi échoue en production
        await otpService.invalidateOtp(otp.id);

        throw new Error(`Échec d'envoi de l'OTP par email: ${emailError.message}`);
      }

      res.status(201).json(createResponse(
        true,
        'OTP généré avec succès',
        {
          contactInfo: email,
          expiresAt: otp.expires_at,
          expiresInMinutes,
          ...(process.env.NODE_ENV !== 'production' ? { otpCode: otp.code } : {})
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
      const mockEnabled = process.env.AUTH_MOCKS === 'true' || process.env.NODE_ENV !== 'production';
      const includeOtpCode = process.env.AUTH_MOCKS === 'true' || process.env.NODE_ENV !== 'production';

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
          // Fallback: récupérer l'utilisateur par téléphone si la personne n'est pas trouvée
          const usersRepository = require('../users/users.repository');
          const user = await usersRepository.findByPhone(phone);
          if (!user || !user.person_id) {
            return res.status(404).json(createResponse(
              false,
              'Personne non trouvée pour ce numéro de téléphone'
            ));
          }
          targetPersonId = user.person_id;
        } else {
          targetPersonId = person.id;
        }
      }

      const otp = await otpService.generatePhoneOtp(targetPersonId, phone, expiresInMinutes, req.user?.id);

      // Envoyer l'OTP par SMS
      try {
        const smsSent = await smsService.sendOTP(phone, otp.code, 'login', {
          expiresIn: expiresInMinutes,
          ip: req.ip
        });

        if (!smsSent) {
          throw new Error('Échec d\'envoi du SMS OTP');
        }

        logger.auth('OTP SMS sent successfully', {
          phone,
          personId: targetPersonId,
          otpId: otp.id,
          expiresInMinutes,
          ip: req.ip
        });
      } catch (smsError) {
        logger.error('Failed to send OTP SMS', {
          phone,
          personId: targetPersonId,
          error: smsError.message,
          ip: req.ip
        });

        // En dev/test, on ne bloque pas le flux si le SMS n'est pas configuré
        if (mockEnabled) {
          return res.status(201).json(createResponse(
            true,
            'OTP généré avec succès (SMS non envoyé en dev)',
            {
              contactInfo: phone,
              expiresAt: otp.expires_at,
              expiresInMinutes,
              ...(includeOtpCode ? { otpCode: otp.code } : {})
            }
          ));
        }

        // Supprimer l'OTP généré si l'envoi échoue en production
        await otpService.invalidateOtp(otp.id);

        throw new Error(`Échec d'envoi de l'OTP par SMS: ${smsError.message}`);
      }

      res.status(201).json(createResponse(
        true,
        'OTP envoyé par SMS avec succès',
        {
          contactInfo: phone,
          expiresAt: otp.expires_at,
          expiresInMinutes,
          ...(includeOtpCode ? { otpCode: otp.code } : {})
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
      const { email, otpCode, code, personId } = req.body;
      const finalCode = otpCode || code;

      if (!email || !finalCode) {
        return res.status(400).json(createResponse(
          false,
          'Email et code OTP requis'
        ));
      }

      const result = await otpService.verifyEmailOtp(finalCode, email, personId);

      // 🔥 ACTIVATION AUTOMATIQUE DU COMPTE APRÈS VÉRIFICATION OTP
      if (result.valid) {
        try {
          // Récupérer l'utilisateur associé à la personne
          const usersRepository = require('../users/users.repository');
          const peopleRepository = require('../people/people.repository');
          
          // Si personId n'est pas fourni, le récupérer depuis l'email
          let targetPersonId = personId;
          if (!targetPersonId) {
            const person = await peopleRepository.findByEmail(email);
            if (person) {
              targetPersonId = person.id;
            }
          }

          if (targetPersonId) {
            const user = await usersRepository.findByPersonId(targetPersonId);
            if (user && user.status !== 'active') {
              // Activer le compte utilisateur
              await usersRepository.updateStatus(user.id, 'active', user.id);
              result.accountActivated = true;
              result.message = 'OTP vérifié et compte activé avec succès';
              
              console.log(`✅ Compte utilisateur ${user.id} activé automatiquement après vérification OTP`);
              
              // 📧 ENVOI EMAIL DE CONFIRMATION D'ACTIVATION
              try {
                // Récupérer les informations complètes de la personne pour l'email
                const peopleRepository = require('../people/people.repository');
                const person = await peopleRepository.findById(targetPersonId);
                
                if (person && person.email) {
                  await notificationClient.sendAccountActivationEmail(person.email, {
                    firstName: person.first_name || '',
                    lastName: person.last_name || '',
                    username: user.username || person.email,
                    activationDate: new Date().toLocaleDateString('fr-FR'),
                    email: person.email
                  });
                  
                  console.log(`📧 Email de confirmation d'activation envoyé à ${person.email}`);
                  result.activationEmailSent = true;
                }
              } catch (emailError) {
                console.error('⚠️ Erreur lors de l\'envoi de l\'email d\'activation:', emailError.message);
                result.activationEmailSent = false;
                result.activationEmailError = emailError.message;
              }
            } else if (user && user.status === 'active') {
              result.accountActivated = false;
              result.message = 'OTP vérifié avec succès (compte déjà actif)';
            }
          }
        } catch (activationError) {
          console.error('⚠️ Erreur lors de l\'activation automatique du compte:', activationError.message);
          // Ne pas bloquer la réponse OTP si l'activation échoue
          result.accountActivated = false;
          result.activationError = activationError.message;
        }
      }

      res.status(200).json(createResponse(
        true,
        result.message || 'OTP vérifié avec succès',
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
      const { phone, otpCode, code, personId } = req.body;
      const finalCode = otpCode || code;

      if (!phone || !finalCode) {
        return res.status(400).json(createResponse(
          false,
          'Téléphone et code OTP requis'
        ));
      }

      const result = await otpService.verifyPhoneOtp(finalCode, phone, personId);

      // 🔥 ACTIVATION AUTOMATIQUE DU COMPTE APRÈS VÉRIFICATION OTP
      if (result.valid) {
        try {
          // Récupérer l'utilisateur associé à la personne
          const usersRepository = require('../users/users.repository');
          const peopleRepository = require('../people/people.repository');
          
          // Si personId n'est pas fourni, le récupérer depuis le téléphone
          let targetPersonId = personId;
          if (!targetPersonId) {
            const person = await peopleRepository.findByPhone(phone);
            if (person) {
              targetPersonId = person.id;
            }
          }

          if (targetPersonId) {
            const user = await usersRepository.findByPersonId(targetPersonId);
            if (user && user.status !== 'active') {
              // Activer le compte utilisateur
              await usersRepository.updateStatus(user.id, 'active', user.id);
              result.accountActivated = true;
              result.message = 'OTP vérifié et compte activé avec succès';
              
              console.log(`✅ Compte utilisateur ${user.id} activé automatiquement après vérification OTP téléphone`);
              
              // 📧 ENVOI EMAIL DE CONFIRMATION D'ACTIVATION
              try {
                // Récupérer les informations complètes de la personne pour l'email
                const peopleRepository = require('../people/people.repository');
                const person = await peopleRepository.findById(targetPersonId);
                
                if (person && person.email) {
                  await notificationClient.sendAccountActivationEmail(person.email, {
                    firstName: person.first_name || '',
                    lastName: person.last_name || '',
                    username: user.username || person.email,
                    activationDate: new Date().toLocaleDateString('fr-FR'),
                    email: person.email
                  });
                  
                  console.log(`📧 Email de confirmation d'activation envoyé à ${person.email}`);
                  result.activationEmailSent = true;
                }
              } catch (emailError) {
                console.error('⚠️ Erreur lors de l\'envoi de l\'email d\'activation:', emailError.message);
                result.activationEmailSent = false;
                result.activationEmailError = emailError.message;
              }
            } else if (user && user.status === 'active') {
              result.accountActivated = false;
              result.message = 'OTP vérifié avec succès (compte déjà actif)';
            }
          }
        } catch (activationError) {
          console.error('⚠️ Erreur lors de l\'activation automatique du compte:', activationError.message);
          // Ne pas bloquer la réponse OTP si l'activation échoue
          result.accountActivated = false;
          result.activationError = activationError.message;
        }
      }

      res.status(200).json(createResponse(
        true,
        result.message || 'OTP vérifié avec succès',
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
      const { contactInfo, code, otpCode, type = 'email' } = req.body;
      const finalCode = code || otpCode;

      if (!contactInfo || !finalCode) {
        return res.status(400).json(createResponse(
          false,
          'Contact et code OTP requis'
        ));
      }

      // Vérifier l'OTP
      const otpResult = await otpService.verifyOtp(finalCode, contactInfo, type);

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

      // Récupérer l'utilisateur pour la notification
      const usersRepository = require('../users/users.repository');
      const user = await usersRepository.findByEmail(email);

      if (user) {
        // Envoyer la notification de réinitialisation de mot de passe
        try {
          await authService.sendPasswordResetNotification(user, otp.code, otp.expires_at);
        } catch (notifyError) {
          logger.error('Failed to send password reset notification', {
            email,
            error: notifyError.message
          });

          if (process.env.NODE_ENV === 'production') {
            throw notifyError;
          }
        }
      }

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
          expiresAt: otp.expires_at,
          ...(process.env.NODE_ENV !== 'production' ? { otpCode: otp.code } : {})
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
      const { email, otpCode, code, token, newPassword } = req.body;
      const finalCode = otpCode || code || token;

      if (!email || !finalCode || !newPassword) {
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
      const otpResult = await otpService.verifyPasswordResetOtp(finalCode, email, person.id);

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

      // Envoyer une notification de changement de mot de passe
      await authService.sendPasswordChangeNotification(updatedUser);

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
      const { personId } = req.params;
      const { type } = req.query;

      if (!personId) {
        return res.status(400).json(createResponse(
          false,
          'ID personne requis'
        ));
      }

      const hasActive = await otpService.hasActiveOtp(parseInt(personId), type);

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

  /**
   * Affiche le formulaire de changement de mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getChangePasswordForm(req, res, next) {
    try {
      const user = req.user; // Récupéré depuis le middleware authenticate
      
      if (!user) {
        return res.status(401).json(createResponse(
          false,
          'Utilisateur non authentifié',
          { error: 'NOT_AUTHENTICATED' }
        ));
      }

      res.status(200).json(createResponse(
        true,
        'Formulaire de changement de mot de passe',
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          message: 'Utilisateur authentifié, peut changer le mot de passe'
        }
      ));
    } catch (error) {
      logger.error('Error in getChangePasswordForm:', {
        error: error.message,
        userId: req.user?.id,
        stack: error.stack
      });
      
      next(error);
    }
  }

  /**
   * Affiche le formulaire de réinitialisation de mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async showResetPasswordForm(req, res, next) {
    try {
      const { token, email } = req.query;

      if (!token || token === 'undefined' || token === '') {
        return res.status(400).json(createResponse(
          false,
          'Token de réinitialisation manquant ou invalide',
          { 
            error: 'MISSING_TOKEN',
            message: 'Le paramètre token est requis et ne peut pas être vide.'
          }
        ));
      }

      // Vérifier si le token est valide
      let tokenData = null;

      if (email) {
        // Si email fourni, vérifier le token spécifique
        tokenData = await passwordService.getResetToken(email);
      } else {
        // Retourner une erreur si pas d'email car on ne peut pas valider le token
        return res.status(400).json(createResponse(
          false,
          'Email requis pour valider le token',
          { 
            error: 'MISSING_EMAIL',
            message: 'L\'email est requis pour valider le token de réinitialisation.'
          }
        ));
      }

      if (!tokenData || tokenData.token !== token) {
        return res.status(400).json(createResponse(
          false,
          'Token de réinitialisation invalide',
          { 
            error: 'INVALID_TOKEN',
            message: 'Le lien de réinitialisation est invalide ou a expiré.'
          }
        ));
      }

      // Vérifier l'âge du token (24h max)
      const tokenAge = Date.now() - new Date(tokenData.created_at).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      
      if (tokenAge > maxAge) {
        return res.status(400).json(createResponse(
          false,
          'Token de réinitialisation expiré',
          { 
            error: 'EXPIRED_TOKEN',
            message: 'Le lien de réinitialisation a expiré. Veuillez demander une nouvelle réinitialisation.'
          }
        ));
      }

      // Token valide - retourner les informations pour le formulaire
      res.status(200).json(createResponse(
        true,
        'Token de réinitialisation valide',
        {
          token,
          email: email,
          expiresIn: maxAge - tokenAge,
          message: 'Vous pouvez maintenant réinitialiser votre mot de passe.'
        }
      ));
    } catch (error) {
      logger.error('Error in showResetPasswordForm:', {
        error: error.message,
        query: req.query,
        stack: error.stack
      });
      
      next(error);
    }
  }
}

module.exports = new AuthController();
