const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Service de validation de la configuration de l'application
 * Utilise Joi pour valider toutes les variables d'environnement requises
 */
class ConfigValidationService {
  constructor() {
    this.schema = this.createValidationSchema();
    this.validatedConfig = null;
  }

  /**
   * Crée le schéma de validation Joi pour toutes les variables d'environnement
   * @returns {Joi.ObjectSchema} Schéma de validation
   */
  createValidationSchema() {
    return Joi.object({
      // Configuration serveur
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development')
        .description('Environnement d\'exécution'),
      
      PORT: Joi.number()
        .port()
        .default(3000)
        .description('Port d\'écoute du serveur'),

      // Configuration base de données
      DB_HOST: Joi.string()
        .hostname()
        .required()
        .description('Hôte de la base de données'),
      
      DB_PORT: Joi.number()
        .port()
        .default(5432)
        .description('Port de la base de données'),
      
      DB_NAME: Joi.string()
        .pattern(/^[a-zA-Z0-9_]+$/)
        .required()
        .description('Nom de la base de données'),
      
      DB_USER: Joi.string()
        .required()
        .description('Utilisateur de la base de données'),
      
      DB_PASSWORD: Joi.string()
        .required()
        .description('Mot de passe de la base de données'),
      
      DB_SSL: Joi.boolean()
        .default(false)
        .description('Utiliser SSL pour la connexion PostgreSQL'),

      // Configuration JWT
      JWT_SECRET: Joi.string()
        .min(32)
        .required()
        .description('Secret pour les tokens JWT (minimum 32 caractères)'),
      
      JWT_EXPIRES_IN: Joi.string()
        .pattern(/^\d+[smhd]$/)
        .default('24h')
        .description('Durée d\'expiration des tokens JWT'),
      
      JWT_REFRESH_EXPIRES_IN: Joi.string()
        .pattern(/^\d+[smhd]$/)
        .default('7d')
        .description('Durée d\'expiration des refresh tokens'),

      // Configuration sécurité
      BCRYPT_ROUNDS: Joi.number()
        .integer()
        .min(10)
        .max(15)
        .default(12)
        .description('Nombre de rounds pour bcrypt'),
      
      CORS_ORIGIN: Joi.string()
        .uri()
        .default('http://localhost:3000')
        .description('Origine autorisée pour CORS'),

      // Configuration Email (optionnelle pour le développement)
      SMTP_HOST: Joi.string()
        .when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional()
        })
        .description('Hôte du serveur SMTP'),
      
      SMTP_PORT: Joi.number()
        .port()
        .default(587)
        .description('Port du serveur SMTP'),
      
      SMTP_SECURE: Joi.boolean()
        .default(false)
        .description('Utiliser TLS pour SMTP'),
      
      SMTP_USER: Joi.string()
        .when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional()
        })
        .description('Utilisateur SMTP'),
      
      SMTP_PASS: Joi.string()
        .when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional()
        })
        .description('Mot de passe SMTP'),

      // Configuration SMS (optionnelle pour le développement)
      TWILIO_ACCOUNT_SID: Joi.string()
        .when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional()
        })
        .description('Account SID Twilio'),
      
      TWILIO_AUTH_TOKEN: Joi.string()
        .when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional()
        })
        .description('Auth token Twilio'),
      
      TWILIO_PHONE_NUMBER: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.optional()
        })
        .description('Numéro de téléphone Twilio'),

      // Configuration Redis (optionnelle pour le développement)
      REDIS_HOST: Joi.string()
        .hostname()
        .default('localhost')
        .description('Hôte Redis'),
      
      REDIS_PORT: Joi.number()
        .port()
        .default(6379)
        .description('Port Redis'),
      
      REDIS_PASSWORD: Joi.string()
        .allow('')
        .default('')
        .description('Mot de passe Redis'),
      
      REDIS_DB: Joi.number()
        .integer()
        .min(0)
        .max(15)
        .default(0)
        .description('Base de données Redis'),

      // Configuration OTP
      OTP_LENGTH: Joi.number()
        .integer()
        .min(4)
        .max(8)
        .default(6)
        .description('Longueur des codes OTP'),
      
      OTP_EXPIRES_IN: Joi.number()
        .integer()
        .min(60)
        .max(3600)
        .default(300)
        .description('Durée d\'expiration des OTP en secondes'),

      // Configuration Logging
      LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug')
        .default('info')
        .description('Niveau de logging'),
      
      LOG_FILE_PATH: Joi.string()
        .default('logs')
        .description('Répertoire des fichiers de log'),
      
      LOG_MAX_SIZE: Joi.string()
        .pattern(/^\d+[kmgt]?b$/i)
        .default('20m')
        .description('Taille maximale des fichiers de log'),
      
      LOG_MAX_FILES: Joi.string()
        .pattern(/^\d+[d]$/)
        .default('14d')
        .description('Durée de rétention des logs'),

      // Configuration Monitoring
      ENABLE_METRICS: Joi.boolean()
        .default(true)
        .description('Activer les métriques'),
      
      METRICS_PORT: Joi.number()
        .port()
        .default(9090)
        .description('Port pour les métriques'),

      // Configuration Rate Limiting
      RATE_LIMIT_WINDOW_MS: Joi.number()
        .integer()
        .min(60000)
        .max(3600000)
        .default(900000)
        .description('Fenêtre de temps pour rate limiting en ms'),
      
      RATE_LIMIT_MAX_REQUESTS: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .default(100)
        .description('Nombre maximal de requêtes par fenêtre'),
      
      AUTH_RATE_LIMIT_MAX_REQUESTS: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(5)
        .description('Nombre maximal de requêtes d\'auth par fenêtre')
    }).unknown(); // Permettre les variables additionnelles
  }

  /**
   * Valide la configuration complète de l'application
   * @returns {Object} Configuration validée
   * @throws {Error} Si la validation échoue
   */
  validateConfig() {
    try {
      const { error, value } = this.schema.validate(process.env, {
        allowUnknown: true,
        stripUnknown: false
      });

      if (error) {
        const errorMessage = `Configuration validation error: ${error.details.map(detail => detail.message).join(', ')}`;
        logger.error('Configuration validation failed', { 
          errors: error.details,
          environment: process.env.NODE_ENV 
        });
        throw new Error(errorMessage);
      }

      // Avertissements pour la configuration de développement
      this.checkDevelopmentWarnings(value);

      // Logger la configuration validée (sans les secrets)
      this.logValidatedConfig(value);

      this.validatedConfig = value;
      logger.info('Configuration validated successfully');
      
      return value;
    } catch (error) {
      logger.error('Critical configuration error', { error: error.message });
      throw error;
    }
  }

  /**
   * Vérifie les avertissements pour la configuration de développement
   * @param {Object} config - Configuration validée
   */
  checkDevelopmentWarnings(config) {
    if (config.NODE_ENV === 'production') {
      // Avertissements pour la production
      if (config.JWT_SECRET === 'your_super_secure_256_bit_secret_key_change_in_production') {
        logger.warn('Using default JWT secret in production - CHANGE IMMEDIATELY!');
      }

      if (!config.SMTP_HOST || !config.SMTP_USER) {
        logger.warn('Email service not configured in production');
      }

      if (!config.TWILIO_ACCOUNT_SID) {
        logger.warn('SMS service not configured in production');
      }
    } else {
      // Avertissements pour le développement
      if (config.JWT_SECRET === 'your_super_secure_256_bit_secret_key_change_in_production') {
        logger.warn('Using default JWT secret - OK for development only');
      }
    }
  }

  /**
   * Log la configuration validée (sans les secrets)
   * @param {Object} config - Configuration validée
   */
  logValidatedConfig(config) {
    const sanitizedConfig = { ...config };
    
    // Masquer les secrets dans les logs
    const secretFields = ['JWT_SECRET', 'DB_PASSWORD', 'SMTP_PASS', 'TWILIO_AUTH_TOKEN', 'REDIS_PASSWORD'];
    secretFields.forEach(field => {
      if (sanitizedConfig[field]) {
        sanitizedConfig[field] = '***MASKED***';
      }
    });

    logger.info('Configuration loaded', { 
      environment: config.NODE_ENV,
      port: config.PORT,
      database: {
        host: config.DB_HOST,
        port: config.DB_PORT,
        name: config.DB_NAME,
        ssl: config.DB_SSL
      },
      services: {
        email: !!config.SMTP_HOST,
        sms: !!config.TWILIO_ACCOUNT_SID,
        redis: !!config.REDIS_HOST
      },
      security: {
        bcryptRounds: config.BCRYPT_ROUNDS,
        jwtExpiresIn: config.JWT_EXPIRES_IN,
        otpLength: config.OTP_LENGTH
      },
      logging: {
        level: config.LOG_LEVEL,
        metrics: config.ENABLE_METRICS
      }
    });
  }

  /**
   * Retourne la configuration validée
   * @returns {Object} Configuration validée
   */
  getConfig() {
    if (!this.validatedConfig) {
      throw new Error('Configuration not validated yet. Call validateConfig() first.');
    }
    return this.validatedConfig;
  }

  /**
   * Vérifie si un service est configuré
   * @param {string} service - Nom du service ('email', 'sms', 'redis')
   * @returns {boolean} True si le service est configuré
   */
  isServiceConfigured(service) {
    const config = this.getConfig();
    
    switch (service) {
      case 'email':
        return !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
      case 'sms':
        return !!(config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN && config.TWILIO_PHONE_NUMBER);
      case 'redis':
        return !!(config.REDIS_HOST);
      default:
        return false;
    }
  }
}

// Exporter une instance singleton
module.exports = new ConfigValidationService();
