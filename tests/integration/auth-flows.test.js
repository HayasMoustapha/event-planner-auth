const request = require('supertest');
const app = require('../../src/app');

describe('Authentication Flows E2E', () => {
  let testPerson = null;
  let testUser = null;
  let authToken = null;
  let otpCode = null;

  beforeAll(async () => {
    // Initialiser l'application (services, database)
    const bootstrap = require('../../src/bootstrap');
    await bootstrap.initialize();

    // Nettoyer les données de test existantes pour garantir l'idempotence des tests
    const { connection } = require('../../src/config/database');
    const testEmail = 'newuser@test.com';
    const adminEmail = 'admin@eventplanner.com';

    // 1. Nettoyer newuser@test.com
    const personRes = await connection.query('SELECT id FROM people WHERE email = $1', [testEmail]);
    if (personRes.rows.length > 0) {
      const pId = personRes.rows[0].id;
      await connection.query('DELETE FROM otps WHERE person_id = $1', [pId]);
      await connection.query('DELETE FROM accesses WHERE user_id IN (SELECT id FROM users WHERE person_id = $1)', [pId]);
      await connection.query('DELETE FROM users WHERE person_id = $1', [pId]);
      await connection.query('DELETE FROM people WHERE id = $1', [pId]);
    }

    // 2. Garantir l'admin par défaut
    const adminPersonRes = await connection.query('SELECT id FROM people WHERE email = $1', [adminEmail]);
    let adminPId;
    if (adminPersonRes.rows.length === 0) {
      const res = await connection.query(`
        INSERT INTO people (first_name, last_name, email, phone, status, created_at, updated_at)
        VALUES ('Super', 'Administrateur', $1, '+33612345678', 'active', NOW(), NOW())
        RETURNING id
      `, [adminEmail]);
      adminPId = res.rows[0].id;
    } else {
      adminPId = adminPersonRes.rows[0].id;
    }

    const adminUserRes = await connection.query('SELECT id FROM users WHERE person_id = $1', [adminPId]);
    if (adminUserRes.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await connection.query(`
        INSERT INTO users (person_id, user_code, username, email, password, status, email_verified_at, created_at, updated_at)
        VALUES ($1, 'ADMIN_TEST', 'admin', $2, $3, 'active', NOW(), NOW(), NOW())
      `, [adminPId, adminEmail, hashedPassword]);
    }

    // 3. Garantir le rôle admin
    const adminRoleIdRes = await connection.query("SELECT id FROM roles WHERE code = 'super_admin'");
    if (adminRoleIdRes.rows.length > 0) {
      const adminRoleId = adminRoleIdRes.rows[0].id;
      const adminUserFinal = await connection.query("SELECT id FROM users WHERE username = 'admin'");
      if (adminUserFinal.rows.length > 0) {
        await connection.query(`
          INSERT INTO accesses (user_id, role_id, status, created_at, updated_at)
          VALUES ($1, $2, 'active', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [adminUserFinal.rows[0].id, adminRoleId]);
      }
    }
  });

  describe('Registration Flow', () => {
    it('should check email availability', async () => {
      const response = await request(app)
        .get('/api/auth/check-email/newuser@test.com')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
    });

    it('should register a new user', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'newuser@test.com',
        phone: '+33612345678',
        password: 'Password123!',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.person.email).toBe(userData.email);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.status).toBe('inactive');

      // Sauvegarder pour les tests suivants
      testPerson = response.body.data.person;
      testUser = response.body.data.user;
    });

    it('should generate OTP for email verification', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({
          email: 'newuser@test.com'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.identifier).toBe('newuser@test.com');
      expect(response.body.data.expiresAt).toBeDefined();
    });

    it('should verify email with OTP', async () => {
      // Simuler la récupération de l'OTP depuis la base de données
      // En pratique, vous devriez intercepter l'email ou utiliser un mock
      const { connection } = require('../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code FROM otps WHERE person_id = $1 AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [testPerson.id, 'email']
      );

      if (otpResult.rows.length > 0) {
        otpCode = otpResult.rows[0].otp_code;

        const response = await request(app)
          .post('/api/auth/verify-email')
          .send({
            email: 'newuser@test.com',
            otpCode: otpCode
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.status).toBe('active');
      } else {
        console.warn('Aucun OTP trouvé pour le test');
      }
    });

    it('should login after verification', async () => {
      const response = await request(app)
        .post('/api/auth/login-after-verification')
        .send({
          email: 'newuser@test.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('newuser@test.com');

      authToken = response.body.data.token;
    });
  });

  describe('OTP Management Flow', () => {
    it('should generate OTP for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({
          email: 'newuser@test.com'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.identifier).toBe('newuser@test.com');
    });

    it('should verify OTP directly', async () => {
      // Récupérer le dernier OTP généré
      const { connection } = require('../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code FROM otps WHERE person_id = $1 AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [testPerson.id, 'email']
      );

      if (otpResult.rows.length > 0) {
        const currentOtpCode = otpResult.rows[0].otp_code;

        const response = await request(app)
          .post('/api/auth/otp/email/verify')
          .send({
            email: 'newuser@test.com',
            code: currentOtpCode,
            personId: testPerson.id
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.purpose).toBe('email');
      } else {
        console.warn('Aucun OTP trouvé pour le test de vérification directe');
      }
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send({
          email: 'newuser@test.com',
          code: '999999',
          personId: testPerson.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle password reset with OTP', async () => {
      // Générer OTP de réinitialisation
      await request(app)
        .post('/api/auth/otp/password-reset/generate')
        .send({
          email: 'newuser@test.com'
        })
        .expect(201);

      // Récupérer l'OTP de réinitialisation
      const { connection } = require('../../src/config/database');
      const otpResult = await connection.query(
        'SELECT otp_code FROM otps WHERE person_id = $1 AND purpose = $2 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [testPerson.id, 'email']
      );

      if (otpResult.rows.length > 0) {
        const resetOtpCode = otpResult.rows[0].otp_code;

        // Utiliser l'OTP pour réinitialiser le mot de passe
        const response = await request(app)
          .post('/api/auth/otp/password-reset/verify')
          .send({
            email: 'newuser@test.com',
            code: resetOtpCode,
            newPassword: 'NewPassword123!'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
      } else {
        console.warn('Aucun OTP de réinitialisation trouvé');
      }
    });
  });

  describe('Authentication with Admin User', () => {
    it('should login with admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'admin123'
        });

      if (response.status !== 200) {
        console.log('DEBUG ADMIN LOGIN FAILED:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('admin@eventplanner.com');
      expect(response.body.data.user.username).toBe('admin');
    });

    it('should reject wrong admin password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Protected Routes Access', () => {
    it('should access profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@test.com');
    });

    it('should reject profile access without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject profile access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('RBAC Integration', () => {
    it('should access user list with admin token', async () => {
      // D'abord, se connecter comme admin pour obtenir un token admin
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'admin123'
        });

      const adminToken = adminLogin.body.data.token;

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should reject user list with user token (insufficient permissions)', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'invalid-email',
          password: 'Password123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'weak@test.com',
          password: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com'
          // password manquant
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // Cleanup
  afterAll(async () => {
    // Nettoyer les données de test
    const { connection } = require('../../src/config/database');
    try {
      await connection.query('DELETE FROM otps WHERE person_id = $1', [testPerson.id]);
      await connection.query('DELETE FROM accesses WHERE user_id = $1', [testUser.id]);
      await connection.query('DELETE FROM users WHERE email = $1', ['newuser@test.com']);
      await connection.query('DELETE FROM people WHERE email = $1', ['newuser@test.com']);
    } catch (error) {
      console.warn('Erreur lors du nettoyage:', error.message);
    }
  });
});
