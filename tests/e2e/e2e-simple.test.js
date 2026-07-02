const request = require('supertest');
const app = require('../../src/app');
const { connection } = require('../../src/config/database');

describe('🧪 E2E Tests - Flux Simplifiés', () => {
  let testUser = null;
  let authTokens = null;
  let adminTokens = null;

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    if (connection) {
      await connection.end();
    }
  });

  describe('📝 Flux 1: Inscription → Activation → Login', () => {
    test('Inscription complète', async () => {
      const userData = {
        email: 'e2euser@test.com',
        username: 'e2euser123',
        password: 'TestPassword123!',
        first_name: 'E2E',
        last_name: 'User',
        phone: '+33612345678'
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

      // 3. Récupérer et vérifier OTP
      const personResult = await connection.query(
        'SELECT id FROM people WHERE email = $1',
        [userData.email]
      );
      const personId = personResult.rows[0].id;

      const otpResult = await connection.query(
        'SELECT otp_code FROM otps WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
        [personId, 'email_verification']
      );
      const otpCode = otpResult.rows[0].otp_code;

      // 4. Vérifier OTP
      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: userData.email,
          otp_code: otpCode
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

      // 6. Accès profil
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('success', true);
      expect(profileResponse.body.data.user.status).toBe('active');
    });
  });

  describe('🔐 Flux 2: Authentification et Permissions', () => {
    test('Login admin et vérification permissions', async () => {
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

      // Accès route protégée
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      expect(usersResponse.body).toHaveProperty('success', true);

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

    test('Accès refusé sans authentification', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('🛡️ Flux 3: RBAC Simple', () => {
    let testRole = null;
    let testPermission = null;

    test('Création et assignation RBAC', async () => {
      // Créer permission
      const permissionResponse = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          name: 'e2e.test.permission',
          description: 'Permission test E2E',
          resource: 'e2e_test',
          action: 'test'
        })
        .expect(201);

      testPermission = permissionResponse.body.data.permission;

      // Créer rôle
      const roleResponse = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          name: 'E2E Test Role',
          description: 'Rôle pour tests E2E',
          level: 50
        })
        .expect(201);

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

      // Rafraîchir le token
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
          permission: 'e2e.test.permission',
          resource: 'e2e_test',
          action: 'test'
        })
        .expect(200);

      expect(checkResponse.body.data.hasPermission).toBe(true);
    });
  });

  describe('🚨 Flux 4: Gestion Erreurs', () => {
    test('Login avec mauvais mot de passe', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('Validation des données', async () => {
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

    test('Accès refusé avec permissions insuffisantes', async () => {
      const response = await request(app)
        .delete(`/api/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${authTokens.token}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('🔄 Flux 5: Logout', () => {
    test('Logout et invalidation tokens', async () => {
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

      // Refresh token invalide après logout
      await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: authTokens.refreshToken
        })
        .expect(401);
    });
  });
});

async function cleanupTestData() {
  try {
    await connection.query('DELETE FROM authorizations WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%e2e%@test.com\')');
    await connection.query('DELETE FROM menu_permissions WHERE menu_id IN (SELECT id FROM menus WHERE name LIKE \'%E2E%\')');
    await connection.query('DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name LIKE \'%E2E%\')');
    await connection.query('DELETE FROM menus WHERE name LIKE \'%E2E%\'');
    await connection.query('DELETE FROM permissions WHERE name LIKE \'%e2e%\'');
    await connection.query('DELETE FROM roles WHERE name LIKE \'%E2E%\'');
    await connection.query('DELETE FROM otps WHERE person_id IN (SELECT id FROM people WHERE email LIKE \'%e2e%@test.com\')');
    await connection.query('DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%e2e%@test.com\')');
    await connection.query('DELETE FROM users WHERE email LIKE \'%e2e%@test.com\'');
    await connection.query('DELETE FROM people WHERE email LIKE \'%e2e%@test.com\'');
    console.log('🧹 E2E test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up E2E test data:', error);
  }
}
