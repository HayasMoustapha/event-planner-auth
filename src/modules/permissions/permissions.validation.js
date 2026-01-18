const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware de validation pour les entrées du module permissions
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
 * Validation pour la création de permission
 */
const validateCreatePermission = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Le code de la permission est requis')
    .isLength({ min: 3, max: 100 })
    .withMessage('Le code de la permission doit contenir entre 3 et 100 caractères')
    .matches(/^[a-z_.]+[a-z_.]*$/)
    .withMessage('Le code doit être en minuscules avec underscores et/ou points (ex: users.read, user.read)'),
    
  body('label')
    .optional()
    .isObject()
    .withMessage('Le label doit être un objet JSON'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La description ne peut pas dépasser 255 caractères'),
    
  body('group')
    .trim()
    .notEmpty()
    .withMessage('Le groupe est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le groupe doit contenir entre 2 et 50 caractères')
    .matches(/^[a-z_]+$/)
    .withMessage('Le groupe doit être en minuscules avec underscores uniquement'),
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour de permission
 */
const validateUpdatePermission = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID de la permission doit être un entier positif'),
    
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Le code de la permission doit contenir entre 3 et 100 caractères')
    .matches(/^[a-z_.]+[a-z_.]*$/)
    .withMessage('Le code doit être en minuscules avec underscores et/ou points (ex: users.read, user.read)'),
    
  body('label')
    .optional()
    .isObject()
    .withMessage('Le label doit être un objet JSON'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La description ne peut pas dépasser 255 caractères'),
    
  body('group')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le groupe doit contenir entre 2 et 50 caractères')
    .matches(/^[a-z_]+$/)
    .withMessage('Le groupe doit être en minuscules avec underscores uniquement'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération de permission par ID
 */
const validateGetPermissionById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID de la permission doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des permissions
 */
const validateGetPermissions = [
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
    
  query('resource')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La ressource doit contenir entre 2 et 50 caractères'),
    
  query('action')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('L\'action doit contenir entre 2 et 50 caractères'),
    
  query('group')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le groupe doit contenir entre 2 et 50 caractères'),
    
  query('sortBy')
    .optional()
    .isIn(['code', 'description', 'group', 'created_at', 'updated_at'])
    .withMessage('Le champ de tri est invalide'),
    
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('L\'ordre de tri doit être ASC ou DESC'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des permissions utilisateur
 */
const validateGetUserPermissions = [
  param('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la vérification de permission utilisateur
 */
const validateCheckUserPermission = [
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  query('permissionCode')
    .notEmpty()
    .withMessage('Le code de la permission est requis')
    .trim()
    .matches(/^[a-z_]+[a-z_]*$/)
    .withMessage('Le code doit être en minuscules avec underscores (ex: users.create)'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des permissions de rôle
 */
const validateGetRolePermissions = [
  param('roleId')
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des actions par ressource
 */
const validateGetActionsByResource = [
  param('group')
    .trim()
    .notEmpty()
    .withMessage('Le nom du groupe est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le groupe doit contenir entre 2 et 50 caractères')
    .matches(/^[a-z_]+$/)
    .withMessage('Le groupe doit être en minuscules avec underscores uniquement'),
    
  handleValidationErrors
];

/**
 * Validation pour la génération de permissions de ressource
 */
const validateGenerateResourcePermissions = [
  body('group')
    .trim()
    .notEmpty()
    .withMessage('Le nom du groupe est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le groupe doit contenir entre 2 et 50 caractères')
    .matches(/^[a-z_]+$/)
    .withMessage('Le groupe doit être en minuscules avec underscores uniquement'),
    
  body('actions')
    .isArray({ min: 1 })
    .withMessage('La liste d\'actions doit être un tableau non vide'),
    
  body('actions.*')
    .isIn(['create', 'read', 'update', 'delete', 'manage', 'view', 'list'])
    .withMessage('Chaque action doit être valide: create, read, update, delete, manage, view, list'),
    
  handleValidationErrors
];

/**
 * Validation pour la vérification de permissions multiples
 */
const validateCheckPermissions = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('La liste de permissions doit être un tableau non vide'),
    
  body('permissions.*')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Chaque permission doit contenir entre 3 et 100 caractères')
    .matches(/^[a-z]+\.[a-z]+$/)
    .withMessage('Chaque permission doit suivre le format: resource.action'),
    
  handleValidationErrors
];

module.exports = {
  validateCreatePermission,
  validateUpdatePermission,
  validateGetPermissionById,
  validateGetPermissions,
  validateGetUserPermissions,
  validateCheckUserPermission,
  validateGetRolePermissions,
  validateGetActionsByResource,
  validateGenerateResourcePermissions,
  validateCheckPermissions,
  handleValidationErrors
};
