const { connection } = require('../config/database');
const cacheService = require('../services/cache.service');
const logger = require('../utils/logger');
const { createResponse } = require('../utils/response');

/**
 * Contrôleur pour les health checks détaillés
 * Fournit des informations sur l'état de santé de tous les composants
 */

/**
 * Vérifie la connexion à la base de données
 * @returns {Promise<Object>} État de la base de données
 */
async function checkDatabase() {
  const startTime = Date.now();
  
  try {
    // Vérifier que la connexion est disponible
    if (!connection) {
      throw new Error('Database connection not available');
    }

    const client = await connection.connect();
    
    // Vérifier que le client est valide
    if (!client || !client.query) {
      throw new Error('Invalid database client');
    }
    
    await client.query('SELECT 1 as health_check');
    client.release();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'OK',
      responseTime: `${responseTime}ms`,
      details: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        connected: true
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Database health check failed', { 
      error: error.message,
      responseTime 
    });
    
    return {
      status: 'ERROR',
      responseTime: `${responseTime}ms`,
      error: error.message,
      details: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        connected: false
      }
    };
  }
}

/**
 * Vérifie l'état du cache Redis
 * @returns {Promise<Object|null>} État du cache ou null si non configuré
 */
async function checkCache() {
  const startTime = Date.now();
  
  try {
    // Vérifier si le service cache est disponible
    if (!cacheService || typeof cacheService.getStats !== 'function') {
      return null;
    }

    const stats = await cacheService.getStats();
    const responseTime = Date.now() - startTime;
    
    if (!stats || !stats.connected) {
      return {
        status: 'WARNING',
        responseTime: `${responseTime}ms`,
        details: {
          connected: false,
          message: 'Redis cache not available - fallback mode'
        }
      };
    }

    return {
      status: 'OK',
      responseTime: `${responseTime}ms`,
      details: {
        connected: true,
        keys: stats.keys || 0,
        memory: stats.memory || 'unknown',
        uptime: stats.uptime || 'unknown'
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Cache health check failed', { 
      error: error.message,
      responseTime 
    });
    
    return {
      status: 'WARNING',
      responseTime: `${responseTime}ms`,
      error: error.message,
      details: {
        connected: false,
        message: 'Cache service unavailable'
      }
    };
  }
}

/**
 * Vérifie l'utilisation de la mémoire
 * @returns {Object} État de la mémoire
 */
function checkMemory() {
  const memUsage = process.memoryUsage();
  const totalMem = require('os').totalmem();
  const freeMem = require('os').freemem();
  const usedMem = totalMem - freeMem;
  
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const systemUsedPercent = Math.round((usedMem / totalMem) * 100);
  
  let status = 'OK';
  if (systemUsedPercent > 90) {
    status = 'ERROR';
  } else if (systemUsedPercent > 80) {
    status = 'WARNING';
  }
  
  return {
    status,
    details: {
      heap: {
        used: `${heapUsedMB}MB`,
        total: `${heapTotalMB}MB`,
        percentage: Math.round((heapUsedMB / heapTotalMB) * 100)
      },
      system: {
        used: `${Math.round(usedMem / 1024 / 1024)}MB`,
        total: `${Math.round(totalMem / 1024 / 1024)}MB`,
        percentage: systemUsedPercent
      },
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    }
  };
}

/**
 * Vérifie l'espace disque disponible
 * @returns {Promise<Object|null>} État du disque
 */
async function checkDisk() {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Vérifier l'espace sur le répertoire courant si le répertoire de logs n'existe pas
    const logDir = process.env.LOG_FILE_PATH || 'logs';
    let checkPath = logDir;
    
    try {
      await fs.access(logDir);
    } catch (error) {
      // Si le répertoire n'existe pas, utiliser le répertoire courant
      checkPath = '.';
    }
    
    // Utiliser statfs ou une alternative plus simple
    try {
      const stats = await fs.statfs(checkPath);
      const totalSpace = stats.bavail * stats.bsize;
      const freeSpace = stats.bavail * stats.bsize;
      const usedSpacePercent = Math.round(((totalSpace - freeSpace) / totalSpace) * 100);
      
      let status = 'OK';
      if (usedSpacePercent > 95) {
        status = 'ERROR';
      } else if (usedSpacePercent > 85) {
        status = 'WARNING';
      }
      
      return {
        status,
        details: {
          path: path.resolve(checkPath),
          total: `${Math.round(totalSpace / 1024 / 1024)}MB`,
          free: `${Math.round(freeSpace / 1024 / 1024)}MB`,
          used: `${usedSpacePercent}%`
        }
      };
    } catch (statfsError) {
      // Si statfs n'est pas disponible, retourner un statut neutre
      return {
        status: 'OK',
        details: {
          path: path.resolve(checkPath),
          message: 'Disk space check not available'
        }
      };
    }
  } catch (error) {
    logger.error('Disk health check failed', { error: error.message });
    
    return {
      status: 'OK',
      error: error.message,
      details: {
        message: 'Unable to check disk space - continuing anyway'
      }
    };
  }
}

/**
 * Health check basique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function basicHealth(req, res) {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Basic health check error', { error: error.message });
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
}

/**
 * Health check détaillé avec tous les composants
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function detailedHealth(req, res) {
  const startTime = Date.now();
  
  try {
    logger.info('Starting detailed health check');
      
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      responseTime: 0,
      checks: {}
    };

    logger.info('Checking database');
    // Vérifier la base de données
    health.checks.database = await checkDatabase();
    logger.info('Database check completed', health.checks.database);
      
    logger.info('Checking cache');
    // Vérifier Redis/cache
    const cacheStats = await checkCache();
    if (cacheStats) {
      health.checks.cache = cacheStats;
    }
    logger.info('Cache check completed', cacheStats);
      
    logger.info('Checking memory');
    // Vérifier la mémoire
    health.checks.memory = checkMemory();
    logger.info('Memory check completed');
      
    logger.info('Checking disk');
    // Vérifier le disque
    health.checks.disk = await checkDisk();
    logger.info('Disk check completed');
      
    // Calculer le temps de réponse
    health.responseTime = Date.now() - startTime;
      
    // Déterminer le statut global
    const allChecks = Object.values(health.checks);
    const hasFailures = allChecks.some(check => check && check.status === 'ERROR');
    const hasWarnings = allChecks.some(check => check && check.status === 'WARNING');
      
    if (hasFailures) {
      health.status = 'ERROR';
      res.status(503);
    } else if (hasWarnings) {
      health.status = 'WARNING';
      res.status(200);
    } else {
      health.status = 'OK';
      res.status(200);
    }

    logger.info('Detailed health check completed', {
      status: health.status,
      responseTime: health.responseTime,
      checks: Object.keys(health.checks)
    });

    res.json(health);
  } catch (error) {
    logger.error('Detailed health check error', { 
      error: error.message,
      stack: error.stack 
    });
      
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error.message,
      checks: {}
    });
  }
}

/**
 * Endpoint de readiness pour Kubernetes
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function readiness(req, res) {
  try {
    // Vérifier que les dépendances critiques sont prêtes
    const dbCheck = await checkDatabase();
      
    if (dbCheck.status !== 'OK') {
      return res.status(503).json({
        status: 'NOT_READY',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbCheck
        }
      });
    }

    res.status(200).json({
      status: 'READY',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck
      }
    });
  } catch (error) {
    logger.error('Readiness check error', { error: error.message });
    res.status(503).json({
      status: 'NOT_READY',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

/**
 * Endpoint de liveness pour Kubernetes
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function liveness(req, res) {
  try {
    // Vérifier que le processus répond
    const uptime = process.uptime();
      
    if (uptime < 5) {
      // Démarrage récent, considérer comme vivant
      return res.status(200).json({
        status: 'ALIVE',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime)
      });
    }

    // Vérifier que le processus n'est pas bloqué
    const startTime = Date.now();
    await new Promise(resolve => setImmediate(resolve));
    const responseTime = Date.now() - startTime;
      
    if (responseTime > 1000) {
      return res.status(503).json({
        status: 'UNHEALTHY',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        responseTime: `${responseTime}ms`
      });
    }

    res.status(200).json({
      status: 'ALIVE',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    logger.error('Liveness check error', { error: error.message });
    res.status(503).json({
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

module.exports = {
  basicHealth,
  detailedHealth,
  readiness,
  liveness
};
