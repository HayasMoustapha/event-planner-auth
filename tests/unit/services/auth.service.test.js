const AuthService = require('../../../src/modules/auth/auth.service');
const usersRepository = require('../../../src/modules/users/users.repository');
const logger = require('../../../src/utils/logger');

// Mock du repository
jest.mock('../../../src/modules/users/users.repository');
jest.mock('../../../src/utils/logger');

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid credentials', async () => {
      // Mock des données utilisateur
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        status: 'active'
      };
      
      usersRepository.verifyPassword.mockResolvedValue(mockUser);

      const result = await authService.authenticate('test@example.com', 'Password123!');

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
      expect(usersRepository.verifyPassword).toHaveBeenCalledWith('test@example.com', 'Password123!');
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
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        status: 'inactive'
      };
      
      usersRepository.verifyPassword.mockResolvedValue(mockUser);

      await expect(authService.authenticate('test@example.com', 'Password123!'))
        .rejects.toThrow('Ce compte est désactivé. Veuillez contacter l\'administrateur.');
    });

    it('should reject locked user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        status: 'locked'
      };
      
      usersRepository.verifyPassword.mockResolvedValue(mockUser);

      await expect(authService.authenticate('test@example.com', 'Password123!'))
        .rejects.toThrow('Ce compte est verrouillé. Veuillez contacter l\'administrateur.');
    });

    it('should reject wrong credentials', async () => {
      usersRepository.verifyPassword.mockResolvedValue(null);

      await expect(authService.authenticate('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Email ou mot de passe incorrect');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(authService.validateEmail('test@example.com')).toBe(true);
      expect(authService.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(authService.validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(authService.validateEmail('invalid-email')).toBe(false);
      expect(authService.validateEmail('@example.com')).toBe(false);
      expect(authService.validateEmail('test@')).toBe(false);
      expect(authService.validateEmail('test@.com')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(authService.validateEmail('')).toBe(false);
      expect(authService.validateEmail(null)).toBe(false);
      expect(authService.validateEmail(undefined)).toBe(false);
    });
  });
});
