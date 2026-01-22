const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const OAuthErrorHandler = require('../modules/oauth/oauth.errorHandler');
const logger = require('../utils/logger');

/**
 * Middleware de sécurité spécialisé pour OAuth
 * Protection contre les attaques spécifiques à l'authentification OAuth
 */
class OAuthMiddleware {
  /**
   * Rate limiting spécifique pour OAuth
   * Limite les tentatives d'authentification OAuth
   */
  static oauthRateLimit() {
    return rateLimit({
      windowMs: parseInt(process.env.OAUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.OAUTH_RATE_LIMIT_MAX_REQUESTS) || 10, // 10 tentatives par fenêtre
      message: {
        success: false,
        message: 'Trop de tentatives d\'authentification OAuth. Veuillez réessayer plus tard.',
        code: 'OAUTH_RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.security('OAuth rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          method: req.method
        });

        res.status(429).json({
          success: false,
          message: 'Trop de tentatives d\'authentification OAuth. Veuillez réessayer plus tard.',
          code: 'OAUTH_RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((15 * 60 * 1000) / 1000) // secondes
        });
      }
    });
  }

  /**
   * Validation des en-têtes de sécurité OAuth
   * Vérifie que la requête provient d'une source légitime
   */
  static validateSecurityHeaders(req, res, next) {
    // Vérifier l'en-tête User-Agent
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 10) {
      logger.security('Suspicious OAuth request - Invalid User-Agent', {
        ip: req.ip,
        userAgent: userAgent || 'missing'
      });

      return res.status(400).json({
        success: false,
        message: 'Requête invalide',
        code: 'INVALID_USER_AGENT'
      });
    }

    // Vérifier l'en-tête Origin pour les requêtes cross-origin
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    const allowedOrigins = this.getAllowedOrigins();

    if (origin && !allowedOrigins.includes(origin)) {
      logger.security('Suspicious OAuth request - Invalid Origin', {
        ip: req.ip,
        origin,
        userAgent
      });

      return res.status(403).json({
        success: false,
        message: 'Origine non autorisée',
        code: 'INVALID_ORIGIN'
      });
    }

    next();
  }

  /**
   * Validation des tokens OAuth (taille et format)
   * Empêche les tokens malformés ou trop volumineux
   */
  static validateTokenFormat(req, res, next) {
    const { idToken, identityToken } = req.body;
    const token = idToken || identityToken;

    if (!token) {
      return next(); // Laisser la validation du controller gérer les tokens manquants
    }

    // Vérifier la taille du token (JWT typique)
    if (token.length < 100 || token.length > 2500) {
      logger.security('Suspicious OAuth request - Invalid token size', {
        ip: req.ip,
        tokenLength: token.length,
        userAgent: req.get('User-Agent')
      });

      return res.status(400).json({
        success: false,
        message: 'Token invalide',
        code: 'INVALID_TOKEN_SIZE'
      });
    }

    // Vérifier le format JWT (3 parties séparées par des points)
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.security('Suspicious OAuth request - Invalid JWT format', {
        ip: req.ip,
        partsCount: parts.length,
        userAgent: req.get('User-Agent')
      });

      return res.status(400).json({
        success: false,
        message: 'Token JWT invalide',
        code: 'INVALID_JWT_FORMAT'
      });
    }

    // Vérifier que chaque partie est en base64url valide
    try {
      parts.forEach(part => {
        Buffer.from(part, 'base64url');
      });
    } catch (error) {
      logger.security('Suspicious OAuth request - Invalid base64url encoding', {
        ip: req.ip,
        error: error.message,
        userAgent: req.get('User-Agent')
      });

      return res.status(400).json({
        success: false,
        message: 'Token JWT mal encodé',
        code: 'INVALID_JWT_ENCODING'
      });
    }

    next();
  }

  /**
   * Journalisation des tentatives OAuth
   * Enregistre toutes les tentatives pour audit
   */
  static logOAuthAttempt(req, res, next) {
    const startTime = Date.now();
    const originalSend = res.send;

    // Intercepter la réponse pour journaliser
    res.send = function(data) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      let responseData;
      try {
        responseData = JSON.parse(data);
      } catch (e) {
        responseData = { success: false };
      }

      const provider = req.url.includes('google') ? 'google' : 
                      req.url.includes('apple') ? 'apple' : 'unknown';

      OAuthErrorHandler.logOAuthAttempt({
        provider,
        success: responseData.success || false,
        userId: responseData.data?.user?.id || null,
        email: responseData.data?.user?.email || null,
        error: responseData.success ? null : responseData.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        duration,
        statusCode: res.statusCode
      });

      originalSend.call(this, data);
    };

    next();
  }

  /**
   * Configuration CORS spécifique à OAuth
   * Restreint les origines autorisées pour les endpoints OAuth
   */
  static oauthCors() {
    return (req, res, next) => {
      const allowedOrigins = this.getAllowedOrigins();
      const origin = req.get('Origin');

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
      }

      res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 heures

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  }

  /**
   * Récupère les origines autorisées depuis la configuration
   * @returns {Array} Liste des origines autorisées
   */
  static getAllowedOrigins() {
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    
    if (corsOrigin === '*') {
      return ['*'];
    }

    if (corsOrigin.includes(',')) {
      return corsOrigin.split(',').map(origin => origin.trim());
    }

    return [corsOrigin];
  }

  /**
   * Validation de la configuration OAuth
   * Vérifie que les variables d'environnement nécessaires sont présentes
   */
  static validateOAuthConfig(req, res, next) {
    const oauthService = require('../modules/oauth/oauth.service');
    const config = oauthService.checkConfiguration();
    const errors = OAuthErrorHandler.validateConfiguration(config);

    if (errors.length > 0) {
      logger.error('OAuth configuration validation failed', { errors });

      return res.status(500).json({
        success: false,
        message: 'Configuration OAuth invalide',
        code: 'OAUTH_CONFIG_ERROR',
        errors: errors.map(err => ({
          provider: err.provider,
          field: err.field,
          message: err.message
        }))
      });
    }

    next();
  }

  /**
   * Middleware combiné pour les routes OAuth
   * Applique toutes les protections OAuth
   */
  static oauthProtection() {
    return [
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://accounts.google.com", "https://appleid.apple.com"]
          }
        }
      }),
      this.oauthCors(),
      this.validateSecurityHeaders,
      this.validateTokenFormat,
      this.logOAuthAttempt,
      this.oauthRateLimit()
    ];
  }

  /**
   * Middleware pour les routes OAuth sécurisées (nécessitant configuration)
   */
  static secureOAuthRoutes() {
    return [
      this.validateOAuthConfig,
      ...this.oauthProtection()
    ];
  }
}

module.exports = OAuthMiddleware;
