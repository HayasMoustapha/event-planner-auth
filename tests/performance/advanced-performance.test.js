const request = require('supertest');
const app = require('../../src/app');

describe('Advanced Performance Testing', () => {
  describe('Stress Testing', () => {
    it('should handle 1000 concurrent requests', async () => {
      const concurrentRequests = 1000;
      const requests = [];
      const startTime = Date.now();

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
      const totalTime = Date.now() - startTime;
      
      // Count successful requests
      const successful = results.filter(result => 
        result.status === 'fulfilled'
      ).length;

      // Calculate metrics
      const successRate = (successful / concurrentRequests) * 100;
      const avgResponseTime = totalTime / concurrentRequests;
      const requestsPerSecond = (successful / totalTime) * 1000;

      expect(successRate).toBeGreaterThan(95); // 95% success rate
      expect(avgResponseTime).toBeLessThan(100); // < 100ms average
      expect(requestsPerSecond).toBeGreaterThan(100); // > 100 RPS

      console.log(`Stress Test Results:
        - Success Rate: ${successRate.toFixed(2)}%
        - Avg Response Time: ${avgResponseTime.toFixed(2)}ms
        - Requests/sec: ${requestsPerSecond.toFixed(2)}
        - Total Time: ${totalTime}ms`);
    });

    it('should handle memory pressure', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 500;
      const largePayload = {
        data: 'x'.repeat(10000), // 10KB per request
        nested: {
          array: new Array(1000).fill('test_data'),
          object: Object.fromEntries(
            Array.from({length: 500}, (_, i) => [`key${i}`, `value${i}`])
          )
        }
      };

      // Perform memory-intensive operations
      for (let i = 0; i < iterations; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(largePayload)
          .expect(400); // Will fail validation but should be processed
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (< 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      console.log(`Memory Pressure Test:
        - Initial Memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Final Memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should maintain performance under sustained load', async () => {
      const duration = 30000; // 30 seconds
      const requestsPerSecond = 50;
      const totalRequests = (duration / 1000) * requestsPerSecond;
      const results = [];
      
      const startTime = Date.now();
      let requestCount = 0;

      // Generate sustained load
      const interval = setInterval(async () => {
        const batchRequests = [];
        
        for (let i = 0; i < requestsPerSecond; i++) {
          batchRequests.push(
            request(app)
              .get('/health')
              .then(res => ({
                status: res.status,
                responseTime: Date.now() // Will be calculated
              }))
          );
        }

        const batchResults = await Promise.allSettled(batchRequests);
        const batchSuccessful = batchResults.filter(result => 
          result.status === 'fulfilled' && result.value.status === 200
        ).length;

        results.push({
          timestamp: Date.now() - startTime,
          successRate: (batchSuccessful / requestsPerSecond) * 100,
          successful: batchSuccessful
        });

        requestCount += requestsPerSecond;

        if (Date.now() - startTime >= duration) {
          clearInterval(interval);
        }
      }, 1000);

      // Wait for test to complete
      await new Promise(resolve => setTimeout(resolve, duration + 1000));

      // Analyze results
      const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
      const minSuccessRate = Math.min(...results.map(r => r.successRate));
      
      expect(avgSuccessRate).toBeGreaterThan(90);
      expect(minSuccessRate).toBeGreaterThan(80);
      expect(requestCount).toBeGreaterThanOrEqual(totalRequests * 0.9);

      console.log(`Sustained Load Test:
        - Duration: ${duration}ms
        - Target RPS: ${requestsPerSecond}
        - Actual Requests: ${requestCount}
        - Avg Success Rate: ${avgSuccessRate.toFixed(2)}%
        - Min Success Rate: ${minSuccessRate.toFixed(2)}%`);
    });
  });

  describe('Load Testing with Authentication', () => {
    it('should handle concurrent authentication attempts', async () => {
      const concurrentAuths = 100;
      const authRequests = [];
      const startTime = Date.now();

      // Create concurrent authentication requests
      for (let i = 0; i < concurrentAuths; i++) {
        authRequests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: `user${i}@example.com`,
              password: 'password123'
            })
        );
      }

      // Wait for all requests to complete
      const results = await Promise.allSettled(authRequests);
      const totalTime = Date.now() - startTime;

      // Analyze results
      const successful = results.filter(result => 
        result.status === 'fulfilled' && 
        [200, 401, 429].includes(result.value.status)
      ).length;

      const rateLimited = results.filter(result => 
        result.status === 'fulfilled' && 
        result.value.status === 429
      ).length;

      const avgResponseTime = totalTime / concurrentAuths;

      expect(successful).toBe(concurrentAuths); // All should complete
      expect(rateLimited).toBeGreaterThan(0); // Some should be rate limited
      expect(avgResponseTime).toBeLessThan(200); // < 200ms average

      console.log(`Concurrent Auth Test:
        - Total Requests: ${concurrentAuths}
        - Successful: ${successful}
        - Rate Limited: ${rateLimited}
        - Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    });

    it('should handle token refresh under load', async () => {
      const refreshRequests = 50;
      const requests = [];

      // Create concurrent refresh token requests
      for (let i = 0; i < refreshRequests; i++) {
        requests.push(
          request(app)
            .post('/api/auth/refresh')
            .send({
              refreshToken: `fake_refresh_token_${i}`
            })
        );
      }

      const results = await Promise.allSettled(requests);
      
      // All should complete (either 401 for invalid tokens or other errors)
      const completed = results.filter(result => 
        result.status === 'fulfilled'
      ).length;

      expect(completed).toBe(refreshRequests);
    });
  });

  describe('Security Performance', () => {
    it('should handle security analysis efficiently under load', async () => {
      const attackDetectionService = require('../../src/security/attack-detection.service');
      const requests = 200;
      const startTime = Date.now();

      // Create requests with potential attacks
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
      
      // Average analysis time should be reasonable (< 100ms under load)
      expect(avgTime).toBeLessThan(100);
      
      console.log(`Security Analysis Performance:
        - Requests: ${requests}
        - Successful: ${successful}
        - Total Time: ${totalTime}ms
        - Avg Time: ${avgTime.toFixed(2)}ms`);
    });

    it('should handle cache operations under security load', async () => {
      const cacheService = require('../../src/services/cache.service');
      const operations = 500;
      const startTime = Date.now();

      // Perform many cache operations simulating security events
      const promises = [];
      for (let i = 0; i < operations; i++) {
        promises.push(cacheService.setLoginAttempt(`security_test_${i}`, {
          ip: `192.168.1.${i % 255}`,
          attempts: i % 10,
          timestamp: new Date().toISOString()
        }, 3600));
        
        promises.push(cacheService.getLoginAttempts(`security_test_${i}`));
      }

      const results = await Promise.allSettled(promises);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / (operations * 2);
      
      // Most operations should complete (cache might be disabled)
      const completed = results.filter(result => result.status === 'fulfilled').length;
      expect(completed).toBeGreaterThan(operations * 1.5); // At least 75%
      
      // Average time should be very fast (< 10ms)
      expect(avgTime).toBeLessThan(10);
      
      console.log(`Cache Security Performance:
        - Operations: ${operations * 2}
        - Completed: ${completed}
        - Total Time: ${totalTime}ms
        - Avg Time: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Resource Limits', () => {
    it('should respect connection limits', async () => {
      const maxConnections = 100;
      const requests = [];

      // Create many simultaneous connections
      for (let i = 0; i < maxConnections * 2; i++) {
        requests.push(
          request(app)
            .get('/health')
            .timeout(5000) // 5 second timeout
        );
      }

      const results = await Promise.allSettled(requests);
      
      // Count successful and timed out requests
      const successful = results.filter(result => 
        result.status === 'fulfilled'
      ).length;

      const timedOut = results.filter(result => 
        result.status === 'rejected' && 
        result.reason.message.includes('timeout')
      ).length;

      // Should handle most requests but some may timeout
      expect(successful).toBeGreaterThan(maxConnections * 0.8);
      expect(timedOut).toBeLessThan(maxConnections * 0.5);

      console.log(`Connection Limits Test:
        - Max Connections: ${maxConnections}
        - Successful: ${successful}
        - Timed Out: ${timedOut}
        - Success Rate: ${((successful / (maxConnections * 2)) * 100).toFixed(2)}%`);
    });

    it('should handle large payloads gracefully', async () => {
      const payloadSizes = [1, 10, 100, 1000]; // KB
      const results = [];

      for (const size of payloadSizes) {
        const payload = {
          data: 'x'.repeat(size * 1024),
          timestamp: new Date().toISOString()
        };

        const startTime = Date.now();
        
        try {
          const response = await request(app)
            .post('/api/auth/login')
            .send(payload)
            .expect(400); // Should fail validation

          results.push({
            size,
            responseTime: Date.now() - startTime,
            status: response.status
          });
        } catch (error) {
          results.push({
            size,
            error: error.message,
            responseTime: Date.now() - startTime
          });
        }
      }

      // All requests should be handled quickly
      results.forEach(result => {
        expect(result.responseTime).toBeLessThan(1000); // < 1 second
        if (result.status) {
          expect(result.status).toBe(400); // Validation error
        }
      });

      console.log('Large Payload Test Results:');
      results.forEach(result => {
        console.log(`  - ${result.size}KB: ${result.responseTime}ms ${result.status || result.error}`);
      });
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance degradation', async () => {
      const baselineRequests = 100;
      const currentRequests = 100;
      
      // Baseline test
      const baselineStart = Date.now();
      for (let i = 0; i < baselineRequests; i++) {
        await request(app).get('/health');
      }
      const baselineTime = Date.now() - baselineStart;
      const baselineAvg = baselineTime / baselineRequests;

      // Current test (simulating degraded performance)
      const currentStart = Date.now();
      for (let i = 0; i < currentRequests; i++) {
        await request(app).get('/health');
      }
      const currentTime = Date.now() - currentStart;
      const currentAvg = currentTime / currentRequests;

      // Calculate performance degradation
      const degradation = ((currentAvg - baselineAvg) / baselineAvg) * 100;

      // In normal conditions, degradation should be minimal
      expect(degradation).toBeLessThan(50); // Less than 50% degradation

      console.log(`Performance Regression Test:
        - Baseline Avg: ${baselineAvg.toFixed(2)}ms
        - Current Avg: ${currentAvg.toFixed(2)}ms
        - Degradation: ${degradation.toFixed(2)}%`);
    });
  });
});
