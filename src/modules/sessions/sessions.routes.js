const express = require('express');
const sessionController = require('./sessions.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const sessionValidation = require('./sessions.validation');

const router = express.Router();

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

// Déconnecter toutes les sessions
router.post('/logout-all', sessionController.logoutAllSessions);

// Révoquer une session spécifique
router.post('/revoke', sessionController.revokeSession);

// Révoquer toutes les sessions d'un utilisateur
router.post('/revoke-all/:userId', 
  rbacMiddleware.requirePermission('sessions.manage'),
  sessionController.revokeAllUserSessions
);

// Récupérer les statistiques des sessions
router.get('/stats', 
  rbacMiddleware.requirePermission('sessions.read'),
  sessionController.getSessionStats
);

// Récupérer les sessions d'un utilisateur
router.get('/user/:userId', 
  rbacMiddleware.requirePermission('sessions.read'),
  sessionController.getUserSessions
);

// Récupérer le nombre de sessions actives
router.get('/active/count', 
  rbacMiddleware.requirePermission('sessions.read'),
  sessionController.getActiveSessionsCount
);

// Récupérer les sessions mobiles
router.get('/device/mobile', 
  rbacMiddleware.requirePermission('sessions.read'),
  sessionController.getMobileDeviceSessions
);

// Récupérer les sessions expirées
router.get('/expired', 
  rbacMiddleware.requirePermission('sessions.read'),
  sessionController.getExpiredSessions
);

// Récupérer l'historique des sessions d'un utilisateur
router.get('/history/:userId', 
  rbacMiddleware.requirePermission('sessions.read'),
  sessionController.getUserSessionHistory
);

// Récupérer les sessions par IP
router.get('/ip/:ip', 
  rbacMiddleware.requirePermission('sessions.read'),
  sessionController.getSessionsByIp
);

// Déconnecter toutes les sessions de l'utilisateur
router.post('/logout-all', sessionController.logoutAllSessions);

// Récupérer les sessions actives de l'utilisateur
router.get('/user/:userId?', 
  sessionController.getUserSessions
);

// Récupérer l'historique des connexions
router.get('/history/:userId?', 
  sessionController.getLoginHistory
);

// Récupérer les statistiques des sessions
router.get('/stats', 
  sessionController.getSessionStats
);

// Révoquer un token spécifique
router.post('/revoke', 
  sessionController.revokeToken
);

/**
 * Routes d'administration - permissions spécifiques requises
 */

// Nettoyer les sessions et tokens expirés
// router.post('/cleanup', sessionController.cleanupExpiredSessions);

module.exports = router;
