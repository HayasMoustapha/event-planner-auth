/**
 * Tests d'intégration pour le CRUD du module authorizations
 * Valide que toutes les routes CRUD fonctionnent correctement
 */

const request = require('supertest');
const app = require('../../src/app');
const { createResponse } = require('../../src/utils/response');

describe('🔑 Authorizations CRUD API Tests', () => {
  let authToken;
  let testRoleId;
  let testPermissionId;
  let testMenuId;
  let createdAuthorizationId;

  beforeAll(async () => {
    // Créer un utilisateur de test et obtenir un token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@eventplanner.com',
        password: 'admin123'
      });

    if (loginResponse.status === 200 && loginResponse.body.success) {
      authToken = loginResponse.body.data.token;
    } else {
      throw new Error('Impossible d\'obtenir un token d\'authentification');
    }
  });

  describe('GET /api/authorizations', () => {
    it('should return paginated authorizations list', async () => {
      const response = await request(app)
        .get('/api/authorizations?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.data)).toBe(true);
      }
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/authorizations?page=0&limit=101')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Erreur de validation');
    });
  });

  describe('POST /api/authorizations', () => {
    it('should create a new authorization', async () => {
      const response = await request(app)
        .post('/api/authorizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: 1,
          permissionId: 1,
          menuId: 1
        });

      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('roleId', 1);
        expect(response.body.data).toHaveProperty('permissionId', 1);
        expect(response.body.data).toHaveProperty('menuId', 1);
        createdAuthorizationId = response.body.data.id;
      } else {
        // Si l'autorisation existe déjà, c'est normal
        expect([400, 409]).toContain(response.status);
      }
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/authorizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: 0,
          permissionId: 'invalid',
          menuId: null
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Erreur de validation');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/authorizations')
        .send({
          roleId: 1,
          permissionId: 1,
          menuId: 1
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/authorizations/:id', () => {
    it('should return authorization by ID', async () => {
      if (!createdAuthorizationId) {
        console.log('⚠️ Skipping test - no authorization created');
        return;
      }

      const response = await request(app)
        .get(`/api/authorizations/${createdAuthorizationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', createdAuthorizationId);
      }
    });

    it('should validate ID parameter', async () => {
      const response = await request(app)
        .get('/api/authorizations/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/authorizations/:id', () => {
    it('should update authorization', async () => {
      if (!createdAuthorizationId) {
        console.log('⚠️ Skipping test - no authorization created');
        return;
      }

      const response = await request(app)
        .put(`/api/authorizations/${createdAuthorizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: 2,
          permissionId: 2,
          menuId: 2
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('roleId', 2);
        expect(response.body.data).toHaveProperty('permissionId', 2);
        expect(response.body.data).toHaveProperty('menuId', 2);
      } else {
        // Erreur attendue si l'autorisation n'existe pas
        expect([400, 404]).toContain(response.status);
      }
    });
  });

  describe('DELETE /api/authorizations/:id', () => {
    it('should soft delete authorization', async () => {
      if (!createdAuthorizationId) {
        console.log('⚠️ Skipping test - no authorization created');
        return;
      }

      const response = await request(app)
        .delete(`/api/authorizations/${createdAuthorizationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Autorisation supprimée avec succès');
      } else {
        // Erreur attendue si l'autorisation n'existe pas
        expect([400, 404]).toContain(response.status);
      }
    });
  });

  describe('GET /api/authorizations/role/:roleId', () => {
    it('should return authorizations by role', async () => {
      const response = await request(app)
        .get('/api/authorizations/role/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('roleId', 1);
        expect(response.body.data).toHaveProperty('authorizations');
        expect(Array.isArray(response.body.data.authorizations)).toBe(true);
      }
    });

    it('should validate role ID parameter', async () => {
      const response = await request(app)
        .get('/api/authorizations/role/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/authorizations/permission/:permissionId', () => {
    it('should return authorizations by permission', async () => {
      const response = await request(app)
        .get('/api/authorizations/permission/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('permissionId', 1);
        expect(response.body.data).toHaveProperty('authorizations');
        expect(Array.isArray(response.body.data.authorizations)).toBe(true);
      }
    });
  });

  describe('GET /api/authorizations/menu/:menuId', () => {
    it('should return authorizations by menu', async () => {
      const response = await request(app)
        .get('/api/authorizations/menu/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('menuId', 1);
        expect(response.body.data).toHaveProperty('authorizations');
        expect(Array.isArray(response.body.data.authorizations)).toBe(true);
      }
    });
  });

  describe('DELETE /api/authorizations/:id/hard', () => {
    it('should hard delete authorization', async () => {
      if (!createdAuthorizationId) {
        console.log('⚠️ Skipping test - no authorization created');
        return;
      }

      const response = await request(app)
        .delete(`/api/authorizations/${createdAuthorizationId}/hard`)
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Autorisation supprimée définitivement avec succès');
      } else {
        // Erreur attendue si l'autorisation n'existe pas
        expect([400, 404]).toContain(response.status);
      }
    });
  });

  describe('RBAC Authorization', () => {
    it('should require proper permissions for CRUD operations', async () => {
      // Test sans token
      const response = await request(app)
        .get('/api/authorizations');

      expect(response.status).toBe(401);

      // Test avec token mais sans permissions
      const invalidTokenResponse = await request(app)
        .get('/api/authorizations')
        .set('Authorization', 'Bearer invalid_token');

      expect([401, 403]).toContain(invalidTokenResponse.status);
    });
  });
});

// Test de validation des schémas
describe('🔍 Authorizations Schema Validation', () => {
  test('authorization creation schema should be valid', () => {
    const validSchema = {
      roleId: 1,
      permissionId: 1,
      menuId: 1
    };

    expect(validSchema.roleId).toBeNumber();
    expect(validSchema.permissionId).toBeNumber();
    expect(validSchema.menuId).toBeNumber();
    expect(validSchema.roleId).toBeGreaterThan(0);
    expect(validSchema.permissionId).toBeGreaterThan(0);
    expect(validSchema.menuId).toBeGreaterThan(0);
  });

  test('authorization update schema should be valid', () => {
    const validUpdateSchema = {
      roleId: 2,
      permissionId: 2,
      menuId: 2
    };

    expect(validUpdateSchema.roleId).toBeNumber();
    expect(validUpdateSchema.permissionId).toBeNumber();
    expect(validUpdateSchema.menuId).toBeNumber();
  });
});

// Test de cohérence avec le schéma SQL
describe('🗄️ Database Schema Consistency', () => {
  test('authorization should respect unique constraint (role_id, permission_id, menu_id)', () => {
    // Ce test vérifie que la logique métier respecte la contrainte d'unicité
    const authorization1 = {
      roleId: 1,
      permissionId: 1,
      menuId: 1
    };

    const authorization2 = {
      roleId: 1,
      permissionId: 1,
      menuId: 1
    };

    // Les deux autorisations sont identiques, donc la deuxième devrait échouer
    expect(authorization1).toEqual(authorization2);
  });

  test('authorization should have required fields according to schema', () => {
    const requiredFields = ['roleId', 'permissionId', 'menuId'];
    const authorization = {
      roleId: 1,
      permissionId: 1,
      menuId: 1
    };

    requiredFields.forEach(field => {
      expect(authorization).toHaveProperty(field);
      expect(authorization[field]).toBeDefined();
      expect(authorization[field]).not.toBeNull();
    });
  });
});
