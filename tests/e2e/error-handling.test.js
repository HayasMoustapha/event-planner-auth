const request = require('supertest');
const app = require('../../src/app');
const { connection } = require('../../src/config/database');

describe('🚨 E2E Tests - Cas d\'Erreur et Robustesse', () => {
  let testUser = null;
  let authTokens = null;
  let adminTokens = null;
  let expiredOtp = null;
  let usedOtp = null;

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
      email: 'error@test.com',
      username: 'erroruser',
      password: 'TestPassword123!',
      firstName: 'Error',
      lastName: 'User',
      phone: '+33655555555'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // data.user has no person_id; person id lives under data.person.id
    testUser = {
      ...registerResponse.body.data.user,
      person_id: registerResponse.body.data.person.id
    };

    // Les nouveaux comptes sont "inactive" ; activer pour permettre le login dans les tests
    // d'autorisation (utilisateur non-admin qui doit passer l'auth puis échouer en 403).
    await connection.query(
      "UPDATE users SET status = 'active' WHERE id = $1",
      [testUser.id]
    );

    // Générer OTP pour tests (le corps n'accepte que { email } — whitelist stricte)
    await request(app)
      .post('/api/auth/otp/email/generate')
      .send({
        email: userData.email
      })
      .expect(201);

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

  describe('🔐 OTP Errors', () => {
    test('OTP expiré', async () => {
      // Créer un OTP expiré manuellement
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
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('expir');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('OTP déjà utilisé', async () => {
      // Créer et marquer un OTP comme utilisé
      // La table otps ne possède pas de colonne used_at ; is_used=true suffit à marquer l'OTP comme utilisé.
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
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
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
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('invalide');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Format OTP invalide', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testUser.email,
          otpCode: 'abc123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Tentatives OTP répétées avec code invalide', async () => {
      // Faire plusieurs tentatives avec des codes incorrects
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/verify-email')
          .send({
            email: testUser.email,
            otpCode: '999999'
          });
      }

      // Le rate limiting est désactivé en environnement de test (skip NODE_ENV==='test'),
      // donc chaque tentative avec un code invalide reste rejetée en 401.
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testUser.email,
          otpCode: '999999'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('invalide');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🔑 Authentication Errors', () => {
    test('Login avec compte inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
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
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('incorrect');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Login avec compte inactif', async () => {
      // Créer un utilisateur inactif
      const inactiveUserData = {
        email: 'inactive@test.com',
        username: 'inactiveuser',
        password: 'TestPassword123!',
        firstName: 'Inactive',
        lastName: 'User',
        phone: '+33666666666'
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
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('désactivé');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Login avec format email invalide', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Login sans mot de passe', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🎫 Token Errors', () => {
    test('Token invalide', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('invalide');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Token manquant', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('token');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Token mal formaté', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Refresh token invalide', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'invalid_refresh_token'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Refresh token expiré', async () => {
      // Simuler un refresh token expiré
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJleHAiOjE2MDAwMDAwMDB9.invalid'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🛡️ Authorization Errors', () => {
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
      expect(response.body).toHaveProperty('message');
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
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('permission');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🛣️ Route Errors', () => {
    test('Route inexistante (protégée par le garde /api)', async () => {
      // Toute route /api non déclarée tombe sous le garde global RobustAuthMiddleware
      // monté sur /api → 401 avant d'atteindre le notFoundHandler.
      const response = await request(app)
        .get('/api/nonexistent-route')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Méthode HTTP non autorisée sans authentification', async () => {
      // PATCH /api/auth/login n'existe pas ; la requête retombe sur le garde /api → 401.
      const response = await request(app)
        .patch('/api/auth/login')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Route protégée avec mauvaise méthode', async () => {
      // Authentifié : dépasse le garde puis atteint le notFoundHandler → 404.
      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(404);

      // Le notFoundHandler renvoie { error, message, availableRoutes } (sans champ success).
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('📝 Validation Errors', () => {
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

      // Les objets d'erreur exposent { message, value } (pas de champ `field`).
      // Vérifier que tous les champs requis sont validés via le contenu des messages (FR).
      const messages = response.body.errors.map(e => e.message.toLowerCase()).join(' | ');
      expect(messages).toContain('email');
      expect(messages).toContain('username');
      expect(messages).toContain('mot de passe');
      expect(messages).toContain('prénom');
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
          phone: '+33644444444'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('déjà');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Username déjà existant rejeté (409)', async () => {
      // Registration now enforces username uniqueness (like email) -> 409.
      // Email préfixé "…error@test.com" pour rester couvert par cleanupTestData().
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'dupusername-error@test.com',
          username: testUser.username, // déjà existant -> rejeté
          password: 'TestPassword123!',
          firstName: 'New',
          lastName: 'User',
          phone: '+33633333333'
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🔧 Database Errors', () => {
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
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Route d\'assignation de rôle inexistante', async () => {
      // POST /api/authorizations/user n'est pas déclarée → notFoundHandler renvoie 404
      // avec { error, message, availableRoutes } (sans champ success).
      const response = await request(app)
        .post('/api/authorizations/user')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUser.id,
          roleId: 999999
        })
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('🌐 Input Sanitization', () => {
    test('Protection XSS', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'xss@test.com',
          username: 'xssuser',
          password: 'TestPassword123!',
          firstName: '<script>alert("xss")</script>',
          lastName: 'User',
          phone: '+33622222222'
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

  describe('⏱️ Rate Limiting', () => {
    test('Tentatives de login répétées (rate limiting désactivé en test)', async () => {
      // Faire plusieurs tentatives de login rapidement
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123!'
          });
      }

      // Le rate limiting est explicitement désactivé sous NODE_ENV==='test' (voir app.js),
      // donc les tentatives avec un mauvais mot de passe restent rejetées en 401.
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('incorrect');
      expect(response.body).not.toHaveProperty('stack');
    });

    test('Tentatives d\'inscription répétées (rate limiting désactivé en test)', async () => {
      // Faire plusieurs tentatives d'inscription rapidement
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/register')
          .send({
            email: `ratelimit${i}@test.com`,
            username: `ratelimit${i}`,
            password: 'TestPassword123!',
            firstName: 'Rate',
            lastName: 'Limit',
            phone: `+3361111111${i}`
          });
      }

      // Le rate limiting est désactivé en test : une inscription avec un email frais réussit (201).
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'ratelimit6@test.com',
          username: 'ratelimit6',
          password: 'TestPassword123!',
          firstName: 'Rate',
          lastName: 'Limit',
          phone: '+33611111116'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('stack');
    });
  });
});

async function cleanupTestData() {
  try {
    // people.email est la source fiable (users.email porte un suffixe "+user").
    // On dérive donc otps/users/password_histories depuis les person_id ciblés.
    // NB: la table authorizations est une table de mapping rôle→permission
    // (pas de colonne user_id) et n'est pas produite par ces tests.
    const emailFilter = `email LIKE '%error@test.com'
       OR email LIKE '%inactive@test.com'
       OR email LIKE '%xss@test.com'
       OR email LIKE '%ratelimit%@test.com'`;
    const targetPeople = `SELECT id FROM people WHERE ${emailFilter}`;
    await connection.query(`DELETE FROM otps WHERE person_id IN (${targetPeople})`);
    await connection.query(`DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE person_id IN (${targetPeople}))`);
    await connection.query(`DELETE FROM users WHERE person_id IN (${targetPeople})`);
    await connection.query(`DELETE FROM people WHERE ${emailFilter}`);
    console.log('🧹 Error test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up error test data:', error);
  }
}
