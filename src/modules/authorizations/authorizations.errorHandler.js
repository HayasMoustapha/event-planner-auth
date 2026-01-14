/**
 * Middleware de gestion des erreurs pour le module authorizations
 * Fournit des messages d'erreur explicites et sécurisés
 */

/**
 * Gère les erreurs spécifiques au module authorizations
 * @param {Error} error - Erreur à traiter
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const authorizationErrorHandler = (error, req, res, next) => {
  // Erreurs de validation
  if (error.message.includes('requis')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de format et de longueur
  if (error.message.includes('doit contenir entre') || 
      error.message.includes('ne peut pas dépasser') ||
      error.message.includes('doit suivre le format') ||
      error.message.includes('ne peut contenir que')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'FORMAT_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs d'ID invalide
  if (error.message.includes('ID utilisateur invalide') || 
      error.message.includes('ID de menu invalide')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_ID',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de politique
  if (error.message.includes('politique')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'POLICY_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de ressource
  if (error.message.includes('ressource')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'RESOURCE_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs d'action
  if (error.message.includes('action')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'ACTION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de cache
  if (error.message.includes('cache')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'CACHE_ERROR',
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

  // Erreurs de contrainte
  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Conflit de données',
      code: 'DATA_CONFLICT',
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

  // Erreur par défaut
  console.error('Erreur non gérée dans authorizations module:', error);
  
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
 * Middleware de logging pour les opérations d'autorisations
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const authorizationLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    if (req.user) {
      console.log(`User: ${req.user.id} (${req.user.email || req.user.username})`);
    }
    
    // Logger les données sensibles de manière sécurisée
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      // Masquer les données sensibles si nécessaire
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
const validateAuthorizationOperation = (req, res, next) => {
  // Validation pour les opérations de cache
  if (req.originalUrl.includes('/cache')) {
    // Seuls les administrateurs peuvent gérer le cache
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul un administrateur peut gérer le cache des autorisations',
        code: 'CACHE_MANAGEMENT_FORBIDDEN',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Validation pour les opérations de politique complexe
  if (req.body && req.body.policy && req.body.policy.type === 'complex') {
    // Les politiques complexes nécessitent des permissions élevées
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes pour les politiques complexes',
        code: 'COMPLEX_POLICY_FORBIDDEN',
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
const sanitizeAuthorizationData = (req, res, next) => {
  // Nettoyer les données d'entrée
  if (req.body) {
    // Normaliser les noms de permissions
    if (req.body.permissionName) {
      req.body.permissionName = req.body.permissionName.trim().toLowerCase();
    }
    
    // Normaliser les noms de rôles
    if (req.body.roleName) {
      req.body.roleName = req.body.roleName.trim().toLowerCase();
    }
    
    // Normaliser les noms de ressources
    if (req.body.resource) {
      req.body.resource = req.body.resource.trim().toLowerCase();
    }
    
    // Normaliser les actions
    if (req.body.action) {
      req.body.action = req.body.action.trim().toLowerCase();
    }
    
    // Normaliser les tableaux
    if (req.body.permissions && Array.isArray(req.body.permissions)) {
      req.body.permissions = req.body.permissions.map(p => p.trim().toLowerCase());
    }
    
    if (req.body.roles && Array.isArray(req.body.roles)) {
      req.body.roles = req.body.roles.map(r => r.trim().toLowerCase());
    }
  }
  
  next();
};

module.exports = {
  authorizationErrorHandler,
  authorizationLogger,
  validateAuthorizationOperation,
  sanitizeAuthorizationData
};
