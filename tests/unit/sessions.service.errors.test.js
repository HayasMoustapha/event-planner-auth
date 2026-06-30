/**
 * Proof: SessionService error-UX hardening.
 *
 * Session/token failures that reach the controller must now be TYPED:
 *  - invalid/expired token   -> 401 (UnauthorizedError)
 *  - session not found       -> 404 (NotFoundError)
 *  - user inactive/missing   -> 401 (UnauthorizedError)
 * instead of a generic Error that the middleware would 500.
 */
jest.mock('../../src/modules/sessions/sessions.repository');
jest.mock('../../src/modules/users/users.repository');
jest.mock('../../../shared/clients/notification-client', () => ({}), { virtual: true });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-sessions';

const sessionRepository = require('../../src/modules/sessions/sessions.repository');
const usersRepository = require('../../src/modules/users/users.repository');
const sessionService = require('../../src/modules/sessions/sessions.service');

afterEach(() => jest.clearAllMocks());

describe('SessionService.refreshSession — typed errors', () => {
  test('invalid refresh token -> 401 REFRESH_TOKEN_INVALID', async () => {
    jest.spyOn(sessionService, 'verifyRefreshToken')
      .mockResolvedValue({ valid: false, message: 'Token invalide' });
    await expect(sessionService.refreshSession('bad'))
      .rejects.toMatchObject({ statusCode: 401, code: 'REFRESH_TOKEN_INVALID', name: 'UnauthorizedError' });
  });

  test('valid token but no session -> 404 SESSION_NOT_FOUND', async () => {
    jest.spyOn(sessionService, 'verifyRefreshToken')
      .mockResolvedValue({ valid: true, decoded: { id: 1 } });
    sessionRepository.findByRefreshToken.mockResolvedValue(null);
    await expect(sessionService.refreshSession('good'))
      .rejects.toMatchObject({ statusCode: 404, code: 'SESSION_NOT_FOUND', name: 'NotFoundError' });
  });

  test('inactive user -> 401 USER_NOT_FOUND_OR_INACTIVE', async () => {
    jest.spyOn(sessionService, 'verifyRefreshToken')
      .mockResolvedValue({ valid: true, decoded: { id: 1 } });
    sessionRepository.findByRefreshToken.mockResolvedValue({ user_id: 1 });
    usersRepository.findById.mockResolvedValue({ id: 1, status: 'inactive' });
    await expect(sessionService.refreshSession('good'))
      .rejects.toMatchObject({ statusCode: 401, code: 'USER_NOT_FOUND_OR_INACTIVE' });
  });
});

describe('SessionService.validateSession — typed errors', () => {
  test('invalid access token -> 401 TOKEN_INVALID', async () => {
    jest.spyOn(sessionService, 'verifyAccessToken')
      .mockResolvedValue({ valid: false, message: 'Token invalide' });
    await expect(sessionService.validateSession('bad'))
      .rejects.toMatchObject({ statusCode: 401, code: 'TOKEN_INVALID' });
  });

  test('inactive user -> 401 USER_NOT_FOUND_OR_INACTIVE', async () => {
    jest.spyOn(sessionService, 'verifyAccessToken')
      .mockResolvedValue({ valid: true, decoded: { id: 1, exp: 9999999999 } });
    sessionRepository.findByAccessToken.mockResolvedValue(null);
    usersRepository.findById.mockResolvedValue(null);
    await expect(sessionService.validateSession('good'))
      .rejects.toMatchObject({ statusCode: 401, code: 'USER_NOT_FOUND_OR_INACTIVE' });
  });
});

describe('SessionService.logoutSession — typed errors', () => {
  test('invalid token -> 401 TOKEN_INVALID', async () => {
    jest.spyOn(sessionService, 'verifyAccessToken')
      .mockResolvedValue({ valid: false, error: 'INVALID_TOKEN' });
    await expect(sessionService.logoutSession('bad'))
      .rejects.toMatchObject({ statusCode: 401, code: 'TOKEN_INVALID' });
  });
});
