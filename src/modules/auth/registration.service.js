const bcrypt = require('bcrypt');
const peopleRepository = require('../people/people.repository');
const usersRepository = require('../users/users.repository');
const otpService = require('./otp.service');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger'); // Utiliser le logger direct pour éviter le cercle vicieux
const serviceContainer = require('../../services/index');

/**
 * Service d'inscription pour gérer la création complète d'un utilisateur
 * Gère la création people + users + génération OTP
 */
class RegistrationService {
  constructor() {
    // Injection paresseuse pour éviter le cercle vicieux d'initialisation
    this._services = null;
  }

  /**
   * Obtient les services de manière paresseuse
   */
  get services() {
    if (!this._services) {
      this._services = {
        logger: serviceContainer.get('logger'),
        emailService: serviceContainer.get('emailService'),
        smsService: serviceContainer.get('smsService'),
        cacheService: serviceContainer.get('cacheService')
      };
    }
    return this._services;
  }

  /**
   * Obtient le logger
   */
  get logger() {
    return logger; // Utiliser le logger direct
  }

  /**
   * Inscrit un nouvel utilisateur avec validation OTP
   * @param {Object} registrationData - Données d'inscription
   * @returns {Promise<Object>} Résultat de l'inscription
   */
  async register(registrationData) {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      username,
      userCode = null,
      options = {}
    } = registrationData;

    try {
      // 1. Valider les données d'entrée
      this.validateRegistrationData(registrationData);

      // 2. Vérifier si l'email n'est pas déjà utilisé dans people ou users
      const existingPerson = await peopleRepository.findByEmail(email);
      if (existingPerson) {
        throw new Error('Cet email est déjà utilisé');
      }

      const existingUser = await usersRepository.findByEmail(email);
      if (existingUser) {
        throw new Error('Un compte utilisateur existe déjà avec cet email');
      }

      // 3. Vérifier si le username n'est pas déjà utilisé
      if (username) {
        const existingUsername = await usersRepository.findByUsername(username);
        if (existingUsername) {
          throw new Error('Ce nom d\'utilisateur est déjà utilisé');
        }
      }

      // 4. Vérifier si le téléphone n'est pas déjà utilisé (optionnel)
      if (phone) {
        const existingPhone = await peopleRepository.findByPhone(phone);
        if (existingPhone) {
          throw new Error('Ce numéro de téléphone est déjà utilisé');
        }
      }

      // 5. Créer la personne
      const personData = {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        status: 'active'
      };

      const person = await peopleRepository.create(personData);
      logger.info(`Personne créée: ${person.id} - ${person.email}`);

      // 6. Créer l'utilisateur associé
      const userData = {
        username: username?.trim() || email.split('@')[0], // Utiliser la partie email comme username par défaut
        email: email.trim().toLowerCase(),
        password: password,
        userCode: userCode || this.generateUserCode(firstName, lastName),
        phone: phone?.trim() || null,
        status: 'inactive', // Inactif jusqu'à validation OTP
        personId: person.id
      };

      const user = await usersRepository.create(userData);
      logger.info(`Utilisateur créé: ${user.id} - ${user.email}`);

      // 7. Générer et envoyer l'OTP
      const otpResult = await otpService.generateEmailOtp(person.id, person.email);
      
      // 8. Envoyer l'OTP par email
      try {
        const emailSent = await this.services.emailService.sendOTP(person.email, otpResult.otp_code, 'verification', {
          ip: options.ip,
          userAgent: options.userAgent
        });
        
        if (!emailSent) {
          throw new Error('Échec d\'envoi de l\'email de vérification');
        }
        
        logger.info('OTP email sent successfully during registration', {
          personId: person.id,
          email: person.email,
          otpId: otpResult.id
        });
      } catch (emailError) {
        logger.error('Failed to send OTP email during registration', {
          personId: person.id,
          email: person.email,
          error: emailError.message
        });
        
        // Supprimer l'OTP généré si l'envoi échoue
        await otpService.invalidateOtp(otpResult.id);
        
        throw new Error(`Échec d'envoi de l'email de vérification: ${emailError.message}`);
      }
      
      // 8. Retourner le résultat sans données sensibles
      return {
        success: true,
        message: 'Inscription réussie. Un code de vérification a été envoyé à votre email.',
        data: {
          person: {
            id: person.id,
            email: person.email,
            firstName: person.first_name,
            lastName: person.last_name
          },
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            userCode: user.user_code,
            status: user.status
          },
          otp: {
            purpose: otpResult.purpose,
            expiresAt: otpResult.expiresAt
            // Ne pas inclure le code OTP lui-même
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Erreur lors de l'inscription: ${error.message}`);
      throw new Error(`Erreur lors de l'inscription: ${error.message}`);
    }
  }

  /**
   * Valide les données d'inscription
   * @param {Object} data - Données à valider
   */
  validateRegistrationData(data) {
    const { firstName, email, password } = data;

    // Validation des champs requis
    if (!firstName || !firstName.trim()) {
      throw new Error('Le prénom est requis');
    }

    if (!email || !email.trim()) {
      throw new Error('L\'email est requis');
    }

    if (!password || !password.trim()) {
      throw new Error('Le mot de passe est requis');
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Format d\'email invalide');
    }

    // Validation mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    // Validation téléphone si fourni
    if (data.phone && data.phone.trim()) {
      const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(data.phone.trim())) {
        throw new Error('Format de numéro de téléphone invalide');
      }
    }

    // Validation username si fourni
    if (data.username && data.username.trim()) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(data.username.trim())) {
        throw new Error('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères alphanumériques et underscores');
      }
    }
  }

  /**
   * Génère un user_code à partir du nom
   * @param {string} firstName - Prénom
   * @param {string} lastName - Nom
   * @returns {string} User code généré
   */
  generateUserCode(firstName, lastName) {
    const base = `${firstName?.toLowerCase() || ''}${lastName?.toLowerCase() || ''}`.replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now().toString(36);
    return `${base}_${timestamp}`;
  }

  /**
   * Vérifie un OTP et active le compte utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} otpCode - Code OTP à vérifier
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async verifyEmail(email, otpCode) {
    try {
      // 1. Récupérer la personne par email
      const person = await peopleRepository.findByEmail(email);
      if (!person) {
        throw new Error('Aucun compte trouvé avec cet email');
      }

      // 2. Vérifier l'OTP
      const otpVerification = await otpService.verifyEmailOtp(otpCode, email, person.id);
      // Si pas d'erreur, l'OTP est valide

      // 3. Récupérer l'utilisateur associé
      const user = await usersRepository.findByEmail(email);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // 4. Activer le compte utilisateur
      const activatedUser = await usersRepository.updateStatus(user.id, 'active', 'activatedBy');
      
      // 5. Marquer l'email comme vérifié
      await usersRepository.updateEmailVerifiedAt(user.id);
      
      logger.info(`Compte activé: ${user.id} - ${user.email}`);

      return {
        success: true,
        message: 'Email vérifié avec succès. Votre compte est maintenant actif.',
        data: {
          user: {
            id: activatedUser.id,
            username: activatedUser.username,
            email: activatedUser.email,
            status: activatedUser.status
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Erreur lors de la vérification email: ${error.message}`);
      throw new Error(`Erreur lors de la vérification: ${error.message}`);
    }
  }

  /**
   * Renvoie un code OTP pour un email existant
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async resendOTP(email, options = {}) {
    try {
      // 1. Vérifier si la personne existe
      const person = await peopleRepository.findByEmail(email);
      if (!person) {
        throw new Error('Aucun compte trouvé avec cet email');
      }

      // 2. Vérifier si l'utilisateur existe et est inactif
      const user = await usersRepository.findByEmail(email);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      if (user.status === 'active') {
        throw new Error('Ce compte est déjà actif');
      }

      // 3. Générer un nouvel OTP
      const otpResult = await otpService.generateEmailOtp(person.id, person.email);

      // 4. Envoyer l'OTP par email
      try {
        const emailSent = await this.services.emailService.sendOTP(person.email, otpResult.otp_code, 'verification', {
          ip: options.ip,
          userAgent: options.userAgent
        });
        
        if (!emailSent) {
          throw new Error('Échec d\'envoi de l\'email de vérification');
        }
        
        logger.info('OTP email sent successfully during resend', {
          personId: person.id,
          email: person.email,
          otpId: otpResult.id
        });
      } catch (emailError) {
        logger.error('Failed to send OTP email during resend', {
          personId: person.id,
          email: person.email,
          error: emailError.message
        });
        
        // Supprimer l'OTP généré si l'envoi échoue
        await otpService.invalidateOtp(otpResult.id);
        
        throw new Error(`Échec d'envoi de l'email de vérification: ${emailError.message}`);
      }

      return {
        success: true,
        message: 'Un nouveau code de vérification a été envoyé à votre email.',
        data: {
          email: email,
          purpose: otpResult.purpose,
          expiresAt: otpResult.expiresAt
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Erreur lors du renvoi OTP: ${error.message}`);
      throw new Error(`Erreur lors du renvoi du code: ${error.message}`);
    }
  }
}

module.exports = new RegistrationService();
