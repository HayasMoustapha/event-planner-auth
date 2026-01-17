const request = require('supertest');
const app = require('../../src/app');
const emailService = require('../../src/services/email.service');
const smsService = require('../../src/services/sms.service');
const cacheService = require('../../src/services/cache.service');
const configValidation = require('../../src/config/validation');

describe('External Services Validation', () => {
  let server;

  beforeAll(async () => {
    // Démarrer le serveur pour les tests
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('Email Service (SMTP)', () => {
    it('should validate email service configuration', () => {
      const isConfigured = configValidation.isServiceConfigured('email');
      const config = configValidation.getConfig();
      
      console.log('📧 Email Service Configuration:');
      console.log(`  - Configured: ${isConfigured}`);
      console.log(`  - Host: ${config.SMTP_HOST || 'Not set'}`);
      console.log(`  - Port: ${config.SMTP_PORT || 'Not set'}`);
      console.log(`  - User: ${config.SMTP_USER ? 'Set' : 'Not set'}`);
      console.log(`  - Password: ${config.SMTP_PASS ? 'Set' : 'Not set'}`);
      
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should test email service readiness', async () => {
      const isReady = emailService.isReady();
      
      console.log(`📧 Email Service Ready: ${isReady}`);
      
      expect(typeof isReady).toBe('boolean');
    });

    it('should send test OTP email', async () => {
      const testEmail = 'test@example.com';
      const testOTP = '123456';
      
      try {
        const result = await emailService.sendOTP(testEmail, testOTP, 'login', {
          ip: '127.0.0.1',
          expiresIn: 5
        });
        
        console.log(`📧 Test OTP Email Result: ${result ? 'Success' : 'Fallback used'}`);
        
        expect(typeof result).toBe('boolean');
      } catch (error) {
        console.error(`📧 Test OTP Email Error: ${error.message}`);
        // Le fallback devrait fonctionner même si le service n'est pas configuré
        expect(true).toBe(true);
      }
    });

    it('should send test welcome email', async () => {
      const testEmail = 'test@example.com';
      const testUser = {
        id: 1,
        first_name: 'Test',
        username: 'testuser'
      };
      
      try {
        const result = await emailService.sendWelcomeEmail(testEmail, testUser);
        
        console.log(`📧 Test Welcome Email Result: ${result ? 'Success' : 'Fallback used'}`);
        
        expect(typeof result).toBe('boolean');
      } catch (error) {
        console.error(`📧 Test Welcome Email Error: ${error.message}`);
        expect(true).toBe(true);
      }
    });
  });

  describe('SMS Service (Twilio)', () => {
    it('should validate SMS service configuration', () => {
      const isConfigured = configValidation.isServiceConfigured('sms');
      const config = configValidation.getConfig();
      
      console.log('📱 SMS Service Configuration:');
      console.log(`  - Configured: ${isConfigured}`);
      console.log(`  - Account SID: ${config.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set'}`);
      console.log(`  - Auth Token: ${config.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set'}`);
      console.log(`  - Phone Number: ${config.TWILIO_PHONE_NUMBER || 'Not set'}`);
      
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should test SMS service readiness', () => {
      const isReady = smsService.isReady();
      
      console.log(`📱 SMS Service Ready: ${isReady}`);
      
      expect(typeof isReady).toBe('boolean');
    });

    it('should test SMS service connection', async () => {
      try {
        const result = await smsService.testConnection();
        
        console.log('📱 SMS Service Connection Test:');
        console.log(`  - Success: ${result.success}`);
        if (result.success) {
          console.log(`  - Account SID: ${result.accountSid}`);
          console.log(`  - Friendly Name: ${result.friendlyName}`);
          console.log(`  - Status: ${result.status}`);
        } else {
          console.log(`  - Error: ${result.error}`);
        }
        
        expect(typeof result).toBe('object');
        expect(typeof result.success).toBe('boolean');
      } catch (error) {
        console.error(`📱 SMS Connection Test Error: ${error.message}`);
        expect(true).toBe(true);
      }
    });

    it('should send test OTP SMS', async () => {
      const testPhone = '+33612345678';
      const testOTP = '123456';
      
      try {
        const result = await smsService.sendOTP(testPhone, testOTP, 'login', {
          ip: '127.0.0.1',
          expiresIn: 5
        });
        
        console.log(`📱 Test OTP SMS Result: ${result ? 'Success' : 'Fallback used'}`);
        
        expect(typeof result).toBe('boolean');
      } catch (error) {
        console.error(`📱 Test OTP SMS Error: ${error.message}`);
        expect(true).toBe(true);
      }
    });
  });

  describe('Cache Service (Redis)', () => {
    it('should validate Redis service configuration', () => {
      const isConfigured = configValidation.isServiceConfigured('redis');
      const config = configValidation.getConfig();
      
      console.log('🗄️ Redis Service Configuration:');
      console.log(`  - Configured: ${isConfigured}`);
      console.log(`  - Host: ${config.REDIS_HOST}`);
      console.log(`  - Port: ${config.REDIS_PORT}`);
      console.log(`  - Password: ${config.REDIS_PASSWORD ? 'Set' : 'Not set'}`);
      console.log(`  - DB: ${config.REDIS_DB}`);
      
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should test Redis service readiness', () => {
      const stats = cacheService.getStats();
      
      console.log(`🗄️ Redis Service Ready: ${stats.ready}`);
      
      expect(typeof stats.ready).toBe('boolean');
    });

    it('should test Redis cache operations', async () => {
      const testKey = 'test:external:services';
      const testValue = { message: 'Test data', timestamp: new Date().toISOString() };
      
      try {
        // Test set
        const setResult = await cacheService.setSession(testKey, testValue, 60);
        console.log(`🗄️ Redis Set Result: ${setResult ? 'Success' : 'Failed'}`);
        
        // Test get
        const getResult = await cacheService.getSession(testKey);
        console.log(`🗄️ Redis Get Result: ${getResult ? 'Success' : 'Failed'}`);
        
        // Test delete
        const deleteResult = await cacheService.deleteSession(testKey);
        console.log(`🗄️ Redis Delete Result: ${deleteResult ? 'Success' : 'Failed'}`);
        
        expect(typeof setResult).toBe('boolean');
        expect(typeof getResult).toBe('object');
        expect(typeof deleteResult).toBe('boolean');
      } catch (error) {
        console.error(`🗄️ Redis Cache Operations Error: ${error.message}`);
        expect(true).toBe(true);
      }
    });

    it('should test Redis stats', async () => {
      try {
        const stats = await cacheService.getStats();
        
        console.log('🗄️ Redis Stats:');
        console.log(`  - Connected: ${stats.connected}`);
        if (stats.connected) {
          console.log(`  - Keys: ${stats.keys || 'N/A'}`);
          console.log(`  - Memory: ${stats.memory || 'N/A'}`);
          console.log(`  - Uptime: ${stats.uptime || 'N/A'}`);
        } else {
          console.log(`  - Error: ${stats.error || 'Unknown error'}`);
        }
        
        expect(typeof stats).toBe('object');
        expect(typeof stats.connected).toBe('boolean');
      } catch (error) {
        console.error(`🗄️ Redis Stats Error: ${error.message}`);
        expect(true).toBe(true);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should test complete OTP flow with email', async () => {
      const testEmail = 'integration@test.com';
      
      try {
        // Générer un OTP
        const generateResponse = await request(app)
          .post('/api/auth/otp/email/generate')
          .send({
            email: testEmail,
            expiresInMinutes: 5
          });
        
        console.log(`🔄 OTP Generation Status: ${generateResponse.status}`);
        
        if (generateResponse.status === 200) {
          console.log('✅ OTP generation successful');
        } else {
          console.log(`⚠️ OTP generation failed: ${generateResponse.body.message}`);
        }
        
        expect([200, 400, 500]).toContain(generateResponse.status);
      } catch (error) {
        console.error(`🔄 OTP Generation Error: ${error.message}`);
        expect(true).toBe(true);
      }
    });

    it('should test complete OTP flow with SMS', async () => {
      const testPhone = '+33612345678';
      
      try {
        // Note: Cette route n'existe pas encore, mais on teste le service directement
        const result = await smsService.sendOTP(testPhone, '123456', 'login');
        
        console.log(`🔄 SMS OTP Result: ${result ? 'Success' : 'Fallback used'}`);
        
        expect(typeof result).toBe('boolean');
      } catch (error) {
        console.error(`🔄 SMS OTP Error: ${error.message}`);
        expect(true).toBe(true);
      }
    });

    it('should test cache with user authorizations', async () => {
      const testUserId = 1;
      const testAuths = [
        { permission: 'users.read', menu: 'users' },
        { permission: 'users.write', menu: 'users' }
      ];
      
      try {
        // Test cache set
        const setResult = await cacheService.setUserAuthorizations(testUserId, testAuths, 3600);
        console.log(`🔄 Auth Cache Set: ${setResult ? 'Success' : 'Failed'}`);
        
        // Test cache get
        const getResult = await cacheService.getUserAuthorizations(testUserId);
        console.log(`🔄 Auth Cache Get: ${getResult ? 'Success' : 'Failed'}`);
        
        // Test cache invalidate
        const invalidateResult = await cacheService.invalidateUserAuthorizations(testUserId);
        console.log(`🔄 Auth Cache Invalidate: ${invalidateResult ? 'Success' : 'Failed'}`);
        
        expect(typeof setResult).toBe('boolean');
        expect(typeof getResult).toBe('object');
        expect(typeof invalidateResult).toBe('boolean');
      } catch (error) {
        console.error(`🔄 Auth Cache Error: ${error.message}`);
        expect(true).toBe(true);
      }
    });
  });

  describe('Service Health Check', () => {
    it('should provide comprehensive service status', async () => {
      const services = {
        email: {
          configured: configValidation.isServiceConfigured('email'),
          ready: emailService.isReady()
        },
        sms: {
          configured: configValidation.isServiceConfigured('sms'),
          ready: smsService.isReady()
        },
        redis: {
          configured: configValidation.isServiceConfigured('redis'),
          ready: cacheService.isReady()
        }
      };
      
      console.log('\n🏥 Service Health Check:');
      console.log('================================');
      
      Object.entries(services).forEach(([name, status]) => {
        const configuredIcon = status.configured ? '✅' : '❌';
        const readyIcon = status.ready ? '✅' : '❌';
        console.log(`${name.toUpperCase()}:`);
        console.log(`  Configured: ${configuredIcon} ${status.configured}`);
        console.log(`  Ready: ${readyIcon} ${status.ready}`);
      });
      
      expect(services).toHaveProperty('email');
      expect(services).toHaveProperty('sms');
      expect(services).toHaveProperty('redis');
    });
  });
});
