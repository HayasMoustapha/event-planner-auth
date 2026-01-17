const twilio = require('twilio');
const logger = require('../utils/logger');
const configValidation = require('../config/validation');

/**
 * Service d'envoi de SMS pour l'authentification
 * Utilise Twilio avec configuration sécurisée
 */
class SMSService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.initialize();
  }

  /**
   * Initialise le client Twilio si la configuration est disponible
   */
  initialize() {
    try {
      const config = configValidation.getConfig();
      
      // Vérifier si le service SMS est configuré
      if (!configValidation.isServiceConfigured('sms')) {
        logger.warn('SMS service not configured - using fallback');
        this.isConfigured = false;
        return;
      }

      // Créer le client Twilio
      this.client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
      
      // Valider le numéro de téléphone Twilio
      if (!config.TWILIO_PHONE_NUMBER) {
        logger.error('Twilio phone number not configured');
        this.isConfigured = false;
        return;
      }

      this.isConfigured = true;
      logger.info('SMS service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize SMS service', { error: error.message });
      this.isConfigured = false;
    }
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
      if (!this.isConfigured) {
        return this.fallbackSendOTP(phoneNumber, otpCode, purpose);
      }

      const { message } = this.generateOTPMessage(otpCode, purpose, options);

      const result = await this.client.messages.create({
        body: message,
        from: configValidation.getConfig().TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      logger.auth('OTP SMS sent', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        purpose,
        messageSid: result.sid,
        status: result.status,
        ip: options.ip
      });

      return true;
    } catch (error) {
      logger.error('Failed to send OTP SMS', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        purpose,
        error: error.message,
        errorCode: error.code,
        ip: options.ip
      });
      
      // Essayer le fallback en cas d'échec
      return this.fallbackSendOTP(phoneNumber, otpCode, purpose);
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
   * Vérifie si le service SMS est configuré
   * @returns {boolean} True si configuré
   */
  isReady() {
    return this.isConfigured;
  }

  /**
   * Teste la connexion au service SMS
   * @returns {Promise<Object>} Résultat du test
   */
  async testConnection() {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'Service not configured' };
      }

      // Tester en récupérant les informations du compte
      const account = await this.client.api.accounts(configValidation.getConfig().TWILIO_ACCOUNT_SID).fetch();
      
      return {
        success: true,
        accountSid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status
      };
    } catch (error) {
      logger.error('SMS connection test failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// Exporter une instance singleton
module.exports = new SMSService();
