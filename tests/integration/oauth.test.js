// De-quarantined: OAuth provider token verification (Google/Apple) is mocked at
// the module boundary so the real verification code path runs deterministically
// WITHOUT any network call to Google/Apple. The stale `getDatabase` import was
// replaced by the actual `connection` export of src/config/database.
//
// Provider mocking strategy:
//   - OAUTH_MOCK / *_OAUTH_MOCK forced to 'false' so the service does NOT take its
//     built-in dev mock shortcut and instead exercises the real verify* methods
//     and the security/config middlewares (token-format, config validation).
//   - google-auth-library.OAuth2Client.verifyIdToken is mocked to reject with an
//     `invalid_token` error -> service throws "Token Google invalide ou expiré"
//     -> OAuthErrorHandler maps to 401 GOOGLE_TOKEN_INVALID.
//   - axios.get (used by verifyAppleToken to fetch Apple's JWKS) is mocked to
//     reject with a `jwt`-containing message -> service throws "Token Apple
//     invalide ou expiré" -> OAuthErrorHandler maps to 401 APPLE_TOKEN_INVALID.
// No src/ changes; provider mocks are test-file scope.

// Force real verification path (disable the service's built-in dev mock) BEFORE
// the app / oauth.service module graph is required. This activates the real
// token-format, config-validation and verification middlewares.
process.env.OAUTH_MOCK = 'false';
process.env.GOOGLE_OAUTH_MOCK = 'false';
process.env.APPLE_OAUTH_MOCK = 'false';

// With mock OFF, the `validateOAuthConfig` middleware runs on every /google and
// /apple request and returns 500 OAUTH_CONFIG_ERROR unless real-looking provider
// credentials are present. Provide non-placeholder values so config validation
// passes and requests reach the security/format/verification stages the tests
// actually target. (Values are deliberately NOT among the service's placeholder
// patterns: no `your_`, `example.com`, `test_key`, `test-secret`, etc.)
const OAUTH_TEST_CONFIG = {
  GOOGLE_CLIENT_ID: '918273645-googleoauthint.apps.googleusercontent.local',
  GOOGLE_CLIENT_SECRET: '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value',
  APPLE_CLIENT_ID: 'com.eventplanner.oauthint',
  APPLE_TEAM_ID: 'ABCDE12345',
  APPLE_KEY_ID: 'KEY9876XYZ',
  APPLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIGintegrationkeymaterial\n-----END PRIVATE KEY-----'
};
Object.assign(process.env, OAUTH_TEST_CONFIG);

// Mock the Google OAuth client so verifyIdToken never contacts Google and fails
// deterministically with an `invalid_token` error.
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn().mockRejectedValue(new Error('invalid_token: signature verification failed'))
    }))
  };
});

// Mock axios so the Apple JWKS fetch never hits the network and fails with a
// `jwt`-containing message (routes to the Apple-invalid branch of the service).
jest.mock('axios', () => ({
  get: jest.fn().mockRejectedValue(new Error('jwt verification unavailable (mocked)')),
  post: jest.fn().mockRejectedValue(new Error('jwt verification unavailable (mocked)'))
}));

const request = require('supertest');
const app = require('../../src/app');
const { connection } = require('../../src/config/database');

// superagent 10.x does not set a default User-Agent header, and the OAuth
// `validateSecurityHeaders` middleware rejects requests whose User-Agent is
// missing or shorter than 10 chars (INVALID_USER_AGENT). Provide a realistic UA
// on every request that is meant to pass that gate (all except the tests that
// deliberately send a bad User-Agent).
const VALID_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) EventPlannerOAuthIntegrationTests/1.0';

describe('OAuth Integration Tests', () => {
  let db;

  beforeAll(async () => {
    db = connection;
  });

  afterAll(async () => {
    // Do NOT close the shared pool here: `connection` is a process-wide singleton
    // shared by the app under test. Closing it would break other suites/teardown.
  });

  beforeEach(async () => {
    // Restaurer une configuration OAuth valide avant chaque test: certains tests
    // (GET /config "missing configuration") suppriment ces variables, ce qui ferait
    // ensuite echouer validateOAuthConfig (500) sur les requetes POST suivantes.
    Object.assign(process.env, OAUTH_TEST_CONFIG);

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
        .set('User-Agent', VALID_UA)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      // With the real verification path active (mock OFF), the express-validator
      // layer (validateGoogleLogin: idToken.notEmpty()) rejects the empty body
      // BEFORE the controller's GOOGLE_TOKEN_REQUIRED guard is reached, so the API
      // returns a generic "Données invalides" validation error (errors nested under
      // `data`). The token is still rejected with 400 — the test's actual intent.
      expect(response.body.data.errors).toBeDefined();
      expect(Array.isArray(response.body.data.errors)).toBe(true);
      expect(response.body.data.errors.some((e) => e.path === 'idToken' || e.param === 'idToken')).toBe(true);
    });

    test('should reject invalid token format', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/google')
        .set('User-Agent', VALID_UA)
        // Must be within the size window (100-2500) so the size guard passes and
        // the JWT-format guard (parts.length !== 3) fires. A single segment with
        // no dots yields parts.length === 1 -> INVALID_JWT_FORMAT.
        .send({ idToken: 'x'.repeat(120) })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_JWT_FORMAT');
    });

    test('should reject oversized token', async () => {
      const oversizedToken = 'a'.repeat(3000);
      const response = await request(app)
        .post('/api/auth/oauth/google')
        .set('User-Agent', VALID_UA)
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
        .set('User-Agent', VALID_UA)
        .send({ idToken: validGoogleToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      // OAuthErrorHandler nests the code under `data` via createResponse.
      expect(response.body.data.code).toBe('GOOGLE_TOKEN_INVALID');
    });
  });

  describe('POST /api/auth/oauth/apple', () => {
    const validAppleToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2V5LWlkIn0.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoidGVzdC1jbGllbnQtaWQiLCJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0X2FwcGxlQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5OX0.invalid-signature';

    test('should reject request without identity token', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/apple')
        .set('User-Agent', VALID_UA)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      // As with Google: with mock OFF, validateAppleLogin (identityToken.notEmpty())
      // preempts the controller's APPLE_IDENTITY_TOKEN_REQUIRED guard and returns a
      // generic validation error; the empty body is still rejected with 400.
      expect(response.body.data.errors).toBeDefined();
      expect(Array.isArray(response.body.data.errors)).toBe(true);
      expect(response.body.data.errors.some((e) => e.path === 'identityToken' || e.param === 'identityToken')).toBe(true);
    });

    test('should reject invalid token format', async () => {
      const response = await request(app)
        .post('/api/auth/oauth/apple')
        .set('User-Agent', VALID_UA)
        // Within the size window so the JWT-format guard fires (see Google case).
        .send({ identityToken: 'x'.repeat(120) })
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
        .set('User-Agent', VALID_UA)
        .send({ identityToken: validAppleToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      // OAuthErrorHandler nests the code under `data` via createResponse.
      expect(response.body.data.code).toBe('APPLE_TOKEN_INVALID');
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
          .set('User-Agent', VALID_UA)
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
        .set('User-Agent', VALID_UA)
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
        .set('User-Agent', VALID_UA)
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
