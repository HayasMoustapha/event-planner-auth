const express = require('express');
const oauthController = require('./oauth.controller');
const oauthValidation = require('./oauth.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const OAuthErrorHandler = require('./oauth.errorHandler');
const OAuthMiddleware = require('../../middlewares/oauth.middleware');

const router = express.Router();

/**
 * Routes OAuth pour Google Sign-In et Apple Sign-In
 * Exactement comme spécifié dans les exigences
 */

// POST /api/auth/oauth/google - Connexion avec Google Sign-In
router.post('/google', 
  OAuthMiddleware.secureOAuthRoutes(),
  oauthValidation.validateGoogleLogin,
  oauthController.loginWithGoogle
);

// POST /api/auth/oauth/apple - Connexion avec Apple Sign-In  
router.post('/apple',
  OAuthMiddleware.secureOAuthRoutes(),
  oauthValidation.validateAppleLogin,
  oauthController.loginWithApple
);

/**
 * Routes additionnelles pour la gestion des identités OAuth
 */

// POST /api/auth/oauth/link/google - Lier un compte Google à un utilisateur existant
router.post('/link/google',
  authMiddleware.authenticate,
  OAuthMiddleware.oauthProtection(),
  oauthValidation.validateLinkGoogle,
  oauthController.linkGoogle
);

// POST /api/auth/oauth/link/apple - Lier un compte Apple à un utilisateur existant
router.post('/link/apple',
  authMiddleware.authenticate,
  OAuthMiddleware.oauthProtection(),
  oauthValidation.validateLinkApple,
  oauthController.linkApple
);

// DELETE /api/auth/oauth/:provider - Détacher une identité OAuth
router.delete('/:provider',
  authMiddleware.authenticate,
  oauthValidation.validateUnlinkIdentity,
  oauthController.unlinkIdentity
);

// GET /api/auth/oauth/identities - Récupérer les identités OAuth de l'utilisateur
router.get('/identities',
  authMiddleware.authenticate,
  oauthController.getUserIdentities
);

// GET /api/auth/oauth/config - Vérifier la configuration OAuth
router.get('/config',
  oauthController.checkConfiguration
);

// Middleware de gestion d'erreurs OAuth
router.use(OAuthErrorHandler.middleware);

module.exports = router;
