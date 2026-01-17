/**
 * Container central des services - Injection de dépendances
 * Garantit la cohérence et l'existence des services critiques
 */

const logger = require('../utils/logger');
const configValidation = require('../config/validation');

// Import des services
const EmailService = require('./email.service');
const SMSService = require('./sms.service');
const CacheService = require('./cache.service');

/**
 * Container de services avec validation des contrats
 */
class ServiceContainer {
  constructor() {
    this.services = {};
    this.initialized = false;
  }

  /**
   * Initialise tous les services critiques
   * @throws {Error} Si un service critique ne peut être initialisé
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    logger.info('🚀 Initializing service container...');

    try {
      // Initialiser le logger (toujours disponible)
      this.services.logger = logger;

      // Initialiser le service email
      this.services.emailService = new EmailService();
      this.validateService('emailService', ['sendOTP', 'sendWelcomeEmail', 'isReady']);

      // Initialiser le service SMS
      this.services.smsService = new SMSService();
      this.validateService('smsService', ['sendOTP', 'sendWelcomeSMS', 'isReady']);

      // Initialiser le service cache
      this.services.cacheService = new CacheService();
      this.validateService('cacheService', [
        'get', 'set', 'setEx', 'del', 'getStats', 'isReady',
        'setLoginAttempt', 'getLoginAttempts', 'getLoginAttempt', // Méthodes manquantes à ajouter
        'incrementLoginAttempt', 'resetLoginAttempt'
      ]);

      this.initialized = true;
      logger.info('✅ Service container initialized successfully');

    } catch (error) {
      logger.error('❌ Service container initialization failed', { error: error.message });
      throw new Error(`Échec critique d'initialisation des services: ${error.message}`);
    }
  }

  /**
   * Valide qu'un service implémente les méthodes requises
   * @param {string} serviceName - Nom du service
   * @param {Array} requiredMethods - Méthodes obligatoires
   * @throws {Error} Si une méthode manque
   */
  validateService(serviceName, requiredMethods) {
    const service = this.services[serviceName];
    
    if (!service) {
      throw new Error(`Service ${serviceName} non initialisé`);
    }

    const missingMethods = requiredMethods.filter(method => 
      typeof service[method] !== 'function'
    );

    if (missingMethods.length > 0) {
      throw new Error(
        `Service ${serviceName} incomplet: méthodes manquantes [${missingMethods.join(', ')}]`
      );
    }

    logger.debug(`✅ Service ${serviceName} validated with ${requiredMethods.length} methods`);
  }

  /**
   * Récupère un service
   * @param {string} serviceName - Nom du service
   * @returns {Object} Instance du service
   * @throws {Error} Si le service n'existe pas
   */
  get(serviceName) {
    if (!this.initialized) {
      throw new Error('Service container non initialisé - appeler initialize() d\'abord');
    }

    if (!this.services[serviceName]) {
      throw new Error(`Service ${serviceName} non disponible`);
    }

    return this.services[serviceName];
  }

  /**
   * Vérifie si tous les services critiques sont disponibles
   * @returns {boolean} True si OK
   */
  isReady() {
    return this.initialized && 
           this.services.logger && 
           this.services.emailService && 
           this.services.smsService && 
           this.services.cacheService;
  }

  /**
   * Retourne le statut de tous les services
   * @returns {Object} Statut détaillé
   */
  getStatus() {
    return {
      initialized: this.initialized,
      services: Object.keys(this.services).map(name => ({
        name,
        available: !!this.services[name],
        type: typeof this.services[name]
      }))
    };
  }
}

// Instance singleton
const serviceContainer = new ServiceContainer();

module.exports = serviceContainer;
