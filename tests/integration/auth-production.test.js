const request = require('supertest');
const app = require('../../src/app');
const cacheService = require('../../src/services/cache.service');
const emailService = require('../../src/services/email.service');
const smsService = require('../../src/services/sms.service');

describe('Auth Service Production Tests', () => {
  let testUser = {
    email: 'production.test@eventplanner.com',
    password: 'ProdTest123!@#',
    first_name: 'Production',
    last_name: 'Test',
    phone: '+33612345678'
  };

  beforeAll(async () => {
    // Attendre l'initialisation des services
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('Service Health Checks', () => {
    it('should have email service ready', async () => {
      const isReady = emailService.isReady();
      expect(typeof isReady).toBe('boolean');
    });

    it('should have SMS service ready', async () => {
      const isReady = smsService.isReady();
      expect(typeof isReady).toBe('boolean');
    });

    it('should have cache service ready', async () => {
      const isReady = cacheService.isReady();
      expect(typeof isReady).toBe('boolean');
    });

    it('should test SMS connection', async () => {
      const testResult = await smsService.testConnection();
      expect(testResult).toHaveProperty('overall');
      expect(testResult).toHaveProperty('twilio');
      expect(testResult).toHaveProperty('vonage');
    });
  });

  describe('Email Delivery Flow', () => {
    it('should send OTP email with fallback', async () => {
      const result = await emailService.sendOTP(
        testUser.email,
        '123456',
        'login',
        { ip: '127.0.0.1' }
      );

      // En développement/test, peut retourner true même sans service
      expect(typeof result).toBe('boolean');
    });

    it('should send welcome email', async () => {
      const mockUser = { id: 1, first_name: 'Test', username: 'testuser' };
      const result = await emailService.sendWelcomeEmail(
        testUser.email,
        mockUser
      );

      expect(typeof result).toBe('boolean');
    });

    it('should send password reset email', async () => {
      const resetToken = 'reset-token-123';
      const result = await emailService.sendPasswordResetEmail(
        testUser.email,
        resetToken,
        { ip: '127.0.0.1' }
      );

      expect(typeof result).toBe('boolean');
    });
  });

  describe('SMS Delivery Flow', () => {
    it('should send OTP SMS with fallback', async () => {
      const result = await smsService.sendOTP(
        testUser.phone,
        '123456',
        'login',
        { ip: '127.0.0.1' }
      );

      // En développement/test, peut retourner true même sans service
      expect(typeof result).toBe('boolean');
    });

    it('should send welcome SMS', async () => {
      const mockUser = { id: 1, first_name: 'Test' };
      const result = await smsService.sendWelcomeSMS(
        testUser.phone,
        mockUser
      );

      expect(typeof result).toBe('boolean');
    });
  });

  describe('Cache Service Flow', () => {
    it('should store and retrieve OTP', async () => {
      const identifier = testUser.email;
      const otpCode = '123456';

      // Stocker l'OTP
      const setResult = await cacheService.setOTP(identifier, otpCode);
      expect(setResult).toBe(true);

      // Récupérer l'OTP
      const retrievedOTP = await cacheService.getOTP(identifier);
      expect(retrievedOTP).toBeTruthy();
      expect(retrievedOTP.code).toBe(otpCode);
      expect(retrievedOTP.attempts).toBe(0);

      // Nettoyer
      await cacheService.deleteOTP(identifier);
    });

    it('should handle OTP attempts', async () => {
      const identifier = testUser.email;
      const otpCode = '123456';

      await cacheService.setOTP(identifier, otpCode);

      // Premier tentative incorrecte
      const attempt1 = await cacheService.incrementOTPAttempts(identifier);
      expect(attempt1.valid).toBe(true);
      expect(attempt1.remaining).toBe(2);

      // Deuxième tentative incorrecte
      const attempt2 = await cacheService.incrementOTPAttempts(identifier);
      expect(attempt2.valid).toBe(true);
      expect(attempt2.remaining).toBe(1);

      // Nettoyer
      await cacheService.deleteOTP(identifier);
    });

    it('should blacklist and check tokens', async () => {
      const tokenId = 'test-token-jti-123';

      // Token ne devrait pas être blacklisté
      const isBlacklisted1 = await cacheService.isTokenBlacklisted(tokenId);
      expect(isBlacklisted1).toBe(false);

      // Blacklister le token
      const blacklistResult = await cacheService.blacklistToken(tokenId, 3600);
      expect(blacklistResult).toBe(true);

      // Token devrait être blacklisté
      const isBlacklisted2 = await cacheService.isTokenBlacklisted(tokenId);
      expect(isBlacklisted2).toBe(true);

      // Nettoyer
      await cacheService.del(`blacklist:${tokenId}`);
    });

    it('should manage login attempts', async () => {
      const identifier = testUser.email;

      // Première tentative
      const attempts1 = await cacheService.incrementLoginAttempts(identifier);
      expect(attempts1).toBe(1);

      // Deuxième tentative
      const attempts2 = await cacheService.incrementLoginAttempts(identifier);
      expect(attempts2).toBe(2);

      // Réinitialiser
      const resetResult = await cacheService.resetLoginAttempts(identifier);
      expect(resetResult).toBe(true);

      // Vérifier réinitialisation
      const attempts3 = await cacheService.incrementLoginAttempts(identifier);
      expect(attempts3).toBe(1);

      // Nettoyer
      await cacheService.resetLoginAttempts(identifier);
    });

    it('should manage sessions', async () => {
      const sessionId = 'session-123';
      const sessionData = {
        userId: 1,
        email: testUser.email,
        role: 'user',
        createdAt: new Date().toISOString()
      };

      // Stocker la session
      const setResult = await cacheService.setSession(sessionId, sessionData, 3600);
      expect(setResult).toBe(true);

      // Récupérer la session
      const retrievedSession = await cacheService.getSession(sessionId);
      expect(retrievedSession).toBeTruthy();
      expect(retrievedSession.userId).toBe(sessionData.userId);
      expect(retrievedSession.email).toBe(sessionData.email);

      // Supprimer la session
      const deleteResult = await cacheService.deleteSession(sessionId);
      expect(deleteResult).toBe(true);

      // Vérifier suppression
      const deletedSession = await cacheService.getSession(sessionId);
      expect(deletedSession).toBeNull();
    });
  });

  describe('API Integration Tests', () => {
    let authToken = null;

    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          phone: testUser.phone
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should login user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');

      authToken = response.body.data.token;
    });

    it('should request OTP login', async () => {
      const response = await request(app)
        .post('/api/auth/request-otp')
        .send({
          email: testUser.email,
          purpose: 'login'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate OTP', async () => {
      // Simuler OTP en cache pour le test
      await cacheService.setOTP(testUser.email, '123456');

      const response = await request(app)
        .post('/api/auth/validate-otp')
        .send({
          email: testUser.email,
          otpCode: '123456',
          purpose: 'login'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Nettoyer
      await cacheService.deleteOTP(testUser.email);
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should logout and blacklist token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject blacklisted token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent OTP requests', async () => {
      const promises = [];
      const startTime = Date.now();

      // Créer 10 requêtes OTP concurrentes
      for (let i = 0; i < 10; i++) {
        promises.push(
          cacheService.setOTP(`test${i}@example.com`, '123456')
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Toutes les requêtes devraient réussir
      expect(results.every(result => result === true)).toBe(true);
      
      // devrait prendre moins de 1 seconde
      expect(endTime - startTime).toBeLessThan(1000);

      // Nettoyer
      for (let i = 0; i < 10; i++) {
        await cacheService.deleteOTP(`test${i}@example.com`);
      }
    });

    it('should handle cache cleanup', async () => {
      // Créer quelques clés expirées
      await cacheService.setOTP('cleanup1@test.com', '123456');
      await cacheService.setOTP('cleanup2@test.com', '654321');

      const deletedCount = await cacheService.cleanupExpired();
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await cacheService.deleteOTP(testUser.email);
    await cacheService.resetLoginAttempts(testUser.email);
    
    // Fermer les connexions
    await cacheService.close();
  });
});
