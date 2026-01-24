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

// Routes de cache
router.post('/cache/create',
  rbacMiddleware.requirePermission('authorizations.manage'),
  authorizationController.createCache
);

router.post('/cache/invalidate',
  rbacMiddleware.requirePermission('authorizations.manage'),
  authorizationController.invalidateCache
);

// Routes d'informations sur les permissions
router.get('/permissions/dependencies',
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationController.getPermissionsDependencies
);

router.get('/policy',
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationController.getPolicy
);

router.get('/roles/hierarchy',
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationController.getRolesHierarchy
);

// Routes utilisateur
router.get('/user/:userId',
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationController.getUserAuthorizations
);

router.get('/user/:userId/effective',
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationController.getUserEffectivePermissions
);

router.get('/user/:userId/highest-role',
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationController.getUserHighestRole
);

router.get('/user/:userId/is-admin',
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationController.getUserIsAdmin
);

// Routes de vérification
router.get('/verify/all/:permissions',
  rbacMiddleware.requirePermission('authorizations.verify'),
  authorizationController.verifyAllPermissions
);

router.get('/verify/any/:permissions',
  rbacMiddleware.requirePermission('authorizations.verify'),
  authorizationController.verifyAnyPermissions
);

router.get('/verify/menu/:menuId',
  rbacMiddleware.requirePermission('authorizations.verify'),
  authorizationController.verifyMenuAccess
);

router.get('/verify/resource/:resource',
  rbacMiddleware.requirePermission('authorizations.verify'),
  authorizationController.verifyResourceAccess
);

router.get('/verify/role/:role',
  rbacMiddleware.requirePermission('authorizations.verify'),
  authorizationController.verifyRoleAccess
);

router.get('/verify/role/all/:roles',
  rbacMiddleware.requirePermission('authorizations.verify'),
  authorizationController.verifyAllRolesAccess
);

router.get('/verify/role/any/:roles',
  rbacMiddleware.requirePermission('authorizations.verify'),
  authorizationController.verifyAnyRolesAccess
);

router.get('/verify/:permission',
  rbacMiddleware.requirePermission('authorizations.verify'),
  authorizationController.verifyPermission
);

// Vérifier si un utilisateur a une permission spécifique
router.post('/check/permission', 
  authorizationValidation.validateCheckPermission,
  authorizationController.checkPermission
);

// DEBUG: Route sans validation pour tester le controller
router.post('/check/permission/debug', 
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

/**
 * Routes CRUD de base pour les autorisations
 */

// Lister toutes les autorisations avec pagination et filtres
router.get('/', 
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationValidation.validateGetAuthorizations,
  authorizationController.getAllAuthorizations
);

// Récupérer une autorisation par son ID
router.get('/:id', 
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationValidation.validateAuthorizationId,
  authorizationController.getAuthorizationById
);

// Créer une nouvelle autorisation
router.post('/', 
  rbacMiddleware.requirePermission('authorizations.create'),
  authorizationValidation.validateCreateAuthorization,
  authorizationController.createAuthorization
);

// Mettre à jour une autorisation
router.put('/:id', 
  rbacMiddleware.requirePermission('authorizations.update'),
  authorizationValidation.validateUpdateAuthorization,
  authorizationController.updateAuthorization
);

// Supprimer une autorisation (soft delete)
router.delete('/:id', 
  rbacMiddleware.requirePermission('authorizations.delete'),
  authorizationValidation.validateAuthorizationId,
  authorizationController.deleteAuthorization
);

// Supprimer définitivement une autorisation
router.delete('/:id/hard', 
  rbacMiddleware.requirePermission('authorizations.hard_delete'),
  authorizationValidation.validateAuthorizationId,
  authorizationController.hardDeleteAuthorization
);

// Lister les autorisations d'un rôle
router.get('/role/:roleId', 
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationValidation.validateRoleId,
  authorizationController.getAuthorizationsByRole
);

// Lister les autorisations d'une permission
router.get('/permission/:permissionId', 
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationValidation.validatePermissionId,
  authorizationController.getAuthorizationsByPermission
);

// Lister les autorisations d'un menu
router.get('/menu/:menuId', 
  rbacMiddleware.requirePermission('authorizations.read'),
  authorizationValidation.validateMenuId,
  authorizationController.getAuthorizationsByMenu
);

module.exports = router;
