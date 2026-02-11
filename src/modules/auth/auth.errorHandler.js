/**
 * Middleware de gestion des erreurs pour le module auth
 * Fournit des messages d'erreur explicites et sécurisés
 */

/**
 * Gère les erreurs spécifiques au module auth
 * @param {Error} error - Erreur à traiter
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const authErrorHandler = (error, req, res, next) => {
  // Erreurs de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: error.details,
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

  if (error.message.includes('Format d\'email invalide')) {
    return res.status(400).json({
      success: false,
      message: 'Format d\'email invalide',
      code: 'INVALID_EMAIL_FORMAT',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Mot de passe requis')) {
    return res.status(400).json({
      success: false,
      message: 'Le mot de passe est requis',
      code: 'PASSWORD_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Email requis')) {
    return res.status(400).json({
      success: false,
      message: 'L\'email est requis',
      code: 'EMAIL_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de compte
  if (error.message.includes('Ce compte est verrouillé')) {
    return res.status(403).json({
      success: false,
      message: 'Ce compte est verrouillé. Veuillez contacter l\'administrateur.',
      code: 'ACCOUNT_LOCK',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Ce compte est désactivé')) {
    return res.status(403).json({
      success: false,
      message: 'Ce compte est désactivé. Veuillez contacter l\'administrateur.',
      code: 'ACCOUNT_INACTIVE',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de token
  if (error.message.includes('Token invalide')) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide',
      code: 'INVALID_TOKEN',
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

  if (error.message.includes('Token de rafraîchissement invalide')) {
    return res.status(401).json({
      success: false,
      message: 'Token de rafraîchissement invalide',
      code: 'INVALID_REFRESH_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs d'OTP
  if (error.message.includes('Code OTP invalide ou expiré')) {
    return res.status(400).json({
      success: false,
      message: 'Code OTP invalide ou expiré',
      code: 'INVALID_OTP',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Code OTP requis')) {
    return res.status(400).json({
      success: false,
      message: 'Le code OTP est requis',
      code: 'OTP_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Contact requis')) {
    return res.status(400).json({
      success: false,
      message: 'Le contact (email ou téléphone) est requis',
      code: 'CONTACT_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Type d\'OTP invalide')) {
    return res.status(400).json({
      success: false,
      message: 'Type d\'OTP invalide. Valeurs autorisées: email, phone',
      code: 'INVALID_OTP_TYPE',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Trop de codes OTP actifs')) {
    return res.status(429).json({
      success: false,
      message: 'Trop de codes OTP actifs pour cet utilisateur. Veuillez patienter avant de générer un nouveau code.',
      code: 'TOO_MANY_OTP',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Format de numéro de téléphone invalide')) {
    return res.status(400).json({
      success: false,
      message: 'Format de numéro de téléphone invalide',
      code: 'INVALID_PHONE_FORMAT',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de mot de passe
  if (error.message.includes('Mot de passe actuel incorrect')) {
    return res.status(400).json({
      success: false,
      message: 'Mot de passe actuel incorrect',
      code: 'INCORRECT_CURRENT_PASSWORD',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Le nouveau mot de passe doit être différent de l\'ancien')) {
    return res.status(400).json({
      success: false,
      message: 'Le nouveau mot de passe doit être différent de l\'ancien',
      code: 'SAME_PASSWORD',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Le mot de passe doit contenir au moins 8 caractères')) {
    return res.status(400).json({
      success: false,
      message: 'Le mot de passe doit contenir au moins 8 caractères',
      code: 'PASSWORD_TOO_SHORT',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')) {
    return res.status(400).json({
      success: false,
      message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
      code: 'PASSWORD_TOO_WEAK',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de ressources
  if (error.message.includes('Utilisateur non trouvé')) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé',
      code: 'USER_NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Utilisateur non trouvé ou inactif')) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé ou inactif',
      code: 'USER_NOT_FOUND_OR_INACTIVE',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de permissions
  if (error.message.includes('Non authentifié')) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié',
      code: 'NOT_AUTHENTICATED',
      timestamp: new Date().toISOString()
    });
  }

  // Erreurs de données
  if (error.message.includes('ID utilisateur invalide')) {
    return res.status(400).json({
      success: false,
      message: 'ID utilisateur invalide',
      code: 'INVALID_USER_ID',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('La durée de validité doit être entre 1 et 60 minutes')) {
    return res.status(400).json({
      success: false,
      message: 'La durée de validité doit être entre 1 et 60 minutes',
      code: 'INVALID_EXPIRATION_TIME',
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

  // Erreur par défaut
  console.error('Erreur non gérée dans auth module:', error);
  
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
 * Middleware de logging pour les opérations auth
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const authLogger = (req, res, next) => {
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
      if (sanitizedBody.password) sanitizedBody.password = '[MASKED]';
      if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = '[MASKED]';
      if (sanitizedBody.newPassword) sanitizedBody.newPassword = '[MASKED]';
      if (sanitizedBody.code) sanitizedBody.code = '[MASKED]';
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
const validateAuthOperation = (req, res, next) => {
  // Validation pour les opérations de changement de mot de passe
  if (req.path.includes('/change-password') && req.method === 'POST') {
    const userId = req.user?.id || req.body.userId;
    const currentUserId = req.user?.id;
    
    // Empêcher le changement du mot de passe d'un autre utilisateur sans permission
    if (currentUserId && userId && currentUserId !== parseInt(userId)) {
      const userRole = req.user?.role;
      if (userRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Seul un super administrateur peut modifier le mot de passe d\'un autre utilisateur',
          code: 'PASSWORD_CHANGE_FORBIDDEN',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  // Validation pour les opérations OTP
  if (req.path.includes('/otp/') && req.method === 'POST') {
    // Limiter la génération d'OTP par utilisateur
    const userId = req.user?.id;
    if (userId) {
      // TODO: Implémenter la logique de rate limiting
      console.log(`🔐 Génération OTP pour l'utilisateur ${userId}`);
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
const sanitizeAuthData = (req, res, next) => {
  // Masquer les mots de passe dans les logs
  if (req.body) {
    if (req.body.password) {
      req.body.password = '[MASKED]';
    }
    if (req.body.currentPassword) {
      req.body.currentPassword = '[MASKED]';
    }
    if (req.body.newPassword) {
      req.body.newPassword = '[MASKED]';
    }
    if (req.body.code) {
      req.body.code = '[MASKED]';
    }
  }
  
  // Masquer les tokens dans les headers
  if (req.headers.authorization) {
    req.headers.authorization = '[MASKED]';
  }
  
  next();
};

module.exports = {
  authErrorHandler,
  authLogger,
  validateAuthOperation,
  sanitizeAuthData
};
