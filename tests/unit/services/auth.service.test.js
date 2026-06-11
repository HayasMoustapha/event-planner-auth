const authService = require('../../../src/modules/auth/auth.service');
const usersRepository = require('../../../src/modules/users/users.repository');
const sessionService = require('../../../src/modules/sessions/sessions.service');
const permissionsService = require('../../../src/services/permissions.service');

jest.mock('../../../src/modules/users/users.repository');
jest.mock('../../../src/modules/users/users-repository-extension', () => ({}));
jest.mock('../../../src/modules/sessions/sessions.service', () => ({
  createSession: jest.fn()
}));
jest.mock('../../../src/services/permissions.service', () => ({
  cache: {
    delete: jest.fn()
  },
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn()
}));
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));
jest.mock('../../../src/services/email.service', () => ({}));
jest.mock('../../../../shared/clients/notification-client', () => ({
  sendEmail: jest.fn()
}));

describe('AuthService', () => {
  const buildUser = (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    status: 'active',
    role: 'organizer',
    password: 'hashed-password',
    ...overrides
  });

  const buildSessionResult = () => ({
    success: true,
    session: {
      id: 'session-id',
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 24 * 60 * 60,
        tokenType: 'Bearer'
      }
    }
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    jest.spyOn(authService, 'generateToken').mockReturnValue('access-token');
    jest.spyOn(authService, 'generateRefreshTokenFromUser').mockReturnValue('refresh-token');

    usersRepository.updateLastLogin.mockResolvedValue(true);
    permissionsService.getUserRoles.mockResolvedValue(['organizer']);
    permissionsService.getUserPermissions.mockResolvedValue(['events.read']);
    sessionService.createSession.mockResolvedValue(buildSessionResult());
  });

  describe('authenticate', () => {
    it('should authenticate user with valid credentials when session persistence succeeds', async () => {
      const mockUser = buildUser();

      usersRepository.verifyPassword.mockResolvedValue(mockUser);

      const result = await authService.authenticate('test@example.com', 'Password123!');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        status: mockUser.status,
        role: mockUser.role
      });
      expect(result.data.token).toBe('access-token');
      expect(result.data.tokens).toEqual(buildSessionResult().session.tokens);
      expect(usersRepository.verifyPassword).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(usersRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(sessionService.createSession).toHaveBeenCalledWith({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: mockUser.id,
        ipAddress: null,
        userAgent: null,
        expiresIn: 24 * 60 * 60
      });
    });

    it('should fail closed when session persistence fails during login', async () => {
      const mockUser = buildUser();

      usersRepository.verifyPassword.mockResolvedValue(mockUser);
      sessionService.createSession.mockRejectedValue(new Error('Session persistence failed'));

      await expect(authService.authenticate('test@example.com', 'Password123!'))
        .rejects.toThrow('Session persistence failed');

      expect(usersRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(sessionService.createSession).toHaveBeenCalledWith({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: mockUser.id,
        ipAddress: null,
        userAgent: null,
        expiresIn: 24 * 60 * 60
      });
    });

    it('should reject invalid email format', async () => {
      await expect(authService.authenticate('invalid-email', 'password'))
        .rejects.toThrow('Format d\'email invalide');
    });

    it('should reject empty email', async () => {
      await expect(authService.authenticate('', 'password'))
        .rejects.toThrow('Email requis');
    });

    it('should reject empty password', async () => {
      await expect(authService.authenticate('test@example.com', ''))
        .rejects.toThrow('Mot de passe requis');
    });

    it('should reject inactive user', async () => {
      usersRepository.verifyPassword.mockResolvedValue(buildUser({ status: 'inactive' }));

      await expect(authService.authenticate('test@example.com', 'Password123!'))
        .rejects.toThrow('Ce compte est désactivé. Veuillez contacter l\'administrateur.');
    });

    it('should reject locked user', async () => {
      usersRepository.verifyPassword.mockResolvedValue(buildUser({ status: 'lock' }));

      await expect(authService.authenticate('test@example.com', 'Password123!'))
        .rejects.toThrow('Ce compte est verrouillé. Veuillez contacter l\'administrateur.');
    });

    it('should reject wrong credentials', async () => {
      usersRepository.verifyPassword.mockResolvedValue(null);

      await expect(authService.authenticate('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Email ou mot de passe incorrect');
    });
  });
});
