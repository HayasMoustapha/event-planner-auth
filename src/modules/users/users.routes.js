const express = require('express');
const usersController = require('./users.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const usersValidation = require('./users.validation');

const router = express.Router();

/**
 * Routes publiques (sans authentification)
 * Utiles pour les vérifications de disponibilité
 */
router.get('/check/username/:username', usersController.checkUsernameAvailability);
router.get('/check/email/:email', usersController.checkEmailAvailability);

/**
 * Routes d'authentification
 */
router.post('/authenticate', usersController.authenticate);

/**
 * Routes protégées - authentification requise
 */
router.use(authMiddleware.authenticate);

/**
 * Routes CRUD avec permissions RBAC
 */
router.get('/', rbacMiddleware.requirePermission('users.list'), usersController.getAll);
router.get('/stats', rbacMiddleware.requirePermission('users.stats'), usersController.getStats);
router.get('/:id', rbacMiddleware.requirePermission('users.read'), usersController.getById);
router.get('/email/:email', rbacMiddleware.requirePermission('users.read'), usersController.getByEmail);
router.get('/username/:username', rbacMiddleware.requirePermission('users.read'), usersController.getByUsername);

/**
 * Routes de modification avec validation
 */
router.post('/', 
  rbacMiddleware.requirePermission('users.create'),
  usersValidation.validateCreate,
  usersController.create
);

router.put('/:id', 
  rbacMiddleware.requirePermission('users.update'),
  usersValidation.validateUpdate,
  usersController.update
);

router.patch('/:id', 
  rbacMiddleware.requirePermission('users.update'),
  usersValidation.validateUpdate,
  usersController.update
);

router.patch('/:id/password', 
  rbacMiddleware.requirePermission('users.update'),
  usersValidation.validatePasswordUpdate,
  usersController.updatePassword
);

router.patch('/:id/status', 
  rbacMiddleware.requirePermission('users.update'),
  usersValidation.validateStatusUpdate,
  usersController.updateStatus
);

/**
 * Routes de suppression (soft delete)
 */
router.delete('/:id', 
  rbacMiddleware.requirePermission('users.delete'),
  usersController.delete
);

/**
 * Routes utilitaires
 */
router.get('/:id/exists', rbacMiddleware.requirePermission('users.read'), usersController.exists);
router.post('/reset-password', 
  rbacMiddleware.requirePermission('users.update'),
  usersValidation.validatePasswordReset,
  usersController.resetPassword
);

/**
 * Routes de recherche
 */
router.get('/search', rbacMiddleware.requirePermission('users.list'), usersController.search);

module.exports = router;
