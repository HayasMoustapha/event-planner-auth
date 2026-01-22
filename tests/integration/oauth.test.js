const request = require('supertest');
const app = require('../../src/app');
const { getDatabase } = require('../../src/config/database');

describe('OAuth Integration Tests', () => {
  let db;
  
  beforeAll(async () => {
    db = getDatabase();
  });

  afterAll(async () => {
    if (db) {
      await db.end();
    }
  });

  beforeEach(async () => {
    // Nettoyer les tables de test
    await db.query('DELETE FROM user_identities WHERE email LIKE \'test_%\'');
    await db.query('DELETE FROM users WHERE email LIKE \'test_%\'');
    await db.query('DELETE FROM people WHERE email LIKE \'test_%\'');
  });

  describe('POST /api/auth/oauth/google', () => {
    const validGoogleToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3Qta2V5LWlkIiwidHlwIjoiUlNBU0cifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXVkIjoidGVzdC1jbGllbnQtaWQiLCJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0X2dvb2dsZUBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiVGVzdCBVc2VyIiwiZ2l2ZW5fbmFtZSI6IlRlc3QiLCJmYW1pbHlfbmFtZSI6IlVzZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9waG90by5qcGciLCJsb2NhbGUiOiJlbiIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5OX0.invalid-signature';

    test('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/google')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('GOOGLE_TOKEN_REQUIRED');
    });

    test('should reject invalid token format', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/google')
        .send({ idToken: 'invalid-token' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_JWT_FORMAT');
    });

    test('should reject oversized token', async () => {
      const oversizedToken = 'a'.repeat(3000);
      const response = await request(app)
        .post('/api/auth/oauth/google')
        .send({ idToken: oversizedToken })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_TOKEN_SIZE');
    });

    test('should handle Google token verification failure', async () => {
      // Mock l'environnement pour les tests
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      const response = await request(app)
        .post('/api/auth/oauth/google')
        .send({ idToken: validGoogleToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('GOOGLE_TOKEN_INVALID');
    });
  });

  describe('POST /api/auth/oauth/apple', () => {
    const validAppleToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2V5LWlkIn0.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoidGVzdC1jbGllbnQtaWQiLCJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0X2FwcGxlQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5OX0.invalid-signature';

    test('should reject request without identity token', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/apple')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('APPLE_IDENTITY_TOKEN_REQUIRED');
    });

    test('should reject invalid token format', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/apple')
        .send({ identityToken: 'invalid-token' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_JWT_FORMAT');
    });

    test('should handle Apple token verification failure', async () => {
      // Mock l'environnement pour les tests
      process.env.APPLE_CLIENT_ID = 'test-client-id';
      process.env.APPLE_TEAM_ID = 'test-team-id';
      process.env.APPLE_KEY_ID = 'test-key-id';
      process.env.APPLE_PRIVATE_KEY = 'test-private-key';

      const response = await request(app)
        .post('/api/auth/oauth/apple')
        .send({ identityToken: validAppleToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('APPLE_TOKEN_INVALID');
    });
  });

  describe('GET /api/auth/oauth/config', () => {
    test('should return OAuth configuration status', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.configuration).toBeDefined();
      expect(response.body.data.configuration.google).toBeDefined();
      expect(response.body.data.configuration.apple).toBeDefined();
    });

    test('should show missing configuration', async () => {
      // Supprimer les variables d'environnement
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.APPLE_CLIENT_ID;
      delete process.env.APPLE_TEAM_ID;
      delete process.env.APPLE_KEY_ID;
      delete process.env.APPLE_PRIVATE_KEY;

      const response = await request(app)
        .get('/api/auth/oauth/config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.configuration.google.configured).toBe(false);
      expect(response.body.data.configuration.apple.configured).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to OAuth endpoints', async () => {
      const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signature';

      // Envoyer plusieurs requêtes rapidement
      const requests = Array(15).fill().map(() =>
        request(app)
          .post('/api/auth/oauth/google')
          .send({ idToken: token })
      );

      const responses = await Promise.all(requests);
      
      // Au moins une requête devrait être limitée
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      const rateLimitedResponse = rateLimitedResponses[0];
      expect(rateLimitedResponse.body.code).toBe('OAUTH_RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Security Headers', () => {
    test('should reject requests without User-Agent', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/google')
        .set('User-Agent', '')
        .send({ idToken: 'valid.token.format' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_USER_AGENT');
    });

    test('should reject requests with suspicious User-Agent', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/google')
        .set('User-Agent', 'bot')
        .send({ idToken: 'valid.token.format' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_USER_AGENT');
    });
  });

  describe('CORS Protection', () => {
    test('should reject unauthorized origins', async () => {
      // Mock une origine non autorisée
      process.env.CORS_ORIGIN = 'https://trusted-domain.com';

      const response = await request(app)
        .post('/api/auth/oauth/google')
        .set('Origin', 'https://malicious-domain.com')
        .send({ idToken: 'valid.token.format' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_ORIGIN');
    });

    test('should allow authorized origins', async () => {
      process.env.CORS_ORIGIN = 'https://trusted-domain.com';

      const response = await request(app)
        .post('/api/auth/oauth/google')
        .set('Origin', 'https://trusted-domain.com')
        .send({ idToken: 'valid.token.format' });
        
      // La requête devrait passer la validation CORS (échouera plus tard sur le token)
      expect(response.status).not.toBe(403);
    });
  });
});

describe('OAuth Service Unit Tests', () => {
  const oauthService = require('../../src/modules/oauth/oauth.service');

  describe('checkConfiguration', () => {
    test('should return configuration status', () => {
      const config = oauthService.checkConfiguration();
      
      expect(config).toBeDefined();
      expect(config.google).toBeDefined();
      expect(config.apple).toBeDefined();
      expect(typeof config.google.configured).toBe('boolean');
      expect(typeof config.apple.configured).toBe('boolean');
    });
  });
});

describe('OAuth Middleware Tests', () => {
  const OAuthMiddleware = require('../../src/middlewares/oauth.middleware');

  describe('getAllowedOrigins', () => {
    test('should handle single origin', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      const origins = OAuthMiddleware.getAllowedOrigins();
      expect(origins).toEqual(['https://example.com']);
    });

    test('should handle multiple origins', () => {
      process.env.CORS_ORIGIN = 'https://example.com,https://trusted.com';
      const origins = OAuthMiddleware.getAllowedOrigins();
      expect(origins).toEqual(['https://example.com', 'https://trusted.com']);
    });

    test('should handle wildcard origin', () => {
      process.env.CORS_ORIGIN = '*';
      const origins = OAuthMiddleware.getAllowedOrigins();
      expect(origins).toEqual(['*']);
    });
  });
});
