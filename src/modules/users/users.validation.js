const { body, param, query, validationResult, matchedData } = require('express-validator');

/**
 * Middleware de validation pour les entrÃ©es du module users
 * Utilise express-validator pour valider et nettoyer les donnÃ©es
 */

/**
 * GÃ¨re les erreurs de validation
 * @param {Object} req - RequÃªte Express
 * @param {Object} res - RÃ©ponse Express
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

  // VÃ©rification des champs non autorisÃ©s (Hardening Rule 3)
  const validatedData = matchedData(req, { includeOptionals: true, locations: ['body'] });
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyFields = Object.keys(req.body);
    const extraFields = bodyFields.filter(field => !Object.keys(validatedData).includes(field));

    // Autoriser explicitement person_id mÃªme si non validÃ©
    const allowedExtraFields = ['person_id'];
    const finalExtraFields = extraFields.filter(field => !allowedExtraFields.includes(field));

    if (finalExtraFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs non autorisÃ©s dans le corps de la requÃªte: ${finalExtraFields.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
};

/**
 * Validation pour la crÃ©ation d'un utilisateur
 */
const validateCreate = [
  // Champs obligatoires
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Le username doit contenir entre 3 et 50 caractÃ¨res')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le username ne peut contenir que des lettres, chiffres et underscores'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dÃ©passer 254 caractÃ¨res'),

  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractÃ¨res')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),


  // Champs optionnels
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Format de numÃ©ro de tÃ©lÃ©phone invalide'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le prÃ©nom doit contenir entre 1 et 50 caractÃ¨res'),

  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le prÃ©nom doit contenir entre 1 et 50 caractÃ¨res'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nom doit contenir entre 1 et 50 caractÃ¨res'),

  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nom doit contenir entre 1 et 50 caractÃ¨res'),


  body('personId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la personne doit Ãªtre un entier positif'),

  body('person_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage("L'ID de la personne doit être un entier positif"),

  body('ui_preferences')
    .optional()
    .isObject()
    .withMessage('ui_preferences doit être un objet'),

  body('profile_metadata')
    .optional()
    .isObject()
    .withMessage('profile_metadata doit être un objet'),

  handleValidationErrors
];

/**
 * Validation pour la mise Ã  jour d'un utilisateur
 */
const validateUpdate = [
  // ID de l'utilisateur
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit Ãªtre un entier positif'),

  // Champs optionnels pour la mise Ã  jour
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Le username doit contenir entre 3 et 50 caractÃ¨res')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le username ne peut contenir que des lettres, chiffres et underscores'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le prÃ©nom doit contenir entre 1 et 50 caractÃ¨res'),

  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le prÃ©nom doit contenir entre 1 et 50 caractÃ¨res'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nom doit contenir entre 1 et 50 caractÃ¨res'),

  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nom doit contenir entre 1 et 50 caractÃ¨res'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('L\'email ne peut pas dÃ©passer 254 caractÃ¨res'),

  body('password')
    .optional()
    .trim()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractÃ¨res')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),


  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Format de numÃ©ro de tÃ©lÃ©phone invalide'),


  body('personId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la personne doit Ãªtre un entier positif'),

  body('person_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la personne doit Ãªtre un entier positif'),

  body('ui_preferences')
    .optional()
    .isObject()
    .withMessage('ui_preferences doit être un objet'),

  body('profile_metadata')
    .optional()
    .isObject()
    .withMessage('profile_metadata doit être un objet'),

  handleValidationErrors
];

/**
 * Validation pour la mise Ã  jour du mot de passe
 */
const validatePasswordUpdate = [
  // ID de l'utilisateur
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit Ãªtre un entier positif'),

  // Champs obligatoires
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),

  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractÃ¨res')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),

  // Validation que le mot de passe est diffÃ©rent
  body('newPassword')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Le nouveau mot de passe doit Ãªtre diffÃ©rent de l\'ancien');
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
    .withMessage('L\'ID doit Ãªtre un entier positif'),

  // Statut obligatoire
  body('status')
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit Ãªtre active, inactive ou lock'),

  handleValidationErrors
];

/**
 * Validation pour la rÃ©initialisation du mot de passe
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
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractÃ¨res')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),

  handleValidationErrors
];

/**
 * Validation pour les paramÃ¨tres de requÃªte (pagination, recherche)
 */
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit Ãªtre un entier supÃ©rieur Ã  0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit Ãªtre un entier entre 1 et 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Le terme de recherche doit contenir entre 1 et 100 caractÃ¨res'),

  query('status')
    .optional()
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit Ãªtre active, inactive ou lock'),

  query('userCode')
    .optional()
    .isString()
    .withMessage('Le userCode doit Ãªtre une chaÃ®ne de caractÃ¨res'),

  handleValidationErrors
];

/**
 * Validation pour l'ID dans les paramÃ¨tres
 */
const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit Ãªtre un entier positif'),

  handleValidationErrors
];

/**
 * Validation pour l'email dans les paramÃ¨tres
 */
const validateEmailParam = [
  param('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Validation pour le username dans les paramÃ¨tres
 */
const validateUsernameParam = [
  param('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Le username doit contenir entre 3 et 50 caractÃ¨res')
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
