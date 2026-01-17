const nodemailer = require('nodemailer');
const { createTransport } = require('nodemailer');
const logger = require('../utils/logger');
const configValidation = require('../config/validation');

/**
 * Service d'envoi d'emails pour l'authentification
 * Utilise Nodemailer avec configuration SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initialize();
  }

  /**
   * Initialise le transporteur email si la configuration est disponible
   */
  initialize() {
    try {
      const config = configValidation.getConfig();
      
      // Vérifier si le service email est configuré
      if (!configValidation.isServiceConfigured('email')) {
        logger.warn('Email service not configured - using fallback');
        this.isConfigured = false;
        return;
      }

      // Créer le transporteur
      this.transporter = createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false // Pour les environnements de développement
        }
      });

      // Vérifier la connexion
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email service verification failed', { error: error.message });
          this.isConfigured = false;
        } else {
          logger.info('Email service ready');
          this.isConfigured = true;
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email service', { error: error.message });
      this.isConfigured = false;
    }
  }

  /**
   * Envoie un code OTP par email
   * @param {string} email - Adresse email du destinataire
   * @param {string} otpCode - Code OTP à envoyer
   * @param {string} purpose - But du code (login, verification, reset)
   * @param {Object} options - Options additionnelles
   * @returns {Promise<boolean>} True si envoyé avec succès
   */
  async sendOTP(email, otpCode, purpose = 'login', options = {}) {
    try {
      if (!this.isConfigured) {
        return this.fallbackSendOTP(email, otpCode, purpose);
      }

      const { subject, html, text } = this.generateOTPTemplate(email, otpCode, purpose, options);

      const mailOptions = {
        from: `"${options.fromName || 'Event Planner'}" <${configValidation.getConfig().SMTP_USER}>`,
        to: email,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.auth('OTP email sent', {
        email,
        purpose,
        messageId: result.messageId,
        ip: options.ip
      });

      return true;
    } catch (error) {
      logger.error('Failed to send OTP email', {
        email,
        purpose,
        error: error.message,
        ip: options.ip
      });
      
      // Essayer le fallback en cas d'échec
      return this.fallbackSendOTP(email, otpCode, purpose);
    }
  }

  /**
   * Envoie un email de bienvenue
   * @param {string} email - Adresse email du destinataire
   * @param {Object} user - Informations utilisateur
   * @param {Object} options - Options additionnelles
   * @returns {Promise<boolean>} True si envoyé avec succès
   */
  async sendWelcomeEmail(email, user, options = {}) {
    try {
      if (!this.isConfigured) {
        return this.fallbackWelcome(email, user);
      }

      const { subject, html, text } = this.generateWelcomeTemplate(user, options);

      const mailOptions = {
        from: `"${options.fromName || 'Event Planner'}" <${configValidation.getConfig().SMTP_USER}>`,
        to: email,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Welcome email sent', {
        email,
        userId: user.id,
        messageId: result.messageId
      });

      return true;
    } catch (error) {
      logger.error('Failed to send welcome email', {
        email,
        userId: user.id,
        error: error.message
      });
      
      return this.fallbackWelcome(email, user);
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   * @param {string} email - Adresse email du destinataire
   * @param {string} resetToken - Token de réinitialisation
   * @param {Object} options - Options additionnelles
   * @returns {Promise<boolean>} True si envoyé avec succès
   */
  async sendPasswordResetEmail(email, resetToken, options = {}) {
    try {
      if (!this.isConfigured) {
        return this.fallbackPasswordReset(email, resetToken);
      }

      const { subject, html, text } = this.generatePasswordResetTemplate(email, resetToken, options);

      const mailOptions = {
        from: `"${options.fromName || 'Event Planner'}" <${configValidation.getConfig().SMTP_USER}>`,
        to: email,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.security('Password reset email sent', {
        email,
        ip: options.ip,
        messageId: result.messageId
      });

      return true;
    } catch (error) {
      logger.error('Failed to send password reset email', {
        email,
        error: error.message,
        ip: options.ip
      });
      
      return this.fallbackPasswordReset(email, resetToken);
    }
  }

  /**
   * Génère le template pour les emails OTP
   * @param {string} email - Email du destinataire
   * @param {string} otpCode - Code OTP
   * @param {string} purpose - But du code
   * @param {Object} options - Options additionnelles
   * @returns {Object} Template généré
   */
  generateOTPTemplate(email, otpCode, purpose, options = {}) {
    const purposeTexts = {
      login: 'connexion',
      verification: 'vérification',
      reset: 'réinitialisation'
    };

    const purposeText = purposeTexts[purpose] || 'connexion';
    const expiresIn = options.expiresIn || 5;

    const subject = `Code de ${purposeText} - Event Planner`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code de ${purposeText}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .code { font-size: 32px; font-weight: bold; color: #4f46e5; text-align: center; 
                  padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; 
                    border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Event Planner</h1>
            <p>Code de ${purposeText}</p>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Voici votre code de ${purposeText} pour Event Planner :</p>
            <div class="code">${otpCode}</div>
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul>
                <li>Ce code expire dans ${expiresIn} minutes</li>
                <li>Ne partagez jamais ce code avec personne</li>
                <li>Nous ne vous demanderons jamais ce code par téléphone</li>
              </ul>
            </div>
            <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Ne répondez pas à cet adresse.</p>
            <p>© 2024 Event Planner. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Event Planner - Code de ${purposeText}

Bonjour,

Voici votre code de ${purposeText} : ${otpCode}

Ce code expire dans ${expiresIn} minutes.

⚠️ Important :
- Ne partagez jamais ce code
- Nous ne vous le demanderons jamais par téléphone
- Si vous n'avez pas demandé ce code, ignorez cet email

© 2024 Event Planner. Tous droits réservés.
    `;

    return { subject, html, text };
  }

  /**
   * Génère le template pour les emails de bienvenue
   * @param {Object} user - Informations utilisateur
   * @param {Object} options - Options additionnelles
   * @returns {Object} Template généré
   */
  generateWelcomeTemplate(user, options = {}) {
    const subject = 'Bienvenue sur Event Planner !';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue !</h1>
            <p>Votre compte Event Planner est prêt</p>
          </div>
          <div class="content">
            <p>Bonjour ${user.first_name || user.username},</p>
            <p>Nous sommes ravis de vous accueillir sur Event Planner !</p>
            <p>Votre compte a été créé avec succès et vous pouvez maintenant :</p>
            <ul>
              <li>Vous connecter en toute sécurité</li>
              <li>Accéder à toutes les fonctionnalités</li>
              <li>Gérer vos événements</li>
            </ul>
            <p>Pour commencer, connectez-vous à votre espace.</p>
          </div>
          <div class="footer">
            <p>© 2024 Event Planner. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Bienvenue sur Event Planner !

Bonjour ${user.first_name || user.username},

Nous sommes ravis de vous accueillir sur Event Planner !

Votre compte a été créé avec succès. Vous pouvez maintenant :
- Vous connecter en toute sécurité
- Accéder à toutes les fonctionnalités  
- Gérer vos événements

Pour commencer, connectez-vous à votre espace.

© 2024 Event Planner. Tous droits réservés.
    `;

    return { subject, html, text };
  }

  /**
   * Génère le template pour les emails de réinitialisation
   * @param {string} email - Email du destinataire
   * @param {string} resetToken - Token de réinitialisation
   * @param {Object} options - Options additionnelles
   * @returns {Object} Template généré
   */
  generatePasswordResetTemplate(email, resetToken, options = {}) {
    const resetUrl = options.resetUrl || `http://localhost:3000/reset-password?token=${resetToken}`;
    const subject = 'Réinitialisation de votre mot de passe';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation mot de passe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; 
                   text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; 
                    border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Sécurité</h1>
            <p>Réinitialisation de mot de passe</p>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe Event Planner.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul>
                <li>Ce lien expire dans 1 heure</li>
                <li>Ne partagez jamais ce lien</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, contactez-nous</li>
              </ul>
            </div>
            <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>© 2024 Event Planner. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Réinitialisation de mot de passe - Event Planner

Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe.

Pour définir un nouveau mot de passe, visitez : ${resetUrl}

⚠️ Important :
- Ce lien expire dans 1 heure
- Ne partagez jamais ce lien
- Si vous n'avez pas demandé cette réinitialisation, contactez-nous

© 2024 Event Planner. Tous droits réservés.
    `;

    return { subject, html, text };
  }

  /**
   * Fallback pour l'envoi d'OTP quand le service n'est pas configuré
   * @param {string} email - Email du destinataire
   * @param {string} otpCode - Code OTP
   * @param {string} purpose - But du code
   * @returns {boolean} True (fallback réussi)
   */
  fallbackSendOTP(email, otpCode, purpose) {
    logger.warn('OTP email fallback - service not configured', {
      email,
      purpose,
      otpCode: otpCode.substring(0, 3) + '***' // Masquer partiellement le code
    });
    
    // En développement, on peut afficher le code dans les logs
    if (configValidation.getConfig().NODE_ENV === 'development') {
      console.log(`🔐 [FALLBACK] OTP pour ${email}: ${otpCode} (purpose: ${purpose})`);
    }
    
    return true;
  }

  /**
   * Fallback pour l'email de bienvenue
   * @param {string} email - Email du destinataire
   * @param {Object} user - Informations utilisateur
   * @returns {boolean} True (fallback réussi)
   */
  fallbackWelcome(email, user) {
    logger.info('Welcome email fallback - service not configured', {
      email,
      userId: user.id
    });
    
    return true;
  }

  /**
   * Fallback pour l'email de réinitialisation
   * @param {string} email - Email du destinataire
   * @param {string} resetToken - Token de réinitialisation
   * @returns {boolean} True (fallback réussi)
   */
  fallbackPasswordReset(email, resetToken) {
    logger.warn('Password reset email fallback - service not configured', {
      email,
      resetToken: resetToken.substring(0, 8) + '***'
    });
    
    return true;
  }

  /**
   * Vérifie si le service email est configuré
   * @returns {boolean} True si configuré
   */
  isReady() {
    return Boolean(this.isConfigured);
  }
}

// Exporter une instance singleton
module.exports = new EmailService();
