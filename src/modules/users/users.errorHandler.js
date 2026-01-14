/**
 * Middleware de gestion des erreurs pour le module users
 * Fournit des messages d'erreur explicites et sécurisés
 */

/**
 * Gère les erreurs spécifiques au module users
 * @param {Error} error - Erreur à traiter
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const usersErrorHandler = (error, req, res, next) => {
  // Erreurs de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: error.details,
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de contrainte de base de données
  if (error.code === '23505') {
    let message = 'Conflit de données';
    
    if (error.constraint.includes('email')) {
      message = 'Cet email est déjà utilisé';
    } else if (error.constraint.includes('username')) {
      message = 'Ce nom d\'utilisateur est déjà utilisé';
    }
    
    return res.status(409).json({
      success: false,
      message,
      field: error.constraint.split('_')[0],
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de connexion à la base de données
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

  // Erreurs de données non trouvées
  if (error.message.includes('non trouvé') || error.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      message: error.message,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de données invalides
  if (error.message.includes('invalide') || error.message.includes('invalid')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_DATA',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de doublons
  if (error.message.includes('existe déjà') || error.message.includes('already exists')) {
    return res.status(409).json({
      success: false,
      message: error.message,
      code: 'DUPLICATE_ENTRY',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs d'opération non autorisée
  if (error.message.includes('Impossible de supprimer') || error.message.includes('associée')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'OPERATION_NOT_ALLOWED',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs d'authentification
  if (error.message.includes('Email ou mot de passe incorrect')) {
    return res.status(401).json({
      success: false,
      message: 'Email ou mot de passe incorrect',
      code: 'AUTHENTICATION_FAILED',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de compte verrouillé/désactivé
  if (error.message.includes('verrouillé') || error.message.includes('désactivé')) {
    return res.status(403).json({
      success: false,
      message: error.message,
      code: 'ACCOUNT_LOCKED',
      timestamp: new Date().toISOString()
    });
  }

  // Erreur par défaut
  console.error('Erreur non gérée dans users module:', error);
  
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
 * Middleware de logging pour les opérations users
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const usersLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    if (req.user) {
      console.log(`User: ${req.user.id} (${req.user.email || req.user.username})`);
    }
    
    if (req.body && Object.keys(req.body).important) {
      const sanitizedBody = { ...req.body };
      // Masquer les données sensibles
      if (sanitizedBody.password) sanitizedBody.password = '[MASKED]';
      if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = '[MASKED]';
      console.log('Body:', sanitizedBody);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware de validation des permissions pour les opérations sensibles
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const validateOperation = (req, res, next) => {
  // Validation pour les opérations de suppression
  if (req.method === 'DELETE' && req.params.id) {
    const id = parseInt(req.params.id);
    
    // Empêcher la suppression de son propre compte
    if (req.user && req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer votre propre compte',
        code: 'SELF_DELETE_FORBIDDEN',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Validation pour les opérations de mise à jour de statut
  if (req.method === 'PATCH' && req.params.id && req.body.status === 'locked') {
    const id = parseInt(req.params.id);
    
    // Empêcher de verrouiller son propre compte
    if (req.user && req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de verrouiller votre propre compte',
        code: 'SELF_LOCK_FORBIDDEN',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Validation pour les opérations de mise à jour de mot de passe
  if (req.method === 'PATCH' && req.params.id && req.body.currentPassword) {
    const id = parseInt(req.params.id);
    
    // Empêcher la modification du mot de passe d'un autre utilisateur
    if (req.user && req.user.id !== id && !req.user.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Seul un administrateur peut modifier le mot de passe d\'un autre utilisateur',
        code: 'PASSWORD_CHANGE_FORBIDDEN',
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
const sanitizeUserData = (req, res, next) => {
  // Masquer les mots de passe dans les logs
  if (req.body.password) {
    req.body.password = '[MASKED]';
  }
  if (req.body.currentPassword) {
    req.body.currentPassword = '[MASKED]';
  }
  
  // Masquer les tokens dans les headers
  if (req.headers.authorization) {
    req.headers.authorization = '[MASKED]';
  }
  
  next();
};

module.exports = {
  usersErrorHandler,
  usersLogger,
  validateOperation,
  sanitizeUserData
};
