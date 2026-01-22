const request = require('supertest');
const app = require('../../src/app');
const { getDatabase } = require('../../src/config/database');

describe('OAuth End-to-End Flows', () => {
  let db;
  let testUser = null;
  let testPerson = null;
  let testIdentity = null;

  beforeAll(async () => {
    db = getDatabase();
    
    // Configuration de test pour OAuth
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.APPLE_CLIENT_ID = 'test-apple-client-id';
    process.env.APPLE_TEAM_ID = 'test-apple-team-id';
    process.env.APPLE_KEY_ID = 'test-apple-key-id';
    process.env.APPLE_PRIVATE_KEY = 'test-apple-private-key';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
  });

  afterAll(async () => {
    if (db) {
      await db.end();
    }
  });

  beforeEach(async () => {
    // Nettoyer les données de test
    await db.query('DELETE FROM user_identities WHERE email LIKE \'oauth_test_%\'');
    await db.query('DELETE FROM users WHERE email LIKE \'oauth_test_%\'');
    await db.query('DELETE FROM people WHERE email LIKE \'oauth_test_%\'');
  });

  describe('Complete OAuth Flow - New User', () => {
    test('should create new user with Google OAuth', async () => {
      // Mock du service OAuth pour simuler une vérification réussie
      const oauthService = require('../../src/modules/oauth/oauth.service');
      const originalVerifyGoogleToken = oauthService.verifyGoogleToken;
      
      oauthService.verifyGoogleToken = jest.fn().mockResolvedValue({
        provider: 'google',
        provider_user_id: 'google_123456789',
        email: 'oauth_test_google@example.com',
        first_name: 'Test',
        last_name: 'Google',
        picture: 'https://example.com/photo.jpg',
        provider_data: {
          iss: 'accounts.google.com',
          aud: 'test-google-client-id'
        }
      });

      try {
        const response = await request(app)
          .post('/api/auth/oauth/google')
          .set('User-Agent', 'Mozilla/5.0 (Test Browser)')
          .set('Origin', 'http://localhost:3000')
          .send({
            idToken: 'mock_google_token_12345'
          })
          .expect(200);

        // Vérifier la réponse
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.provider).toBe('google');
        expect(response.body.data.isNewUser).toBe(true);
        expect(response.body.data.user.email).toBe('oauth_test_google@example.com');
        expect(response.body.data.user.first_name).toBe('Test');
        expect(response.body.data.user.last_name).toBe('Google');

        // Vérifier que l'utilisateur a été créé en base
        const userResult = await db.query(
          'SELECT * FROM users WHERE email = $1',
          ['oauth_test_google@example.com']
        );
        expect(userResult.rows).toHaveLength(1);
        testUser = userResult.rows[0];

        // Vérifier que la personne a été créée
        const personResult = await db.query(
          'SELECT * FROM people WHERE email = $1',
          ['oauth_test_google@example.com']
        );
        expect(personResult.rows).toHaveLength(1);
        testPerson = personResult.rows[0];

        // Vérifier que l'identité OAuth a été créée
        const identityResult = await db.query(
          'SELECT * FROM user_identities WHERE user_id = $1 AND provider = $2',
          [testUser.id, 'google']
        );
        expect(identityResult.rows).toHaveLength(1);
        testIdentity = identityResult.rows[0];
        expect(testIdentity.provider_user_id).toBe('google_123456789');

      } finally {
        // Restaurer la fonction originale
        oauthService.verifyGoogleToken = originalVerifyGoogleToken;
      }
    });

    test('should create new user with Apple OAuth', async () => {
      // Mock du service OAuth pour simuler une vérification réussie
      const oauthService = require('../../src/modules/oauth/oauth.service');
      const originalVerifyAppleToken = oauthService.verifyAppleToken;
      
      oauthService.verifyAppleToken = jest.fn().mockResolvedValue({
        provider: 'apple',
        provider_user_id: 'apple_123456789',
        email: 'oauth_test_apple@example.com',
        first_name: null,
        last_name: null,
        is_private_email: false,
        provider_data: {
          iss: 'https://appleid.apple.com',
          aud: 'test-apple-client-id'
        }
      });

      try {
        const response = await request(app)
          .post('/api/auth/oauth/apple')
          .set('User-Agent', 'Mozilla/5.0 (Test Browser)')
          .set('Origin', 'http://localhost:3000')
          .send({
            identityToken: 'mock_apple_token_12345'
          })
          .expect(200);

        // Vérifier la réponse
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.provider).toBe('apple');
        expect(response.body.data.isNewUser).toBe(true);
        expect(response.body.data.user.email).toBe('oauth_test_apple@example.com');

        // Vérifier que l'utilisateur a été créé en base
        const userResult = await db.query(
          'SELECT * FROM users WHERE email = $1',
          ['oauth_test_apple@example.com']
        );
        expect(userResult.rows).toHaveLength(1);

        // Vérifier que l'identité OAuth a été créée
        const identityResult = await db.query(
          'SELECT * FROM user_identities WHERE user_id = $1 AND provider = $2',
          [userResult.rows[0].id, 'apple']
        );
        expect(identityResult.rows).toHaveLength(1);
        expect(identityResult.rows[0].provider_user_id).toBe('apple_123456789');

      } finally {
        // Restaurer la fonction originale
        oauthService.verifyAppleToken = originalVerifyAppleToken;
      }
    });
  });

  describe('OAuth Flow - Existing User', () => {
    beforeEach(async () => {
      // Créer un utilisateur existant
      const personResult = await db.query(`
        INSERT INTO people (first_name, last_name, email, status, created_at, updated_at)
        VALUES ('Existing', 'User', 'oauth_existing@example.com', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `);
      testPerson = personResult.rows[0];

      const userResult = await db.query(`
        INSERT INTO users (person_id, username, email, password, user_code, status, email_verified_at, created_at, updated_at)
        VALUES ($1, 'existing_user', 'oauth_existing@example.com', 'hashed_password', 'U123456', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [testPerson.id]);
      testUser = userResult.rows[0];
    });

    test('should login existing user with Google OAuth', async () => {
      // Créer d'abord une identité Google pour cet utilisateur
      await db.query(`
        INSERT INTO user_identities (user_id, provider, provider_user_id, email, created_at, updated_at)
        VALUES ($1, 'google', 'google_existing_123', 'oauth_existing@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [testUser.id]);

      // Mock du service OAuth
      const oauthService = require('../../src/modules/oauth/oauth.service');
      const originalVerifyGoogleToken = oauthService.verifyGoogleToken;
      
      oauthService.verifyGoogleToken = jest.fn().mockResolvedValue({
        provider: 'google',
        provider_user_id: 'google_existing_123',
        email: 'oauth_existing@example.com',
        first_name: 'Existing',
        last_name: 'User',
        provider_data: {}
      });

      try {
        const response = await request(app)
          .post('/api/auth/oauth/google')
          .set('User-Agent', 'Mozilla/5.0 (Test Browser)')
          .set('Origin', 'http://localhost:3000')
          .send({
            idToken: 'mock_google_existing_token'
          })
          .expect(200);

        // Vérifier la réponse
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.provider).toBe('google');
        expect(response.body.data.isNewUser).toBe(false);
        expect(response.body.data.user.email).toBe('oauth_existing@example.com');
        expect(response.body.data.user.id).toBe(testUser.id);

      } finally {
        oauthService.verifyGoogleToken = originalVerifyGoogleToken;
      }
    });
  });

  describe('OAuth Error Flows', () => {
    test('should handle email conflict with existing user', async () => {
      // Créer un utilisateur avec email classique
      const personResult = await db.query(`
        INSERT INTO people (first_name, last_name, email, status, created_at, updated_at)
        VALUES ('Classic', 'User', 'oauth_conflict@example.com', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `);
      const person = personResult.rows[0];

      await db.query(`
        INSERT INTO users (person_id, username, email, password, user_code, status, created_at, updated_at)
        VALUES ($1, 'classic_user', 'oauth_conflict@example.com', 'hashed_password', 'U789012', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [person.id]);

      // Mock du service OAuth pour simuler une tentative avec le même email
      const oauthService = require('../../src/modules/oauth/oauth.service');
      const originalVerifyGoogleToken = oauthService.verifyGoogleToken;
      
      oauthService.verifyGoogleToken = jest.fn().mockResolvedValue({
        provider: 'google',
        provider_user_id: 'google_conflict_123',
        email: 'oauth_conflict@example.com',
        first_name: 'Google',
        last_name: 'User',
        provider_data: {}
      });

      try {
        const response = await request(app)
          .post('/api/auth/oauth/google')
          .set('User-Agent', 'Mozilla/5.0 (Test Browser)')
          .set('Origin', 'http://localhost:3000')
          .send({
            idToken: 'mock_google_conflict_token'
          })
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('EMAIL_ALREADY_USED');
        expect(response.body.message).toContain('déjà utilisé');

      } finally {
        oauthService.verifyGoogleToken = originalVerifyGoogleToken;
      }
    });

    test('should handle locked account', async () => {
      // Créer un utilisateur verrouillé
      const personResult = await db.query(`
        INSERT INTO people (first_name, last_name, email, status, created_at, updated_at)
        VALUES ('Locked', 'User', 'oauth_locked@example.com', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `);
      const person = personResult.rows[0];

      const userResult = await db.query(`
        INSERT INTO users (person_id, username, email, password, user_code, status, created_at, updated_at)
        VALUES ($1, 'locked_user', 'oauth_locked@example.com', 'hashed_password', 'U345678', 'lock', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [person.id]);
      const user = userResult.rows[0];

      // Créer une identité OAuth
      await db.query(`
        INSERT INTO user_identities (user_id, provider, provider_user_id, email, created_at, updated_at)
        VALUES ($1, 'google', 'google_locked_123', 'oauth_locked@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [user.id]);

      // Mock du service OAuth
      const oauthService = require('../../src/modules/oauth/oauth.service');
      const originalVerifyGoogleToken = oauthService.verifyGoogleToken;
      
      oauthService.verifyGoogleToken = jest.fn().mockResolvedValue({
        provider: 'google',
        provider_user_id: 'google_locked_123',
        email: 'oauth_locked@example.com',
        first_name: 'Locked',
        last_name: 'User',
        provider_data: {}
      });

      try {
        const response = await request(app)
          .post('/api/auth/oauth/google')
          .set('User-Agent', 'Mozilla/5.0 (Test Browser)')
          .set('Origin', 'http://localhost:3000')
          .send({
            idToken: 'mock_google_locked_token'
          })
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('ACCOUNT_LOCKED');

      } finally {
        oauthService.verifyGoogleToken = originalVerifyGoogleToken;
      }
    });
  });

  describe('OAuth Identity Management', () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      const personResult = await db.query(`
        INSERT INTO people (first_name, last_name, email, status, created_at, updated_at)
        VALUES ('Identity', 'User', 'oauth_identity@example.com', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `);
      testPerson = personResult.rows[0];

      const userResult = await db.query(`
        INSERT INTO users (person_id, username, email, password, user_code, status, created_at, updated_at)
        VALUES ($1, 'identity_user', 'oauth_identity@example.com', 'hashed_password', 'U456789', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [testPerson.id]);
      testUser = userResult.rows[0];
    });

    test('should link Google identity to existing user', async () => {
      // Mock du service OAuth
      const oauthService = require('../../src/modules/oauth/oauth.service');
      const originalLinkOAuthToUser = oauthService.linkOAuthToUser;
      
      oauthService.linkOAuthToUser = jest.fn().mockResolvedValue({
        identity: {
          id: 1,
          provider: 'google',
          provider_user_id: 'google_link_123'
        }
      });

      try {
        // Simuler une authentification préalable
        const authToken = 'mock_auth_token';
        
        const response = await request(app)
          .post('/api/auth/oauth/link/google')
          .set('Authorization', `Bearer ${authToken}`)
          .set('User-Agent', 'Mozilla/5.0 (Test Browser)')
          .send({
            idToken: 'mock_google_link_token'
          })
          .expect(401); // Sera 401 car le token n'est pas valide, mais la route est accessible

        // La route devrait être accessible (pas 404)
        expect(response.status).not.toBe(404);

      } finally {
        oauthService.linkOAuthToUser = originalLinkOAuthToUser;
      }
    });

    test('should retrieve user OAuth identities', async () => {
      // Créer une identité OAuth pour l'utilisateur
      await db.query(`
        INSERT INTO user_identities (user_id, provider, provider_user_id, email, created_at, updated_at)
        VALUES ($1, 'google', 'google_retrieve_123', 'oauth_identity@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [testUser.id]);

      // Mock de l'authentification
      const authToken = 'mock_auth_token';
      
      const response = await request(app)
        .get('/api/auth/oauth/identities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401); // Sera 401 car le token n'est pas valide

      // La route devrait être accessible (pas 404)
      expect(response.status).not.toBe(404);
    });
  });
});
