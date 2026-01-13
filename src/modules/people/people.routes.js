const express = require('express');
const peopleController = require('./people.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware.authenticate);

// Routes avec permissions RBAC
router.get('/', rbacMiddleware.requirePermission('people.list'), peopleController.getAll);
router.get('/:id', rbacMiddleware.requirePermission('people.read'), peopleController.getById);
router.post('/', rbacMiddleware.requirePermission('people.create'), peopleController.create);
router.put('/:id', rbacMiddleware.requirePermission('people.update'), peopleController.update);
router.delete('/:id', rbacMiddleware.requirePermission('people.delete'), peopleController.delete);

module.exports = router;
