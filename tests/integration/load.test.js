const request = require('supertest');
const app = require('../../src/app');

describe('Load Testing', () => {
  describe('Basic Load Tests', () => {
    it('should handle concurrent health check requests', async () => {
      const concurrentRequests = 50;
      const requests = [];

      // Create concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/health')
            .expect(200)
        );
      }

      // Wait for all requests to complete
      const results = await Promise.allSettled(requests);
      
      // Count successful requests
      const successful = results.filter(result => 
        result.status === 'fulfilled'
      ).length;

      // At least 90% should succeed
      expect(successful).toBeGreaterThan(concurrentRequests * 0.9);
    });

    it('should handle concurrent authentication attempts', async () => {
      const concurrentRequests = 20;
      const requests = [];

      // Create concurrent login attempts
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: `test${i}@example.com`,
              password: 'password123'
            })
        );
      }

      // Wait for all requests to complete
      const results = await Promise.allSettled(requests);
      
      // Count successful requests (should be 401 for invalid credentials)
      const successful = results.filter(result => 
        result.status === 'fulfilled' && 
        [401, 429].includes(result.value.status)
      ).length;

      // All requests should complete (either 401 or 429)
      expect(successful).toBe(concurrentRequests);
    });

    it('should handle rate limiting under load', async () => {
      const ip = '192.168.1.100';
      const requests = [];
      
      // Create many requests from same IP
      for (let i = 0; i < 30; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .set('X-Forwarded-For', ip)
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        );
      }

      // Wait for all requests to complete
      const results = await Promise.allSettled(requests);
      
      // Count rate limited responses
      const rateLimited = results.filter(result => 
        result.status === 'fulfilled' && 
        result.value.status === 429
      ).length;

      // Should have rate limiting after threshold
      expect(rateLimited).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage Under Load', () => {
    it('should not leak memory during high load', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 100;
      
      // Perform many requests
      for (let i = 0; i < iterations; i++) {
        await request(app)
          .get('/health')
          .expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large payloads efficiently', async () => {
      const largePayload = {
        data: 'x'.repeat(1000), // 1KB payload
        nested: {
          array: new Array(100).fill('test'),
          object: Object.fromEntries(
            Array.from({length: 50}, (_, i) => [`key${i}`, `value${i}`])
          )
        }
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(largePayload)
        .expect(400); // Will fail validation but should be processed

      const responseTime = Date.now() - startTime;
      
      // Should process large payload quickly (< 100ms)
      expect(responseTime).toBeLessThan(100);
      expect(response.body).toHaveProperty('code');
    });
  });

  describe('Database Connection Pool', () => {
    it('should handle concurrent database operations', async () => {
      const concurrentRequests = 10;
      const requests = [];

      // Create concurrent requests that hit database
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/health/detailed')
            .expect(200)
        );
      }

      // Wait for all requests to complete
      const results = await Promise.allSettled(requests);
      
      // Count successful requests
      const successful = results.filter(result => 
        result.status === 'fulfilled'
      ).length;

      // All should succeed
      expect(successful).toBe(concurrentRequests);
    });
  });

  describe('Cache Performance', () => {
    it('should handle cache operations efficiently', async () => {
      const cacheService = require('../../src/services/cache.service');
      const operations = 100;
      const startTime = Date.now();

      // Perform many cache operations
      const promises = [];
      for (let i = 0; i < operations; i++) {
        promises.push(cacheService.setUserAuthorizations(i, [`permission_${i}`], 3600));
        promises.push(cacheService.getUserAuthorizations(i));
      }

      await Promise.allSettled(promises);
      
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / (operations * 2); // 2 operations per iteration
      
      // Average time should be reasonable (< 10ms per operation)
      expect(avgTime).toBeLessThan(10);
    });
  });

  describe('Security Under Load', () => {
    it('should handle security analysis efficiently', async () => {
      const attackDetectionService = require('../../src/security/attack-detection.service');
      const requests = 50;
      const startTime = Date.now();

      // Create many requests with potential attacks
      const promises = [];
      for (let i = 0; i < requests; i++) {
        const mockReq = {
          ip: `192.168.1.${i % 255}`,
          originalUrl: '/api/auth/login',
          method: 'POST',
          body: {
            email: `test${i}@example.com`,
            password: `password${i}`
          },
          headers: {
            'user-agent': 'Mozilla/5.0 (Test Browser)'
          }
        };

        promises.push(attackDetectionService.analyzeRequest(mockReq));
      }

      const results = await Promise.allSettled(promises);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / requests;
      
      // All analyses should complete
      const successful = results.filter(result => result.status === 'fulfilled').length;
      expect(successful).toBe(requests);
      
      // Average analysis time should be reasonable (< 50ms)
      expect(avgTime).toBeLessThan(50);
    });

    it('should not block legitimate traffic under attack', async () => {
      const legitimateRequests = 20;
      const attackRequests = 10;
      const promises = [];

      // Create legitimate requests
      for (let i = 0; i < legitimateRequests; i++) {
        promises.push(
          request(app)
            .get('/health')
            .expect(200)
        );
      }

      // Create attack requests
      for (let i = 0; i < attackRequests; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: `attack${i}@example.com'; DROP TABLE users; --`,
              password: 'password'
            })
        );
      }

      const results = await Promise.allSettled(promises);
      
      // Count legitimate successful requests
      const legitimateSuccessful = results.slice(0, legitimateRequests).filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      ).length;

      // Most legitimate requests should succeed
      expect(legitimateSuccessful).toBeGreaterThan(legitimateRequests * 0.8);
    });
  });

  describe('Metrics Collection', () => {
    it('should collect metrics efficiently under load', async () => {
      const metricsService = require('../../src/metrics/metrics.service');
      const requests = 100;
      const startTime = Date.now();

      // Simulate metric collection
      for (let i = 0; i < requests; i++) {
        metricsService.recordHttpRequest('GET', '/test', 200, false, 50);
        metricsService.recordAuthenticationAttempt('login', 'success', '192.168.1.1');
        metricsService.recordSecurityEvent('test_event', 'low', '192.168.1.1');
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / (requests * 3); // 3 metrics per request
      
      // Average metric recording time should be very fast (< 1ms)
      expect(avgTime).toBeLessThan(1);
      
      // Verify metrics are recorded
      const metrics = await metricsService.getMetrics();
      expect(metrics).toContain('event_planner_auth_http_requests_total');
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle errors gracefully without crashing', async () => {
      const requests = 50;
      const promises = [];

      // Create requests that will cause various errors
      for (let i = 0; i < requests; i++) {
        promises.push(
          request(app)
            .get(`/api/nonexistent/endpoint/${i}`)
            .expect(404)
        );
      }

      const results = await Promise.allSettled(promises);
      
      // All requests should complete with proper error handling
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 404
      ).length;

      expect(successful).toBe(requests);
    });

    it('should maintain response quality under stress', async () => {
      const requests = 30;
      const promises = [];

      // Create requests to health endpoint
      for (let i = 0; i < requests; i++) {
        promises.push(
          request(app)
            .get('/health')
            .then(res => ({
              status: res.status,
              responseTime: Date.now() // Will be calculated later
            }))
        );
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled');
      
      // All successful responses should be consistent
      successful.forEach(result => {
        expect(result.value.status).toBe(200);
      });

      // At least 90% should succeed
      expect(successful.length).toBeGreaterThan(requests * 0.9);
    });
  });
});
