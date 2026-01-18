const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware de validation pour les entrées du module menus
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
 * Validation pour la création de menu
 */
const validateCreateMenu = [
  body('label')
    .notEmpty()
    .withMessage('Le label du menu est requis')
    .isObject()
    .withMessage('Le label doit être un objet JSON'),
    
  body('description')
    .optional()
    .isObject()
    .withMessage('La description doit être un objet JSON'),
    
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('L\'icône ne peut pas dépasser 100 caractères'),
    
  body('route')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La route ne peut pas dépasser 255 caractères'),
    
  body('parentMenuId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu parent doit être un entier positif'),
    
  body('sortOrder')
    .optional()
    .isInt({ min: 0, max: 9999 })
    .withMessage('L\'ordre de tri doit être un entier entre 0 et 9999'),
    
  body('isVisible')
    .optional()
    .isBoolean()
    .withMessage('La visibilité doit être un booléen'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour de menu
 */
const validateUpdateMenu = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),
    
  body('label')
    .optional()
    .isObject()
    .withMessage('Le label doit être un objet JSON'),
    
  body('description')
    .optional()
    .isObject()
    .withMessage('La description doit être un objet JSON'),
    
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('L\'icône ne peut pas dépasser 100 caractères'),
    
  body('route')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La route ne peut pas dépasser 255 caractères'),
    
  body('parentMenuId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu parent doit être un entier positif'),
    
  body('sortOrder')
    .optional()
    .isInt({ min: 0, max: 9999 })
    .withMessage('L\'ordre de tri doit être un entier entre 0 et 9999'),
    
  body('isVisible')
    .optional()
    .isBoolean()
    .withMessage('La visibilité doit être un booléen'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération de menu par ID
 */
const validateGetMenuById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des menus
 */
const validateGetMenus = [
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
    
  query('isVisible')
    .optional()
    .isBoolean()
    .withMessage('La visibilité doit être un booléen'),
    
  query('parentMenuId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu parent doit être un entier positif'),
    
  query('sortBy')
    .optional()
    .isIn(['label', 'description', 'route', 'sort_order', 'created_at', 'updated_at'])
    .withMessage('Le champ de tri est invalide'),
    
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('L\'ordre de tri doit être ASC ou DESC'),
    
  handleValidationErrors
];

/**
 * Validation pour la mise à jour du statut de menu
 */
const validateUpdateMenuStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),
    
  body('status')
    .isIn(['active', 'inactive'])
    .withMessage('Le statut doit être "active" ou "inactive"'),
    
  handleValidationErrors
];

/**
 * Validation pour la récupération des menus utilisateur
 */
const validateGetUserMenus = [
  param('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la vérification d'accès au menu
 */
const validateCheckUserMenuAccess = [
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
    
  query('menuId')
    .notEmpty()
    .withMessage('L\'ID du menu est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour l'association de permissions
 */
const validateAssignMenuPermissions = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),
    
  body('permissionIds')
    .isArray({ min: 1 })
    .withMessage('Les IDs de permissions doivent être un tableau non vide'),
    
  body('permissionIds.*')
    .isInt({ min: 1 })
    .withMessage('Chaque ID de permission doit être un entier positif'),
    
  handleValidationErrors
];

/**
 * Validation pour la duplication de menu
 */
const validateDuplicateMenu = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu source doit être un entier positif'),
    
  body('label')
    .notEmpty()
    .withMessage('Le label du nouveau menu est requis')
    .isObject()
    .withMessage('Le label doit être un objet JSON'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La description ne peut pas dépasser 255 caractères'),
    
  handleValidationErrors
];

/**
 * Validation pour la réorganisation des menus
 */
const validateReorderMenus = [
  body('menuOrders')
    .isArray({ min: 1 })
    .withMessage('La liste des menus est requise'),
    
  body('menuOrders.*.menuId')
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),
    
  body('menuOrders.*.sortOrder')
    .isInt({ min: 0 })
    .withMessage('L\'ordre de tri doit être un entier positif'),
    
  handleValidationErrors
];

module.exports = {
  validateCreateMenu,
  validateUpdateMenu,
  validateGetMenuById,
  validateGetMenus,
  validateUpdateMenuStatus,
  validateGetUserMenus,
  validateCheckUserMenuAccess,
  validateAssignMenuPermissions,
  validateDuplicateMenu,
  validateReorderMenus,
  handleValidationErrors
};
