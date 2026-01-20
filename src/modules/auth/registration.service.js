const bcrypt = require('bcrypt');
const { connection } = require('../../config/database');
const otpService = require('./otp.service');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const serviceContainer = require('../../services/index');

/**
 * Service d'inscription pour gérer la création complète d'un utilisateur
 * Gère la création people + users + génération OTP de manière robuste
 */
class RegistrationService {
  constructor() {
    // Injection paresseuse pour éviter le cercle vicieux d'initialisation
    this._services = null;
  }

  /**
   * Obtient les services de manière paresseuse
   * @returns {Object} Services injectés
   */
  get services() {
    if (!this._services) {
      this._services = {
        emailService: serviceContainer.get('emailService'),
        smsService: serviceContainer.get('smsService'),
        cacheService: serviceContainer.get('cacheService')
      };
    }
    return this._services;
  }

  /**
   * Génère un code utilisateur basé sur le nom
   * @param {string} first_name - Prénom
   * @param {string} last_name - Nom de famille
   * @returns {string} Code utilisateur généré
   */
  generateUserCode(first_name, last_name) {
    const firstName = first_name?.trim() || '';
    const lastName = last_name?.trim() || '';
    const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
    return base || 'user';
  }

  /**
   * Inscrit un nouvel utilisateur avec création de personne et utilisateur
   * @param {Object} registrationData - Données d'inscription
   * @param {Object} options - Options supplémentaires (IP, UserAgent, etc.)
   * @returns {Promise<Object>} Résultat de l'inscription
   */
  async register(registrationData, options = {}) {
    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      username,
      userCode
    } = registrationData;

    // Validation des données de base
    if (!first_name || !first_name.trim()) {
      throw new Error('Le prénom est obligatoire');
    }
    if (!email || !email.trim()) {
      throw new Error('L\'email est obligatoire');
    }
    if (!password || password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    const client = await connection.connect();
    let person, user;

    try {
      // Démarrer une transaction pour garantir la cohérence
      await client.query('BEGIN');

      // ÉTAPE 1: Vérifier si l'email n'existe pas déjà
      const emailCheckQuery = `SELECT id FROM people WHERE email = $1`;
      const emailCheckResult = await client.query(emailCheckQuery, [email.trim().toLowerCase()]);
      if (emailCheckResult.rows.length > 0) {
        throw new Error('Cet email est déjà utilisé');
      }

      // ÉTAPE 2: Créer la personne
      const personQuery = `
        INSERT INTO people (first_name, last_name, email, phone, status, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, first_name, last_name, email, phone, status, created_at
      `;
      
      const personResult = await client.query(personQuery, [
        first_name.trim(),
        last_name?.trim() || null,
        email.trim().toLowerCase(),
        phone?.trim() || null,
        'active',
        null
      ]);
      
      person = personResult.rows[0];
      
      if (!person || !person.id) {
        throw new Error('Erreur lors de la création de la personne: ID non généré');
      }

      logger.info(`Personne créée: ${person.id} - ${person.email}`);

      // ÉTAPE 3: Créer l'utilisateur associé
      const userData = {
        username: username?.trim() || email.split('@')[0],
        email: email.trim().toLowerCase(),
        password: password,
        userCode: userCode || this.generateUserCode(first_name, last_name),
        phone: phone?.trim() || null,
        status: 'inactive', // Inactif jusqu'à validation OTP
        person_id: person.id
      };

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const userQuery = `
        INSERT INTO users (person_id, username, email, password, user_code, phone, status, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, person_id, username, email, user_code, phone, status, created_at
      `;
      
      const userResult = await client.query(userQuery, [
        userData.person_id,
        userData.username,
        userData.email,
        hashedPassword,
        userData.userCode,
        userData.phone,
        userData.status,
        null
      ]);
      
      user = userResult.rows[0];
      
      if (!user || !user.id) {
        throw new Error('Erreur lors de la création de l\'utilisateur: ID non généré');
      }

      logger.info(`Utilisateur créé: ${user.id} - ${user.email}`);

      // ÉTAPE 4: Générer et envoyer l'OTP
      const otpResult = await otpService.generateEmailOtp(user.id, person.email);
      
      // ÉTAPE 5: Envoyer l'OTP par email
      try {
        const emailSent = await this.services.emailService.sendOTP(person.email, otpResult.code, 'verification', {
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

      // Valider la transaction
      await client.query('COMMIT');

      // ÉTAPE 6: Retourner le résultat sans données sensibles
      return {
        success: true,
        message: 'Inscription réussie. Un code de vérification a été envoyé à votre email.',
        data: {
          person: {
            id: person.id,
            email: person.email,
            first_name: person.first_name,
            last_name: person.last_name
          },
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.status
          },
          otp: {
            id: otpResult.id,
            purpose: otpResult.purpose,
            expires_at: otpResult.expires_at,
            // En développement uniquement, inclure le code pour débogage
            ...(process.env.NODE_ENV === 'development' && { code: otpResult.code })
          }
        }
      };

      // Debug: Afficher l'environnement et le code OTP
      logger.info('Debug OTP Info', {
        nodeEnv: process.env.NODE_ENV,
        otpCode: otpResult.code,
        otpResult: otpResult
      });

    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await client.query('ROLLBACK');
      
      logger.error('Erreur lors de l\'inscription', {
        error: error.message,
        email: email,
        step: 'registration'
      });
      
      throw error;
    } finally {
      // Libérer la connexion
      client.release();
    }
  }

  /**
   * Vérifie un code OTP et active le compte utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} otpCode - Code OTP à vérifier
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async verifyEmail(email, otpCode) {
    try {
      // Récupérer la personne par email
      const personQuery = `SELECT id, email FROM people WHERE email = $1`;
      const personResult = await connection.query(personQuery, [email.trim().toLowerCase()]);
      
      if (personResult.rows.length === 0) {
        throw new Error('Aucun compte trouvé avec cet email');
      }
      
      const person = personResult.rows[0];
      
      // Vérifier l'OTP
      const otpVerification = await otpService.verifyEmailOtp(otpCode, email, person.id);
      
      if (!otpVerification.valid) {
        throw new Error('Code OTP invalide ou expiré');
      }
      
      // Activer l'utilisateur
      const userUpdateQuery = `
        UPDATE users 
        SET status = 'active', email_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE person_id = $1
        RETURNING id, username, email, status
      `;
      
      const userUpdateResult = await connection.query(userUpdateQuery, [person.id]);
      
      if (userUpdateResult.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }
      
      const user = userUpdateResult.rows[0];
      
      logger.info('Email vérifié et compte activé', {
        personId: person.id,
        userId: user.id,
        email: person.email
      });
      
      return {
        success: true,
        message: 'Email vérifié avec succès. Votre compte est maintenant actif.',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.status
          }
        }
      };
      
    } catch (error) {
      logger.error('Erreur lors de la vérification email', {
        error: error.message,
        email: email
      });
      
      throw error;
    }
  }

  /**
   * Renvoie un code OTP (alias pour resendOtp)
   * @param {string} email - Email de l'utilisateur
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async resendOTP(email, options = {}) {
    return await this.resendOtp(email, options);
  }

  /**
   * Renvoie un code OTP
   * @param {string} email - Email de l'utilisateur
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async resendOtp(email, options = {}) {
    try {
      // Récupérer la personne par email
      const personQuery = `SELECT id, email FROM people WHERE email = $1`;
      const personResult = await connection.query(personQuery, [email.trim().toLowerCase()]);
      
      if (personResult.rows.length === 0) {
        throw new Error('Aucun compte trouvé avec cet email');
      }
      
      const person = personResult.rows[0];
      
      // Générer un nouvel OTP
      const otpResult = await otpService.generateEmailOtp(person.id, person.email);
      
      // Envoyer l'OTP par email
      try {
        const emailSent = await this.services.emailService.sendOTP(person.email, otpResult.otp_code, 'verification', {
          ip: options.ip,
          userAgent: options.userAgent
        });
        
        if (!emailSent) {
          throw new Error('Échec d\'envoi de l\'email de vérification');
        }
        
        logger.info('OTP email resent successfully', {
          personId: person.id,
          email: person.email,
          otpId: otpResult.id
        });
        
        return {
          success: true,
          message: 'Un nouveau code de vérification a été envoyé à votre email.',
          data: {
            otp: {
              id: otpResult.id,
              purpose: otpResult.purpose,
              expires_at: otpResult.expires_at
            }
          }
        };
        
      } catch (emailError) {
        // Supprimer l'OTP généré si l'envoi échoue
        await otpService.invalidateOtp(otpResult.id);
        
        throw new Error(`Échec d'envoi de l'email de vérification: ${emailError.message}`);
      }
      
    } catch (error) {
      logger.error('Erreur lors du renvoi OTP', {
        error: error.message,
        email: email
      });
      
      throw error;
    }
  }
}

module.exports = new RegistrationService();
