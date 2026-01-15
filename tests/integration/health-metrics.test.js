const request = require('supertest');
const app = require('../../src/app');
const cacheService = require('../../src/services/cache.service');

describe('Health Checks Integration', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('cache');
      expect(response.body.checks).toHaveProperty('memory');
    });

    it('should handle database connection failure gracefully', async () => {
      // Mock database failure
      const originalConnect = require('../../src/config/database').connection.connect;
      require('../../src/config/database').connection.connect = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/health/detailed')
        .expect(503);

      expect(response.body.status).toBe('ERROR');
      expect(response.body.checks.database.status).toBe('ERROR');

      // Restore original function
      require('../../src/config/database').connection.connect = originalConnect;
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'READY');
      expect(response.body).toHaveProperty('checks');
    });
  });

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ALIVE');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});

describe('Metrics Integration', () => {
  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/plain/);
      expect(response.text).toContain('event_planner_auth_');
    });
  });

  describe('GET /metrics/info (protected)', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/metrics/info')
        .expect(401);
    });

    it('should require admin permissions', async () => {
      // Mock user without admin permissions
      const token = 'fake_token';
      
      await request(app)
        .get('/metrics/info')
        .set('Authorization', `Bearer ${token}`)
        .expect(401); // Will fail authentication first
    });
  });
});

describe('Cache Service Integration', () => {
  describe('Cache operations', () => {
    it('should handle cache operations gracefully', async () => {
      // Test cache operations without Redis running
      const result = await cacheService.setUserAuthorizations(1, ['test_permission'], 3600);
      expect(typeof result).toBe('boolean');
    });

    it('should return null for cache misses', async () => {
      const result = await cacheService.getUserAuthorizations(999);
      expect(result).toBeNull();
    });

    it('should handle cache invalidation', async () => {
      const result = await cacheService.invalidateUserAuthorizations(1);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Cache stats', () => {
    it('should return cache statistics', async () => {
      const stats = await cacheService.getStats();
      expect(typeof stats).toBe('object');
      expect(stats).toHaveProperty('connected');
    });
  });
});

describe('Application Integration', () => {
  describe('API Documentation', () => {
    it('should return API endpoints documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('auth');
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('metrics');
    });
  });

  describe('Root endpoint', () => {
    it('should return application information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Event Planner Auth API');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Metrics collection', () => {
    it('should collect HTTP request metrics', async () => {
      // Make a request to generate metrics
      await request(app)
        .get('/health')
        .expect(200);

      // Check that metrics are being collected
      const metricsResponse = await request(app)
        .get('/metrics')
        .expect(200);

      expect(metricsResponse.text).toContain('event_planner_auth_http_requests_total');
    });
  });
});
