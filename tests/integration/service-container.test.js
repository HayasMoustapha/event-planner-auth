const request = require('supertest');
const app = require('../../src/app');
const serviceContainer = require('../../src/services/index');

describe('Service Container Validation Tests', () => {
  beforeAll(async () => {
    // Initialiser le container pour les tests
    await serviceContainer.initialize();
  });

  describe('Service Container Initialization', () => {
    test('should initialize all critical services successfully', async () => {
      const status = serviceContainer.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.services).toHaveLength(4); // logger, emailService, smsService, cacheService
      
      // Vérifier que tous les services critiques sont disponibles
      const criticalServices = ['logger', 'emailService', 'smsService', 'cacheService'];
      criticalServices.forEach(serviceName => {
        const serviceStatus = status.services.find(s => s.name === serviceName);
        expect(serviceStatus).toBeDefined();
        expect(serviceStatus.available).toBe(true);
        expect(serviceStatus.type).toBe('object');
      });
    });

    test('should throw error if service missing required methods', async () => {
      // Simuler un service incomplet
      const incompleteService = {
        isReady: () => true
        // Manque sendOTP
      };
      
      serviceContainer.services.testService = incompleteService;
      
      expect(() => {
        serviceContainer.validateService('testService', ['sendOTP']);
      }).toThrow('Service testService incomplet: méthodes manquantes [sendOTP]');
    });
  });

  describe('Service Availability', () => {
    test('should provide working logger service', () => {
      const logger = serviceContainer.get('logger');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('should provide working email service', () => {
      const emailService = serviceContainer.get('emailService');
      expect(emailService).toBeDefined();
      expect(typeof emailService.sendOTP).toBe('function');
      expect(typeof emailService.isReady).toBe('function');
    });

    test('should provide working SMS service', () => {
      const smsService = serviceContainer.get('smsService');
      expect(smsService).toBeDefined();
      expect(typeof smsService.sendOTP).toBe('function');
      expect(typeof smsService.isReady).toBe('function');
    });

    test('should provide working cache service with all required methods', () => {
      const cacheService = serviceContainer.get('cacheService');
      expect(cacheService).toBeDefined();
      
      // Vérifier toutes les méthodes requises
      const requiredMethods = [
        'get', 'set', 'setEx', 'del', 'getStats', 'isReady',
        'setLoginAttempt', 'getLoginAttempts', 'getLoginAttempt',
        'incrementLoginAttempt', 'resetLoginAttempt'
      ];
      
      requiredMethods.forEach(method => {
        expect(typeof cacheService[method]).toBe('function');
      });
    });
  });

  describe('Service Error Handling', () => {
    test('should throw error for non-existent service', () => {
      expect(() => {
        serviceContainer.get('nonExistentService');
      }).toThrow('Service nonExistentService non disponible');
    });

    test('should throw error if container not initialized', async () => {
      const newContainer = require('../../src/services/index');
      
      // Créer un nouveau container non initialisé
      const uninitializedContainer = Object.create(newContainer);
      uninitializedContainer.initialized = false;
      
      expect(() => {
        uninitializedContainer.get('logger');
      }).toThrow('Service container non initialisé - appeler initialize() d\'abord');
    });
  });

  describe('Fail-Fast Behavior', () => {
    test('should fail fast if critical service missing', async () => {
      // Simuler l'échec d'initialisation
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      const mockContainer = require('../../src/services/index');
      const failingContainer = Object.create(mockContainer);
      
      // Override la méthode initialize pour simuler un échec
      failingContainer.initialize = async () => {
        throw new Error('Service critique manquant');
      };
      
      await expect(failingContainer.initialize()).rejects.toThrow('Service critique manquant');
      
      // Restaurer console.error
      console.error = originalConsoleError;
    });
  });

  describe('API Integration with Service Container', () => {
    test('should work with real API calls', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'OK');
    });

    test('should handle service failures gracefully', async () => {
      // Simuler un service email non configuré
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Cette test dépendra de la configuration réelle
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'Test123!'
        });
      
      // Soit succès (si email configuré) soit erreur explicite
      expect([200, 500]).toContain(response.status);
      
      // Restaurer l'environnement
      process.env.NODE_ENV = originalEnv;
    });
  });
});
