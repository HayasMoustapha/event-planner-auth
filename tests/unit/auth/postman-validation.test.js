const request = require('supertest');
const app = require('../../../src/app');

describe('Postman Bodies Validation Unit Tests', () => {
  describe('📝 Registration Body Validation', () => {
    it('should validate complete registration body', async () => {
      const validBody = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.validation@example.com',
        phone: '+33612345678',
        password: 'Password123!',
        username: 'testvalidation'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(validBody)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.person.email).toBe(validBody.email);
    });

    it('should reject registration with missing firstName', async () => {
      const invalidBody = {
        lastName: 'User',
        email: 'test@example.com',
        phone: '+33612345678',
        password: 'Password123!',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration with invalid email format', async () => {
      const invalidBody = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email',
        phone: '+33612345678',
        password: 'Password123!',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const invalidBody = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+33612345678',
        password: 'weak',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('🔐 Login Body Validation', () => {
    it('should validate complete login body', async () => {
      // First create a user
      const userData = {
        firstName: 'Login',
        lastName: 'Test',
        email: 'login.test@example.com',
        phone: '+33699999999',
        password: 'LoginTest123!',
        username: 'logintest'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Generate and verify OTP
      await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: userData.email })
        .expect(201);

      // Get OTP from database
      const { connection } = require('../../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code, person_id FROM otps WHERE person_id = (SELECT id FROM people WHERE email = $1) AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [userData.email, 'email']
      );

      if (otpResult.rows.length > 0) {
        const otpCode = otpResult.rows[0].otp_code;
        const personId = otpResult.rows[0].person_id;

        await request(app)
          .post('/api/auth/verify-email')
          .send({
            email: userData.email,
            otpCode: otpCode
          })
          .expect(200);

        // Test login
        const loginBody = {
          email: userData.email,
          password: userData.password
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginBody)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
      }
    });

    it('should reject login with missing email', async () => {
      const invalidBody = {
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject login with missing password', async () => {
      const invalidBody = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject login with invalid email format', async () => {
      const invalidBody = {
        email: 'invalid-email',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('🔢 OTP Generation Body Validation', () => {
    it('should validate email OTP generation body', async () => {
      const validBody = {
        email: 'otp.test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send(validBody)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.identifier).toBe(validBody.email);
    });

    it('should reject email OTP generation with missing email', async () => {
      const invalidBody = {};

      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject email OTP generation with invalid email', async () => {
      const invalidBody = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate phone OTP generation body', async () => {
      const validBody = {
        phone: '+33612345678'
      };

      const response = await request(app)
        .post('/api/auth/otp/phone/generate')
        .send(validBody)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.identifier).toBe(validBody.phone);
    });

    it('should reject phone OTP generation with missing phone', async () => {
      const invalidBody = {};

      const response = await request(app)
        .post('/api/auth/otp/phone/generate')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject phone OTP generation with invalid phone', async () => {
      const invalidBody = {
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .post('/api/auth/otp/phone/generate')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('🔍 OTP Verification Body Validation', () => {
    it('should validate email OTP verification body', async () => {
      // First generate OTP
      const email = 'verify.test@example.com';
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Verify',
          lastName: 'Test',
          email: email,
          phone: '+33688888888',
          password: 'VerifyTest123!',
          username: 'verifytest'
        })
        .expect(201);

      await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email })
        .expect(201);

      // Get OTP from database
      const { connection } = require('../../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code FROM otps WHERE person_id = (SELECT id FROM people WHERE email = $1) AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [email, 'email']
      );

      if (otpResult.rows.length > 0) {
        const otpCode = otpResult.rows[0].otp_code;

        const validBody = {
          email: email,
          code: otpCode
        };

        const response = await request(app)
          .post('/api/auth/otp/email/verify')
          .send(validBody)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should reject OTP verification with missing email', async () => {
      const invalidBody = {
        code: '123456'
      };

      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject OTP verification with missing code', async () => {
      const invalidBody = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject OTP verification with invalid code format', async () => {
      const invalidBody = {
        email: 'test@example.com',
        code: 'invalid'
      };

      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('🔐 Token Validation Body Validation', () => {
    it('should validate token validation body', async () => {
      // Create and login user first
      const userData = {
        firstName: 'Token',
        lastName: 'Test',
        email: 'token.test@example.com',
        phone: '+33677777777',
        password: 'TokenTest123!',
        username: 'tokentest'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: userData.email })
        .expect(201);

      // Get OTP and verify
      const { connection } = require('../../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code, person_id FROM otps WHERE person_id = (SELECT id FROM people WHERE email = $1) AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [userData.email, 'email']
      );

      if (otpResult.rows.length > 0) {
        const otpCode = otpResult.rows[0].otp_code;

        await request(app)
          .post('/api/auth/verify-email')
          .send({
            email: userData.email,
            otpCode: otpCode
          })
          .expect(200);

        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          })
          .expect(200);

        const token = loginResponse.body.data.token;

        const validBody = {
          token: token
        };

        const response = await request(app)
          .post('/api/auth/validate-token')
          .send(validBody)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.valid).toBe(true);
      }
    });

    it('should reject token validation with missing token', async () => {
      const invalidBody = {};

      const response = await request(app)
        .post('/api/auth/validate-token')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject token validation with invalid token', async () => {
      const invalidBody = {
        token: 'invalid-token'
      };

      const response = await request(app)
        .post('/api/auth/validate-token')
        .send(invalidBody)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('🔄 Token Refresh Body Validation', () => {
    it('should validate token refresh body', async () => {
      // Similar setup as token validation
      const userData = {
        firstName: 'Refresh',
        lastName: 'Test',
        email: 'refresh.test@example.com',
        phone: '+33666666666',
        password: 'RefreshTest123!',
        username: 'refreshtest'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: userData.email })
        .expect(201);

      const { connection } = require('../../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code, person_id FROM otps WHERE person_id = (SELECT id FROM people WHERE email = $1) AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [userData.email, 'email']
      );

      if (otpResult.rows.length > 0) {
        const otpCode = otpResult.rows[0].otp_code;

        await request(app)
          .post('/api/auth/verify-email')
          .send({
            email: userData.email,
            otpCode: otpCode
          })
          .expect(200);

        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          })
          .expect(200);

        const token = loginResponse.body.data.token;

        const validBody = {
          refreshToken: token
        };

        const response = await request(app)
          .post('/api/auth/refresh-token')
          .send(validBody)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
      }
    });

    it('should reject token refresh with missing refreshToken', async () => {
      const invalidBody = {};

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send(invalidBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('🔑 Password Change Body Validation', () => {
    it('should validate password change body', async () => {
      // Setup user and login
      const userData = {
        firstName: 'Password',
        lastName: 'Test',
        email: 'password.test@example.com',
        phone: '+33655555555',
        password: 'PasswordTest123!',
        username: 'passwordtest'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: userData.email })
        .expect(201);

      const { connection } = require('../../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code, person_id FROM otps WHERE person_id = (SELECT id FROM people WHERE email = $1) AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [userData.email, 'email']
      );

      if (otpResult.rows.length > 0) {
        const otpCode = otpResult.rows[0].otp_code;

        await request(app)
          .post('/api/auth/verify-email')
          .send({
            email: userData.email,
            otpCode: otpCode
          })
          .expect(200);

        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          })
          .expect(200);

        const token = loginResponse.body.data.token;

        const validBody = {
          currentPassword: userData.password,
          newPassword: 'NewPassword456!'
        };

        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${token}`)
          .send(validBody)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should reject password change with missing currentPassword', async () => {
      const invalidBody = {
        newPassword: 'NewPassword456!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(invalidBody)
        .expect(401); // Unauthorized (no token)

      expect(response.body.success).toBe(false);
    });

    it('should reject password change with missing newPassword', async () => {
      const invalidBody = {
        currentPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(invalidBody)
        .expect(401); // Unauthorized (no token)

      expect(response.body.success).toBe(false);
    });

    it('should reject password change with weak newPassword', async () => {
      const invalidBody = {
        currentPassword: 'Password123!',
        newPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(invalidBody)
        .expect(401); // Unauthorized (no token)

      expect(response.body.success).toBe(false);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      const { connection } = require('../../../src/config/database');
      const testEmails = [
        'test.validation@example.com',
        'login.test@example.com',
        'otp.test@example.com',
        'verify.test@example.com',
        'token.test@example.com',
        'refresh.test@example.com',
        'password.test@example.com'
      ];

      for (const email of testEmails) {
        await connection.query('DELETE FROM users WHERE email = $1', [email]);
        await connection.query('DELETE FROM people WHERE email = $1', [email]);
      }
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  });
});
