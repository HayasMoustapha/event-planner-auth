const { body, param, query, validationResult, matchedData } = require('express-validator');

/**
 * Middleware de validation pour les entrées du module accesses
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
 * Validation pour la création d'un accès
 */
const validateCreateAccess = [
  body('userId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'utilisateur doit être un entier positif'),

  body('roleId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),

  body('status')
    .optional()
    .trim()
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit être active, inactive ou lock'),

  handleValidationErrors
];

/**
 * Validation pour la récupération des accès (query params)
 */
const validateGetAccesses = [
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

  query('status')
    .optional()
    .trim()
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut de filtre doit être active, inactive ou lock'),

  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'utilisateur doit être un entier positif'),

  query('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),

  query('sortBy')
    .optional()
    .trim()
    .isIn(['created_at', 'updated_at', 'status', 'user_id', 'role_id'])
    .withMessage('Le champ de tri doit être created_at, updated_at, status, user_id ou role_id'),

  query('sortOrder')
    .optional()
    .trim()
    .isIn(['ASC', 'DESC'])
    .withMessage('L\'ordre de tri doit être ASC ou DESC'),

  handleValidationErrors
];

/**
 * Validation pour l'ID dans les paramètres de route
 */
const validateAccessId = [
  param('id')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'accès doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour l'ID d'utilisateur dans les paramètres de route
 */
const validateUserId = [
  param('userId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'utilisateur doit être un entier positif'),

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
 * Validation pour l'ID d'utilisateur et de rôle dans les paramètres de route
 */
const validateUserIdAndRoleId = [
  param('userId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'utilisateur doit être un entier positif'),

  param('roleId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour la mise à jour du statut d'un accès
 */
const validateUpdateAccessStatus = [
  param('id')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'accès doit être un entier positif'),

  body('status')
    .trim()
    .notEmpty()
    .withMessage('Le statut est requis')
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit être active, inactive ou lock'),

  handleValidationErrors
];

/**
 * Validation pour l'assignation multiple de rôles
 */
const validateAssignMultipleRoles = [
  param('userId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'utilisateur doit être un entier positif'),

  body('roleIds')
    .isArray({ min: 1 })
    .withMessage('Les IDs de rôles doivent être un tableau non vide'),

  body('roleIds.*')
    .isInt({ min: 1 })
    .withMessage('Chaque ID de rôle doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour le retrait multiple de rôles
 */
const validateRemoveMultipleRoles = [
  param('userId')
    .trim()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'utilisateur doit être un entier positif'),

  body('roleIds')
    .isArray({ min: 1 })
    .withMessage('Les IDs de rôles doivent être un tableau non vide'),

  body('roleIds.*')
    .isInt({ min: 1 })
    .withMessage('Chaque ID de rôle doit être un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour les paramètres de requête optionnels
 */
const validateQueryParams = [
  query('onlyActive')
    .optional()
    .trim()
    .isIn(['true', 'false'])
    .withMessage('Le paramètre onlyActive doit être true ou false'),

  handleValidationErrors
];

module.exports = {
  validateCreateAccess,
  validateGetAccesses,
  validateAccessId,
  validateUserId,
  validateRoleId,
  validateUserIdAndRoleId,
  validateUpdateAccessStatus,
  validateAssignMultipleRoles,
  validateRemoveMultipleRoles,
  validateQueryParams
};
