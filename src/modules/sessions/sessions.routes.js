const express = require('express');
const SessionController = require('./sessions.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const sessionValidation = require('./sessions.validation');

const router = express.Router();
const sessionController = new SessionController();

/**
 * Routes publiques pour la gestion des sessions
 * Ces routes ne nécessitent pas d'authentification préalable
 */

// Créer une nouvelle session
router.post('/create', 
  sessionValidation.validateCreateSession,
  sessionController.createSession
);

// Rafraîchir les tokens
router.post('/refresh', 
  sessionValidation.validateRefreshSession,
  sessionController.refreshSession
);

// Valider un token de réinitialisation de mot de passe
router.post('/password-reset/verify', 
  sessionValidation.validateVerifyPasswordResetToken,
  sessionController.verifyPasswordResetToken
);

// Générer un token de réinitialisation de mot de passe
router.post('/password-reset/generate', 
  sessionValidation.validateGeneratePasswordResetToken,
  sessionController.generatePasswordResetToken
);

/**
 * Routes protégées - authentification requise
 */
router.use(authMiddleware.authenticate);

// Valider une session
router.get('/validate', sessionController.validateSession);

// Récupérer la session courante
router.get('/current', sessionController.getCurrentSession);

// Déconnecter la session courante
router.post('/logout', sessionController.logoutSession);

// Déconnecter toutes les sessions de l'utilisateur
router.post('/logout-all', sessionController.logoutAllSessions);

// Récupérer les sessions actives de l'utilisateur
router.get('/user/:userId?', 
  sessionValidation.validateGetUserSessions,
  sessionController.getUserSessions
);

// Récupérer l'historique des connexions
router.get('/history/:userId?', 
  sessionValidation.validateGetLoginHistory,
  sessionController.getLoginHistory
);

// Récupérer les statistiques des sessions
router.get('/stats', 
  sessionValidation.validateGetSessionStats,
  sessionController.getSessionStats
);

// Révoquer un token spécifique
router.post('/revoke', 
  sessionValidation.validateRevokeToken,
  sessionController.revokeToken
);

/**
 * Routes d'administration - permissions spécifiques requises
 */

// Nettoyer les sessions et tokens expirés
router.post('/cleanup', 
  rbacMiddleware.requirePermission('sessions.manage'),
  sessionController.cleanupExpired
);

module.exports = router;
