jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('../../src/modules/identities/identities.service', () => ({}));
jest.mock('../../src/modules/auth/auth.service', () => ({}));
jest.mock('../../src/modules/sessions/sessions.service', () => ({}));
jest.mock('../../src/config/database', () => ({
  connection: {
    query: jest.fn(),
    end: jest.fn().mockResolvedValue()
  }
}));
jest.mock('../../src/utils/error-handler', () => ({
  handleExternalServiceError: jest.fn(),
  handleValidationError: jest.fn(),
  withErrorHandling: jest.fn((fn) => fn)
}));
jest.mock('../../src/utils/logger', () => ({
  auth: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

const OAUTH_ENV_KEYS = [
  'NODE_ENV',
  'OAUTH_MOCK',
  'GOOGLE_OAUTH_MOCK',
  'APPLE_OAUTH_MOCK',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'APPLE_CLIENT_ID',
  'APPLE_TEAM_ID',
  'APPLE_KEY_ID',
  'APPLE_PRIVATE_KEY'
];

const ORIGINAL_ENV = {};
for (const key of OAUTH_ENV_KEYS) {
  ORIGINAL_ENV[key] = process.env[key];
}

function applyOAuthEnv(overrides = {}) {
  for (const key of OAUTH_ENV_KEYS) {
    delete process.env[key];
  }

  Object.assign(process.env, {
    NODE_ENV: 'test',
    OAUTH_MOCK: 'false',
    GOOGLE_OAUTH_MOCK: 'false',
    APPLE_OAUTH_MOCK: 'false',
    ...overrides
  });
}

function restoreOAuthEnv() {
  for (const key of OAUTH_ENV_KEYS) {
    delete process.env[key];
    if (typeof ORIGINAL_ENV[key] !== 'undefined') {
      process.env[key] = ORIGINAL_ENV[key];
    }
  }
}

function loadOAuthService() {
  jest.resetModules();
  return require('../../src/modules/oauth/oauth.service');
}

describe('OAuth configuration contract', () => {
  afterEach(() => {
    jest.clearAllMocks();
    restoreOAuthEnv();
  });

  test('marks placeholder and missing credentials as missing live provider credentials', () => {
    applyOAuthEnv({
      GOOGLE_CLIENT_ID: 'your_google_client_id',
      GOOGLE_CLIENT_SECRET: '',
      APPLE_CLIENT_ID: 'com.yourapp.service',
      APPLE_TEAM_ID: '',
      APPLE_KEY_ID: 'your_apple_key_id',
      APPLE_PRIVATE_KEY: ''
    });

    const oauthService = loadOAuthService();
    const config = oauthService.checkConfiguration();

    expect(config.mockEnabled).toBe(false);

    expect(config.google.status).toBe('missing_live_provider_credentials');
    expect(config.google.configured).toBe(false);
    expect(config.google.blockedByMissingLiveCredentials).toBe(true);
    expect(config.google.presentFields).toEqual([]);
    expect(config.google.missingFields).toEqual(['GOOGLE_CLIENT_SECRET']);
    expect(config.google.placeholderFields).toEqual(['GOOGLE_CLIENT_ID']);

    expect(config.apple.status).toBe('missing_live_provider_credentials');
    expect(config.apple.configured).toBe(false);
    expect(config.apple.blockedByMissingLiveCredentials).toBe(true);
    expect(config.apple.presentFields).toEqual([]);
    expect(config.apple.missingFields).toEqual(['APPLE_TEAM_ID', 'APPLE_PRIVATE_KEY']);
    expect(config.apple.placeholderFields).toEqual(['APPLE_CLIENT_ID', 'APPLE_KEY_ID']);
  });

  test('exposes mock_only when live credentials are absent but provider mock is enabled', () => {
    applyOAuthEnv({
      OAUTH_MOCK: 'false',
      GOOGLE_OAUTH_MOCK: 'true',
      APPLE_OAUTH_MOCK: 'true',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      APPLE_CLIENT_ID: '',
      APPLE_TEAM_ID: '',
      APPLE_KEY_ID: '',
      APPLE_PRIVATE_KEY: ''
    });

    const oauthService = loadOAuthService();
    const config = oauthService.checkConfiguration();

    expect(config.google.status).toBe('mock_only');
    expect(config.google.mockEnabled).toBe(true);
    expect(config.google.liveProved).toBe(false);

    expect(config.apple.status).toBe('mock_only');
    expect(config.apple.mockEnabled).toBe(true);
    expect(config.apple.liveProved).toBe(false);
  });

  test('keeps configured providers short of live ready until runtime proof exists', () => {
    applyOAuthEnv({
      GOOGLE_CLIENT_ID: 'google-client-id-prod',
      GOOGLE_CLIENT_SECRET: 'google-client-secret-prod',
      APPLE_CLIENT_ID: 'com.ginutech.eventplanner',
      APPLE_TEAM_ID: 'TEAM123456',
      APPLE_KEY_ID: 'KEY123456',
      APPLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----real-key-----END PRIVATE KEY-----'
    });

    const oauthService = loadOAuthService();
    const config = oauthService.checkConfiguration();

    expect(config.google.status).toBe('configured_not_live_proved');
    expect(config.google.configured).toBe(true);
    expect(config.google.liveProved).toBe(false);
    expect(config.google.blockedByMissingLiveCredentials).toBe(false);
    expect(config.google.presentFields).toEqual(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
    expect(config.google.missingFields).toEqual([]);
    expect(config.google.placeholderFields).toEqual([]);

    expect(config.apple.status).toBe('configured_not_live_proved');
    expect(config.apple.configured).toBe(true);
    expect(config.apple.liveProved).toBe(false);
    expect(config.apple.blockedByMissingLiveCredentials).toBe(false);
    expect(config.apple.presentFields).toEqual([
      'APPLE_CLIENT_ID',
      'APPLE_TEAM_ID',
      'APPLE_KEY_ID',
      'APPLE_PRIVATE_KEY'
    ]);
    expect(config.apple.missingFields).toEqual([]);
    expect(config.apple.placeholderFields).toEqual([]);
  });
});
