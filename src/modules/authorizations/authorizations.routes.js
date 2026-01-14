const express = require('express');
const authorizationController = require('./authorizations.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const authorizationValidation = require('./authorizations.validation');

const router = express.Router();

/**
 * Routes pour la gestion des autorisations
 * Ces routes nécessitent une authentification
 */
router.use(authMiddleware.authenticate);

/**
 * Routes de vérification des permissions
 */

// Vérifier si un utilisateur a une permission spécifique
router.post('/check/permission', 
  authorizationValidation.validateCheckPermission,
  authorizationController.checkPermission
);

// Vérifier si un utilisateur a l'une des permissions requises
router.post('/check/any-permission', 
  authorizationValidation.validateCheckPermissions,
  authorizationController.checkAnyPermission
);

// Vérifier si un utilisateur a toutes les permissions requises
router.post('/check/all-permissions', 
  authorizationValidation.validateCheckPermissions,
  authorizationController.checkAllPermissions
);

/**
 * Routes de vérification des rôles
 */

// Vérifier si un utilisateur a un rôle spécifique
router.post('/check/role', 
  authorizationValidation.validateCheckRole,
  authorizationController.checkRole
);

// Vérifier si un utilisateur a l'un des rôles requis
router.post('/check/any-role', 
  authorizationValidation.validateCheckRoles,
  authorizationController.checkAnyRole
);

// Vérifier si un utilisateur a tous les rôles requis
router.post('/check/all-role', 
  authorizationValidation.validateCheckRoles,
  authorizationController.checkAllRoles
);

/**
 * Routes de vérification des menus
 */

// Vérifier si un utilisateur a accès à un menu
router.post('/check/menu', 
  authorizationValidation.validateCheckMenuAccess,
  authorizationController.checkMenuAccess
);

/**
 * Routes de vérification des ressources
 */

// Vérifier si un utilisateur peut accéder à une ressource avec une action spécifique
router.post('/check/resource', 
  authorizationValidation.validateCheckResourceAccess,
  authorizationController.checkResourceAccess
);

/**
 * Routes de récupération des autorisations
 */

// Récupérer toutes les autorisations d'un utilisateur
router.get('/user/:userId?', 
  authorizationValidation.validateGetUserAuthorizations,
  authorizationController.getUserAuthorizations
);

// Récupérer le rôle de plus haut niveau d'un utilisateur
router.get('/user/:userId/highest-role', 
  authorizationValidation.validateGetUserAuthorizations,
  authorizationController.getUserHighestRole
);

/**
 * Routes d'administration et gestion avancée
 */

// Vérifier si un utilisateur est administrateur
router.post('/check/admin', 
  authorizationValidation.validateCheckAdminStatus,
  authorizationController.checkAdminStatus
);

// Vérifier les autorisations basées sur une politique complexe
router.post('/check/policy', 
  authorizationValidation.validateCheckPolicy,
  authorizationController.checkPolicy
);

// Créer un cache des autorisations pour un utilisateur
router.post('/cache', 
  authorizationValidation.validateCacheUserAuthorizations,
  authorizationController.cacheUserAuthorizations
);

// Invalider le cache des autorisations pour un utilisateur
router.post('/cache/invalidate', 
  authorizationValidation.validateInvalidateUserAuthorizationCache,
  authorizationController.invalidateUserAuthorizationCache
);

module.exports = router;
