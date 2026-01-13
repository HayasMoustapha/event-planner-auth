const express = require('express');
const usersController = require('./users.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware.authenticate);

// Routes avec permissions RBAC
router.get('/', rbacMiddleware.requirePermission('users.list'), usersController.getAll);
router.get('/:id', rbacMiddleware.requirePermission('users.read'), usersController.getById);
router.post('/', rbacMiddleware.requirePermission('users.create'), usersController.create);
router.put('/:id', rbacMiddleware.requirePermission('users.update'), usersController.update);
router.delete('/:id', rbacMiddleware.requirePermission('users.delete'), usersController.delete);

// Gestion des rôles
router.get('/:id/roles', rbacMiddleware.requirePermission('users.read'), usersController.getUserRoles);
router.post('/:id/roles', rbacMiddleware.requirePermission('roles.assign'), usersController.assignRole);
router.delete('/:id/roles/:roleId', rbacMiddleware.requirePermission('roles.assign'), usersController.removeRole);

// Gestion du statut
router.put('/:id/status', rbacMiddleware.requirePermission('users.update'), usersController.updateStatus);

module.exports = router;
