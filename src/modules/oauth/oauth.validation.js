const { body, param } = require('express-validator');

/**
 * Validation pour l'authentification Google Sign-In
 */
const validateGoogleLogin = [
  body('idToken')
    .notEmpty()
    .withMessage('Le token Google est requis')
    .isString()
    .withMessage('Le token Google doit être une chaîne de caractères')
    .isLength({ min: 100, max: 2000 })
    .withMessage('Le token Google doit avoir une longueur valide')
];

/**
 * Validation pour l'authentification Apple Sign-In
 */
const validateAppleLogin = [
  body('identityToken')
    .notEmpty()
    .withMessage('Le token d\'identité Apple est requis')
    .isString()
    .withMessage('Le token d\'identité Apple doit être une chaîne de caractères')
    .isLength({ min: 100, max: 2000 })
    .withMessage('Le token d\'identité Apple doit avoir une longueur valide'),
  
  body('user')
    .optional()
    .isString()
    .withMessage('L\'ID utilisateur Apple doit être une chaîne de caractères')
    .isLength({ min: 1, max: 255 })
    .withMessage('L\'ID utilisateur Apple doit avoir une longueur valide')
];

/**
 * Validation pour lier un compte Google
 */
const validateLinkGoogle = [
  body('idToken')
    .notEmpty()
    .withMessage('Le token Google est requis')
    .isString()
    .withMessage('Le token Google doit être une chaîne de caractères')
    .isLength({ min: 100, max: 2000 })
    .withMessage('Le token Google doit avoir une longueur valide')
];

/**
 * Validation pour lier un compte Apple
 */
const validateLinkApple = [
  body('identityToken')
    .notEmpty()
    .withMessage('Le token d\'identité Apple est requis')
    .isString()
    .withMessage('Le token d\'identité Apple doit être une chaîne de caractères')
    .isLength({ min: 100, max: 2000 })
    .withMessage('Le token d\'identité Apple doit avoir une longueur valide'),
  
  body('user')
    .optional()
    .isString()
    .withMessage('L\'ID utilisateur Apple doit être une chaîne de caractères')
    .isLength({ min: 1, max: 255 })
    .withMessage('L\'ID utilisateur Apple doit avoir une longueur valide')
];

/**
 * Validation pour détacher une identité
 */
const validateUnlinkIdentity = [
  param('provider')
    .notEmpty()
    .withMessage('Le fournisseur est requis')
    .isIn(['google', 'apple'])
    .withMessage('Le fournisseur doit être google ou apple')
];

module.exports = {
  validateGoogleLogin,
  validateAppleLogin,
  validateLinkGoogle,
  validateLinkApple,
  validateUnlinkIdentity
};
