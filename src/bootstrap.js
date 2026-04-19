const DatabaseBootstrap = require('./services/database-bootstrap.service');
const serviceContainer = require('./services/index');

/**
 * Point d'entrÃ©e pour le bootstrap de l'application
 * Initialise les services critiques avant dÃ©marrage du serveur
 */
class ApplicationBootstrap {
  /**
   * Initialise tous les composants critiques de l'application
   * @throws {Error} Si l'initialisation Ã©choue
   */
  async initialize() {
    console.log('ðŸš€ Starting Event Planner Auth bootstrap...');
    
    try {
      // 0. CrÃ©er la base de donnÃ©es si elle n'existe pas (AVANT toute connexion)
      console.log('ðŸ” Checking database existence...');
      await DatabaseBootstrap.ensureDatabaseExists();
      console.log('âœ… Database existence verified');
      
      // 1. Bootstrap de la base de donnÃ©es
      console.log('ðŸ“Š Initializing database...');
      await DatabaseBootstrap.initialize(); // âœ… METHODE CORRECTE
      console.log('âœ… Database initialized successfully');
      
      // 2. Initialisation du container de services
      console.log('ðŸ”§ Initializing service container...');
      await serviceContainer.initialize();
      console.log('âœ… Service container initialized successfully');

      // 3. Validation finale des services critiques
      console.log('ðŸ” Validating critical services...');
      this.validateCriticalServices();
      console.log('âœ… All critical services validated');

      console.log('ðŸŽ¯ Application bootstrap completed successfully');
      
    } catch (error) {
      console.error('âŒ Application bootstrap failed:', error.message);
      console.error('ðŸ”¥ Server cannot start - critical services unavailable');
      process.exit(1); // ArrÃªt immÃ©diat si bootstrap Ã©choue
    }
  }

  /**
   * Valide que tous les services critiques sont disponibles
   * @throws {Error} Si un service critique manque
   */
  validateCriticalServices() {
    const status = serviceContainer.getStatus();
    
    const isProduction = process.env.NODE_ENV === 'production';
    const criticalServices = isProduction
      ? ['logger', 'emailService', 'smsService', 'cacheService']
      : ['logger', 'emailService'];
    
    for (const serviceName of criticalServices) {
      const serviceStatus = status.services.find(s => s.name === serviceName);
      
      if (!serviceStatus || !serviceStatus.available) {
        throw new Error(
          `Service critique ${serviceName} non disponible - dÃ©marrage impossible`
        );
      }
      
      if (serviceStatus.type !== 'object') {
        throw new Error(
          `Service ${serviceName} mal initialisÃ© - type: ${serviceStatus.type}`
        );
      }
    }

    console.log('✅ Critical services status:', {
      logger: !!serviceContainer.get('logger'),
      emailService: serviceContainer.get('emailService').isReady(),
      smsService: serviceContainer.get('smsService').isReady(),
      cacheService: serviceContainer.get('cacheService').isReady(),
      mode: isProduction ? 'strict' : 'development-tolerant'
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
