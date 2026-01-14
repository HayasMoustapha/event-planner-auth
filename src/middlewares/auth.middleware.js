const jwt = require('jsonwebtoken');
const sessionService = require('../modules/sessions/sessions.service');
const { createResponse } = require('../utils/response');

/**
 * Middleware d'authentification JWT
 * Vérifie les tokens et gère les sessions utilisateur
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(createResponse(
        false,
        'Token d\'accès requis',
        { code: 'TOKEN_REQUIRED' }
      ));
    }

    const token = authHeader.substring(7); // Supprimer 'Bearer '

    // Vérifier et valider le token
    const tokenValidation = await sessionService.verifyAccessToken(token);
    
    if (!tokenValidation.valid) {
      return res.status(401).json(createResponse(
        false,
        tokenValidation.message,
        { 
          code: tokenValidation.error,
          expiredAt: tokenValidation.expiresAt 
        }
      ));
    }

    // Valider la session complète
    const sessionValidation = await sessionService.validateSession(token);
    
    if (!sessionValidation) {
      return res.status(401).json(createResponse(
        false,
        'Session non trouvée ou expirée',
        { code: 'SESSION_INVALID' }
      ));
    }

    // Ajouter les informations utilisateur et session à la requête
    req.user = sessionValidation.user;
    req.session = sessionValidation.session;
    req.token = token;

    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    return res.status(401).json(createResponse(
      false,
      'Erreur d\'authentification',
      { 
        code: 'AUTHENTICATION_ERROR',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      }
    ));
  }
};

/**
 * Middleware d'authentification optionnelle
 * N'échoue pas si le token n'est pas présent, mais tente de valider s'il existe
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token, continuer sans authentification
      req.user = null;
      req.session = null;
      req.token = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    // Tenter de valider le token
    const tokenValidation = await sessionService.verifyAccessToken(token);
    
    if (!tokenValidation.valid) {
      req.user = null;
      req.session = null;
      req.token = null;
      return next();
    }

    // Valider la session
    const sessionValidation = await sessionService.validateSession(token);
    
    if (!sessionValidation) {
      req.user = null;
      req.session = null;
      req.token = null;
      return next();
    }

    // Ajouter les informations si valides
    req.user = sessionValidation.user;
    req.session = sessionValidation.session;
    req.token = token;

    next();
  } catch (error) {
    console.error('Erreur d\'authentification optionnelle:', error);
    
    // En cas d'erreur, continuer sans authentification
    req.user = null;
    req.session = null;
    req.token = null;
    next();
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est authentifié
 * @param {boolean} required - Si true, échoue si non authentifié
 */
const isAuthenticated = (required = true) => {
  return (req, res, next) => {
    if (required && !req.user) {
      return res.status(401).json(createResponse(
        false,
        'Authentification requise',
        { code: 'AUTHENTICATION_REQUIRED' }
      ));
    }
    
    next();
  };
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param {string|Array} roles - Rôle(s) autorisé(s)
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createResponse(
        false,
        'Authentification requise',
        { code: 'AUTHENTICATION_REQUIRED' }
      ));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(createResponse(
        false,
        'Permissions insuffisantes',
        { 
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: allowedRoles,
          userRole: req.user.role 
        }
      ));
    }

    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est propriétaire de la ressource
 * @param {string} paramName - Nom du paramètre contenant l'ID utilisateur
 */
const requireOwnership = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createResponse(
        false,
        'Authentification requise',
        { code: 'AUTHENTICATION_REQUIRED' }
      ));
    }

    const resourceUserId = parseInt(req.params[paramName]) || parseInt(req.body[paramName]);
    const currentUserId = req.user.id;

    // Les administrateurs peuvent accéder à toutes les ressources
    if (req.user.role === 'admin') {
      return next();
    }

    if (resourceUserId !== currentUserId) {
      return res.status(403).json(createResponse(
        false,
        'Accès non autorisé à cette ressource',
        { 
          code: 'ACCESS_DENIED',
          resourceUserId,
          currentUserId 
        }
      ));
    }

    next();
  };
};

/**
 * Middleware pour limiter le nombre de sessions actives
 * @param {number} maxSessions - Nombre maximum de sessions autorisées
 */
const limitSessions = (maxSessions = 5) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    try {
      const sessions = await sessionService.getUserSessions(req.user.id, { limit: 100 });
      const activeSessions = sessions.sessions.filter(s => s.is_active);

      if (activeSessions.length >= maxSessions) {
        return res.status(429).json(createResponse(
          false,
          `Nombre maximum de sessions atteint (${maxSessions})`,
          { 
            code: 'MAX_SESSIONS_REACHED',
            currentSessions: activeSessions.length,
            maxSessions 
          }
        ));
      }

      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des sessions:', error);
      next(); // Continuer en cas d'erreur
    }
  };
};

/**
 * Middleware pour vérifier la fraîcheur du token
 * @param {number} maxAge - Âge maximum du token en secondes
 */
const requireFreshToken = (maxAge = 300) => { // 5 minutes par défaut
  return (req, res, next) => {
    if (!req.user || !req.token) {
      return res.status(401).json(createResponse(
        false,
        'Authentification requise',
        { code: 'AUTHENTICATION_REQUIRED' }
      ));
    }

    try {
      // Décoder le token pour vérifier l'âge
      const decoded = jwt.decode(req.token);
      const tokenAge = Math.floor(Date.now() / 1000) - decoded.iat;

      if (tokenAge > maxAge) {
        return res.status(401).json(createResponse(
          false,
          'Token trop ancien, veuillez vous réauthentifier',
          { 
            code: 'TOKEN_TOO_OLD',
            tokenAge,
            maxAge 
          }
        ));
      }

      next();
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'âge du token:', error);
      
      return res.status(401).json(createResponse(
        false,
        'Token invalide',
        { code: 'INVALID_TOKEN' }
      ));
    }
  };
};

/**
 * Middleware pour ajouter des informations de session aux logs
 */
const sessionLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Ajouter des informations de session aux logs
    if (req.user) {
      console.log(`[${new Date().toISOString()}] Session: ${req.session?.id || 'unknown'}, User: ${req.user.id} (${req.user.email})`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware pour valider l'état du compte utilisateur
 */
const validateAccountStatus = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const user = req.user;

  if (user.status === 'locked') {
    return res.status(403).json(createResponse(
      false,
      'Compte verrouillé. Veuillez contacter l\'administrateur.',
      { code: 'ACCOUNT_LOCKED' }
    ));
  }

  if (user.status === 'inactive') {
    return res.status(403).json(createResponse(
      false,
      'Compte désactivé. Veuillez contacter l\'administrateur.',
      { code: 'ACCOUNT_INACTIVE' }
    ));
  }

  if (user.status !== 'active') {
    return res.status(403).json(createResponse(
      false,
      'État du compte non valide.',
      { code: 'INVALID_ACCOUNT_STATUS', status: user.status }
    ));
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  isAuthenticated,
  requireRole,
  requireOwnership,
  limitSessions,
  requireFreshToken,
  sessionLogger,
  validateAccountStatus
};
