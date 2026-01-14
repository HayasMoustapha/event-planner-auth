/**
 * Middleware de gestion des erreurs pour le module sessions
 * Fournit des messages d'erreur explicites et sécurisés
 */

/**
 * Gère les erreurs spécifiques au module sessions
 * @param {Error} error - Erreur à traiter
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const sessionErrorHandler = (error, req, res, next) => {
  // Erreurs de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: error.details,
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de session
  if (error.message.includes('Utilisateur non trouvé')) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé',
      code: 'USER_NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Utilisateur non actif')) {
    return res.status(403).json({
      success: false,
      message: 'Utilisateur non actif',
      code: 'USER_INACTIVE',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Session non trouvée')) {
    return res.status(404).json({
      success: false,
      message: 'Session non trouvée ou expirée',
      code: 'SESSION_NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de token
  if (error.message.includes('Token a été révoqué')) {
    return res.status(401).json({
      success: false,
      message: 'Token a été révoqué',
      code: 'TOKEN_REVOKED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Token expiré')) {
    return res.status(401).json({
      success: false,
      message: 'Token expiré',
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Token invalide')) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Refresh token expiré')) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token expiré',
      code: 'REFRESH_TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Refresh token invalide')) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token invalide',
      code: 'INVALID_REFRESH_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Type de token invalide')) {
    return res.status(400).json({
      success: false,
      message: 'Type de token invalide',
      code: 'INVALID_TOKEN_TYPE',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de réinitialisation de mot de passe
  if (error.message.includes('Token de réinitialisation expiré')) {
    return res.status(400).json({
      success: false,
      message: 'Token de réinitialisation expiré',
      code: 'RESET_TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Token de réinitialisation invalide')) {
    return res.status(400).json({
      success: false,
      message: 'Token de réinitialisation invalide',
      code: 'INVALID_RESET_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de données
  if (error.message.includes('ID utilisateur requis')) {
    return res.status(400).json({
      success: false,
      message: 'ID utilisateur requis',
      code: 'USER_ID_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('ID utilisateur invalide')) {
    return res.status(400).json({
      success: false,
      message: 'ID utilisateur invalide',
      code: 'INVALID_USER_ID',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Refresh token requis')) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token requis',
      code: 'REFRESH_TOKEN_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Token d\'accès requis')) {
    return res.status(400).json({
      success: false,
      message: 'Token d\'accès requis',
      code: 'ACCESS_TOKEN_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Token à révoquer requis')) {
    return res.status(400).json({
      success: false,
      message: 'Token à révoquer requis',
      code: 'REVOKE_TOKEN_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Token de réinitialisation requis')) {
    return res.status(400).json({
      success: false,
      message: 'Token de réinitialisation requis',
      code: 'RESET_TOKEN_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de base de données
  if (error.code === 'ECONNREFUSED' || error.code === '3D000') {
    return res.status(503).json({
      success: false,
      message: 'Service de base de données indisponible',
      code: 'DATABASE_UNAVAILABLE',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de permission
  if (error.code === '42501' || error.message.includes('permission')) {
    return res.status(403).json({
      success: false,
      message: 'Permission refusée pour cette opération',
      code: 'PERMISSION_DENIED',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de contrainte
  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Conflit de données',
      code: 'DATA_CONFLICT',
      timestamp: new Date().toISOString()
    });
  }

  // Erreur par défaut
  console.error('Erreur non gérée dans sessions module:', error);
  
  return res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    // En développement, inclure les détails de l'erreur
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  });
};

/**
 * Middleware de logging pour les opérations de sessions
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const sessionLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    if (req.user) {
      console.log(`User: ${req.user.id} (${req.user.email || req.user.username})`);
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      // Masquer les données sensibles
      if (sanitizedBody.accessToken) sanitizedBody.accessToken = '[MASKED]';
      if (sanitizedBody.refreshToken) sanitizedBody.refreshToken = '[MASKED]';
      if (sanitizedBody.token) sanitizedBody.token = '[MASKED]';
      console.log('Body:', sanitizedBody);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware de validation des opérations sensibles
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const validateSessionOperation = (req, res, next) => {
  // Validation pour les opérations de session
  if (req.path.includes('/logout-all') && req.method === 'POST') {
    const userId = req.user?.id || req.body.userId;
    const currentUserId = req.user?.id;
    
    // Empêcher la déconnexion des sessions d'un autre utilisateur sans permission
    if (currentUserId && userId && currentUserId !== parseInt(userId)) {
      const userRole = req.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Seul un administrateur peut déconnecter les sessions d\'un autre utilisateur',
          code: 'SESSION_LOGOUT_FORBIDDEN',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  // Validation pour les opérations de révocation
  if (req.path.includes('/revoke') && req.method === 'POST') {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise pour révoquer un token',
        code: 'AUTHENTICATION_REQUIRED',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
};

/**
 * Middleware de validation des données sensibles
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const sanitizeSessionData = (req, res, next) => {
  // Masquer les tokens dans les logs
  if (req.body) {
    if (req.body.accessToken) {
      req.body.accessToken = '[MASKED]';
    }
    if (req.body.refreshToken) {
      req.body.refreshToken = '[MASKED]';
    }
    if (req.body.token) {
      req.body.token = '[MASKED]';
    }
  }
  
  // Masquer les tokens dans les headers
  if (req.headers.authorization) {
    req.headers.authorization = '[MASKED]';
  }
  
  next();
};

module.exports = {
  sessionErrorHandler,
  sessionLogger,
  validateSessionOperation,
  sanitizeSessionData
};
