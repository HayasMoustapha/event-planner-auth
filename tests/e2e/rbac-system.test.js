const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const { connection } = require('../../src/config/database');
const serviceContainer = require('../../src/services');

describe('🛡️ E2E Tests - RBAC System (4 rôles)', () => {
  let adminTokens = null;
  let adminUserId = null;
  let organizerTokens = null;
  let designerTokens = null;
  let userTokens = null;
  let testUsers = [];

  beforeAll(async () => {
    await serviceContainer.initialize();
    await cleanupRbacTestData();
    await setupTestUsers();
  });

  afterAll(async () => {
    await cleanupRbacTestData();
    try {
      const cacheService = serviceContainer.get('cacheService');
      await cacheService.close();
    } catch (error) {
      // no-op: cache may not be initialized in some test runs
    }
  });

  async function createUserDirect(userData) {
    const personResult = await connection.query(
      `INSERT INTO people (first_name, last_name, email, phone, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
       RETURNING id`,
      [userData.first_name, userData.last_name, userData.email, userData.phone]
    );

    const personId = personResult.rows[0].id;
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const userCode = `RBAC_${userData.roleCode.toUpperCase()}_${Date.now()}`;

    const userResult = await connection.query(
      `INSERT INTO users (person_id, user_code, username, email, phone, password, status, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW(), NOW())
       RETURNING id`,
      [personId, userCode, userData.username, userData.email, userData.phone, passwordHash]
    );

    const userId = userResult.rows[0].id;

    const roleResult = await connection.query(
      'SELECT id FROM roles WHERE code = $1 AND deleted_at IS NULL',
      [userData.roleCode]
    );
    const roleId = roleResult.rows[0]?.id;

    await connection.query(
      `INSERT INTO accesses (user_id, role_id, status, created_at, updated_at)
       VALUES ($1, $2, 'active', NOW(), NOW())
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );

    return userId;
  }

  async function setupTestUsers() {
    // Super admin existant (seed)
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@eventplanner.com', password: 'Admin123!' })
      .expect(200);
    adminTokens = adminLogin.body.data;

    const adminMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminTokens.token}`)
      .expect(200);
    adminUserId = adminMe.body?.data?.user?.id || null;

    const users = [
      {
        email: 'rbacorganizer@test.com',
        username: 'rbacorganizer',
        password: 'Organizer123!',
        first_name: 'Organizer',
        last_name: 'RBAC',
        phone: '+33611111111',
        roleCode: 'organizer'
      },
      {
        email: 'rbacdesigner@test.com',
        username: 'rbacdesigner',
        password: 'Designer123!',
        first_name: 'Designer',
        last_name: 'RBAC',
        phone: '+33622222222',
        roleCode: 'designer'
      },
      {
        email: 'rbacuser@test.com',
        username: 'rbacuser',
        password: 'User123!',
        first_name: 'User',
        last_name: 'RBAC',
        phone: '+33633333333',
        roleCode: 'user'
      }
    ];

    for (const userData of users) {
      const userId = await createUserDirect(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      testUsers.push({
        id: userId,
        tokens: loginResponse.body.data,
        roleCode: userData.roleCode
      });
    }

    organizerTokens = testUsers.find(u => u.roleCode === 'organizer').tokens;
    designerTokens = testUsers.find(u => u.roleCode === 'designer').tokens;
    userTokens = testUsers.find(u => u.roleCode === 'user').tokens;
  }

  describe('✅ Accès Autorisé (par rôle)', () => {
    test('Super Admin peut accéder aux routes admin', async () => {
      await request(app)
        .get('/api/realtime/stats')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .expect(200);

      await request(app)
        .post('/api/realtime/test')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({ message: 'rbac-test' })
        .expect(200);

      if (adminUserId) {
        await request(app)
          .get(`/api/admin/users/${adminUserId}/permissions`)
          .set('Authorization', `Bearer ${adminTokens.token}`)
          .expect(200);
      }
    });

    test('Organizer peut accéder aux routes utilisateur', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${organizerTokens.token}`)
        .expect(200);

      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${organizerTokens.token}`)
        .expect(200);

      await request(app)
        .get('/api/accesses/business-roles')
        .set('Authorization', `Bearer ${organizerTokens.token}`)
        .expect(200);
    });

    test('Designer peut accéder aux routes utilisateur', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${designerTokens.token}`)
        .expect(200);

      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${designerTokens.token}`)
        .expect(200);

      await request(app)
        .get('/api/accesses/business-roles')
        .set('Authorization', `Bearer ${designerTokens.token}`)
        .expect(200);
    });

    test('User peut accéder aux routes utilisateur', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userTokens.token}`)
        .expect(200);

      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userTokens.token}`)
        .expect(200);

      await request(app)
        .get('/api/accesses/business-roles')
        .set('Authorization', `Bearer ${userTokens.token}`)
        .expect(200);
    });
  });

  describe('🚫 Accès Refusé (RBAC)', () => {
    test('Organizer ne peut pas accéder aux routes admin', async () => {
      await request(app)
        .get('/api/realtime/stats')
        .set('Authorization', `Bearer ${organizerTokens.token}`)
        .expect(403);
    });

    test('Designer ne peut pas accéder aux routes admin', async () => {
      await request(app)
        .post('/api/realtime/test')
        .set('Authorization', `Bearer ${designerTokens.token}`)
        .send({ message: 'rbac-test' })
        .expect(403);
    });

    test('User ne peut pas accéder aux routes admin', async () => {
      if (adminUserId) {
        await request(app)
          .get(`/api/admin/users/${adminUserId}/permissions`)
          .set('Authorization', `Bearer ${userTokens.token}`)
          .expect(403);
      }
    });

    test('Accès refusé sans token', async () => {
      await request(app)
        .get('/api/roles')
        .expect(401);
    });
  });
});

async function cleanupRbacTestData() {
  try {
    await connection.query("DELETE FROM accesses WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%rbac%@test.com%')");
    await connection.query("DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%rbac%@test.com%')");
    await connection.query("DELETE FROM users WHERE email LIKE '%rbac%@test.com%'");
    await connection.query("DELETE FROM people WHERE email LIKE '%rbac%@test.com%'");
    console.log('🧹 RBAC test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up RBAC test data:', error);
  }
}
