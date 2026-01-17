const request = require('supertest');
const app = require('../../src/app');

describe('Auth Controller Unit Tests', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'Admin123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Connexion réussie');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('admin@eventplanner.com');
      expect(response.body.data.user.status).toBe('active');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Erreur de validation');
    });

    it('should reject login with invalid password format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Erreur de validation');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Inscription réussie');
      expect(response.body.data).toHaveProperty('person');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('otp');
      expect(response.body.data.person.email).toBe(newUser.email);
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.status).toBe('inactive');
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'invalid-email',
          password: 'TestPassword123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Erreur de validation');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Erreur de validation');
    });

    it('should reject registration with missing first name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: 'TestPassword123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Erreur de validation');
    });

    it('should reject registration with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Duplicate',
          email: 'admin@eventplanner.com',
          password: 'TestPassword123'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid OTP', async () => {
      // First register a new user to get an OTP
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob.wilson@example.com',
          password: 'TestPassword123'
        });

      // Get the OTP from database (in real test, you'd mock this)
      const otpCode = '123456'; // This would come from the service

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'bob.wilson@example.com',
          otpCode: otpCode
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Email vérifié avec succès');
      expect(response.body.data.user.status).toBe('active');
    });

    it('should reject verification with invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'admin@eventplanner.com',
          otpCode: '999999'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject verification with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          otpCode: '123456'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Erreur de validation');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'Admin123'
        });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: loginResponse.body.data.token
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Token rafraîchi avec succès');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Token de rafraîchissement requis');
    });
  });

  describe('POST /api/auth/validate-token', () => {
    it('should validate token successfully', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'Admin123'
        });

      const response = await request(app)
        .post('/api/auth/validate-token')
        .send({
          token: loginResponse.body.data.token
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Validation du token');
      expect(response.body.data).toHaveProperty('valid');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/validate-token')
        .send({
          token: 'invalid.token.here'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Protected Routes', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'Admin123'
        });
      authToken = loginResponse.body.data.token;
    });

    describe('POST /api/auth/logout', () => {
      it('should logout successfully with valid token', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
      });

      it('should reject logout without token', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('GET /api/auth/profile', () => {
      it('should get user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Profil utilisateur récupéré');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('email', 'admin@eventplanner.com');
        expect(response.body.data).not.toHaveProperty('password');
      });

      it('should reject profile request without token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('POST /api/auth/change-password', () => {
      it('should change password successfully', async () => {
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: 'Admin123',
            newPassword: 'NewTestPassword123'
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
      });

      it('should reject password change with wrong current password', async () => {
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: 'WrongPassword123',
            newPassword: 'NewTestPassword123'
          })
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      });

      it('should reject password change with same password', async () => {
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: 'Admin123',
            newPassword: 'Admin123'
          })
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      });
    });
  });

  describe('OTP Routes', () => {
    describe('POST /api/auth/otp/email/generate', () => {
      it('should generate email OTP successfully', async () => {
        const response = await request(app)
          .post('/api/auth/otp/email/generate')
          .send({
            email: 'admin@eventplanner.com',
            expiresInMinutes: 15
          })
          .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'OTP généré avec succès');
        expect(response.body.data).toHaveProperty('identifier', 'admin@eventplanner.com');
        expect(response.body.data).toHaveProperty('expiresAt');
      });

      it('should reject OTP generation without email', async () => {
        const response = await request(app)
          .post('/api/auth/otp/email/generate')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message', 'Erreur de validation');
      });
    });

    describe('POST /api/auth/otp/email/verify', () => {
      it('should verify email OTP successfully', async () => {
        // First generate an OTP
        await request(app)
          .post('/api/auth/otp/email/generate')
          .send({
            email: 'admin@eventplanner.com'
          });

        // Verify with valid OTP (in real test, you'd get the actual OTP)
        const response = await request(app)
          .post('/api/auth/otp/email/verify')
          .send({
            email: 'admin@eventplanner.com',
            code: '123456'
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'OTP vérifié avec succès');
      });

      it('should reject OTP verification with invalid code', async () => {
        const response = await request(app)
          .post('/api/auth/otp/email/verify')
          .send({
            email: 'admin@eventplanner.com',
            code: '999999'
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('POST /api/auth/otp/password-reset/generate', () => {
      it('should generate password reset OTP', async () => {
        const response = await request(app)
          .post('/api/auth/otp/password-reset/generate')
          .send({
            email: 'admin@eventplanner.com'
          })
          .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'OTP de réinitialisation généré avec succès');
        expect(response.body.data).toHaveProperty('identifier', 'admin@eventplanner.com');
      });
    });

    describe('POST /api/auth/otp/password-reset/verify', () => {
      it('should reset password with valid OTP', async () => {
        // First generate reset OTP
        await request(app)
          .post('/api/auth/otp/password-reset/generate')
          .send({
            email: 'admin@eventplanner.com'
          });

        const response = await request(app)
          .post('/api/auth/otp/password-reset/verify')
          .send({
            email: 'admin@eventplanner.com',
            code: '123456',
            newPassword: 'ResetPassword123'
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Mot de passe réinitialisé avec succès');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('otpVerified');
      });
    });
  });

  describe('Availability Check Routes', () => {
    describe('GET /api/auth/check-email/:email', () => {
      it('should return false for existing email', async () => {
        const response = await request(app)
          .get('/api/auth/check-email/admin@eventplanner.com')
          .expect(200);

        expect(response.body.data).toHaveProperty('available', true);
      });

      it('should return true for non-existing email', async () => {
        const response = await request(app)
          .get('/api/auth/check-email/nonexistent@example.com')
          .expect(200);

        expect(response.body.data).toHaveProperty('available', true);
      });
    });

    describe('GET /api/auth/check-username/:username', () => {
      it('should return false for existing username', async () => {
        const response = await request(app)
          .get('/api/auth/check-username/admin')
          .expect(200);

        expect(response.body.data).toHaveProperty('available', true);
      });

      it('should return true for non-existing username', async () => {
        const response = await request(app)
          .get('/api/auth/check-username/newuser123')
          .expect(200);

        expect(response.body.data).toHaveProperty('available', true);
      });
    });
  });
});
