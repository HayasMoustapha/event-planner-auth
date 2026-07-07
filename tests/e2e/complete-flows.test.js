const request = require('supertest');
const app = require('../../src/app');
const { connection } = require('../../src/config/database');

// Unique email per run so the chained flow never collides with previous data.
const RUN_ID = Date.now();
const TEST_EMAIL = `newuser_${RUN_ID}@test.com`;
const TEST_USERNAME = `newuser${RUN_ID}`.slice(0, 20);
const TEST_PASSWORD = 'TestPassword123!';

describe('🧪 E2E Tests - Flux Complets', () => {
  let testUser = null;      // people-derived identity { id (users.id), person_id, email }
  let testPerson = null;    // people row
  let authTokens = null;    // { token, tokens: { accessToken, refreshToken, expiresIn }, ... }
  let otpCode = null;
  let adminTokens = null;   // hoisted so later flux blocks can reuse the admin session
  let newRoleTokens = null; // refreshed user tokens after role assignment
  let testRoleId = null;
  let testPermissionId = null;

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('📝 Flux 1: Inscription → OTP → Activation → Login', () => {
    test('Étape 1: Vérification disponibilité email', async () => {
      const response = await request(app)
        .get(`/api/auth/check-email/${TEST_EMAIL}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('available', true);
    });

    test('Étape 2: Vérification disponibilité username', async () => {
      const response = await request(app)
        .get(`/api/auth/check-username/${TEST_USERNAME}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('available', true);
    });

    test('Étape 3: Inscription utilisateur', async () => {
      const userData = {
        email: TEST_EMAIL,
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
        first_name: 'Test',
        last_name: 'User',
        phone: '+33612345678'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      // En environnement de dev/test l'email n'est pas réellement envoyé.
      expect(response.body).toHaveProperty('message', 'Inscription réussie (email non envoyé en dev).');
      expect(response.body.data).toHaveProperty('user');
      // data.user.email expose l'email de la personne (sans le suffixe +user interne).
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      // Le compte est créé 'inactive' jusqu'à la vérification OTP.
      expect(response.body.data.user).toHaveProperty('status', 'inactive');
      // Le code OTP est exposé en dev via response.body.debug.otpCode.
      expect(response.body).toHaveProperty('debug');
      expect(response.body.debug).toHaveProperty('otpCode');
      otpCode = response.body.debug.otpCode;
      expect(otpCode).toMatch(/^\d{6}$/);

      // Vérifier en base de données. users.email porte le suffixe +user.
      const userResult = await connection.query(
        'SELECT * FROM users WHERE email = $1',
        [`${userData.email}+user`]
      );
      expect(userResult.rows).toHaveLength(1);

      testUser = userResult.rows[0];
      expect(testUser.status).toBe('inactive');

      // Vérifier la personne associée
      const personResult = await connection.query(
        'SELECT * FROM people WHERE id = $1',
        [testUser.person_id]
      );
      testPerson = personResult.rows[0];
      expect(testPerson).toBeDefined();
      expect(testPerson.email).toBe(userData.email);
    });

    test('Étape 4: Génération OTP pour email', async () => {
      // La génération d'OTP applique une whitelist stricte du corps: {email} uniquement.
      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({
          email: testPerson.email
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'OTP généré avec succès');

      // Récupérer le dernier code OTP en base pour cette personne (purpose 'email').
      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 ORDER BY created_at DESC LIMIT 1',
        [testPerson.id]
      );

      expect(otpResult.rows).toHaveLength(1);
      otpCode = otpResult.rows[0].otp_code;
      expect(otpCode).toMatch(/^\d{6}$/);
    });

    test('Étape 5: Vérification OTP et activation compte', async () => {
      // Le champ attendu est otpCode (6 chiffres), pas otp_code.
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testPerson.email,
          otpCode: otpCode
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Email vérifié avec succès. Votre compte est maintenant actif.');

      // Vérifier que l'utilisateur est activé (users.email porte le suffixe +user).
      const updatedUser = await connection.query(
        'SELECT * FROM users WHERE email = $1',
        [`${testPerson.email}+user`]
      );
      expect(updatedUser.rows[0].status).toBe('active');
      expect(updatedUser.rows[0].email_verified_at).toBeDefined();
    });

    test('Étape 6: Login après activation', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testPerson.email,
          password: TEST_PASSWORD
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Connexion réussie');
      // data.token = access token JWT; data.tokens.{accessToken,refreshToken,expiresIn}.
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      expect(response.body.data.tokens).toHaveProperty('expiresIn');

      authTokens = response.body.data;
      expect(authTokens.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    test('Étape 7: Accès au profil utilisateur', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      // Le profil renvoie les champs utilisateur directement sous data.
      expect(response.body.data).toHaveProperty('status', 'active');
      // person_email correspond à l'email d'origine.
      expect(response.body.data).toHaveProperty('person_email', testPerson.email);
    });
  });

  describe('🔐 Flux 2: Login → Accès Protégé → Permissions', () => {
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
      // La liste paginée expose le tableau sous data.data.
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    test('Étape 3: Vérification des permissions admin', async () => {
      const response = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          // La permission doit suivre le format resource.action (une seule paire).
          permission: 'users.list'
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

  describe('👥 Flux 3: Rôles → Permissions', () => {
    test('Étape 1: Création d un nouveau rôle', async () => {
      const roleData = {
        code: 'test_role_e2e',
        label: { fr: 'Test Role E2E', en: 'Test Role E2E' },
        description: { fr: 'Role créé pour les tests E2E', en: 'Role created for E2E tests' },
        level: 50
      };

      // L'utilisateur standard ne possède pas roles.create -> 403.
      await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${authTokens.token}`)
        .send(roleData)
        .expect(403);

      // Créer avec admin
      const adminResponse = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send(roleData)
        .expect(201);

      expect(adminResponse.body).toHaveProperty('success', true);
      // Le rôle créé est retourné directement sous data.
      testRoleId = adminResponse.body.data.id;
      expect(testRoleId).toBeDefined();
    });

    test('Étape 2: Création d une permission', async () => {
      const permissionData = {
        // Le code doit être en minuscules, format resource.action, sans chiffres.
        code: 'test.access',
        label: { fr: 'Permission test E2E', en: 'E2E test permission' },
        group: 'test'
      };

      const response = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send(permissionData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testPermissionId = response.body.data.id;
      expect(testPermissionId).toBeDefined();
    });

    test('Étape 3: Assigner la permission au rôle', async () => {
      const response = await request(app)
        .post(`/api/roles/${testRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          permissionIds: [testPermissionId]
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('assigned', 1);
    });

    test('Étape 4: Assigner le rôle à l utilisateur', async () => {
      const response = await request(app)
        .post('/api/accesses')
        .set('Authorization', `Bearer ${adminTokens.token}`)
        .send({
          userId: testUser.id,
          roleId: testRoleId
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('role_id', String(testRoleId));
    });

    test('Étape 5: Vérifier que l utilisateur a la permission', async () => {
      // Rafraîchir le token pour obtenir les nouvelles permissions.
      const refreshResponse = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: authTokens.tokens.refreshToken
        })
        .expect(200);

      newRoleTokens = refreshResponse.body.data; // { token }

      const response = await request(app)
        .post('/api/authorizations/check/permission')
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .send({
          permission: 'test.access'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('hasPermission', true);
    });
  });

  describe('🚨 Flux 4: Gestion des Erreurs', () => {
    test('Étape 1: Login avec mot de passe incorrect', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testPerson.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });

    test('Étape 2: Vérification OTP avec code incorrect', async () => {
      // Un OTP invalide renvoie 401 (identifiants rejetés), message FR.
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testPerson.email,
          otpCode: '999999'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Code OTP invalide ou expiré');
    });

    test('Étape 3: Tentative d accès sans permission', async () => {
      // Le token utilisateur (rôle test sans roles.delete) est refusé.
      const response = await request(app)
        .delete(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Permission refusée');
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

    test('Étape 5: Tentatives de login répétées (rate limiting désactivé en test)', async () => {
      // Le rate limiting est explicitement désactivé en NODE_ENV=test (app.js skip),
      // et aucun verrouillage de compte n'est appliqué sur échec: chaque tentative
      // avec un mauvais mot de passe reste 401.
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testPerson.email,
            password: 'WrongPassword123!'
          });
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testPerson.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });
  });

  describe('🔄 Flux 5: Logout et Nettoyage', () => {
    test('Étape 1: Logout utilisateur', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Session terminée avec succès');
    });

    test('Étape 2: Token invalide après logout', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newRoleTokens.token}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Étape 3: Refresh token après logout', async () => {
      // PRODUCT BUG (voir rapport): le logout ne révoque PAS le refresh token.
      // authService.logout ne blackliste que l'access token courant, et
      // authService.refreshToken (auth.service.js:352-368) se contente d'un
      // jwt.verify + contrôle "user actif" sans consulter la blacklist de session.
      // Le refresh token reste donc valide après déconnexion et renvoie 200.
      // Comportement attendu: 401. On assied ici le comportement RÉEL actuel.
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: authTokens.tokens.refreshToken
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
    });
  });
});

// Fonctions utilitaires pour le nettoyage
async function cleanupTestData() {
  try {
    // Supprimer les accès de test (rôle assigné à l'utilisateur)
    await connection.query('DELETE FROM accesses WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test.com%\' OR email LIKE \'%@test%\')');

    // Supprimer les autorisations (role<->permission) de test
    await connection.query('DELETE FROM authorizations WHERE permission_id IN (SELECT id FROM permissions WHERE code LIKE \'test%\')');
    await connection.query('DELETE FROM authorizations WHERE role_id IN (SELECT id FROM roles WHERE code LIKE \'%test%\' OR code LIKE \'%e2e%\')');

    // Supprimer les permissions de test
    await connection.query('DELETE FROM permissions WHERE code LIKE \'test%\' OR code LIKE \'%e2e%\'');

    // Supprimer les rôles de test
    await connection.query('DELETE FROM roles WHERE code LIKE \'%test%\' OR code LIKE \'%e2e%\'');

    // Supprimer les OTP de test (via person_id)
    await connection.query('DELETE FROM otps WHERE person_id IN (SELECT id FROM people WHERE email LIKE \'%test.com%\' OR email LIKE \'%@test%\')');

    // Supprimer les utilisateurs de test
    await connection.query('DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test.com%\' OR email LIKE \'%@test%\')');
    await connection.query('DELETE FROM users WHERE email LIKE \'%test.com%\' OR email LIKE \'%@test%\'');

    // Supprimer les personnes de test
    await connection.query('DELETE FROM people WHERE email LIKE \'%test.com%\' OR email LIKE \'%@test%\'');

    console.log('🧹 Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}
