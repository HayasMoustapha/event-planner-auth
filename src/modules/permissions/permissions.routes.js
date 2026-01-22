const express = require('express');
const permissionController = require('./permissions.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const permissionValidation = require('./permissions.validation');

const router = express.Router();

/**
 * Routes publiques pour la gestion des permissions
 * Ces routes nécessitent une authentification
 */
router.use(authMiddleware.authenticate);

/**
 * Routes de lecture - accessibles aux utilisateurs authentifiés
 */

// Routes spéciales (doivent être avant /:id)
router.get('/stats', 
  rbacMiddleware.requirePermission('permissions.view_stats'),
  permissionController.getPermissionStats
);

router.get('/group/:groupName', 
  rbacMiddleware.requirePermission('permissions.read'),
  permissionController.getPermissionsByGroup
);

router.get('/resources', 
  rbacMiddleware.requirePermission('permissions.read'),
  permissionController.getResources
);

router.get('/resources/:resource/actions', 
  rbacMiddleware.requirePermission('permissions.read'),
  permissionController.getResourceActions
);

router.get('/role/:roleId', 
  rbacMiddleware.requirePermission('permissions.read'),
  permissionController.getRolePermissions
);

router.get('/system', 
  rbacMiddleware.requirePermission('permissions.read'),
  permissionController.getSystemPermissions
);

router.get('/user/:userId', 
  rbacMiddleware.requirePermission('permissions.read'),
  permissionController.getUserPermissions
);

router.get('/user/:userId/all/:permissions', 
  rbacMiddleware.requirePermission('permissions.verify'),
  permissionController.verifyUserAllPermissions
);

router.get('/user/:userId/any/:permissions', 
  rbacMiddleware.requirePermission('permissions.verify'),
  permissionController.verifyUserAnyPermissions
);

router.get('/user/:userId/check/:permission', 
  rbacMiddleware.requirePermission('permissions.verify'),
  permissionController.checkUserPermission
);

// Routes POST
router.post('/custom', 
  rbacMiddleware.requirePermission('permissions.create'),
  permissionController.createCustomPermission
);

router.post('/generate', 
  rbacMiddleware.requirePermission('permissions.create'),
  permissionController.generatePermission
);

// Routes avec paramètres
router.get('/:permissionId', 
  rbacMiddleware.requirePermission('permissions.read'),
  permissionController.getPermissionById
);

// Récupérer toutes les permissions avec pagination et filtres
router.get('/', 
  permissionValidation.validateGetPermissions,
  permissionController.getPermissions
);

// Récupérer une permission par son ID
router.get('/:id', 
  permissionValidation.validateGetPermissionById,
  permissionController.getPermissionById
);

// Récupérer les permissions d'un utilisateur
router.get('/user/:userId?', 
  permissionValidation.validateGetUserPermissions,
  permissionController.getUserPermissions
);

// Récupérer les permissions d'un rôle
router.get('/role/:roleId', 
  permissionValidation.validateGetRolePermissions,
  permissionController.getRolePermissions
);

// Récupérer toutes les ressources disponibles
router.get('/resources/list', 
  permissionController.getResources
);

// Récupérer les actions disponibles pour une ressource
router.get('/resource/:resource/actions', 
  permissionValidation.validateGetActionsByResource,
  permissionController.getActionsByResource
);

// Vérifier si un utilisateur a une permission spécifique
router.get('/check', 
  permissionValidation.validateCheckUserPermission,
  permissionController.checkUserPermission
);

/**
 * Routes d'écriture - nécessitent des permissions spécifiques
 */

// Créer une nouvelle permission
router.post('/', 
  rbacMiddleware.requirePermission('permissions.create'),
  permissionValidation.validateCreatePermission,
  permissionController.createPermission
);

// Mettre à jour une permission
router.put('/:id', 
  rbacMiddleware.requirePermission('permissions.update'),
  permissionValidation.validateUpdatePermission,
  permissionController.updatePermission
);

// Supprimer une permission
router.delete('/:id', 
  rbacMiddleware.requirePermission('permissions.delete'),
  permissionValidation.validateGetPermissionById,
  permissionController.deletePermission
);

// Générer les permissions de base pour une ressource
router.post('/generate', 
  rbacMiddleware.requirePermission('permissions.create'),
  permissionValidation.validateGenerateResourcePermissions,
  permissionController.generateResourcePermissions
);

// Vérifier si un utilisateur a l'une des permissions requises
router.post('/check/any', 
  permissionValidation.validateCheckPermissions,
  permissionController.hasAnyPermission
);

// Vérifier si un utilisateur a toutes les permissions requises
router.post('/check/all', 
  permissionValidation.validateCheckPermissions,
  permissionController.hasAllPermissions
);

/**
 * Routes d'administration - nécessitent des permissions d'administration
 */

// Récupérer les statistiques des permissions
router.get('/stats', 
  rbacMiddleware.requirePermission('permissions.view_stats'),
  permissionController.getPermissionStats
);

router.get('/admin/stats', 
  rbacMiddleware.requirePermission('permissions.view_stats'),
  permissionController.getPermissionStats
);

module.exports = router;
