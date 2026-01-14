const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware de validation pour les entrées du module sessions
 * Utilise express-validator pour valider et nettoyer les données
 */

/**
 * Gère les erreurs de validation
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Validation pour la création de session
 */
const validateCreateSession = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  body('deviceInfo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Les informations sur l\'appareil ne peuvent pas dépasser 255 caractères'),
    
  body('ipAddress')
    .optional()
    .isIP()
    .withMessage('L\'adresse IP est invalide'),
    
  body('userAgent')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le user agent ne peut pas dépasser 500 caractères'),
    
  handleValidationErrors
];

/**
 * Validation pour le rafraîchissement de session
 */
const validateRefreshSession = [
  body('refreshToken')
    .trim()
    .notEmpty()
    .withMessage('Le refresh token est requis')
    .isLength({ min: 10 })
    .withMessage('Le refresh token est invalide'),
    
  body('expiresIn')
    .optional()
    .isInt({ min: 300, max: 86400 }) // 5min à 24h
    .withMessage('La durée d\'expiration doit être entre 300 et 86400 secondes'),
    
  handleValidationErrors
];

/**
 * Validation pour la déconnexion de toutes les sessions
 */
const validateLogoutAllSessions = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  body('exceptSessionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de session doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des sessions utilisateur
 */
const validateGetUserSessions = [
  param('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération de l'historique des connexions
 */
const validateGetLoginHistory = [
  param('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des statistiques
 */
const validateGetSessionStats = [
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la génération de token de réinitialisation
 */
const validateGeneratePasswordResetToken = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la vérification de token de réinitialisation
 */
const validateVerifyPasswordResetToken = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Le token de réinitialisation est requis')
    .isLength({ min: 10 })
    .withMessage('Le token de réinitialisation est invalide'),
    
  handleValidationErrors
];

/**
 * Validation pour la révocation de token
 */
const validateRevokeToken = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Le token à révoquer est requis')
    .isLength({ min: 10 })
    .withMessage('Le token est invalide'),
    
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La raison ne peut pas dépasser 255 caractères')
    .isIn(['manual_revocation', 'security_breach', 'user_request', 'admin_action'])
    .withMessage('La raison doit être une valeur valide: manual_revocation, security_breach, user_request, admin_action'),
    
  handleValidationErrors
];

/**
 * Validation pour les paramètres de route
 */
const validateRouteParams = [
  param('sessionId')
    .isInt({ min: 1 })
    .withMessage('L\'ID de session doit être un entier positif'),
    
  handleValidationErrors
];

module.exports = {
  validateCreateSession,
  validateRefreshSession,
  validateLogoutAllSessions,
  validateGetUserSessions,
  validateGetLoginHistory,
  validateGetSessionStats,
  validateGeneratePasswordResetToken,
  validateVerifyPasswordResetToken,
  validateRevokeToken,
  validateRouteParams,
  handleValidationErrors
};
