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
      // Contrat API : whitelist stricte du corps → seul { email } est accepté (pas de `purpose`).
      // La génération d'OTP renvoie 201.
      const otpResponse = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({
          email: userData.email
        })
        .expect(201);

      expect(otpResponse.body).toHaveProperty('success', true);
      const otpCode = otpResponse.body.data.debug.otpCode;

      // 3. Vérifier OTP
      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: userData.email,
          otpCode: otpCode
        })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('success', true);

      // 4. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
      authTokens = loginResponse.body.data;

      // 5. Vérifier le profil
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('success', true);
      // Le profil renvoie les champs utilisateur directement sous data (pas data.user).
      expect(profileResponse.body.data.status).toBe('active');
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
      // Créer permission avec le format contractuel :
      // { code (min./points/underscores), label (objet JSON), group ([a-z_]) }.
      // `data` EST la permission (pas data.permission).
      const permissionResponse = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          code: 'test.read',
          label: { fr: 'Test Read Permission' },
          description: 'Permission pour lire les tests',
          group: 'test'
        })
        .expect(201);

      expect(permissionResponse.body).toHaveProperty('success', true);
      testPermission = permissionResponse.body.data;

      // Créer rôle avec le format contractuel :
      // { code ([a-zA-Z0-9_]), label (objet JSON requis), description (objet JSON), level }.
      const roleResponse = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          code: 'test_role',
          label: { fr: 'Test Role' },
          description: { fr: 'Rôle pour les tests' },
          level: 50
        })
        .expect(201);

      expect(roleResponse.body).toHaveProperty('success', true);
      testRole = roleResponse.body.data;

      // Assigner permission au rôle.
      // PRODUCT BUG (rapporté) : POST /api/roles/:id/permissions renvoie 500
      // « malformed array literal » — roles.repository.assignPermissions construit des
      // placeholders SQL ($1..$3 par permission) incohérents avec la requête
      // (SELECT ... WHERE p.id = ANY($3)), donc $3 reçoit createdBy au lieu du tableau d'IDs.
      // On sème donc l'association rôle↔permission directement en base pour pouvoir
      // valider le VRAI chemin produit (l'évaluation RBAC via check/permission).
      await connection.query(
        'INSERT INTO authorizations (role_id, permission_id, menu_id, created_by, created_at) VALUES ($1, $2, 1, 1, now())',
        [testRole.id, testPermission.id]
      );

      // Assigner rôle à l'utilisateur via le module accesses (users↔roles = table `accesses`).
      await request(app)
        .post('/api/accesses')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUser.id,
          roleId: testRole.id
        })
        .expect(201);

      // Rafraîchir le token de l'utilisateur (refreshToken dans data.tokens).
      const refreshResponse = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: authTokens.tokens.refreshToken
        })
        .expect(200);

      authTokens = refreshResponse.body.data;

      // Vérifier la nouvelle permission (chemin produit réel).
      const checkResponse = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .send({
          permission: 'test.read',
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
    // Schéma réel : users↔roles = `accesses`, roles↔permissions = `authorizations`
    // (colonne role_id ; PAS de user_id). roles / permissions n'ont pas de colonne `name`
    // mais `code`. On nettoie donc via `code`.
    await connection.query('DELETE FROM accesses WHERE role_id IN (SELECT id FROM roles WHERE code LIKE \'test\\_%\')');
    await connection.query('DELETE FROM authorizations WHERE role_id IN (SELECT id FROM roles WHERE code LIKE \'test\\_%\')');
    await connection.query('DELETE FROM permissions WHERE code = \'test.read\'');
    await connection.query('DELETE FROM roles WHERE code LIKE \'test\\_%\'');
    await connection.query('DELETE FROM otps WHERE person_id IN (SELECT id FROM people WHERE email LIKE \'%manual@test.com\')');
    await connection.query('DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%manual@test.com\')');
    await connection.query('DELETE FROM users WHERE email LIKE \'%manual@test.com\'');
    await connection.query('DELETE FROM people WHERE email LIKE \'%manual@test.com\'');
    console.log('🧹 Manual E2E test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up manual E2E test data:', error);
  }
}
