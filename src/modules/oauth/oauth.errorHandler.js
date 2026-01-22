const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Gestionnaire d'erreurs spécialisé pour OAuth
 * Gère les erreurs spécifiques à Google Sign-In et Apple Sign-In
 */
class OAuthErrorHandler {
  /**
   * Gère les erreurs OAuth et retourne une réponse appropriée
   * @param {Error} error - Erreur à gérer
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  static handle(error, req, res, next) {
    logger.error('OAuth error occurred', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Erreurs spécifiques à OAuth
    if (error.message.includes('Token Google invalide')) {
      return res.status(401).json(createResponse(
        false,
        'Token Google invalide ou expiré',
        { 
          code: 'GOOGLE_TOKEN_INVALID',
          provider: 'google'
        }
      ));
    }

    if (error.message.includes('Token Apple invalide')) {
      return res.status(401).json(createResponse(
        false,
        'Token Apple invalide ou expiré',
        { 
          code: 'APPLE_TOKEN_INVALID',
          provider: 'apple'
        }
      ));
    }

    if (error.message.includes('Email déjà utilisé')) {
      return res.status(409).json(createResponse(
        false,
        'Cet email est déjà utilisé. Connectez-vous et liez votre compte.',
        { 
          code: 'EMAIL_ALREADY_USED',
          requiresLinking: true
        }
      ));
    }

    if (error.message.includes('Cette identité')) {
      return res.status(409).json(createResponse(
        false,
        error.message,
        { 
          code: 'IDENTITY_ALREADY_LINKED'
        }
      ));
    }

    if (error.message.includes('Fournisseur OAuth non supporté')) {
      return res.status(400).json(createResponse(
        false,
        'Fournisseur OAuth non supporté',
        { 
          code: 'UNSUPPORTED_PROVIDER'
        }
      ));
    }

    if (error.message.includes('compte est verrouillé')) {
      return res.status(403).json(createResponse(
        false,
        'Ce compte est verrouillé. Veuillez contacter l\'administrateur.',
        { 
          code: 'ACCOUNT_LOCKED'
        }
      ));
    }

    if (error.message.includes('compte est désactivé')) {
      return res.status(403).json(createResponse(
        false,
        'Ce compte est désactivé. Veuillez contacter l\'administrateur.',
        { 
          code: 'ACCOUNT_INACTIVE'
        }
      ));
    }

    if (error.message.includes('Impossible de détacher')) {
      return res.status(400).json(createResponse(
        false,
        error.message,
        { 
          code: 'IDENTITY_UNLINK_FAILED'
        }
      ));
    }

    // Erreurs de validation
    if (error.message.includes('requis')) {
      return res.status(400).json(createResponse(
        false,
        error.message,
        { 
          code: 'VALIDATION_ERROR'
        }
      ));
    }

    // Erreurs de configuration
    if (error.message.includes('configuration') || error.message.includes('CLIENT_ID')) {
      return res.status(500).json(createResponse(
        false,
        'Erreur de configuration OAuth. Contactez l\'administrateur.',
        { 
          code: 'OAUTH_CONFIG_ERROR'
        }
      ));
    }

    // Erreurs réseau ou serveur distant
    if (error.message.includes('network') || error.message.includes('fetch') || error.code === 'ECONNREFUSED') {
      return res.status(503).json(createResponse(
        false,
        'Service OAuth temporairement indisponible. Veuillez réessayer plus tard.',
        { 
          code: 'OAUTH_SERVICE_UNAVAILABLE'
        }
      ));
    }

    // Erreur par défaut
    return res.status(500).json(createResponse(
      false,
      'Erreur lors de l\'authentification OAuth',
      { 
        code: 'OAUTH_GENERIC_ERROR',
        timestamp: new Date().toISOString()
      }
    ));
  }

  /**
   * Middleware de gestion d'erreurs OAuth
   * @param {Error} error - Erreur à gérer
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  static middleware(error, req, res, next) {
    // Si l'en-tête Accept indique une préférence pour HTML
    if (req.get('Accept') && req.get('Accept').includes('text/html')) {
      return next(error);
    }

    // Gérer l'erreur avec le gestionnaire OAuth
    this.handle(error, req, res, next);
  }

  /**
   * Crée une erreur OAuth standardisée
   * @param {string} code - Code d'erreur
   * @param {string} message - Message d'erreur
   * @param {Object} details - Détails supplémentaires
   * @returns {Error} Erreur formatée
   */
  static createError(code, message, details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    error.isOAuth = true;
    return error;
  }

  /**
   * Journalique les tentatives d'authentification OAuth
   * @param {Object} logData - Données à journaliser
   */
  static logOAuthAttempt(logData) {
    const {
      provider,
      success,
      userId,
      email,
      error,
      ip,
      userAgent
    } = logData;

    const logLevel = success ? 'auth' : 'security';
    
    logger[logLevel]('OAuth authentication attempt', {
      provider,
      success,
      userId: success ? userId : null,
      email: success ? email : null,
      error: success ? null : error,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Valide la configuration OAuth et retourne les erreurs
   * @param {Object} config - Configuration OAuth
   * @returns {Array} Liste des erreurs de configuration
   */
  static validateConfiguration(config) {
    const errors = [];

    // Validation Google
    if (!config.google.clientId) {
      errors.push({
        provider: 'google',
        field: 'GOOGLE_CLIENT_ID',
        message: 'Client ID Google manquant'
      });
    }

    if (!config.google.clientSecret) {
      errors.push({
        provider: 'google',
        field: 'GOOGLE_CLIENT_SECRET',
        message: 'Client Secret Google manquant'
      });
    }

    // Validation Apple
    if (!config.apple.clientId) {
      errors.push({
        provider: 'apple',
        field: 'APPLE_CLIENT_ID',
        message: 'Client ID Apple manquant'
      });
    }

    if (!config.apple.teamId) {
      errors.push({
        provider: 'apple',
        field: 'APPLE_TEAM_ID',
        message: 'Team ID Apple manquant'
      });
    }

    if (!config.apple.keyId) {
      errors.push({
        provider: 'apple',
        field: 'APPLE_KEY_ID',
        message: 'Key ID Apple manquant'
      });
    }

    if (!config.apple.privateKey) {
      errors.push({
        provider: 'apple',
        field: 'APPLE_PRIVATE_KEY',
        message: 'Private Key Apple manquant'
      });
    }

    return errors;
  }
}

module.exports = OAuthErrorHandler;
