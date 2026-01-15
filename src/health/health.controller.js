const { connection } = require('../../config/database');
const cacheService = require('../../services/cache.service');
const logger = require('../../utils/logger');
const { createResponse } = require('../../utils/response');

/**
 * Contrôleur pour les health checks détaillés
 * Fournit des informations sur l'état de santé de tous les composants
 */
class HealthController {
  /**
   * Health check basique
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async basicHealth(req, res) {
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
  async detailedHealth(req, res) {
    const startTime = Date.now();
    
    try {
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        responseTime: 0,
        checks: {}
      };

      // Vérifier la base de données
      health.checks.database = await this.checkDatabase();
      
      // Vérifier Redis/cache
      health.checks.cache = await this.checkCache();
      
      // Vérifier la mémoire
      health.checks.memory = this.checkMemory();
      
      // Vérifier le disque
      health.checks.disk = await this.checkDisk();
      
      // Calculer le temps de réponse
      health.responseTime = Date.now() - startTime;
      
      // Déterminer le statut global
      const allChecks = Object.values(health.checks);
      const hasFailures = allChecks.some(check => check.status !== 'OK');
      const hasWarnings = allChecks.some(check => check.status === 'WARNING');
      
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
      logger.error('Detailed health check error', { error: error.message });
      
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
   * Vérifie la connexion à la base de données
   * @returns {Promise<Object>} État de la base de données
   */
  async checkDatabase() {
    const startTime = Date.now();
    
    try {
      const client = await connection.connect();
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
   * @returns {Promise<Object>} État du cache
   */
  async checkCache() {
    const startTime = Date.now();
    
    try {
      const stats = await cacheService.getStats();
      const responseTime = Date.now() - startTime;
      
      if (!stats.connected) {
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
        status: 'ERROR',
        responseTime: `${responseTime}ms`,
        error: error.message,
        details: {
          connected: false
        }
      };
    }
  }

  /**
   * Vérifie l'utilisation de la mémoire
   * @returns {Object} État de la mémoire
   */
  checkMemory() {
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
   * @returns {Promise<Object>} État du disque
   */
  async checkDisk() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Vérifier l'espace sur le répertoire de logs
      const logDir = process.env.LOG_FILE_PATH || 'logs';
      const stats = await fs.statfs(logDir);
      
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
          path: path.resolve(logDir),
          total: `${Math.round(totalSpace / 1024 / 1024)}MB`,
          free: `${Math.round(freeSpace / 1024 / 1024)}MB`,
          used: `${usedSpacePercent}%`
        }
      };
    } catch (error) {
      logger.error('Disk health check failed', { error: error.message });
      
      return {
        status: 'WARNING',
        error: error.message,
        details: {
          message: 'Unable to check disk space'
        }
      };
    }
  }

  /**
   * Endpoint de readiness pour Kubernetes
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async readiness(req, res) {
    try {
      // Vérifier que les dépendances critiques sont prêtes
      const dbCheck = await this.checkDatabase();
      
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
  async liveness(req, res) {
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
}

module.exports = new HealthController();
