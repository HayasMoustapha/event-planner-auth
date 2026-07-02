const request = require('supertest');
const app = require('../../src/app');
const { connection } = require('../../src/config/database');

describe('🧪 E2E Tests - Flux Manuel', () => {
  let testUser = null;
  let authTokens = null;
  let adminTokens = null;
  let testPermission = null;
  let testRole = null;

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('📝 Flux 1: Inscription → Activation → Login', () => {
    test('Inscription complète avec vérification manuelle', async () => {
      const userData = {
        email: 'manual@test.com',
        username: 'manualuser',
        password: 'TestPassword123!',
        firstName: 'Manual',
        lastName: 'User',
        phone: '+33688888888'
      };

      // 1. Inscription
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('success', true);
      testUser = registerResponse.body.data.user;

      // 2. Générer OTP
      const otpResponse = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({
          email: userData.email,
          purpose: 'email_verification'
        })
        .expect(200);

      expect(otpResponse.body).toHaveProperty('success', true);

      // 3. Récupérer OTP depuis la base
      const otpResult = await connection.query(
        'SELECT otp_code FROM otps WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
        [testUser.person_id, 'email_verification']
      );
      const otpCode = otpResult.rows[0].otp_code;

      // 4. Vérifier OTP
      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: userData.email,
          otpCode: otpCode
        })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('success', true);

      // 5. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
      authTokens = loginResponse.body.data;

      // 6. Vérifier le profil
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('success', true);
      expect(profileResponse.body.data.user.status).toBe('active');
    });
  });

  describe('🔐 Flux 2: Login Admin et Vérifications', () => {
    test('Login admin et accès aux ressources', async () => {
      // Login admin
      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'Admin123!'
        })
        .expect(200);

      expect(adminLoginResponse.body).toHaveProperty('success', true);
      adminTokens = adminLoginResponse.body.data;

      // Accès à la liste des utilisateurs
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      expect(usersResponse.body).toHaveProperty('success', true);
      expect(usersResponse.body.data.data).toBeDefined();

      // Vérification permission
      const permissionResponse = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          permission: 'users.list',
          resource: 'users',
          action: 'list'
        })
        .expect(200);

      expect(permissionResponse.body).toHaveProperty('success', true);
      expect(permissionResponse.body.data.hasPermission).toBe(true);
    });
  });

  describe('🛡️ Flux 3: RBAC Simplifié', () => {
    test('Création permission et rôle avec validation correcte', async () => {
      // Créer permission avec le bon format
      const permissionResponse = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          code: 'test_read',
          name: 'Test Read Permission',
          description: 'Permission pour lire les tests',
          resource: 'test',
          action: 'read'
        })
        .expect(201);

      expect(permissionResponse.body).toHaveProperty('success', true);
      testPermission = permissionResponse.body.data.permission;

      // Créer rôle
      const roleResponse = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          name: 'Test Role',
          description: 'Rôle pour les tests',
          level: 50
        })
        .expect(201);

      expect(roleResponse.body).toHaveProperty('success', true);
      testRole = roleResponse.body.data.role;

      // Assigner permission au rôle
      await request(app)
        .post(`/api/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          permissions: [testPermission.id]
        })
        .expect(200);

      // Assigner rôle à l'utilisateur
      await request(app)
        .post('/api/authorizations/user')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUser.id,
          roleId: testRole.id
        })
        .expect(200);

      // Rafraîchir le token de l'utilisateur
      const refreshResponse = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: authTokens.refreshToken
        })
        .expect(200);

      authTokens = refreshResponse.body.data;

      // Vérifier la nouvelle permission
      const checkResponse = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .send({
          permission: 'test_read',
          resource: 'test',
          action: 'read'
        })
        .expect(200);

      expect(checkResponse.body.data.hasPermission).toBe(true);
    });
  });

  describe('🚨 Flux 4: Tests d Erreur', () => {
    test('Login avec mauvais mot de passe', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Accès refusé sans token', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    test('Validation des données invalides', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'ab',
          password: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('🔄 Flux 5: Logout', () => {
    test('Logout et invalidation', async () => {
      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .expect(200);

      expect(logoutResponse.body).toHaveProperty('success', true);

      // Token invalide après logout
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .expect(401);
    });
  });
});

async function cleanupTestData() {
  try {
    await connection.query('DELETE FROM authorizations WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%manual@test.com\')');
    await connection.query('DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name LIKE \'%Test%\')');
    await connection.query('DELETE FROM permissions WHERE code = \'test_read\'');
    await connection.query('DELETE FROM roles WHERE name LIKE \'%Test%\'');
    await connection.query('DELETE FROM otps WHERE person_id IN (SELECT id FROM people WHERE email LIKE \'%manual@test.com\')');
    await connection.query('DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%manual@test.com\')');
    await connection.query('DELETE FROM users WHERE email LIKE \'%manual@test.com\'');
    await connection.query('DELETE FROM people WHERE email LIKE \'%manual@test.com\'');
    console.log('🧹 Manual E2E test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up manual E2E test data:', error);
  }
}
