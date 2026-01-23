const twilio = require('twilio');
const { Vonage } = require('@vonage/server-sdk');
const logger = require('../utils/logger');
const configValidation = require('../config/validation');

/**
 * Service d'envoi de SMS pour l'authentification
 * Utilise Twilio + Vonage fallback avec haute disponibilité
 */
class SMSService {
  constructor() {
    this.twilioClient = null;
    this.vonageClient = null;
    this.twilioConfigured = false;
    this.vonageConfigured = false;
    // Appeler initialize() automatiquement à l'instanciation
    this.initialize();
  }

  /**
   * Initialise les clients SMS (Twilio + Vonage)
   */
  async initialize() {
    try {
      const config = configValidation.getConfig();
      
      // Initialiser Twilio
      if (configValidation.isServiceConfigured('sms')) {
        if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN && config.TWILIO_PHONE_NUMBER) {
          this.twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
          this.twilioConfigured = true;
          logger.info('Twilio SMS service initialized');
        }
      }

      // Initialiser Vonage comme fallback
      if (config.VONAGE_API_KEY && config.VONAGE_API_SECRET) {
        this.vonageClient = new Vonage({
          apiKey: config.VONAGE_API_KEY,
          apiSecret: config.VONAGE_API_SECRET
        });
        this.vonageConfigured = true;
        logger.info('Vonage SMS service initialized');
      }

      if (!this.twilioConfigured && !this.vonageConfigured) {
        logger.warn('No SMS service configured - SMS disabled');
      }

    } catch (error) {
      logger.error('Failed to initialize SMS service', { error: error.message });
      this.twilioConfigured = false;
      this.vonageConfigured = false;
    }
  }

  /**
   * Envoie un SMS avec fallback automatique
   * @param {string} phoneNumber - Numéro de téléphone du destinataire
   * @param {string} message - Message à envoyer
   * @param {Object} options - Options additionnelles
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendSMSWithFallback(phoneNumber, message, options = {}) {
    const config = configValidation.getConfig();
    
    // Essayer Twilio d'abord
    if (this.twilioConfigured) {
      try {
        const result = await this.twilioClient.messages.create({
          body: message,
          from: config.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });
        
        logger.auth('SMS sent via Twilio', {
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          messageSid: result.sid,
          status: result.status,
          provider: 'twilio'
        });
        
        return { success: true, provider: 'twilio', messageId: result.sid };
      } catch (error) {
        logger.warn('Twilio failed, trying Vonage', { 
          error: error.message,
          phoneNumber: this.maskPhoneNumber(phoneNumber)
        });
      }
    }

    // Fallback Vonage
    if (this.vonageConfigured) {
      try {
        const result = await this.vonageClient.sms.send({
          to: phoneNumber,
          from: config.VONAGE_FROM_NUMBER || 'EventPlanner',
          text: message
        });

        if (result.messages[0].status === '0') {
          logger.auth('SMS sent via Vonage', {
            phoneNumber: this.maskPhoneNumber(phoneNumber),
            messageId: result.messages[0].messageId,
            provider: 'vonage'
          });
          
          return { success: true, provider: 'vonage', messageId: result.messages[0].messageId };
        } else {
          throw new Error(`Vonage error: ${result.messages[0]['error-text']}`);
        }
      } catch (error) {
        logger.error('Vonage failed', { 
          error: error.message,
          phoneNumber: this.maskPhoneNumber(phoneNumber)
        });
      }
    }

    // Aucun service disponible
    if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
      logger.warn('SMS fallback - no service configured', {
        phoneNumber: this.maskPhoneNumber(phoneNumber)
      });
      return { success: false, fallback: true, reason: 'No SMS service configured' };
    }

    throw new Error('Tous les services SMS ont échoué');
  }

  /**
   * Envoie un code OTP par SMS
   * @param {string} phoneNumber - Numéro de téléphone du destinataire
   * @param {string} otpCode - Code OTP à envoyer
   * @param {string} purpose - But du code (login, verification, reset)
   * @param {Object} options - Options additionnelles
   * @returns {Promise<boolean>} True si envoyé avec succès
   */
  async sendOTP(phoneNumber, otpCode, purpose = 'login', options = {}) {
    try {
      const config = configValidation.getConfig();
      
      // En développement/test sans configuration, logger le code
      if (!this.twilioConfigured && !this.vonageConfigured) {
        if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
          logger.warn('OTP SMS fallback - service not configured', {
            phoneNumber: this.maskPhoneNumber(phoneNumber),
            purpose,
            otpCode: otpCode.substring(0, 3) + '***'
          });
          console.log(`🔐 [DEV] OTP SMS pour ${this.maskPhoneNumber(phoneNumber)}: ${otpCode} (purpose: ${purpose})`);
          return true;
        }
        
        throw new Error('Service SMS non configuré - impossible d\'envoyer l\'OTP');
      }

      const { message } = this.generateOTPMessage(otpCode, purpose, options);
      const result = await this.sendSMSWithFallback(phoneNumber, message, options);

      if (result.success) {
        logger.auth('OTP SMS sent successfully', {
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          purpose,
          provider: result.provider,
          messageId: result.messageId,
          ip: options.ip
        });
        return true;
      }

      throw new Error('Échec d\'envoi de l\'OTP par SMS');

    } catch (error) {
      logger.error('Failed to send OTP SMS', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        purpose,
        error: error.message,
        ip: options.ip
      });
      
      throw new Error(`Échec d'envoi de l'OTP par SMS: ${error.message}`);
    }
  }

  /**
   * Envoie un SMS de bienvenue
   * @param {string} phoneNumber - Numéro de téléphone du destinataire
   * @param {Object} user - Informations utilisateur
   * @param {Object} options - Options additionnelles
   * @returns {Promise<boolean>} True si envoyé avec succès
   */
  async sendWelcomeSMS(phoneNumber, user, options = {}) {
    try {
      if (!this.isConfigured) {
        return this.fallbackWelcome(phoneNumber, user);
      }

      const { message } = this.generateWelcomeMessage(user, options);

      const result = await this.client.messages.create({
        body: message,
        from: configValidation.getConfig().TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      logger.info('Welcome SMS sent', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        userId: user.id,
        messageSid: result.sid,
        status: result.status
      });

      return true;
    } catch (error) {
      logger.error('Failed to send welcome SMS', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        userId: user.id,
        error: error.message,
        errorCode: error.code
      });
      
      return this.fallbackWelcome(phoneNumber, user);
    }
  }

  /**
   * Envoie un SMS de réinitialisation de mot de passe
   * @param {string} phoneNumber - Numéro de téléphone du destinataire
   * @param {string} resetToken - Token de réinitialisation
   * @param {Object} options - Options additionnelles
   * @returns {Promise<boolean>} True si envoyé avec succès
   */
  async sendPasswordResetSMS(phoneNumber, resetToken, options = {}) {
    try {
      if (!this.isConfigured) {
        return this.fallbackPasswordReset(phoneNumber, resetToken);
      }

      const { message } = this.generatePasswordResetMessage(resetToken, options);

      const result = await this.client.messages.create({
        body: message,
        from: configValidation.getConfig().TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      logger.security('Password reset SMS sent', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        ip: options.ip,
        messageSid: result.sid,
        status: result.status
      });

      return true;
    } catch (error) {
      logger.error('Failed to send password reset SMS', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        error: error.message,
        errorCode: error.code,
        ip: options.ip
      });
      
      return this.fallbackPasswordReset(phoneNumber, resetToken);
    }
  }

  /**
   * Génère le message pour les SMS OTP
   * @param {string} otpCode - Code OTP
   * @param {string} purpose - But du code
   * @param {Object} options - Options additionnelles
   * @returns {Object} Message généré
   */
  generateOTPMessage(otpCode, purpose, options = {}) {
    const purposeTexts = {
      login: 'connexion',
      verification: 'vérification',
      reset: 'réinitialisation'
    };

    const purposeText = purposeTexts[purpose] || 'connexion';
    const expiresIn = options.expiresIn || 5;

    const message = `Event Planner: Votre code de ${purposeText} est ${otpCode}. Expire dans ${expiresIn} min. Ne partagez jamais ce code. Si vous n'avez pas demandé ce code, ignorez ce SMS.`;

    return { message };
  }

  /**
   * Génère le message pour les SMS de bienvenue
   * @param {Object} user - Informations utilisateur
   * @param {Object} options - Options additionnelles
   * @returns {Object} Message généré
   */
  generateWelcomeMessage(user, options = {}) {
    const message = `Bienvenue sur Event Planner ${user.first_name || user.username}! Votre compte a été créé avec succès. Connectez-vous pour commencer à organiser vos événements.`;

    return { message };
  }

  /**
   * Génère le message pour les SMS de réinitialisation
   * @param {string} resetToken - Token de réinitialisation
   * @param {Object} options - Options additionnelles
   * @returns {Object} Message généré
   */
  generatePasswordResetMessage(resetToken, options = {}) {
    const resetUrl = options.resetUrl || `http://localhost:3000/reset-password?token=${resetToken}`;
    const message = `Event Planner: Réinitialisez votre mot de passe: ${resetUrl}. Ce lien expire dans 1h. Si vous n'avez pas demandé cette réinitialisation, contactez-nous.`;

    return { message };
  }

  /**
   * Masque partiellement un numéro de téléphone pour les logs
   * @param {string} phoneNumber - Numéro à masquer
   * @returns {string} Numéro masqué
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) {
      return '***';
    }
    
    // Garder les 2 premiers et 2 derniers caractères
    const visible = phoneNumber.substring(0, 2) + '***' + phoneNumber.substring(phoneNumber.length - 2);
    return visible;
  }

  /**
   * Fallback pour l'envoi d'OTP quand le service n'est pas configuré
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {string} otpCode - Code OTP
   * @param {string} purpose - But du code
   * @returns {boolean} True (fallback réussi)
   */
  fallbackSendOTP(phoneNumber, otpCode, purpose) {
    logger.warn('OTP SMS fallback - service not configured', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      purpose,
      otpCode: otpCode.substring(0, 3) + '***' // Masquer partiellement le code
    });
    
    // En développement, on peut afficher le code dans les logs
    if (configValidation.getConfig().NODE_ENV === 'development') {
      console.log(`🔐 [FALLBACK] OTP SMS pour ${this.maskPhoneNumber(phoneNumber)}: ${otpCode} (purpose: ${purpose})`);
    }
    
    return true;
  }

  /**
   * Fallback pour le SMS de bienvenue
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {Object} user - Informations utilisateur
   * @returns {boolean} True (fallback réussi)
   */
  fallbackWelcome(phoneNumber, user) {
    logger.info('Welcome SMS fallback - service not configured', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      userId: user.id
    });
    
    return true;
  }

  /**
   * Fallback pour le SMS de réinitialisation
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {string} resetToken - Token de réinitialisation
   * @returns {boolean} True (fallback réussi)
   */
  fallbackPasswordReset(phoneNumber, resetToken) {
    logger.warn('Password reset SMS fallback - service not configured', {
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      resetToken: resetToken.substring(0, 8) + '***'
    });
    
    return true;
  }

  /**
   * Vérifie si au moins un service SMS est configuré
   * @returns {boolean} True si configuré
   */
  isReady() {
    return this.twilioConfigured || this.vonageConfigured;
  }

  /**
   * Teste la connexion aux services SMS
   * @returns {Promise<Object>} Résultat des tests
   */
  async testConnection() {
    const results = {
      twilio: { success: false, error: null },
      vonage: { success: false, error: null },
      overall: false
    };

    // Tester Twilio
    if (this.twilioConfigured) {
      try {
        const config = configValidation.getConfig();
        const account = await this.twilioClient.api.accounts(config.TWILIO_ACCOUNT_SID).fetch();
        results.twilio = {
          success: true,
          accountSid: account.sid,
          friendlyName: account.friendlyName,
          status: account.status
        };
      } catch (error) {
        results.twilio.error = error.message;
      }
    }

    // Tester Vonage
    if (this.vonageConfigured) {
      try {
        const result = await this.vonageClient.number.getBalance();
        results.vonage = {
          success: true,
          balance: result.value,
          currency: result.currency
        };
      } catch (error) {
        results.vonage.error = error.message;
      }
    }

    results.overall = results.twilio.success || results.vonage.success;
    return results;
  }
}

// Exporter une instance singleton
module.exports = new SMSService();
