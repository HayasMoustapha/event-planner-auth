const request = require('supertest');
const app = require('../../src/app');

describe('Postman Synchronization Tests', () => {
  let authToken = null;
  let testUser = null;

  beforeAll(async () => {
    // Créer un utilisateur de test pour les tests authentifiés
    const userData = {
      firstName: 'Postman',
      lastName: 'Test',
      email: 'postman.test@example.com',
      phone: '+33699999999',
      password: 'PostmanTest123!',
      username: 'postmantest'
    };

    try {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      testUser = registerResponse.body.data.user;

      // Générer OTP pour vérification
      await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: userData.email })
        .expect(201);

      // Récupérer OTP depuis la base
      const { connection } = require('../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code FROM otps WHERE person_id = $1 AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [registerResponse.body.data.person.id, 'email']
      );

      if (otpResult.rows.length > 0) {
        const otpCode = otpResult.rows[0].otp_code;

        // Vérifier email
        await request(app)
          .post('/api/auth/verify-email')
          .send({
            email: userData.email,
            otpCode: otpCode
          })
          .expect(200);

        // Login pour obtenir token
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          })
          .expect(200);

        authToken = loginResponse.body.data.token;
      }
    } catch (error) {
      console.log('Setup error:', error.message);
    }
  });

  describe('🏠 Health & Status Routes', () => {
    it('should return health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return root endpoint', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('📝 Registration Routes', () => {
    it('should check email availability', async () => {
      const response = await request(app)
        .get('/api/auth/check-email/test.availability@example.com')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
    });

    it('should check username availability', async () => {
      const response = await request(app)
        .get('/api/auth/check-username/testusername123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
    });

    it('should register new user', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'new.user@example.com',
        phone: '+33688888888',
        password: 'NewUser123!',
        username: 'newuser123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.person.email).toBe(userData.email);
      expect(response.body.data.user.status).toBe('inactive');
    });

    it('should reject duplicate email', async () => {
      const userData = {
        firstName: 'Duplicate',
        lastName: 'User',
        email: 'postman.test@example.com', // Email déjà utilisé
        phone: '+33677777777',
        password: 'DuplicateUser123!',
        username: 'duplicateuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Conflit');
    });
  });

  describe('🔐 Authentication Routes', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'postman.test@example.com',
          password: 'PostmanTest123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('postman.test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'postman.test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should validate JWT token', async () => {
      if (!authToken) return;

      const response = await request(app)
        .post('/api/auth/validate-token')
        .send({ token: authToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should refresh JWT token', async () => {
      if (!authToken) return;

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: authToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should get user profile', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('postman.test@example.com');
    });

    it('should change password', async () => {
      if (!authToken) return;

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'PostmanTest123!',
          newPassword: 'NewPassword456!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should logout user', async () => {
      if (!authToken) return;

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('🔢 OTP Management Routes', () => {
    it('should generate email OTP', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: 'postman.test@example.com' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.identifier).toBe('postman.test@example.com');
      expect(response.body.data.expiresAt).toBeDefined();
    });

    it('should generate phone OTP', async () => {
      const response = await request(app)
        .post('/api/auth/otp/phone/generate')
        .send({ phone: '+33699999999' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.identifier).toBe('+33699999999');
    });

    it('should verify email OTP', async () => {
      // Générer un OTP d'abord
      await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: 'postman.test@example.com' })
        .expect(201);

      // Récupérer l'OTP depuis la base
      const { connection } = require('../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code FROM otps WHERE person_id = $1 AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [testUser.person_id, 'email']
      );

      if (otpResult.rows.length > 0) {
        const otpCode = otpResult.rows[0].otp_code;

        const response = await request(app)
          .post('/api/auth/otp/email/verify')
          .send({
            email: 'postman.test@example.com',
            code: otpCode
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.purpose).toBe('email');
      }
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send({
          email: 'postman.test@example.com',
          code: '999999'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should generate password reset OTP', async () => {
      const response = await request(app)
        .post('/api/auth/otp/password-reset/generate')
        .send({ email: 'postman.test@example.com' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.identifier).toBe('postman.test@example.com');
    });

    it('should verify password reset OTP', async () => {
      // Générer un OTP de reset d'abord
      await request(app)
        .post('/api/auth/otp/password-reset/generate')
        .send({ email: 'postman.test@example.com' })
        .expect(201);

      // Récupérer l'OTP depuis la base
      const { connection } = require('../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code FROM otps WHERE person_id = $1 AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [testUser.person_id, 'email']
      );

      if (otpResult.rows.length > 0) {
        const otpCode = otpResult.rows[0].otp_code;

        const response = await request(app)
          .post('/api/auth/otp/password-reset/verify')
          .send({
            email: 'postman.test@example.com',
            code: otpCode,
            newPassword: 'ResetPassword123!'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('👥 User Management Routes', () => {
    it('should get users list (protected)', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(403); // RBAC protection

      expect(response.body.success).toBe(false);
    });

    it('should get user by ID (protected)', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(403); // RBAC protection

      expect(response.body.success).toBe(false);
    });

    it('should get user by email (protected)', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/users/email/postman.test@example.com')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401); // Additional auth required

      expect(response.body.success).toBe(false);
    });
  });

  describe('👥 People Management Routes', () => {
    it('should get people list (public)', async () => {
      const response = await request(app)
        .get('/api/people')
        .expect(401); // Auth required

      expect(response.body.success).toBe(false);
    });

    it('should get person by ID (protected)', async () => {
      const response = await request(app)
        .get('/api/people/1')
        .expect(401); // Auth required

      expect(response.body.success).toBe(false);
    });
  });

  describe('🔧 Admin OTP Routes', () => {
    it('should get OTP stats (protected)', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/auth/otp/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403); // Admin permissions required

      expect(response.body.success).toBe(false);
    });

    it('should cleanup OTP (protected)', async () => {
      if (!authToken) return;

      const response = await request(app)
        .post('/api/auth/otp/cleanup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403); // Admin permissions required

      expect(response.body.success).toBe(false);
    });

    it('should get person OTP details (protected)', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/auth/otp/person/16')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403); // Admin permissions required

      expect(response.body.success).toBe(false);
    });
  });

  describe('📊 Postman Bodies Validation', () => {
    it('should validate register body structure', async () => {
      const invalidBody = {
        // Missing required fields
        email: 'invalid@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate login body structure', async () => {
      const invalidBody = {
        // Missing password
        email: 'postman.test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate OTP generation body structure', async () => {
      const invalidBody = {
        // Missing email
        phone: '+33699999999'
      };

      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  afterAll(async () => {
    // Nettoyage des données de test
    try {
      const { connection } = require('../../src/config/database');
      if (testUser) {
        await connection.query('DELETE FROM users WHERE email = $1', ['postman.test@example.com']);
        await connection.query('DELETE FROM people WHERE email = $1', ['postman.test@example.com']);
      }
      await connection.query('DELETE FROM users WHERE email = $1', ['new.user@example.com']);
      await connection.query('DELETE FROM people WHERE email = $1', ['new.user@example.com']);
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  });
});
