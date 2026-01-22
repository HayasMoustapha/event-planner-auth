const logger = require('./logger');

/**
 * Utilitaire de logging pour l'audit et la sécurité
 * Centralise tous les logs de sécurité avec contexte structuré
 */
class AuditLogger {
  constructor() {
    this.logLevels = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
      INFO: 4
    };
  }

  /**
   * Log une erreur critique
   */
  critical(message, context = {}) {
    logger.error('🚨 CRITICAL', {
      message,
      level: 'CRITICAL',
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log une erreur de haute priorité
   */
  high(message, context = {}) {
    logger.error('⚠️ HIGH', {
      message,
      level: 'HIGH',
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log une erreur de moyenne priorité
   */
  medium(message, context = {}) {
    logger.warn('⚠️ MEDIUM', {
      message,
      level: 'MEDIUM',
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log une erreur de basse priorité
   */
  low(message, context = {}) {
    logger.warn('ℹ️ LOW', {
      message,
      level: 'LOW',
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log un événement de sécurité
   */
  security(event, context = {}) {
    this.high(`Security Event: ${event}`, {
      type: 'SECURITY',
      event,
      ...context
    });
  }

  /**
   * Log une tentative d'attaque
   */
  attack(type, details, context = {}) {
    this.critical(`Attack Detected: ${type}`, {
      type: 'ATTACK',
      attackType: type,
      details,
      ...context
    });
  }

  /**
   * Log une erreur de base de données
   */
  database(operation, error, context = {}) {
    this.high(`Database Error: ${operation}`, {
      type: 'DATABASE',
      operation,
      error: error.message,
      stack: error.stack,
      ...context
    });
  }

  /**
   * Log une erreur d'authentification
   */
  auth(event, context = {}) {
    this.medium(`Auth Event: ${event}`, {
      type: 'AUTH',
      event,
      ...context
    });
  }

  /**
   * Log une erreur de validation
   */
  validation(field, value, rule, context = {}) {
    this.low(`Validation Error: ${field}`, {
      type: 'VALIDATION',
      field,
      value,
      rule,
      ...context
    });
  }
}

module.exports = new AuditLogger();
