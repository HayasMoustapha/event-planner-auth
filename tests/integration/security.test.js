const request = require('supertest');
const app = require('../../src/app');
const attackDetectionService = require('../../src/security/attack-detection.service');
const securityMiddleware = require('../../src/middlewares/security.middleware');

describe('Security Middleware Integration', () => {
  describe('Attack Detection', () => {
    it('should detect SQL injection attempts', async () => {
      const maliciousPayload = {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload)
        .expect(400);

      expect(response.body).toHaveProperty('code', 'CONTENT_VALIDATION_FAILED');
    });

    it('should detect XSS attempts', async () => {
      const maliciousPayload = {
        email: 'test@example.com',
        comment: '<script>alert("xss")</script>'
      };

      const response = await request(app)
        .post('/api/some-endpoint')
        .send(maliciousPayload)
        .expect(400);

      expect(response.body).toHaveProperty('code', 'CONTENT_VALIDATION_FAILED');
    });

    it('should detect path traversal attempts', async () => {
      const maliciousPayload = {
        file: '../../../etc/passwd'
      };

      const response = await request(app)
        .get('/api/files')
        .query(maliciousPayload)
        .expect(400);

      expect(response.body).toHaveProperty('code', 'CONTENT_VALIDATION_FAILED');
    });

    it('should detect oversized payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(15000) // 15KB
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(largePayload)
        .expect(400);

      expect(response.body).toHaveProperty('code', 'INPUT_VALIDATION_FAILED');
    });
  });

  describe('Brute Force Protection', () => {
    it('should allow normal requests', async () => {
      const normalPayload = {
        email: 'test@example.com',
        password: 'password123'
      };

      // First request should succeed
      await request(app)
        .post('/api/auth/login')
        .send(normalPayload);

      // Second request should also succeed (under threshold)
      const response = await request(app)
        .post('/api/auth/login')
        .send(normalPayload)
        .expect(401); // Will fail auth but not be blocked

      expect(response.headers).not.toHaveProperty('x-ratelimit-remaining');
    });

    it('should block after too many attempts', async () => {
      const failedPayload = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make 6 failed attempts (exceeds threshold of 5)
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(failedPayload);
      }

      // Next request should be blocked
      const response = await request(app)
        .post('/api/auth/login')
        .send(failedPayload)
        .expect(429);

      expect(response.body).toHaveProperty('code', 'BRUTE_FORCE_DETECTED');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML in input', async () => {
      const payloadWithHTML = {
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert("xss")>'
      };

      const response = await request(app)
        .post('/api/some-endpoint')
        .send(payloadWithHTML)
        .expect(400);

      expect(response.body).toHaveProperty('code', 'CONTENT_VALIDATION_FAILED');
    });

    it('should allow safe input', async () => {
      const safePayload = {
        name: 'John Doe',
        description: 'A safe description'
      };

      // This should not be blocked by security middleware
      const response = await request(app)
        .post('/api/some-endpoint')
        .send(safePayload);

      // Response depends on the endpoint, but shouldn't be 400 for security reasons
      expect([200, 401, 404]).toContain(response.status);
    });
  });
});

describe('Attack Detection Service', () => {
  describe('Request Analysis', () => {
    it('should analyze requests for attacks', async () => {
      const mockReq = {
        ip: '192.168.1.1',
        originalUrl: '/api/auth/login',
        method: 'POST',
        body: {
          email: "test@example.com'; DROP TABLE users; --",
          password: 'password'
        },
        headers: {
          'user-agent': 'Mozilla/5.0'
        }
      };

      const analysis = await attackDetectionService.analyzeRequest(mockReq);

      expect(analysis.isAttack).toBe(true);
      expect(analysis.attackTypes).toContain('sql_injection');
      expect(analysis.riskLevel).toBe('high');
      expect(analysis.ip).toBe('192.168.1.1');
    });

    it('should detect XSS attacks', async () => {
      const mockReq = {
        ip: '192.168.1.1',
        originalUrl: '/api/comments',
        method: 'POST',
        body: {
          comment: '<script>alert("xss")</script>'
        }
      };

      const analysis = await attackDetectionService.analyzeRequest(mockReq);

      expect(analysis.isAttack).toBe(true);
      expect(analysis.attackTypes).toContain('xss');
      expect(analysis.riskLevel).toBe('medium');
    });

    it('should detect path traversal', async () => {
      const mockReq = {
        ip: '192.168.1.1',
        originalUrl: '/api/files',
        method: 'GET',
        query: {
          path: '../../../etc/passwd'
        }
      };

      const analysis = await attackDetectionService.analyzeRequest(mockReq);

      expect(analysis.isAttack).toBe(true);
      expect(analysis.attackTypes).toContain('path_traversal');
      expect(analysis.riskLevel).toBe('medium');
    });

    it('should pass clean requests', async () => {
      const mockReq = {
        ip: '192.168.1.1',
        originalUrl: '/api/auth/login',
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const analysis = await attackDetectionService.analyzeRequest(mockReq);

      expect(analysis.isAttack).toBe(false);
      expect(analysis.attackTypes).toHaveLength(0);
      expect(analysis.riskLevel).toBe('low');
    });
  });

  describe('IP Blacklist', () => {
    it('should detect blacklisted IPs', async () => {
      const blacklistedIP = '10.0.0.1'; // Private network range

      const isBlacklisted = await attackDetectionService.isIPBlacklisted(blacklistedIP);

      expect(isBlacklisted).toBe(true);
    });

    it('should allow legitimate IPs', async () => {
      const legitimateIP = '8.8.8.8'; // Public DNS

      const isBlacklisted = await attackDetectionService.isIPBlacklisted(legitimateIP);

      expect(isBlacklisted).toBe(false);
    });
  });

  describe('Brute Force Detection', () => {
    it('should detect brute force patterns', async () => {
      const identifier = 'test@example.com';

      // Simulate multiple failed attempts
      for (let i = 0; i < 6; i++) {
        await attackDetectionService.detectBruteForce(identifier, {
          ip: '192.168.1.1',
          timestamp: new Date().toISOString()
        });
      }

      const result = await attackDetectionService.detectBruteForce(identifier, {
        ip: '192.168.1.1',
        timestamp: new Date().toISOString()
      });

      expect(result.isBruteForce).toBe(true);
      expect(result.attempts).toBe(7);
      expect(result.blocked).toBe(true);
    });

    it('should not false positive normal usage', async () => {
      const identifier = 'test@example.com';

      // Single attempt should not trigger brute force
      const result = await attackDetectionService.detectBruteForce(identifier, {
        ip: '192.168.1.1',
        timestamp: new Date().toISOString()
      });

      expect(result.isBruteForce).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.blocked).toBe(false);
    });
  });

  describe('Risk Level Calculation', () => {
    it('should calculate correct risk levels', async () => {
      const testCases = [
        { attacks: ['sql_injection'], expected: 'high' },
        { attacks: ['xss'], expected: 'medium' },
        { attacks: ['path_traversal'], expected: 'medium' },
        { attacks: ['brute_force'], expected: 'medium' },
        { attacks: ['sql_injection', 'xss'], expected: 'critical' },
        { attacks: ['suspicious_fields'], expected: 'low' }
      ];

      for (const testCase of testCases) {
        // Access the private method through reflection for testing
        const riskLevel = attackDetectionService.calculateRiskLevel(testCase.attacks);
        expect(riskLevel).toBe(testCase.expected);
      }
    });
  });
});

describe('Security Headers', () => {
  it('should add security headers to responses', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: "test@example.com'; DROP TABLE users; --",
        password: 'password'
      });

    // Should have security analysis headers
    expect(response.headers).toHaveProperty('x-security-analysis');
  });

  it('should include rate limit headers for protected endpoints', async () => {
    const failedPayload = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    // Make multiple attempts to trigger rate limiting
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/login')
        .send(failedPayload);
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send(failedPayload);

    expect(response.headers).toHaveProperty('x-ratelimit-limit');
    expect(response.headers).toHaveProperty('x-ratelimit-remaining');
  });
});
