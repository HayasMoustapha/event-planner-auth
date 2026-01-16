const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware de validation pour les entrées du module users
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
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * Validation pour la création d'un utilisateur
 */
const validateCreate = [
  // Champs obligatoires
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Le username doit contenir entre 3 et 50 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le username ne peut contenir que des lettres, chiffres et underscores'),
    
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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  
  // Champs optionnels
  body('role')
    .optional()
    .isIn(['admin', 'user', 'moderator'])
    .withMessage('Le rôle doit être admin, user ou moderator'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit être active, inactive ou lock'),
    
  body('personId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la personne doit être un entier positif'),
    
  body('photo')
    .optional()
    .isURL()
    .withMessage('L\'URL de la photo est invalide'),
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour d'un utilisateur
 */
const validateUpdate = [
  // ID de l'utilisateur
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
    
  // Champs optionnels pour la mise à jour
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Le username doit contenir entre 3 et 50 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le username ne peut contenir que des lettres, chiffres et underscores'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dépasser 254 caractères'),
    
  body('password')
    .optional()
    .trim()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    
  body('role')
    .optional()
    .isIn(['admin', 'user', 'moderator'])
    .withMessage('Le rôle doit être admin, user ou moderator'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit être active, inactive ou lock'),
    
  body('personId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la personne doit être un entier positif'),
    
  body('photo')
    .optional()
    .isURL()
    .withMessage('L\'URL de la photo est invalide'),
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour du mot de passe
 */
const validatePasswordUpdate = [
  // ID de l'utilisateur
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
    
  // Champs obligatoires
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
    
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    
  // Validation que le mot de passe est différent
  body('newPassword')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
      }
      return true;
    }),
    
  handleValidationErrors
];

/**
 * Validation pour le changement de statut
 */
const validateStatusUpdate = [
  // ID de l'utilisateur
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
    
  // Statut obligatoire
  body('status')
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit être active, inactive ou lock'),
    
  handleValidationErrors
];

/**
 * Validation pour la réinitialisation du mot de passe
 */
const validatePasswordReset = [
  // Champs obligatoires
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
    
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    
  handleValidationErrors
];

/**
 * Validation pour les paramètres de requête (pagination, recherche)
 */
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier supérieur à 0'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être un entier entre 1 et 100'),
    
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Le terme de recherche doit contenir entre 1 et 100 caractères'),
    
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit être active, inactive ou lock'),
    
  query('role')
    .optional()
    .isIn(['admin', 'user', 'moderator'])
    .withMessage('Le rôle doit être admin, user ou moderator'),
    
  handleValidationErrors
];

/**
 * Validation pour l'ID dans les paramètres
 */
const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour l'email dans les paramètres
 */
const validateEmailParam = [
  param('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
    
  handleValidationErrors
];

/**
 * Validation pour le username dans les paramètres
 */
const validateUsernameParam = [
  param('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Le username doit contenir entre 3 et 50 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le username ne peut contenir que des lettres, chiffres et underscores'),
    
  handleValidationErrors
];

module.exports = {
  validateCreate,
  validateUpdate,
  validatePasswordUpdate,
  validateStatusUpdate,
  validateQueryParams,
  validateIdParam,
  validateEmailParam,
  validateUsernameParam,
  validatePasswordReset,
  handleValidationErrors
};
