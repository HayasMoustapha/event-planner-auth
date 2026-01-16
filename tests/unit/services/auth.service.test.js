const AuthService = require('../../../src/modules/auth/auth.service');
const usersRepository = require('../../../src/modules/users/users.repository');
const peopleRepository = require('../../../src/modules/people/people.repository');
const logger = require('../../../src/utils/logger');

// Mock des repositories
jest.mock('../../../src/modules/users/users.repository');
jest.mock('../../../src/modules/people/people.repository');
jest.mock('../../../src/utils/logger');

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    authService = AuthService; // Utiliser l'instance exportée
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
      usersRepository.updateLastLogin.mockResolvedValue(true);

      const result = await authService.authenticate('test@example.com', 'Password123!');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.user).toEqual(mockUser);
      expect(result.data.token).toBeDefined();
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
        status: 'lock'
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
});
