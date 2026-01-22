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

// Routes spéciales (doivent être avant /:id)
router.get('/stats', 
  rbacMiddleware.requirePermission('menus.view_stats'),
  menuController.getMenuStats
);

router.get('/hidden', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getHiddenMenus
);

router.get('/parent/:menuId', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getMenusByParent
);

router.get('/root', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getRootMenus
);

router.get('/root-only', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getRootOnlyMenus
);

router.get('/status/active', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getActiveMenus
);

router.get('/tree', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getMenuTree
);

router.get('/user/:userId', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getUserMenus
);

router.get('/visible', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getVisibleMenus
);

// Routes POST spéciales
router.post('/reorder', 
  rbacMiddleware.requirePermission('menus.manage'),
  menuController.reorderMenus
);

// Routes avec paramètres (doivent être après les routes spéciales)
router.get('/:menuId', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getMenuById
);

router.get('/:menuId/access', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getMenuAccess
);

router.post('/:menuId/duplicate', 
  rbacMiddleware.requirePermission('menus.create'),
  menuController.duplicateMenu
);

router.get('/:menuId/permissions', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getMenuPermissions
);

router.get('/:menuId/permissions/:permissionId', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getMenuPermissionById
);

// Récupérer tous les menus avec pagination et filtres
router.get('/', 
  menuValidation.validateGetMenus,
  menuController.getMenus
);

// Récupérer l'arborescence complète des menus
router.get('/tree', 
  rbacMiddleware.requirePermission('menus.read'),
  menuController.getMenuTree
);

// Récupérer les menus de premier niveau (racine) - cette route est déjà définie plus haut
// router.get('/root', menuController.getRootMenus);

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

// Récupérer les menus accessibles à un utilisateur - route déjà définie plus haut
// router.get('/user/:userId?', menuValidation.validateGetUserMenus, menuController.getUserMenus);

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

// Dupliquer un menu - route déjà définie plus haut
// router.post('/:id/duplicate', rbacMiddleware.requirePermission('menus.create'), menuValidation.validateDuplicateMenu, menuController.duplicateMenu);

// Réorganiser l'ordre des menus - route déjà définie plus haut
// router.post('/reorder', rbacMiddleware.requirePermission('menus.update'), menuValidation.validateReorderMenus, menuController.reorderMenus);

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

// Récupérer les statistiques des menus - route déjà définie plus haut
// router.get('/stats', rbacMiddleware.requirePermission('menus.view_stats'), menuController.getMenuStats);

router.get('/admin/stats', 
  rbacMiddleware.requirePermission('menus.view_stats'),
  menuController.getMenuStats
);

module.exports = router;
