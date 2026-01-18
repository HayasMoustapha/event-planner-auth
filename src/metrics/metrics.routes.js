const express = require('express');
const metricsService = require('./metrics.service');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * Routes pour les métriques Prometheus
 */

// Endpoint principal pour les métriques (publique pour monitoring)
router.get('/', async (req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('# Error generating metrics\n');
  }
});

// Informations sur les métriques (protégé)
router.get('/info', 
  authenticate, 
  requirePermission('admin.metrics.read'),
  (req, res) => {
    try {
      const stats = metricsService.getStats();
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get metrics info'
      });
    }
  }
);

// Réinitialiser les métriques (admin uniquement)
router.post('/reset', 
  authenticate, 
  requirePermission('admin.metrics.reset'),
  (req, res) => {
    try {
      metricsService.reset();
      res.json({
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to reset metrics'
      });
    }
  }
);

module.exports = router;
