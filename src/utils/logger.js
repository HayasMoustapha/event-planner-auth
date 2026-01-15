const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

/**
 * Service de logging structuré pour l'application
 * Utilise Winston avec rotation quotidienne des logs
 */
class LoggerService {
  constructor() {
    this.logger = this.createLogger();
  }

  /**
   * Crée et configure le logger Winston
   * @returns {winston.Logger} Instance configurée du logger
   */
  createLogger() {
    // Créer le répertoire de logs s'il n'existe pas
    const logDir = process.env.LOG_FILE_PATH || 'logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Format personnalisé pour les logs
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, userId, ip, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]`;
        
        // Ajouter le service si disponible
        if (service) {
          log += ` [${service}]`;
        }
        
        // Ajouter les informations de contexte si disponibles
        if (userId) {
          log += ` [User:${userId}]`;
        }
        if (ip) {
          log += ` [IP:${ip}]`;
        }
        
        log += `: ${message}`;
        
        // Ajouter les métadonnées si présentes
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        
        return log;
      })
    );

    // Configuration des transports
    const transports = [];

    // Transport pour les erreurs (fichier séparé)
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );

    // Transport pour tous les logs avec rotation quotidienne
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        format: logFormat
      })
    );

    // Transport console pour le développement
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            logFormat
          )
        })
      );
    }

    // Créer le logger
    const logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { 
        service: 'auth-service',
        environment: process.env.NODE_ENV || 'development'
      },
      transports,
      // Gérer les exceptions non capturées
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'exceptions.log')
        })
      ],
      // Gérer les rejets de promesses non capturés
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'rejections.log')
        })
      ]
    });

    return logger;
  }

  /**
   * Log une erreur
   * @param {string} message - Message d'erreur
   * @param {Object} meta - Métadonnées optionnelles
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * Log un avertissement
   * @param {string} message - Message d'avertissement
   * @param {Object} meta - Métadonnées optionnelles
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log une information
   * @param {string} message - Message d'information
   * @param {Object} meta - Métadonnées optionnelles
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log de debug
   * @param {string} message - Message de debug
   * @param {Object} meta - Métadonnées optionnelles
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log une opération d'authentification
   * @param {string} action - Action effectuée (login, logout, etc.)
   * @param {Object} context - Contexte de l'opération
   */
  auth(action, context = {}) {
    this.info(`Auth: ${action}`, {
      category: 'auth',
      action,
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      success: context.success,
      ...context
    });
  }

  /**
   * Log une opération de sécurité
   * @param {string} event - Événement de sécurité
   * @param {Object} context - Contexte de l'événement
   */
  security(event, context = {}) {
    this.warn(`Security: ${event}`, {
      category: 'security',
      event,
      ip: context.ip,
      userId: context.userId,
      userAgent: context.userAgent,
      risk: context.risk || 'medium',
      ...context
    });
  }

  /**
   * Log une performance
   * @param {string} operation - Opération mesurée
   * @param {number} duration - Durée en millisecondes
   * @param {Object} context - Contexte additionnel
   */
  performance(operation, duration, context = {}) {
    const level = duration > 1000 ? 'warn' : 'info';
    this.logger[level](`Performance: ${operation} took ${duration}ms`, {
      category: 'performance',
      operation,
      duration,
      ...context
    });
  }

  /**
   * Log une requête HTTP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {number} duration - Durée de traitement
   */
  http(req, res, duration) {
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    this.logger[level](`HTTP: ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      category: 'http',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
  }

  /**
   * Log une opération de base de données
   * @param {string} operation - Opération SQL
   * @param {number} duration - Durée en millisecondes
   * @param {Object} context - Contexte additionnel
   */
  database(operation, duration, context = {}) {
    const level = duration > 500 ? 'warn' : 'debug';
    this.logger[level](`Database: ${operation} took ${duration}ms`, {
      category: 'database',
      operation,
      duration,
      ...context
    });
  }
}

// Exporter une instance singleton
module.exports = new LoggerService();
