const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware de validation pour les entrées du module roles
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
 * Validation pour la création de rôle
 */
const validateCreateRole = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom du rôle est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom du rôle doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-Z0-9_\-\s]+$/)
    .withMessage('Le nom du rôle ne peut contenir que des lettres, chiffres, underscores, tirets et espaces'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La description ne peut pas dépasser 255 caractères'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
  body('level')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Le niveau doit être un entier entre 0 et 100'),
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour de rôle
 */
const validateUpdateRole = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),
    
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom du rôle doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-Z0-9_\-\s]+$/)
    .withMessage('Le nom du rôle ne peut contenir que des lettres, chiffres, underscores, tirets et espaces'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La description ne peut pas dépasser 255 caractères'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
  body('level')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Le niveau doit être un entier entre 0 et 100'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération de rôle par ID
 */
const validateGetRoleById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des rôles
 */
const validateGetRoles = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
    
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le terme de recherche ne peut pas dépasser 100 caractères'),
    
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'deleted'])
    .withMessage('Le statut de filtre doit être "active", "inactive" ou "deleted"'),
    
  query('sortBy')
    .optional()
    .isIn(['name', 'description', 'status', 'level', 'created_at', 'updated_at'])
    .withMessage('Le champ de tri est invalide'),
    
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('L\'ordre de tri doit être ASC ou DESC'),
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour du statut de rôle
 */
const validateUpdateRoleStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),
    
  body('status')
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
  handleValidationErrors
];

/**
 * Validation pour l'association de permissions
 */
const validateAssignPermissions = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),
    
  body('permissionIds')
    .isArray({ min: 1 })
    .withMessage('Les IDs de permissions doivent être un tableau non vide'),
    
  body('permissionIds.*')
    .isInt({ min: 1 })
    .withMessage('Chaque ID de permission doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des rôles utilisateur
 */
const validateGetUserRoles = [
  param('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la vérification de rôle utilisateur
 */
const validateCheckUserRole = [
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  query('roleName')
    .notEmpty()
    .withMessage('Le nom du rôle est requis')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom du rôle doit contenir entre 2 et 50 caractères'),
    
  handleValidationErrors
];

/**
 * Validation pour la duplication de rôle
 */
const validateDuplicateRole = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle source doit être un entier positif'),
    
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom du nouveau rôle est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom du rôle doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-Z0-9_\-\s]+$/)
    .withMessage('Le nom du rôle ne peut contenir que des lettres, chiffres, underscores, tirets et espaces'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La description ne peut pas dépasser 255 caractères'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des utilisateurs d'un rôle
 */
const validateGetRoleUsers = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),
    
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

module.exports = {
  validateCreateRole,
  validateUpdateRole,
  validateGetRoleById,
  validateGetRoles,
  validateUpdateRoleStatus,
  validateAssignPermissions,
  validateGetUserRoles,
  validateCheckUserRole,
  validateDuplicateRole,
  validateGetRoleUsers,
  handleValidationErrors
};
