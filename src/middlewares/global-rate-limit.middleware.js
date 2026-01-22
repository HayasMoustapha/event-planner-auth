const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Middleware de rate limiting global
 * Applique des limites de taux sur tous les endpoints critiques
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        endpoint: req.path,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        success: false,
        message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000) // Convertir en secondes
      });
    }
  });
};

// Configurations par type d'endpoint
const rateLimitConfigs = {
  // Authentification - très restrictif
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.'
  },
  
  // Inscription - moins restrictif
  registration: {
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3,
    message: 'Trop de tentatives d\'inscription. Veuillez réessayer plus tard.'
  },
  
  // Mot de passe oublié - très restrictif
  passwordReset: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: 'Trop de tentatives de réinitialisation. Veuillez réessayer plus tard.'
  },
  
  // Requêtes générales - modérément
  general: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Trop de requêtes. Veuillez ralentir.'
  },
  
  // API sensibles - très restrictif
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 minute
    max: 10,
    message: 'Trop de requêtes sur les endpoints sensibles.'
  }
};

const getRateLimitConfig = (req) => {
  const path = req.path;
  
  // Endpoints d'authentification
  if (path.startsWith('/api/auth/login') || 
      path.startsWith('/api/auth/login-remember') || 
      path.startsWith('/api/auth/login-otp')) {
    return rateLimitConfigs.auth;
  }
  
  // Endpoints d'inscription
  if (path.startsWith('/api/auth/register') || 
      path.startsWith('/api/auth/verify-email')) {
    return rateLimitConfigs.registration;
  }
  
  // Endpoints de mot de passe oublié
  if (path.startsWith('/api/auth/forgot-password') || 
      path.startsWith('/api/auth/reset-password')) {
    return rateLimitConfigs.passwordReset;
  }
  
  // Endpoints sensibles (OAuth, profil, etc.)
  if (path.startsWith('/api/auth/oauth') || 
      path.startsWith('/api/auth/profile') || 
      path.startsWith('/api/users/') ||
      path.startsWith('/api/sessions/')) {
    return rateLimitConfigs.sensitive;
  }
  
  // Configuration par défaut
  return rateLimitConfigs.general;
};

const globalRateLimit = createRateLimit(60 * 1000, 1000, 'Trop de requêtes. Veuillez ralentir.');

module.exports = (req, res, next) => {
  const rateLimitConfig = getRateLimitConfig(req);
  const limiter = rateLimitConfig.windowMs ? 
    createRateLimit(rateLimitConfig.windowMs, rateLimitConfig.max, rateLimitConfig.message) : 
    globalRateLimit;
  
  // Appliquer le rate limiting
  limiter(req, res, () => {
    next();
  });
};
