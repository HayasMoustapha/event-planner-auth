const express = require('express');
const roleController = require('./roles.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const roleValidation = require('./roles.validation');

const router = express.Router();

/**
 * Routes publiques pour la gestion des rôles
 * Ces routes nécessitent une authentification
 */
router.use(authMiddleware.authenticate);

/**
 * Routes de lecture - accessibles aux utilisateurs authentifiés
 */

// Récupérer tous les rôles avec pagination et filtres
router.get('/', 
  roleValidation.validateGetRoles,
  roleController.getRoles
);

// Récupérer un rôle par son ID avec ses permissions
router.get('/:id', 
  roleValidation.validateGetRoleById,
  roleController.getRoleById
);

// Récupérer les permissions d'un rôle
router.get('/:id/permissions', 
  roleValidation.validateGetRoleById,
  roleController.getRolePermissions
);

// Récupérer les utilisateurs ayant un rôle
router.get('/:id/users', 
  roleValidation.validateGetRoleById,
  roleValidation.validateGetRoleUsers,
  roleController.getRoleUsers
);

// Récupérer les rôles d'un utilisateur
router.get('/user/:userId?', 
  roleValidation.validateGetUserRoles,
  roleController.getUserRoles
);

// Vérifier si un utilisateur a un rôle spécifique
router.get('/check/role', 
  roleValidation.validateCheckUserRole,
  roleController.checkUserRole
);

// Récupérer le rôle de plus haut niveau d'un utilisateur
router.get('/user/:userId/highest', 
  roleValidation.validateGetRoleById,
  roleController.getUserHighestRole
);

/**
 * Routes d'écriture - nécessitent des permissions spécifiques
 */

// Créer un nouveau rôle
router.post('/', 
  rbacMiddleware.requirePermission('roles.create'),
  roleValidation.validateCreateRole,
  roleController.createRole
);

// Mettre à jour un rôle
router.put('/:id', 
  rbacMiddleware.requirePermission('roles.update'),
  roleValidation.validateUpdateRole,
  roleController.updateRole
);

// Supprimer un rôle
router.delete('/:id', 
  rbacMiddleware.requirePermission('roles.delete'),
  roleValidation.validateGetRoleById,
  roleController.deleteRole
);

// Dupliquer un rôle
router.post('/:id/duplicate', 
  rbacMiddleware.requirePermission('roles.create'),
  roleValidation.validateDuplicateRole,
  roleController.duplicateRole
);

/**
 * Routes de gestion des permissions - nécessitent des permissions spécifiques
 */

// Associer des permissions à un rôle
router.post('/:id/permissions', 
  rbacMiddleware.requirePermission('roles.assign_permissions'),
  roleValidation.validateAssignPermissions,
  roleController.assignPermissions
);

// Supprimer toutes les permissions d'un rôle
router.delete('/:id/permissions', 
  rbacMiddleware.requirePermission('roles.assign_permissions'),
  roleValidation.validateGetRoleById,
  roleController.removeAllPermissions
);

/**
 * Routes d'administration - nécessitent des permissions d'administration
 */

// Récupérer les statistiques des rôles
router.get('/admin/stats', 
  rbacMiddleware.requirePermission('roles.view_stats'),
  roleController.getRoleStats
);

module.exports = router;
