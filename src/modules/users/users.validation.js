const { body, param, query, validationResult, matchedData } = require('express-validator');

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
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }

  // Vérification des champs non autorisés (Hardening Rule 3)
  const validatedData = matchedData(req, { includeOptionals: true, locations: ['body'] });
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyFields = Object.keys(req.body);
    const extraFields = bodyFields.filter(field => !Object.keys(validatedData).includes(field));

    // Autoriser explicitement person_id même si non validé
    const allowedExtraFields = ['person_id'];
    const finalExtraFields = extraFields.filter(field => !allowedExtraFields.includes(field));

    if (finalExtraFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs non autorisés dans le corps de la requête: ${finalExtraFields.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
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

  body('user_code')
    .trim()
    .notEmpty()
    .withMessage('Le code utilisateur est requis')
    .isLength({ max: 50 })
    .withMessage('Le code utilisateur ne doit pas dépasser 50 caractères'),

  // Champs optionnels
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Format de numéro de téléphone invalide'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le prénom doit contenir entre 1 et 50 caractères'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nom doit contenir entre 1 et 50 caractères'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit être active, inactive ou lock'),

  body('personId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la personne doit être un entier positif'),

  body('person_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la personne doit être un entier positif'),

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

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le prénom doit contenir entre 1 et 50 caractères'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nom doit contenir entre 1 et 50 caractères'),

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

  body('userCode')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le code utilisateur ne doit pas dépasser 50 caractères'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Format de numéro de téléphone invalide'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'lock'])
    .withMessage('Le statut doit être active, inactive ou lock'),

  body('personId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la personne doit être un entier positif'),

  body('person_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la personne doit être un entier positif'),

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

  query('userCode')
    .optional()
    .isString()
    .withMessage('Le userCode doit être une chaîne de caractères'),

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
