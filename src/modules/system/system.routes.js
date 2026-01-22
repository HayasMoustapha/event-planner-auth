const express = require('express');
const router = express.Router();
const { createResponse } = require('../../utils/response');
const { connection } = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * @swagger
 * /api/system/cache:
 *   get:
 *     summary: Obtenir les informations du cache
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Informations du cache
 *       500:
 *         description: Erreur serveur
 */
router.get('/cache', async (req, res) => {
  try {
    // Informations sur le cache Redis si disponible
    const cacheInfo = {
      status: 'active',
      type: 'redis',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(createResponse(
      true,
      'Informations du cache récupérées',
      cacheInfo
    ));
  } catch (error) {
    logger.error('Error getting cache info:', error);
    res.status(500).json(createResponse(
      false,
      'Erreur lors de la récupération des informations du cache',
      { error: error.message }
    ));
  }
});

/**
 * @swagger
 * /api/system/config:
 *   get:
 *     summary: Obtenir la configuration système
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Configuration système
 *       500:
 *         description: Erreur serveur
 */
router.get('/config', async (req, res) => {
  try {
    const config = {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform
    };

    res.status(200).json(createResponse(
      true,
      'Configuration système récupérée',
      config
    ));
  } catch (error) {
    logger.error('Error getting system config:', error);
    res.status(500).json(createResponse(
      false,
      'Erreur lors de la récupération de la configuration système',
      { error: error.message }
    ));
  }
});

/**
 * @swagger
 * /api/system/database:
 *   get:
 *     summary: Obtenir les informations de la base de données
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Informations de la base de données
 *       500:
 *         description: Erreur serveur
 */
router.get('/database', async (req, res) => {
  try {
    const result = await connection.query('SELECT version()');
    const dbInfo = {
      status: 'connected',
      type: 'postgresql',
      version: result.rows[0].version,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(createResponse(
      true,
      'Informations de la base de données récupérées',
      dbInfo
    ));
  } catch (error) {
    logger.error('Error getting database info:', error);
    res.status(500).json(createResponse(
      false,
      'Erreur lors de la récupération des informations de la base de données',
      { error: error.message }
    ));
  }
});

/**
 * @swagger
 * /api/system/info:
 *   get:
 *     summary: Obtenir les informations système complètes
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Informations système complètes
 *       500:
 *         description: Erreur serveur
 */
router.get('/info', async (req, res) => {
  try {
    const [dbResult] = await Promise.allSettled([
      connection.query('SELECT version()')
    ]);

    const systemInfo = {
      application: {
        name: 'Event Planner Auth API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      database: {
        status: dbResult.status === 'fulfilled' ? 'connected' : 'error',
        type: 'postgresql',
        version: dbResult.status === 'fulfilled' ? dbResult.value.rows[0].version : null
      },
      memory: process.memoryUsage()
    };

    res.status(200).json(createResponse(
      true,
      'Informations système complètes récupérées',
      systemInfo
    ));
  } catch (error) {
    logger.error('Error getting system info:', error);
    res.status(500).json(createResponse(
      false,
      'Erreur lors de la récupération des informations système',
      { error: error.message }
    ));
  }
});

/**
 * @swagger
 * /api/system/status:
 *   get:
 *     summary: Obtenir le statut du système
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Statut du système
 *       500:
 *         description: Erreur serveur
 */
router.get('/status', async (req, res) => {
  try {
    const [dbResult] = await Promise.allSettled([
      connection.query('SELECT 1')
    ]);

    const status = {
      status: dbResult.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbResult.status === 'fulfilled' ? 'up' : 'down',
        api: 'up'
      }
    };

    const statusCode = status.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(createResponse(
      true,
      'Statut du système récupéré',
      status
    ));
  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json(createResponse(
      false,
      'Erreur lors de la récupération du statut système',
      { error: error.message }
    ));
  }
});

module.exports = router;
