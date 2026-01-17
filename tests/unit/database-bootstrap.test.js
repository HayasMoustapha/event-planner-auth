const DatabaseBootstrap = require('../../src/services/database-bootstrap.service');

describe('DatabaseBootstrap Contract Validation', () => {
  describe('Contract Compliance', () => {
    test('should export a class instance', () => {
      expect(DatabaseBootstrap).toBeDefined();
      expect(typeof DatabaseBootstrap).toBe('function');
      expect(DatabaseBootstrap.prototype.constructor.name).toBe('DatabaseBootstrap');
    });

    test('should have initialize method', () => {
      const instance = new DatabaseBootstrap();
      expect(typeof instance.initialize).toBe('function');
    });

    test('should NOT have runBootstrap method (legacy compatibility)', () => {
      const instance = new DatabaseBootstrap();
      expect(instance.runBootstrap).toBeUndefined();
    });

    test('should have optional verify method', () => {
      const instance = new DatabaseBootstrap();
      expect(typeof instance.verify).toBe('function');
    });

    test('should have optional shutdown method', () => {
      const instance = new DatabaseBootstrap();
      expect(typeof instance.shutdown).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    let instance;

    beforeEach(() => {
      instance = new DatabaseBootstrap();
    });

    test('initialize() should be async and return Object', async () => {
      const result = await instance.initialize();
      
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('actions');
      expect(result).toHaveProperty('migrationsApplied');
      expect(result).toHaveProperty('seedsExecuted');
    });

    test('verify() should be async and return Object', async () => {
      // Mock des dépendances pour le test
      const mockConnection = {
        connect: jest.fn().mockResolvedValue({
          query: jest.fn().mockResolvedValue({
            rows: [{ count: 1 }]
          })
        })
      };

      // Temporairement remplacer la dépendance
      const originalConnection = require.cache[require.resolve('../../src/config/database')];
      require.cache[require.resolve('../../src/config/database')] = mockConnection;

      const result = await instance.verify();
      
      // Restaurer la dépendance originale
      require.cache[require.resolve('../../src/config/database')] = originalConnection;

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    test('shutdown() should be async and return Object', async () => {
      const result = await instance.shutdown();
      
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    test('should throw error on database connection failure', async () => {
      // Mock une erreur de connexion
      const mockConnection = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };

      const originalConnection = require.cache[require.resolve('../../src/config/database')];
      require.cache[require.resolve('../../src/config/database')] = mockConnection;

      await expect(instance.initialize()).rejects.toThrow('Connection failed');

      // Restaurer
      require.cache[require.resolve('../../src/config/database')] = originalConnection;
    });

    test('should handle migration errors gracefully', async () => {
      // Mock une erreur de migration
      const mockFs = {
        readdir: jest.fn().mockResolvedValue(['001_initial_schema.sql']),
        readFile: jest.fn().mockRejectedValue(new Error('Migration file not found'))
      };

      const originalFs = require.cache[require.resolve('fs')];
      require.cache[require.resolve('fs')] = mockFs;

      await expect(instance.initialize()).rejects.toThrow('Migration file not found');

      // Restaurer
      require.cache[require.resolve('fs')] = originalFs;
    });
  });

  describe('Idempotency', () => {
    test('initialize() should be idempotent', async () => {
      const mockConnection = {
        connect: jest.fn().mockResolvedValue({
          query: jest.fn()
            .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // Première fois
            .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // Deuxième fois
        })
      };

      const originalConnection = require.cache[require.resolve('../../src/config/database')];
      require.cache[require.resolve('../../src/config/database')] = mockConnection;

      // Premier appel
      await instance.initialize();
      
      // Deuxième appel (ne devrait pas ré-appliquer les migrations)
      await instance.initialize();
      
      // Vérifier que la connexion a été appelée seulement 2 fois
      expect(mockConnection.connect).toHaveBeenCalledTimes(2);
      expect(mockConnection.connect.mock.results[0].value.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.connect.mock.results[1].value.query).toHaveBeenCalledTimes(1);

      // Restaurer
      require.cache[require.resolve('../../src/config/database')] = originalConnection;
    });
  });

  describe('Integration with Bootstrap', () => {
    test('should work with ApplicationBootstrap', async () => {
      const ApplicationBootstrap = require('../../src/bootstrap');
      const bootstrap = new ApplicationBootstrap();
      
      // Mock le service container pour éviter l'initialisation réelle
      const mockServiceContainer = {
        initialize: jest.fn().mockResolvedValue(),
        getStatus: jest.fn().mockReturnValue({
          initialized: true,
          services: []
        })
      };

      const originalServiceContainer = require.cache[require.resolve('../../src/services/index')];
      require.cache[require.resolve('../../src/services/index')] = mockServiceContainer;

      await expect(bootstrap.initialize()).resolves.toBeDefined();

      // Restaurer
      require.cache[require.resolve('../../src/services/index')] = originalServiceContainer;
    });
  });
});
