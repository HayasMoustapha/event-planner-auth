const request = require('supertest');
const app = require('../../src/app');
const connection = require('../../src/config/database');

describe('🚨 E2E Tests - Robustesse et Sécurité', () => {
  let testUser = null;
  let adminTokens = null;

  beforeAll(async () => {
    await cleanupTestData();
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  async function setupTestData() {
    // Créer utilisateur de test
    const userData = {
      email: 'robust@test.com',
      username: 'robustuser',
      password: 'TestPassword123!',
      firstName: 'Robust',
      lastName: 'User',
      phone: '+33699999999'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    testUser = registerResponse.body.data.user;

    // Activer l'utilisateur
    const otpResult = await connection.query(
      'SELECT otp_code FROM otps WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
      [testUser.person_id, 'email_verification']
    );
    
    if (otpResult.rows.length > 0) {
      await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: userData.email,
          otpCode: otpResult.rows[0].otp_code
        })
        .expect(200);
    }

    // Login admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@eventplanner.com',
        password: 'Admin123!'
      })
      .expect(200);

    adminTokens = adminLoginResponse.body.data;
  }

  describe('🔐 OTP - Cas d\'Erreur', () => {
    test('OTP expiré', async () => {
      // Créer un OTP expiré
      await connection.query(
        `INSERT INTO otps (person_id, otp_code, expires_at, is_used, purpose, created_at, updated_at, uid)
         VALUES ($1, '999999', NOW() - INTERVAL '1 hour', false, 'email_verification', NOW(), NOW(), gen_random_uuid())`,
        [testUser.person_id]
      );

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testUser.email,
          otpCode: '999999'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('expir');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('OTP déjà utilisé', async () => {
      // Créer un OTP utilisé
      await connection.query(
        `INSERT INTO otps (person_id, otp_code, expires_at, is_used, purpose, created_at, updated_at, uid)
         VALUES ($1, '888888', NOW() + INTERVAL '1 hour', true, 'email_verification', NOW(), NOW(), gen_random_uuid())`,
        [testUser.person_id]
      );

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testUser.email,
          otpCode: '888888'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('invalide');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('OTP non existant', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testUser.email,
          otpCode: '123456'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('invalide');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🔑 Authentication - Cas d\'Erreur', () => {
    test('Login avec compte inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('incorrect');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Login avec mauvais mot de passe', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('incorrect');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Login avec compte inactif', async () => {
      // Créer utilisateur inactif
      const inactiveUserData = {
        email: 'inactive@test.com',
        username: 'inactiveuser',
        password: 'TestPassword123!',
        firstName: 'Inactive',
        lastName: 'User',
        phone: '+33688888888'
      };

      await request(app)
        .post('/api/auth/register')
        .send(inactiveUserData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: inactiveUserData.email,
          password: inactiveUserData.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('désactivé');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🎫 Token - Cas d\'Erreur', () => {
    test('Token invalide', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('invalide');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Token manquant', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('requis');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Token mal formaté', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🛡️ Authorization - Cas d\'Erreur', () => {
    test('Accès sans permission', async () => {
      // Login utilisateur normal
      const userLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!'
        })
        .expect(200);

      const userTokens = userLoginResponse.body.data;

      // Tenter d'accéder à une route admin
      const response = await request(app)
        .delete('/api/roles/1')
        .set('Authorization', `Bearer ${userTokens.token}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('permission');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Permission spécifique manquante', async () => {
      // Login utilisateur normal
      const userLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!'
        })
        .expect(200);

      const userTokens = userLoginResponse.body.data;

      // Tenter de créer un rôle
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${userTokens.token}`)
        .send({
          name: 'Unauthorized Role',
          description: 'Should not work',
          level: 50
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('permission');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🛣️ Routes - Cas d\'Erreur', () => {
    test('Route inexistante', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('trouvée');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Méthode HTTP non autorisée', async () => {
      const response = await request(app)
        .patch('/api/auth/login')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('📝 Validation - Cas d\'Erreur', () => {
    test('Inscription avec données invalides', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'ab', // too short
          password: '123', // too weak
          firstName: '', // empty
          lastName: '',
          phone: 'invalid-phone'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body).not.toHaveProperty('stack');

      // Vérifier que tous les champs requis sont validés
      const errorFields = response.body.errors.map(e => e.field);
      expect(errorFields).toContain('email');
      expect(errorFields).toContain('username');
      expect(errorFields).toContain('password');
      expect(errorFields).toContain('firstName');
    });

    test('Email déjà existant', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email, // déjà existant
          username: 'newuser123',
          password: 'TestPassword123!',
          firstName: 'New',
          lastName: 'User',
          phone: '+33677777777'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('déjà');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Username déjà existant', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          username: testUser.username, // déjà existant
          password: 'TestPassword123!',
          firstName: 'New',
          lastName: 'User',
          phone: '+33666666666'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('déjà');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🔧 Database - Cas d\'Erreur', () => {
    test('Référence inexistante', async () => {
      // Tenter de mettre à jour un utilisateur qui n'existe pas
      const response = await request(app)
        .put('/api/users/999999')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          firstName: 'Updated',
          lastName: 'User'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Contrainte de clé étrangère', async () => {
      // Tenter d'assigner un rôle qui n'existe pas
      const response = await request(app)
        .post('/api/authorizations/user')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUser.id,
          roleId: 999999
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🌐 Sécurité - Protection', () => {
    test('Protection XSS', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'xss@test.com',
          username: 'xssuser',
          password: 'TestPassword123!',
          firstName: '<script>alert("xss")</script>',
          lastName: 'User',
          phone: '+33655555555'
        })
        .expect(400); // Should be rejected by validation

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Protection SQL Injection', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin@eventplanner.com'; DROP TABLE users; --",
          password: 'TestPassword123!'
        })
        .expect(400); // Should be rejected by validation

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('⏱️ Rate Limiting - Robustesse', () => {
    test('Rate limiting login', async () => {
      // Faire plusieurs tentatives de login rapidement
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123!'
          });
      }

      // La 6ème tentative devrait être bloquée
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(429);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase()).toContain('too many');
      expect(response.body).not.toHaveProperty('stack');
    });
  });
});

async function cleanupTestData() {
  try {
    await connection.query('DELETE FROM authorizations WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%robust@test.com\' OR email LIKE \'%inactive@test.com\' OR email LIKE \'%xss@test.com\')');
    await connection.query('DELETE FROM otps WHERE person_id IN (SELECT id FROM people WHERE email LIKE \'%robust@test.com\' OR email LIKE \'%inactive@test.com\' OR email LIKE \'%xss@test.com\')');
    await connection.query('DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%robust@test.com\' OR email LIKE \'%inactive@test.com\' OR email LIKE \'%xss@test.com\')');
    await connection.query('DELETE FROM users WHERE email LIKE \'%robust@test.com\' OR email LIKE \'%inactive@test.com\' OR email LIKE \'%xss@test.com\'');
    await connection.query('DELETE FROM people WHERE email LIKE \'%robust@test.com\' OR email LIKE \'%inactive@test.com\' OR email LIKE \'%xss@test.com\'');
    console.log('🧹 Robustness test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up robustness test data:', error);
  }
}
