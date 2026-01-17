const request = require('supertest');
const app = require('../../src/app');
const connection = require('../../src/config/database');

describe('🛡️ E2E Tests - RBAC System', () => {
  let adminTokens = null;
  let managerTokens = null;
  let userTokens = null;
  let testRole = null;
  let testPermission = null;
  let testMenu = null;
  let testUsers = [];

  beforeAll(async () => {
    await cleanupRbacTestData();
    await setupTestUsers();
  });

  afterAll(async () => {
    await cleanupRbacTestData();
  });

  async function setupTestUsers() {
    // Créer utilisateurs de test avec différents rôles
    const users = [
      {
        email: 'rbacadmin@test.com',
        username: 'rbacadmin',
        password: 'Admin123!',
        first_name: 'Admin',
        last_name: 'RBAC',
        phone: '+33611111111'
      },
      {
        email: 'rbacmanager@test.com',
        username: 'rbacmanager',
        password: 'Manager123!',
        first_name: 'Manager',
        last_name: 'RBAC',
        phone: '+33622222222'
      },
      {
        email: 'rbacuser@test.com',
        username: 'rbacuser',
        password: 'User123!',
        first_name: 'User',
        last_name: 'RBAC',
        phone: '+33633333333'
      }
    ];

    for (const userData of users) {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = registerResponse.body.data.user;

      // Activer directement l'utilisateur (bypass OTP pour les tests)
      await connection.query(
        'UPDATE users SET status = $1, email_verified_at = NOW() WHERE id = $2',
        ['active', user.id]
      );

      // Login pour obtenir les tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      testUsers.push({
        ...user,
        tokens: loginResponse.body.data
      });
    }

    adminTokens = testUsers[0].tokens;
    managerTokens = testUsers[1].tokens;
    userTokens = testUsers[2].tokens;
  }

  describe('🏗️ Setup RBAC Components', () => {
    test('Création permission de test', async () => {
      const permissionData = {
        name: 'rbac.test.read',
        description: 'Permission de test pour RBAC',
        resource: 'rbac_test',
        action: 'read'
      };

      const response = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send(permissionData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testPermission = response.body.data.permission;
    });

    test('Création rôle de test', async () => {
      const roleData = {
        name: 'RBAC Test Role',
        description: 'Rôle de test pour RBAC',
        level: 50
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send(roleData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testRole = response.body.data.role;
    });

    test('Création menu de test', async () => {
      const menuData = {
        name: 'RBAC Test Menu',
        label: 'Menu Test RBAC',
        url: '/rbac-test',
        icon: 'rbac-icon',
        order: 100
      };

      const response = await request(app)
        .post('/api/menus')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send(menuData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testMenu = response.body.data.menu;
    });
  });

  describe('🔗 RBAC Assignments', () => {
    test('Assigner permission au rôle', async () => {
      const response = await request(app)
        .post(`/api/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          permissions: [testPermission.id]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Vérifier l'assignation
      const verifyResponse = await request(app)
        .get(`/api/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      expect(verifyResponse.body.data.permissions).toHaveLength(1);
      expect(verifyResponse.body.data.permissions[0].id).toBe(testPermission.id);
    });

    test('Assigner permission au menu', async () => {
      const response = await request(app)
        .post(`/api/menus/${testMenu.id}/permissions`)
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          permissions: [testPermission.id]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Assigner rôle au manager', async () => {
      const response = await request(app)
        .post('/api/authorizations/user')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUsers[1].id,
          roleId: testRole.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('🔍 Permission Verification', () => {
    test('Admin a toutes les permissions', async () => {
      const response = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          permission: 'rbac.test.read',
          resource: 'rbac_test',
          action: 'read'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasPermission', true);
    });

    test('Manager a la permission assignée', async () => {
      // Rafraîchir le token pour prendre en compte les nouvelles permissions
      const refreshResponse = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: managerTokens.refreshToken
        })
        .expect(200);

      managerTokens = refreshResponse.body.data;

      const response = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${managerTokens.token}`)
        .send({
          permission: 'rbac.test.read',
          resource: 'rbac_test',
          action: 'read'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasPermission', true);
    });

    test('User simple n a pas la permission', async () => {
      const response = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${userTokens.token}`)
        .send({
          permission: 'rbac.test.read',
          resource: 'rbac_test',
          action: 'read'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasPermission', false);
    });
  });

  describe('📋 Menu Access Control', () => {
    test('Admin a accès à tous les menus', async () => {
      const response = await request(app)
        .get(`/api/menus/user/${testUsers[0].id}`)
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data.menus)).toBe(true);
    });

    test('Manager a accès au menu de test', async () => {
      const response = await request(app)
        .post('/api/authorizations/check/menu')
        .set('Authorization', `Bearer ${managerTokens.token}`)
        .send({
          menuId: testMenu.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasAccess', true);
    });

    test('User simple n a pas accès au menu de test', async () => {
      const response = await request(app)
        .post('/api/authorizations/check/menu')
        .set('Authorization', `Bearer ${userTokens.token}`)
        .send({
          menuId: testMenu.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasAccess', false);
    });
  });

  describe('🎯 Role-Based Access', () => {
    test('Vérifier le rôle le plus élevé', async () => {
      const response = await request(app)
        .get(`/api/authorizations/user/${testUsers[1].id}/highest-role`)
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('highestRole');
      expect(response.body.data.highestRole.id).toBe(testRole.id);
    });

    test('Vérifier si utilisateur a un rôle spécifique', async () => {
      const response = await request(app)
        .post('/api/authorizations/check/role')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUsers[1].id,
          roleName: testRole.name
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasRole', true);
    });

    test('Vérifier si utilisateur est admin', async () => {
      const response = await request(app)
        .post('/api/authorizations/check/admin')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUsers[0].id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('isAdmin', true);
    });
  });

  describe('🚫 Access Denial Tests', () => {
    test('Manager ne peut pas créer de rôles', async () => {
      const roleData = {
        name: 'Unauthorized Role',
        description: 'Ce rôle ne devrait pas être créé',
        level: 75
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${managerTokens.token}`)
        .send(roleData)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    test('User ne peut pas supprimer des permissions', async () => {
      const response = await request(app)
        .delete(`/api/permissions/${testPermission.id}`)
        .set('Authorization', `Bearer ${userTokens.token}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    test('Accès refusé sans token', async () => {
      const response = await request(app)
        .get('/api/roles')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('🔄 RBAC Cache Management', () => {
    test('Mettre en cache les autorisations', async () => {
      const response = await request(app)
        .post('/api/authorizations/cache')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUsers[1].id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Authorizations cached successfully');
    });

    test('Invalider le cache des autorisations', async () => {
      const response = await request(app)
        .post('/api/authorizations/cache/invalidate')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUsers[1].id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Authorization cache invalidated');
    });
  });

  describe('📊 RBAC Statistics', () => {
    test('Statistiques des rôles', async () => {
      const response = await request(app)
        .get('/api/roles/admin/stats')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalRoles');
      expect(response.body.data).toHaveProperty('activeRoles');
    });

    test('Statistiques des permissions', async () => {
      const response = await request(app)
        .get('/api/permissions/admin/stats')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalPermissions');
    });

    test('Statistiques des menus', async () => {
      const response = await request(app)
        .get('/api/menus/admin/stats')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalMenus');
    });
  });
});

async function cleanupRbacTestData() {
  try {
    // Supprimer dans l'ordre inverse pour respecter les contraintes de clés étrangères
    await connection.query('DELETE FROM authorizations WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%rbac%@test.com\')');
    await connection.query('DELETE FROM menu_permissions WHERE menu_id IN (SELECT id FROM menus WHERE name LIKE \'%RBAC Test%\')');
    await connection.query('DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name LIKE \'%RBAC Test%\')');
    await connection.query('DELETE FROM menus WHERE name LIKE \'%RBAC Test%\'');
    await connection.query('DELETE FROM permissions WHERE name LIKE \'%rbac.test%\'');
    await connection.query('DELETE FROM roles WHERE name LIKE \'%RBAC Test%\'');
    await connection.query('DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%rbac%@test.com\')');
    await connection.query('DELETE FROM users WHERE email LIKE \'%rbac%@test.com\'');
    await connection.query('DELETE FROM people WHERE email LIKE \'%rbac%@test.com\'');
    console.log('🧹 RBAC test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up RBAC test data:', error);
  }
}
