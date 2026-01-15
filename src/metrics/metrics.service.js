const client = require('prom-client');
const logger = require('../utils/logger');

/**
 * Service de métriques Prometheus pour l'application
 * Collecte et expose les métriques de performance et d'utilisation
 */
class MetricsService {
  constructor() {
    // Créer un registre pour les métriques
    this.register = new client.Registry();
    
    // Ajouter les métriques par défaut (process, memory, etc.)
    client.collectDefaultMetrics({ 
      register: this.register,
      prefix: 'event_planner_auth_'
    });
    
    // Métriques personnalisées pour l'authentification
    this.httpRequestsTotal = new client.Counter({
      name: 'event_planner_auth_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'user_authenticated'],
      registers: [this.register]
    });
    
    this.httpRequestDuration = new client.Histogram({
      name: 'event_planner_auth_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register]
    });
    
    this.activeSessions = new client.Gauge({
      name: 'event_planner_auth_active_sessions_total',
      help: 'Number of active user sessions',
      registers: [this.register]
    });
    
    this.authenticationAttempts = new client.Counter({
      name: 'event_planner_auth_authentication_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['type', 'result', 'ip'],
      registers: [this.register]
    });
    
    this.otpGenerated = new client.Counter({
      name: 'event_planner_auth_otp_generated_total',
      help: 'Total number of OTP codes generated',
      labelNames: ['type', 'method', 'success'],
      registers: [this.register]
    });
    
    this.databaseConnections = new client.Gauge({
      name: 'event_planner_auth_database_connections',
      help: 'Number of active database connections',
      registers: [this.register]
    });
    
    this.cacheOperations = new client.Counter({
      name: 'event_planner_auth_cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'result'],
      registers: [this.register]
    });
    
    this.authorizationChecks = new client.Counter({
      name: 'event_planner_auth_authorization_checks_total',
      help: 'Total number of authorization checks',
      labelNames: ['permission', 'result', 'cached'],
      registers: [this.register]
    });
    
    this.passwordResets = new client.Counter({
      name: 'event_planner_auth_password_resets_total',
      help: 'Total number of password reset requests',
      labelNames: ['success', 'ip'],
      registers: [this.register]
    });
    
    this.securityEvents = new client.Counter({
      name: 'event_planner_auth_security_events_total',
      help: 'Total number of security events',
      labelNames: ['event_type', 'severity', 'ip'],
      registers: [this.register]
    });
    
    logger.info('Metrics service initialized');
  }

  /**
   * Enregistre une requête HTTP
   * @param {string} method - Méthode HTTP
   * @param {string} route - Route
   * @param {number} statusCode - Code de statut
   * @param {boolean} userAuthenticated - Si l'utilisateur est authentifié
   * @param {number} duration - Durée en millisecondes
   */
  recordHttpRequest(method, route, statusCode, userAuthenticated, duration) {
    const labels = {
      method,
      route: this.sanitizeRoute(route),
      status_code: statusCode.toString(),
      user_authenticated: userAuthenticated.toString()
    };
    
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe({
      method,
      route: this.sanitizeRoute(route),
      status_code: statusCode.toString()
    }, duration / 1000);
    
    logger.debug('HTTP request recorded', {
      method,
      route: this.sanitizeRoute(route),
      statusCode,
      duration,
      userAuthenticated
    });
  }

  /**
   * Met à jour le compteur de sessions actives
   * @param {number} count - Nombre de sessions actives
   */
  setActiveSessions(count) {
    this.activeSessions.set(count);
  }

  /**
   * Enregistre une tentative d'authentification
   * @param {string} type - Type d'authentification (login, otp, etc.)
   * @param {string} result - Résultat (success, failure, blocked)
   * @param {string} ip - Adresse IP
   */
  recordAuthenticationAttempt(type, result, ip) {
    this.authenticationAttempts.inc({
      type,
      result,
      ip: this.sanitizeIP(ip)
    });
    
    logger.debug('Authentication attempt recorded', {
      type,
      result,
      ip: this.sanitizeIP(ip)
    });
  }

  /**
   * Enregistre la génération d'OTP
   * @param {string} type - Type d'OTP (login, reset, verification)
   * @param {string} method - Méthode (email, sms)
   * @param {boolean} success - Si la génération a réussi
   */
  recordOTPGenerated(type, method, success) {
    this.otpGenerated.inc({
      type,
      method,
      success: success.toString()
    });
    
    logger.debug('OTP generation recorded', { type, method, success });
  }

  /**
   * Met à jour le nombre de connexions à la base de données
   * @param {number} count - Nombre de connexions actives
   */
  setDatabaseConnections(count) {
    this.databaseConnections.set(count);
  }

  /**
   * Enregistre une opération de cache
   * @param {string} operation - Type d'opération (get, set, del)
   * @param {string} result - Résultat (hit, miss, success, error)
   */
  recordCacheOperation(operation, result) {
    this.cacheOperations.inc({ operation, result });
  }

  /**
   * Enregistre une vérification d'autorisation
   * @param {string} permission - Permission vérifiée
   * @param {string} result - Résultat (granted, denied)
   * @param {boolean} cached - Si le résultat vient du cache
   */
  recordAuthorizationCheck(permission, result, cached) {
    this.authorizationChecks.inc({
      permission: this.sanitizePermission(permission),
      result,
      cached: cached.toString()
    });
    
    logger.debug('Authorization check recorded', {
      permission: this.sanitizePermission(permission),
      result,
      cached
    });
  }

  /**
   * Enregistre une demande de réinitialisation de mot de passe
   * @param {boolean} success - Si la demande a réussi
   * @param {string} ip - Adresse IP
   */
  recordPasswordReset(success, ip) {
    this.passwordResets.inc({
      success: success.toString(),
      ip: this.sanitizeIP(ip)
    });
  }

  /**
   * Enregistre un événement de sécurité
   * @param {string} eventType - Type d'événement
   * @param {string} severity - Sévérité (low, medium, high, critical)
   * @param {string} ip - Adresse IP
   */
  recordSecurityEvent(eventType, severity, ip) {
    this.securityEvents.inc({
      event_type: eventType,
      severity,
      ip: this.sanitizeIP(ip)
    });
    
    logger.security('Security event recorded', {
      eventType,
      severity,
      ip: this.sanitizeIP(ip)
    });
  }

  /**
   * Nettoie les routes pour les métriques (remplace les IDs)
   * @param {string} route - Route originale
   * @returns {string} Route nettoyée
   */
  sanitizeRoute(route) {
    return route
      .replace(/\/\d+/g, '/:id')           // Remplacer les IDs par :id
      .replace(/\/[a-f0-9-]{24,}/g, '/:uuid') // Remplacer les UUIDs par :uuid
      .replace(/\/[a-f0-9-]{8,}/g, '/:token') // Remplacer les tokens par :token
      .substring(0, 100); // Limiter la longueur
  }

  /**
   * Nettoie les adresses IP pour les métriques
   * @param {string} ip - Adresse IP
   * @returns {string} IP nettoyée
   */
  sanitizeIP(ip) {
    if (!ip) return 'unknown';
    
    // Hasher l'IP pour la confidentialité tout en gardant l'unicité
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 8);
  }

  /**
   * Nettoie les noms de permissions pour les métriques
   * @param {string} permission - Nom de permission
   * @returns {string} Permission nettoyée
   */
  sanitizePermission(permission) {
    if (!permission) return 'unknown';
    
    return permission
      .replace(/[^a-zA-Z0-9_.]/g, '_')  // Caractères valides seulement
      .substring(0, 50); // Limiter la longueur
  }

  /**
   * Retourne le registre Prometheus
   * @returns {Registry} Registre Prometheus
   */
  getRegistry() {
    return this.register;
  }

  /**
   * Retourne les métriques au format texte Prometheus
   * @returns {Promise<string>} Métriques formatées
   */
  async getMetrics() {
    try {
      return await this.register.metrics();
    } catch (error) {
      logger.error('Error generating metrics', { error: error.message });
      return '# Error generating metrics\n';
    }
  }

  /**
   * Réinitialise toutes les métriques (pour les tests)
   */
  reset() {
    this.register.clear();
    logger.info('Metrics reset');
  }

  /**
   * Retourne des statistiques sur les métriques
   * @returns {Object} Statistiques des métriques
   */
  getStats() {
    return {
      registrySize: this.register.getMetricsAsJSON().length,
      defaultMetricsEnabled: true,
      customMetricsCount: 10,
      lastReset: new Date().toISOString()
    };
  }
}

// Exporter une instance singleton
module.exports = new MetricsService();
