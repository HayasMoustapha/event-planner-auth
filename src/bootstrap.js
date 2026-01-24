const DatabaseBootstrap = require('./services/database-bootstrap.service');
const serviceContainer = require('./services/index');

/**
 * Point d'entrée pour le bootstrap de l'application
 * Initialise les services critiques avant démarrage du serveur
 */
class ApplicationBootstrap {
  /**
   * Initialise tous les composants critiques de l'application
   * @throws {Error} Si l'initialisation échoue
   */
  async initialize() {
    console.log('🚀 Starting Event Planner Auth bootstrap...');
    
    try {
      // 0. Créer la base de données si elle n'existe pas (AVANT toute connexion)
      console.log('🔍 Checking database existence...');
      await DatabaseBootstrap.ensureDatabaseExists();
      console.log('✅ Database existence verified');
      
      // 1. Bootstrap de la base de données
      console.log('📊 Initializing database...');
      await DatabaseBootstrap.initialize(); // ✅ METHODE CORRECTE
      console.log('✅ Database initialized successfully');
      
      // 2. Initialisation du container de services
      console.log('🔧 Initializing service container...');
      await serviceContainer.initialize();
      console.log('✅ Service container initialized successfully');

      // 3. Validation finale des services critiques
      console.log('🔍 Validating critical services...');
      this.validateCriticalServices();
      console.log('✅ All critical services validated');

      console.log('🎯 Application bootstrap completed successfully');
      
    } catch (error) {
      console.error('❌ Application bootstrap failed:', error.message);
      console.error('🔥 Server cannot start - critical services unavailable');
      process.exit(1); // Arrêt immédiat si bootstrap échoue
    }
  }

  /**
   * Valide que tous les services critiques sont disponibles
   * @throws {Error} Si un service critique manque
   */
  validateCriticalServices() {
    const status = serviceContainer.getStatus();
    
    // Services critiques qui doivent TOUJOURS être disponibles
    const criticalServices = ['logger', 'emailService', 'smsService', 'cacheService'];
    
    for (const serviceName of criticalServices) {
      const serviceStatus = status.services.find(s => s.name === serviceName);
      
      if (!serviceStatus || !serviceStatus.available) {
        throw new Error(
          `Service critique ${serviceName} non disponible - démarrage impossible`
        );
      }
      
      if (serviceStatus.type !== 'object') {
        throw new Error(
          `Service ${serviceName} mal initialisé - type: ${serviceStatus.type}`
        );
      }
    }

    console.log('✅ Critical services status:', {
      logger: !!serviceContainer.get('logger'),
      emailService: serviceContainer.get('emailService').isReady(),
      smsService: serviceContainer.get('smsService').isReady(),
      cacheService: serviceContainer.get('cacheService').isReady()
    });
  }

  /**
   * Retourne le container de services pour utilisation
   * @returns {Object} Service container
   */
  getServiceContainer() {
    return serviceContainer;
  }
}

module.exports = new ApplicationBootstrap();
