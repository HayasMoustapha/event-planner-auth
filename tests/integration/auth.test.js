// De-quarantined: this suite runs against an ISOLATED, freshly-seeded auth test DB
// (see tests/setup/db-provision.js + jest globalSetup). It no longer hard-codes '123456':
// OTP codes are read from the API response (`debug.otpCode`, exposed when NODE_ENV!=='production').
// Assertions are aligned to the REAL API response shape / status codes (source of truth = src/).
const request = require('supertest');
const app = require('../../src/app');

// Seed admin credentials (database/seeds/seeds/admin.seed.sql -> bcrypt of 'Admin123!').
const ADMIN_EMAIL = 'admin@eventplanner.com';
const ADMIN_PASSWORD = 'Admin123!';

// Returns a fresh, non-blacklisted admin JWT. Logout blacklists the token it is called with,
// so protected-route tests must each obtain their own token rather than share one.
async function loginAdmin(password = ADMIN_PASSWORD) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password });
  return res.body.data.token;
}

describe('Auth Controller Unit Tests', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Connexion réussie');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(ADMIN_EMAIL);
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

    it('should reject login with unknown user (no password-format gate on login)', async () => {
      // The login validator only requires a non-empty password (no strength check),
      // so a short password for a non-existent user yields 401, not 400.
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
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
          email: ADMIN_EMAIL,
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
      // In dev/test the email is not actually sent, so the API appends a dev note.
      expect(response.body).toHaveProperty('message', 'Inscription réussie (email non envoyé en dev).');
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
          email: 'jane.smith2@example.com',
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
          email: 'jane.smith3@example.com',
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
          email: ADMIN_EMAIL,
          password: 'TestPassword123'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid OTP', async () => {
      // Register a new user; the API exposes the generated OTP via debug.otpCode in test mode.
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob.wilson@example.com',
          password: 'TestPassword123'
        })
        .expect(201);

      const otpCode = registerResponse.body.debug && registerResponse.body.debug.otpCode;
      expect(otpCode).toBeDefined();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'bob.wilson@example.com',
          otpCode: otpCode
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toMatch(/Email vérifié avec succès/);
      expect(response.body.data.user.status).toBe('active');
    });

    it('should reject verification with invalid OTP', async () => {
      // An unknown OTP throws "Code OTP invalide ou expiré"; the global error middleware maps
      // any message containing "invalide" to 401.
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: ADMIN_EMAIL,
          otpCode: '999999'
        })
        .expect(401);

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
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
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
      // Missing refreshToken is caught by the request validator -> generic validation message.
      expect(response.body).toHaveProperty('message', 'Erreur de validation');
    });
  });

  describe('POST /api/auth/validate-token', () => {
    it('should validate token successfully', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        });

      const response = await request(app)
        .post('/api/auth/validate-token')
        .send({
          token: loginResponse.body.data.token
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Validation du token');
      expect(response.body.data).toHaveProperty('valid', true);
    });

    it('should report an invalid token as not valid', async () => {
      // validate-token always answers 200 and reports validity in data.valid.
      const response = await request(app)
        .post('/api/auth/validate-token')
        .send({
          token: 'invalid.token.here'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valid', false);
    });
  });

  describe('Protected Routes', () => {
    describe('POST /api/auth/logout', () => {
      it('should logout successfully with valid token', async () => {
        // Uses its own token (logout blacklists it).
        const token = await loginAdmin();
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${token}`)
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
        const token = await loginAdmin();
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Profil utilisateur récupéré');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('email', ADMIN_EMAIL);
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
      it('should reject password change with wrong current password', async () => {
        // "Mot de passe actuel incorrect" -> global error middleware -> 401 (message contains "incorrect").
        const token = await loginAdmin();
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${token}`)
          .send({
            currentPassword: 'WrongPassword123',
            newPassword: 'AnotherTestPassword123',
            confirmPassword: 'AnotherTestPassword123'
          })
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      });

      it('should reject password change with same password', async () => {
        // newPassword === currentPassword is rejected by the validator (400).
        const token = await loginAdmin();
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${token}`)
          .send({
            currentPassword: 'Admin123!',
            newPassword: 'Admin123!',
            confirmPassword: 'Admin123!'
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      });

      it('should change password successfully', async () => {
        // Runs last: it mutates the admin password. The change-password validator requires
        // confirmPassword === newPassword.
        const token = await loginAdmin();
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${token}`)
          .send({
            currentPassword: ADMIN_PASSWORD,
            newPassword: 'NewTestPassword123',
            confirmPassword: 'NewTestPassword123'
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('OTP Routes', () => {
    describe('POST /api/auth/otp/email/generate', () => {
      it('should generate email OTP successfully', async () => {
        const response = await request(app)
          .post('/api/auth/otp/email/generate')
          .send({
            email: ADMIN_EMAIL,
            expiresInMinutes: 15
          })
          .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.message).toMatch(/OTP généré avec succès/);
        expect(response.body.data).toHaveProperty('identifier', ADMIN_EMAIL);
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
        // Generate an OTP and read the code back from the (test-mode) debug field.
        const genResponse = await request(app)
          .post('/api/auth/otp/email/generate')
          .send({
            email: ADMIN_EMAIL
          })
          .expect(201);

        const code = genResponse.body.data && genResponse.body.data.debug && genResponse.body.data.debug.otpCode;
        expect(code).toBeDefined();

        const response = await request(app)
          .post('/api/auth/otp/email/verify')
          .send({
            email: ADMIN_EMAIL,
            otpCode: code
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.message).toMatch(/OTP vérifié/);
      });

      it('should reject OTP verification with invalid code', async () => {
        // "Code OTP invalide ou expiré" -> global error middleware -> 401 (message contains "invalide").
        const response = await request(app)
          .post('/api/auth/otp/email/verify')
          .send({
            email: ADMIN_EMAIL,
            otpCode: '999999'
          })
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('POST /api/auth/otp/password-reset/generate', () => {
      it('should generate password reset OTP', async () => {
        const response = await request(app)
          .post('/api/auth/otp/password-reset/generate')
          .send({
            email: ADMIN_EMAIL
          })
          .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'OTP de réinitialisation généré avec succès');
        expect(response.body.data).toHaveProperty('identifier', ADMIN_EMAIL);
      });
    });

    describe('POST /api/auth/otp/password-reset/verify', () => {
      it('should reset password with valid OTP', async () => {
        // Generate reset OTP and read the code back from the (test-mode) debug field.
        const genResponse = await request(app)
          .post('/api/auth/otp/password-reset/generate')
          .send({
            email: ADMIN_EMAIL
          })
          .expect(201);

        const code = genResponse.body.data && genResponse.body.data.debug && genResponse.body.data.debug.otpCode;
        expect(code).toBeDefined();

        const response = await request(app)
          .post('/api/auth/otp/password-reset/verify')
          .send({
            email: ADMIN_EMAIL,
            otpCode: code,
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
      it('should report an existing email as unavailable', async () => {
        // available === !exists; the seeded admin email exists -> available:false.
        const response = await request(app)
          .get(`/api/auth/check-email/${ADMIN_EMAIL}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('available', false);
      });

      it('should report a non-existing email as available', async () => {
        const response = await request(app)
          .get('/api/auth/check-email/nonexistent@example.com')
          .expect(200);

        expect(response.body.data).toHaveProperty('available', true);
      });
    });

    describe('GET /api/auth/check-username/:username', () => {
      it('should report an existing username as unavailable', async () => {
        // The seeded admin username 'admin' exists -> available:false.
        const response = await request(app)
          .get('/api/auth/check-username/admin')
          .expect(200);

        expect(response.body.data).toHaveProperty('available', false);
      });

      it('should report a non-existing username as available', async () => {
        const response = await request(app)
          .get('/api/auth/check-username/newuser123')
          .expect(200);

        expect(response.body.data).toHaveProperty('available', true);
      });
    });
  });
});
