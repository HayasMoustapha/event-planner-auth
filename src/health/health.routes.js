const express = require('express');
const healthController = require('./health.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * Routes de health check pour monitoring et Kubernetes
 */

// Health check basique (publique)
router.get('/health', healthController.basicHealth);

// Health check détaillé (publique)
router.get('/health/detailed', healthController.detailedHealth);

// Readiness probe (Kubernetes)
router.get('/ready', healthController.readiness);

// Liveness probe (Kubernetes)
router.get('/live', healthController.liveness);

// Health check avec authentification (protégée)
router.get('/health/authenticated', 
  authenticate, 
  healthController.detailedHealth
);

// Health check admin (requiert permissions admin)
router.get('/health/admin', 
  authenticate, 
  requirePermission('admin.health.read'),
  healthController.detailedHealth
);

module.exports = router;
