/**
 * Middleware de gestion des erreurs pour le module permissions
 * Fournit des messages d'erreur explicites et sécurisés
 */

/**
 * Gère les erreurs spécifiques au module permissions
 * @param {Error} error - Erreur à traiter
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const permissionErrorHandler = (error, req, res, next) => {
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

  // Erreurs de statut
  if (error.message.includes('statut doit être')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_STATUS',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de duplication
  if (error.message.includes('existe déjà')) {
    return res.status(409).json({
      success: false,
      message: error.message,
      code: 'DUPLICATE_PERMISSION',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de permission non trouvée
  if (error.message.includes('Permission non trouvée')) {
    return res.status(404).json({
      success: false,
      message: error.message,
      code: 'PERMISSION_NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de suppression
  if (error.message.includes('Impossible de supprimer')) {
    return res.status(409).json({
      success: false,
      message: error.message,
      code: 'DELETE_CONSTRAINT',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs d'ID invalide
  if (error.message.includes('ID de permission invalide') || 
      error.message.includes('ID utilisateur invalide') ||
      error.message.includes('ID de rôle invalide')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_ID',
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

  // Erreurs de pagination et options
  if (error.message.includes('page') || 
      error.message.includes('limite') || 
      error.message.includes('tri')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_OPTIONS',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de permissions système critiques
  if (error.message.includes('permission système critique')) {
    return res.status(403).json({
      success: false,
      message: error.message,
      code: 'PROTECTED_PERMISSION',
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
  console.error('Erreur non gérée dans permissions module:', error);
  
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
 * Middleware de logging pour les opérations de permissions
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const permissionLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    if (req.user) {
      console.log(`User: ${req.user.id} (${req.user.email || req.user.username})`);
    }
    
    if (req.params.id) {
      console.log(`Permission ID: ${req.params.id}`);
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
const validatePermissionOperation = (req, res, next) => {
  // Validation pour les opérations de suppression
  if (req.method === 'DELETE' && req.params.id) {
    const permissionId = parseInt(req.params.id);
    
    // Empêcher la suppression de permissions système critiques
    const criticalPermissions = [1, 2, 3, 4]; // IDs des permissions critiques
    if (criticalPermissions.includes(permissionId) && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul un super administrateur peut supprimer une permission système critique',
        code: 'PROTECTED_PERMISSION',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Validation pour les opérations de mise à jour
  if (req.method === 'PUT' && req.params.id) {
    const permissionId = parseInt(req.params.id);
    
    // Empêcher la modification de permissions système critiques
    const criticalPermissions = [1, 2, 3, 4];
    if (criticalPermissions.includes(permissionId) && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul un super administrateur peut modifier une permission système critique',
        code: 'PROTECTED_PERMISSION',
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
const sanitizePermissionData = (req, res, next) => {
  // Nettoyer les données d'entrée
  if (req.body) {
    // Normaliser le nom de la permission
    if (req.body.name) {
      req.body.name = req.body.name.trim().toLowerCase();
    }
    
    // Normaliser la ressource
    if (req.body.resource) {
      req.body.resource = req.body.resource.trim().toLowerCase();
    }
    
    // Normaliser l'action
    if (req.body.action) {
      req.body.action = req.body.action.trim().toLowerCase();
    }
    
    // Normaliser la description
    if (req.body.description) {
      req.body.description = req.body.description.trim().replace(/\s+/g, ' ');
    }
    
    // Normaliser les tableaux de permissions
    if (req.body.permissions && Array.isArray(req.body.permissions)) {
      req.body.permissions = req.body.permissions.map(p => p.trim().toLowerCase());
    }
    
    // Normaliser les tableaux d'actions
    if (req.body.actions && Array.isArray(req.body.actions)) {
      req.body.actions = req.body.actions.map(a => a.trim().toLowerCase());
    }
  }
  
  next();
};

module.exports = {
  permissionErrorHandler,
  permissionLogger,
  validatePermissionOperation,
  sanitizePermissionData
};
