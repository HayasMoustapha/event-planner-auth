const express = require('express');
const menuController = require('./menus.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const menuValidation = require('./menus.validation');

const router = express.Router();

/**
 * Routes publiques pour la gestion des menus
 * Ces routes nécessitent une authentification
 */
router.use(authMiddleware.authenticate);

/**
 * Routes de lecture - accessibles aux utilisateurs authentifiés
 */

// Récupérer tous les menus avec pagination et filtres
router.get('/', 
  menuValidation.validateGetMenus,
  menuController.getMenus
);

// Récupérer l'arborescence complète des menus
router.get('/tree', 
  menuController.getMenuTree
);

// Récupérer les menus de premier niveau (racine)
router.get('/root', 
  menuController.getRootMenus
);

// Récupérer un menu par son ID
router.get('/:id', 
  menuValidation.validateGetMenuById,
  menuController.getMenuById
);

// Récupérer les permissions d'un menu
router.get('/:id/permissions', 
  menuValidation.validateGetMenuById,
  menuController.getMenuPermissions
);

// Récupérer les menus accessibles à un utilisateur
router.get('/user/:userId?', 
  menuValidation.validateGetUserMenus,
  menuController.getUserMenus
);

// Vérifier si un utilisateur a accès à un menu
router.get('/check/access', 
  menuValidation.validateCheckUserMenuAccess,
  menuController.checkUserMenuAccess
);

/**
 * Routes d'écriture - nécessitent des permissions spécifiques
 */

// Créer un nouveau menu
router.post('/', 
  rbacMiddleware.requirePermission('menus.create'),
  menuValidation.validateCreateMenu,
  menuController.createMenu
);

// Mettre à jour un menu
router.put('/:id', 
  rbacMiddleware.requirePermission('menus.update'),
  menuValidation.validateUpdateMenu,
  menuController.updateMenu
);

// Supprimer un menu
router.delete('/:id', 
  rbacMiddleware.requirePermission('menus.delete'),
  menuValidation.validateGetMenuById,
  menuController.deleteMenu
);

// Dupliquer un menu
router.post('/:id/duplicate', 
  rbacMiddleware.requirePermission('menus.create'),
  menuValidation.validateDuplicateMenu,
  menuController.duplicateMenu
);

// Réorganiser l'ordre des menus
router.post('/reorder', 
  rbacMiddleware.requirePermission('menus.update'),
  menuValidation.validateReorderMenus,
  menuController.reorderMenus
);

/**
 * Routes de gestion des permissions - nécessitent des permissions spécifiques
 */

// Associer des permissions à un menu
router.post('/:id/permissions', 
  rbacMiddleware.requirePermission('menus.assign_permissions'),
  menuValidation.validateAssignMenuPermissions,
  menuController.assignMenuPermissions
);

// Supprimer toutes les permissions d'un menu
router.delete('/:id/permissions', 
  rbacMiddleware.requirePermission('menus.assign_permissions'),
  menuValidation.validateGetMenuById,
  menuController.removeAllMenuPermissions
);

/**
 * Routes d'administration - nécessitent des permissions d'administration
 */

// Récupérer les statistiques des menus
router.get('/admin/stats', 
  rbacMiddleware.requirePermission('menus.view_stats'),
  menuController.getMenuStats
);

module.exports = router;
