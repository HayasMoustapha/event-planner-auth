const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware de validation pour les entrées du module people
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
 * Validation pour la création d'une personne
 */
const validateCreate = [
  // Champs obligatoires
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-Z\u00C0-\u017F\s'\-]+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de famille doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-Z\u00C0-\u017F\s'\-]+$/)
    .withMessage('Le nom de famille ne peut contenir que des lettres, espaces, tirets et apostrophes'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dépasser 254 caractères'),
  
  // Champs optionnels
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+?[1-9]\d{1,3})?[0-9]{7,15}$/)
    .withMessage('Format de numéro de téléphone invalide'),
    
  body('photo')
    .optional()
    .trim()
    .isURL()
    .withMessage('L\'URL de la photo est invalide'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour d'une personne
 */
const validateUpdate = [
  // ID de la personne
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
    
  // Champs optionnels pour la mise à jour
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-Z\u00C0-\u017F\s'\-]+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
    
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de famille doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-Z\u00C0-\u017F\s'\-]+$/)
    .withMessage('Le nom de famille ne peut contenir que des lettres, espaces, tirets et apostrophes'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dépasser 254 caractères'),
    
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+?[1-9]\d{1,3})?[0-9]{7,15}$/)
    .withMessage('Format de numéro de téléphone invalide'),
    
  body('photo')
    .optional()
    .trim()
    .isURL()
    .withMessage('L\'URL de la photo est invalide'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour du statut
 */
const validateStatusUpdate = [
  // ID de la personne
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
    
  // Statut obligatoire
  body('status')
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
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
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
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
 * Validation pour le téléphone dans les paramètres
 */
const validatePhoneParam = [
  param('phone')
    .matches(/^(\+?[1-9]\d{1,3})?[0-9]{7,15}$/)
    .withMessage('Format de numéro de téléphone invalide'),
    
  handleValidationErrors
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateStatusUpdate,
  validateQueryParams,
  validateIdParam,
  validateEmailParam,
  validatePhoneParam,
  handleValidationErrors
};
