const express = require('express');
const peopleController = require('./people.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const peopleValidation = require('./people.validation');

const router = express.Router();

/**
 * Routes publiques (pas d'authentification requise)
 * Utiles pour les flux OTP et recherche de base
 */
router.get('/search', peopleController.search); // Recherche publique
router.get('/email/:email', peopleController.getByEmail); // Pour OTP
router.get('/phone/:phone', peopleController.getByPhone); // Pour OTP
router.get('/:id/exists', peopleController.exists); // Vérification existence

/**
 * Routes protégées - authentification requise
 */
router.use(authMiddleware.authenticate);

/**
 * Routes CRUD avec permissions RBAC
 */
router.get('/', rbacMiddleware.requirePermission('people.list'), peopleController.getAll);
router.get('/stats', rbacMiddleware.requirePermission('people.stats'), peopleController.getStats);
router.get('/status/active', rbacMiddleware.requirePermission('people.read'), peopleController.getActivePeople);
router.get('/:id', rbacMiddleware.requirePermission('people.read'), peopleController.getById);
router.get('/email/:email', rbacMiddleware.requirePermission('people.read'), peopleController.getByEmail);
router.get('/phone/:phone', rbacMiddleware.requirePermission('people.read'), peopleController.getByPhone);
router.get('/exists/:id', rbacMiddleware.requirePermission('people.read'), peopleController.checkPersonExists);

// Routes POST
router.post('/:id/status', 
  rbacMiddleware.requirePermission('people.update'),
  peopleController.updatePersonStatus
);

/**
 * Routes de modification avec validation
 */
router.post('/', 
  rbacMiddleware.requirePermission('people.create'),
  peopleValidation.validateCreate,
  peopleController.create
);

router.put('/:id', 
  rbacMiddleware.requirePermission('people.update'),
  peopleValidation.validateUpdate,
  peopleController.update
);

router.patch('/:id/status', 
  rbacMiddleware.requirePermission('people.update'),
  peopleValidation.validateStatusUpdate,
  peopleController.updateStatus
);

/**
 * Routes de suppression (soft delete)
 */
router.delete('/:id', 
  rbacMiddleware.requirePermission('people.delete'),
  peopleController.delete
);

module.exports = router;
