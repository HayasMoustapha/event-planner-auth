const { body, param, query, validationResult, matchedData } = require('express-validator');

/**
 * Middleware de validation pour les entrées du module authorizations
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

  // Vérification des champs non autorisés (Hardening Rule 3)
  const validatedData = matchedData(req, { includeOptionals: true, locations: ['body'] });
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyFields = Object.keys(req.body);
    const extraFields = bodyFields.filter(field => !Object.keys(validatedData).includes(field));

    if (extraFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs non autorisés dans le corps de la requête: ${extraFields.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
};

/**
 * Validation pour la vérification de permission
 */
const validateCheckPermission = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  body('permissionName')
    .trim()
    .notEmpty()
    .withMessage('Le nom de la permission est requis')
    .isLength({ min: 3, max: 100 })
    .withMessage('Le nom de la permission doit contenir entre 3 et 100 caractères')
    .matches(/^[a-z]+\.[a-z]+$/)
    .withMessage('Le nom de la permission doit suivre le format: resource.action'),

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

/**
 * Validation pour la vérification de rôle
 */
const validateCheckRole = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  body('roleName')
    .trim()
    .notEmpty()
    .withMessage('Le nom du rôle est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom du rôle doit contenir entre 2 et 50 caractères'),

  handleValidationErrors
];

/**
 * Validation pour la vérification de rôles multiples
 */
const validateCheckRoles = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  body('roles')
    .isArray({ min: 1 })
    .withMessage('La liste de rôles doit être un tableau non vide'),

  body('roles.*')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Chaque rôle doit contenir entre 2 et 50 caractères'),

  handleValidationErrors
];

/**
 * Validation pour la vérification d'accès au menu
 */
const validateCheckMenuAccess = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  body('menuId')
    .notEmpty()
    .withMessage('L\'ID du menu est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour la vérification d'accès à la ressource
 */
const validateCheckResourceAccess = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  body('resource')
    .trim()
    .notEmpty()
    .withMessage('Le nom de la ressource est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('La ressource doit contenir entre 2 et 50 caractères')
    .matches(/^[a-z]+$/)
    .withMessage('La ressource ne peut contenir que des lettres minuscules'),

  body('action')
    .trim()
    .notEmpty()
    .withMessage('L\'action est requise')
    .isLength({ min: 2, max: 50 })
    .withMessage('L\'action doit contenir entre 2 et 50 caractères')
    .matches(/^[a-z]+$/)
    .withMessage('L\'action ne peut contenir que des lettres minuscules'),

  handleValidationErrors
];

/**
 * Validation pour la récupération des autorisations utilisateur
 */
const validateGetUserAuthorizations = [
  param('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour la vérification du statut administrateur
 */
const validateCheckAdminStatus = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour la vérification de politique
 */
const validateCheckPolicy = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  body('policy')
    .notEmpty()
    .withMessage('La politique est requise')
    .isObject()
    .withMessage('La politique doit être un objet'),

  body('policy.type')
    .isIn(['permission', 'role', 'menu', 'resource', 'complex'])
    .withMessage('Le type de politique doit être valide: permission, role, menu, resource, complex'),

  body('policy.conditions')
    .notEmpty()
    .withMessage('Les conditions de la politique sont requises')
    .isObject()
    .withMessage('Les conditions doivent être un objet'),

  handleValidationErrors
];

/**
 * Validation pour la mise en cache des autorisations
 */
const validateCacheUserAuthorizations = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  body('ttl')
    .optional()
    .isInt({ min: 60, max: 3600 })
    .withMessage('La durée de vie du cache doit être entre 60 et 3600 secondes'),

  handleValidationErrors
];

/**
 * Validation pour l'invalidation du cache
 */
const validateInvalidateUserAuthorizationCache = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour la récupération des autorisations (query params)
 */
const validateGetAuthorizations = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être un entier entre 1 et 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Le terme de recherche ne peut pas dépasser 255 caractères'),

  query('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),

  query('permissionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la permission doit être un entier positif'),

  query('menuId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),

  query('sortBy')
    .optional()
    .trim()
    .isIn(['created_at', 'updated_at', 'role_id', 'permission_id', 'menu_id'])
    .withMessage('Le champ de tri doit être created_at, updated_at, role_id, permission_id ou menu_id'),

  query('sortOrder')
    .optional()
    .trim()
    .isIn(['ASC', 'DESC'])
    .withMessage('L\'ordre de tri doit être ASC ou DESC'),

  handleValidationErrors
];

/**
 * Validation pour l'ID d'autorisation dans les paramètres de route
 */
const validateAuthorizationId = [
  param('id')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'autorisation doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour la création d'une autorisation
 */
const validateCreateAuthorization = [
  body('roleId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),

  body('permissionId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la permission doit être un entier positif'),

  body('menuId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour la mise à jour d'une autorisation
 */
const validateUpdateAuthorization = [
  param('id')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'autorisation doit être un entier positif'),

  body('roleId')
    .optional()
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),

  body('permissionId')
    .optional()
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la permission doit être un entier positif'),

  body('menuId')
    .optional()
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour l'ID de rôle dans les paramètres de route
 */
const validateRoleId = [
  param('roleId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour l'ID de permission dans les paramètres de route
 */
const validatePermissionId = [
  param('permissionId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la permission doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour l'ID de menu dans les paramètres de route
 */
const validateMenuId = [
  param('menuId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID du menu doit être un entier positif'),

  handleValidationErrors
];

module.exports = {
  validateCheckPermission,
  validateCheckPermissions,
  validateCheckRole,
  validateCheckRoles,
  validateCheckMenuAccess,
  validateCheckResourceAccess,
  validateGetUserAuthorizations,
  validateCheckAdminStatus,
  validateCheckPolicy,
  validateCacheUserAuthorizations,
  validateInvalidateUserAuthorizationCache,
  validateGetAuthorizations,
  validateAuthorizationId,
  validateCreateAuthorization,
  validateUpdateAuthorization,
  validateRoleId,
  validatePermissionId,
  validateMenuId,
  handleValidationErrors
};
