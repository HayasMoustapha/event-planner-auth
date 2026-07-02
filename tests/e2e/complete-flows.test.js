const request = require('supertest');
const app = require('../../src/app');
const { connection } = require('../../src/config/database');

describe('🧪 E2E Tests - Flux Complets', () => {
  let testUser = null;
  let testPerson = null;
  let authTokens = null;
  let otpCode = null;
  let testRoleId = null;
  let testPermissionId = null;
  let testMenuId = null;

  beforeAll(async () => {
    // Nettoyer la base de données pour les tests
    await cleanupTestData();
  });

  afterAll(async () => {
    // Nettoyer après les tests
    await cleanupTestData();
  });

  describe('📝 Flux 1: Inscription → OTP → Activation → Login', () => {
    test('Étape 1: Vérification disponibilité email', async () => {
      const response = await request(app)
        .get('/api/auth/check-email/newuser@test.com')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('available', true);
    });

    test('Étape 2: Vérification disponibilité username', async () => {
      const response = await request(app)
        .get('/api/auth/check-username/newuser123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('available', true);
    });

    test('Étape 3: Inscription utilisateur', async () => {
      const userData = {
        email: 'newuser@test.com',
        username: 'newuser123',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User',
        phone: '+33612345678'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).toHaveProperty('status', 'pending');

      // Vérifier en base de données
      const userResult = await connection.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      expect(userResult.rows).toHaveLength(1);
      
      testUser = userResult.rows[0];
      expect(testUser.status).toBe('pending');

      // Vérifier la personne associée
      const personResult = await connection.query(
        'SELECT * FROM people WHERE id = $1',
        [testUser.person_id]
      );
      testPerson = personResult.rows[0];
      expect(testPerson).toBeDefined();
    });

    test('Étape 4: Génération OTP pour email', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({
          email: testUser.email,
          purpose: 'email_verification'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'OTP generated successfully');

      // Récupérer le code OTP en base
      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
        [testPerson.id, 'email_verification']
      );
      
      expect(otpResult.rows).toHaveLength(1);
      otpCode = otpResult.rows[0].otp_code;
      expect(otpCode).toMatch(/^\d{6}$/);
    });

    test('Étape 5: Vérification OTP et activation compte', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testUser.email,
          otp_code: otpCode
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Email verified successfully');

      // Vérifier que l'utilisateur est activé
      const updatedUser = await connection.query(
        'SELECT * FROM users WHERE email = $1',
        [testUser.email]
      );
      expect(updatedUser.rows[0].status).toBe('active');
      expect(updatedUser.rows[0].email_verified_at).toBeDefined();
    });

    test('Étape 6: Login après activation', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');

      authTokens = response.body.data;
      expect(authTokens.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    test('Étape 7: Accès au profil utilisateur', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      expect(response.body.data.user).toHaveProperty('status', 'active');
    });
  });

  describe('🔐 Flux 2: Login → Accès Protégé → Permissions', () => {
    let adminTokens = null;

    test('Étape 1: Login admin', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@eventplanner.com',
          password: 'Admin123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      adminTokens = response.body.data;
    });

    test('Étape 2: Accès à une route protégée', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    test('Étape 3: Vérification des permissions admin', async () => {
      const response = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          permission: 'users.list',
          resource: 'users',
          action: 'list'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasPermission', true);
    });

    test('Étape 4: Accès refusé sans token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Étape 5: Accès refusé avec token invalide', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('👥 Flux 3: Rôles → Permissions → Menus', () => {
    let newRoleTokens = null;

    test('Étape 1: Création d un nouveau rôle', async () => {
      const roleData = {
        name: 'Test Role E2E',
        description: 'Role créé pour les tests E2E',
        level: 50
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .send(roleData)
        .expect(403); // Should fail - user doesn't have permission

      // Créer avec admin
      const adminResponse = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send(roleData)
        .expect(201);

      expect(adminResponse.body).toHaveProperty('success', true);
      testRoleId = adminResponse.body.data.role.id;
    });

    test('Étape 2: Création d une permission', async () => {
      const permissionData = {
        name: 'test.e2e.access',
        description: 'Permission pour les tests E2E',
        resource: 'test',
        action: 'access'
      };

      const response = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send(permissionData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testPermissionId = response.body.data.permission.id;
    });

    test('Étape 3: Assigner la permission au rôle', async () => {
      const response = await request(app)
        .post(`/api/roles/${testRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          permissions: [testPermissionId]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Étape 4: Assigner le rôle à l utilisateur', async () => {
      const response = await request(app)
        .post('/api/authorizations/user')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUser.id,
          roleId: testRoleId
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Étape 5: Vérifier que l utilisateur a la permission', async () => {
      // Rafraîchir le token pour obtenir les nouvelles permissions
      const refreshResponse = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: authTokens.refreshToken
        })
        .expect(200);

      newRoleTokens = refreshResponse.body.data;

      const response = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .send({
          permission: 'test.e2e.access',
          resource: 'test',
          action: 'access'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasPermission', true);
    });

    test('Étape 6: Création d un menu', async () => {
      const menuData = {
        name: 'Test Menu E2E',
        label: 'Menu Test E2E',
        url: '/test-e2e',
        icon: 'test-icon',
        order: 100,
        parent_id: null
      };

      const response = await request(app)
        .post('/api/menus')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send(menuData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testMenuId = response.body.data.menu.id;
    });

    test('Étape 7: Assigner la permission au menu', async () => {
      const response = await request(app)
        .post(`/api/menus/${testMenuId}/permissions`)
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          permissions: [testPermissionId]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Étape 8: Vérifier que l utilisateur a accès au menu', async () => {
      const response = await request(app)
        .post('/api/authorizations/check/menu')
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .send({
          menuId: testMenuId
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasAccess', true);
    });

    test('Étape 9: Lister les menus accessibles à l utilisateur', async () => {
      const response = await request(app)
        .get(`/api/menus/user/${testUser.id}`)
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data.menus)).toBe(true);
      
      // Vérifier que notre menu est dans la liste
      const menuIds = response.body.data.menus.map(m => m.id);
      expect(menuIds).toContain(testMenuId);
    });
  });

  describe('🚨 Flux 4: Gestion des Erreurs', () => {
    test('Étape 1: Login avec mot de passe incorrect', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    test('Étape 2: Vérification OTP avec code incorrect', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testUser.email,
          otp_code: '999999'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid or expired OTP');
    });

    test('Étape 3: Tentative d accès sans permission', async () => {
      const response = await request(app)
        .delete(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    test('Étape 4: Validation des données d entrée', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'ab', // too short
          password: '123' // too weak
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('Étape 5: Gestion du rate limiting', async () => {
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
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('too many');
    });
  });

  describe('🔄 Flux 5: Logout et Nettoyage', () => {
    test('Étape 1: Logout utilisateur', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    test('Étape 2: Token invalide après logout', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Étape 3: Refresh token invalide après logout', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: authTokens.refreshToken
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

// Fonctions utilitaires pour le nettoyage
async function cleanupTestData() {
  try {
    // Supprimer les autorisations de test
    await connection.query('DELETE FROM authorizations WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test.com\' OR email LIKE \'%@test%\')');
    
    // Supprimer les permissions de test
    await connection.query('DELETE FROM authorizations WHERE permission_id IN (SELECT id FROM permissions WHERE name LIKE \'%test%\')');
    await connection.query('DELETE FROM permissions WHERE name LIKE \'%test%\' OR name LIKE \'%e2e%\'');
    
    // Supprimer les menus de test
    await connection.query('DELETE FROM menu_permissions WHERE menu_id IN (SELECT id FROM menus WHERE name LIKE \'%test%\' OR name LIKE \'%e2e%\')');
    await connection.query('DELETE FROM menus WHERE name LIKE \'%test%\' OR name LIKE \'%e2e%\'');
    
    // Supprimer les rôles de test
    await connection.query('DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name LIKE \'%test%\' OR name LIKE \'%e2e%\')');
    await connection.query('DELETE FROM roles WHERE name LIKE \'%test%\' OR name LIKE \'%e2e%\'');
    
    // Supprimer les OTP de test
    await connection.query('DELETE FROM otps WHERE person_id IN (SELECT id FROM people WHERE email LIKE \'%test.com\' OR email LIKE \'%@test%\')');
    
    // Supprimer les utilisateurs de test
    await connection.query('DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test.com\' OR email LIKE \'%@test%\')');
    await connection.query('DELETE FROM users WHERE email LIKE \'%test.com\' OR email LIKE \'%@test%\'');
    
    // Supprimer les personnes de test
    await connection.query('DELETE FROM people WHERE email LIKE \'%test.com\' OR email LIKE \'%@test%\'');
    
    console.log('🧹 Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}
