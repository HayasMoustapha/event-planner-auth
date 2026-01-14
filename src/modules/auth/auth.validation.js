const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware de validation pour les entrées du module auth
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
 * Validation pour la connexion classique
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dépasser 254 caractères'),
    
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    
  handleValidationErrors
];

/**
 * Validation pour la connexion avec OTP
 */
const validateLoginWithOtp = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('L\'identifiant (email ou téléphone) est requis')
    .isLength({ min: 3, max: 254 })
    .withMessage('L\'identifiant doit contenir entre 3 et 254 caractères'),
    
  body('code')
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('Le code OTP doit contenir entre 4 et 10 caractères')
    .isNumeric()
    .withMessage('Le code OTP doit contenir uniquement des chiffres'),
    
  body('type')
    .optional()
    .isIn(['email', 'phone'])
    .withMessage('Le type doit être email ou phone'),
    
  handleValidationErrors
];

/**
 * Validation pour le rafraîchissement de token
 */
const validateRefreshToken = [
  body('refreshToken')
    .trim()
    .notEmpty()
    .withMessage('Le token de rafraîchissement est requis')
    .isLength({ min: 10 })
    .withMessage('Le token de rafraîchissement est invalide'),
    
  handleValidationErrors
];

/**
 * Validation pour la validation de token
 */
const validateToken = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Le token est requis')
    .isLength({ min: 10 })
    .withMessage('Le token est invalide'),
    
  handleValidationErrors
];

/**
 * Validation pour la génération d'OTP par email
 */
const validateGenerateEmailOtp = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dépasser 254 caractères'),
    
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  body('expiresInMinutes')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('La durée de validité doit être entre 1 et 60 minutes'),
    
  handleValidationErrors
];

/**
 * Validation pour la génération d'OTP par téléphone
 */
const validateGeneratePhoneOtp = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Le numéro de téléphone est requis')
    .isMobilePhone('any')
    .withMessage('Format de numéro de téléphone invalide')
    .isLength({ min: 10, max: 15 })
    .withMessage('Le numéro de téléphone doit contenir entre 10 et 15 caractères'),
    
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  body('expiresInMinutes')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('La durée de validité doit être entre 1 et 60 minutes'),
    
  handleValidationErrors
];

/**
 * Validation pour la vérification d'OTP par email
 */
const validateVerifyEmailOtp = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dépasser 254 caractères'),
    
  body('code')
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('Le code OTP doit contenir entre 4 et 10 caractères')
    .isNumeric()
    .withMessage('Le code OTP doit contenir uniquement des chiffres'),
    
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la vérification d'OTP par téléphone
 */
const validateVerifyPhoneOtp = [
  body('phone')
    .trim()
    .isMobilePhone('any')
    .withMessage('Format de numéro de téléphone invalide')
    .isLength({ min: 10, max: 15 })
    .withMessage('Le numéro de téléphone doit contenir entre 10 et 15 caractères'),
    
  body('code')
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('Le code OTP doit contenir entre 4 et 10 caractères')
    .isNumeric()
    .withMessage('Le code OTP doit contenir uniquement des chiffres'),
    
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la génération d'OTP de réinitialisation de mot de passe
 */
const validateGeneratePasswordResetOtp = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dépasser 254 caractères'),
    
  handleValidationErrors
];

/**
 * Validation pour la réinitialisation de mot de passe avec OTP
 */
const validateResetPasswordWithOtp = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dépasser 254 caractères'),
    
  body('code')
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('Le code OTP doit contenir entre 4 et 10 caractères')
    .isNumeric()
    .withMessage('Le code OTP doit contenir uniquement des chiffres'),
    
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    
  handleValidationErrors
];

/**
 * Validation pour l'invalidation des OTP d'un utilisateur
 */
const validateInvalidateUserOtps = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  body('type')
    .optional()
    .isIn(['email', 'phone'])
    .withMessage('Le type doit être email ou phone'),
    
  handleValidationErrors
];

/**
 * Validation pour le changement de mot de passe
 */
const validateChangePassword = [
  body('currentPassword')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Le mot de passe actuel est requis'),
    
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
      }
      return true;
    }),
    
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour les paramètres de requête
 */
const validateQueryParams = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  query('type')
    .optional()
    .isIn(['email', 'phone'])
    .withMessage('Le type doit être email ou phone'),
    
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateLoginWithOtp,
  validateRefreshToken,
  validateToken,
  validateGenerateEmailOtp,
  validateGeneratePhoneOtp,
  validateVerifyEmailOtp,
  validateVerifyPhoneOtp,
  validateGeneratePasswordResetOtp,
  validateResetPasswordWithOtp,
  validateInvalidateUserOtps,
  validateChangePassword,
  validateQueryParams,
  handleValidationErrors
};
