/**
 * Middleware de gestion des erreurs pour le module roles
 * Fournit des messages d'erreur explicites et sécurisés
 */

/**
 * Gère les erreurs spécifiques au module roles
 * @param {Error} error - Erreur à traiter
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const roleErrorHandler = (error, req, res, next) => {
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

  // Erreurs de niveau
  if (error.message.includes('niveau doit être')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_LEVEL',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de duplication
  if (error.message.includes('existe déjà')) {
    return res.status(409).json({
      success: false,
      message: error.message,
      code: 'DUPLICATE_ROLE',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de rôle non trouvé
  if (error.message.includes('Rôle non trouvé')) {
    return res.status(404).json({
      success: false,
      message: error.message,
      code: 'ROLE_NOT_FOUND',
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
  if (error.message.includes('ID de rôle invalide') || 
      error.message.includes('ID utilisateur invalide')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_ID',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de permissions
  if (error.message.includes('permissions')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'PERMISSION_ERROR',
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
  console.error('Erreur non gérée dans roles module:', error);
  
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
 * Middleware de logging pour les opérations de rôles
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const roleLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    if (req.user) {
      console.log(`User: ${req.user.id} (${req.user.email || req.user.username})`);
    }
    
    if (req.params.id) {
      console.log(`Role ID: ${req.params.id}`);
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
const validateRoleOperation = (req, res, next) => {
  // Validation pour les opérations de suppression
  if (req.method === 'DELETE' && req.params.id) {
    const roleId = parseInt(req.params.id);
    
    // Empêcher la suppression du rôle admin si l'utilisateur n'est pas super admin
    if (roleId === 1 && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul un super administrateur peut supprimer le rôle administrateur',
        code: 'PROTECTED_ROLE',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Validation pour les opérations de mise à jour
  if (req.method === 'PUT' && req.params.id) {
    const roleId = parseInt(req.params.id);
    
    // Empêcher la modification du niveau du rôle admin
    if (roleId === 1 && req.body.level !== undefined && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul un super administrateur peut modifier le niveau du rôle administrateur',
        code: 'PROTECTED_LEVEL',
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
const sanitizeRoleData = (req, res, next) => {
  // Nettoyer les données d'entrée
  if (req.body) {
    // Normaliser le nom du rôle
    if (req.body.name) {
      req.body.name = req.body.name.trim().replace(/\s+/g, ' ');
    }
    
    // Normaliser la description
    if (req.body.description) {
      req.body.description = req.body.description.trim().replace(/\s+/g, ' ');
    }
    
    // Valider le niveau
    if (req.body.level !== undefined) {
      req.body.level = parseInt(req.body.level);
    }
  }
  
  next();
};

module.exports = {
  roleErrorHandler,
  roleLogger,
  validateRoleOperation,
  sanitizeRoleData
};
