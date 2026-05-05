const { body, param } = require('express-validator');
const oauthService = require('./oauth.service');

/**
 * Validation pour l'authentification Google Sign-In
 */
const validateGoogleLogin = [
  body('idToken')
    .notEmpty()
    .withMessage('Le token Google est requis')
    .isString()
    .withMessage('Le token Google doit etre une chaine de caracteres')
    .custom((value) => {
      if (oauthService.isProviderMockEnabled('google')) {
        return true;
      }
      return typeof value === 'string' && value.length >= 100 && value.length <= 2000;
    })
    .withMessage('Le token Google doit avoir une longueur valide'),

  body('defaultRole')
    .optional()
    .isIn(['organizer', 'designer', 'user'])
    .withMessage('Le role par defaut doit etre organizer, designer ou user')
];

/**
 * Validation pour l'authentification Apple Sign-In
 */
const validateAppleLogin = [
  body('identityToken')
    .notEmpty()
    .withMessage("Le token d'identite Apple est requis")
    .isString()
    .withMessage("Le token d'identite Apple doit etre une chaine de caracteres")
    .custom((value) => {
      if (oauthService.isProviderMockEnabled('apple')) {
        return true;
      }
      return typeof value === 'string' && value.length >= 100 && value.length <= 2000;
    })
    .withMessage("Le token d'identite Apple doit avoir une longueur valide"),

  body('user')
    .optional()
    .isString()
    .withMessage("L'ID utilisateur Apple doit etre une chaine de caracteres")
    .isLength({ min: 1, max: 255 })
    .withMessage("L'ID utilisateur Apple doit avoir une longueur valide"),

  body('defaultRole')
    .optional()
    .isIn(['organizer', 'designer', 'user'])
    .withMessage('Le role par defaut doit etre organizer, designer ou user')
];

/**
 * Validation pour lier un compte Google
 */
const validateLinkGoogle = [
  body('idToken')
    .notEmpty()
    .withMessage('Le token Google est requis')
    .isString()
    .withMessage('Le token Google doit etre une chaine de caracteres')
    .custom((value) => {
      if (oauthService.isProviderMockEnabled('google')) {
        return true;
      }
      return typeof value === 'string' && value.length >= 100 && value.length <= 2000;
    })
    .withMessage('Le token Google doit avoir une longueur valide')
];

/**
 * Validation pour lier un compte Apple
 */
const validateLinkApple = [
  body('identityToken')
    .notEmpty()
    .withMessage("Le token d'identite Apple est requis")
    .isString()
    .withMessage("Le token d'identite Apple doit etre une chaine de caracteres")
    .custom((value) => {
      if (oauthService.isProviderMockEnabled('apple')) {
        return true;
      }
      return typeof value === 'string' && value.length >= 100 && value.length <= 2000;
    })
    .withMessage("Le token d'identite Apple doit avoir une longueur valide"),

  body('user')
    .optional()
    .isString()
    .withMessage("L'ID utilisateur Apple doit etre une chaine de caracteres")
    .isLength({ min: 1, max: 255 })
    .withMessage("L'ID utilisateur Apple doit avoir une longueur valide")
];

/**
 * Validation pour detacher une identite
 */
const validateUnlinkIdentity = [
  param('provider')
    .notEmpty()
    .withMessage('Le fournisseur est requis')
    .isIn(['google', 'apple'])
    .withMessage('Le fournisseur doit etre google ou apple')
];

module.exports = {
  validateGoogleLogin,
  validateAppleLogin,
  validateLinkGoogle,
  validateLinkApple,
  validateUnlinkIdentity
};
