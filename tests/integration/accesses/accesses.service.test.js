const accessesService = require('../../../src/modules/accesses/accesses.service');
const usersRepository = require('../../../src/modules/users/users.repository');
const rolesRepository = require('../../../src/modules/roles/roles.repository');

// Mock des repositories
jest.mock('../../../src/modules/users/users.repository');
jest.mock('../../../src/modules/roles/roles.repository');

describe('AccessesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccess', () => {
    it('should create access successfully with valid data', async () => {
      // Mock des repositories
      usersRepository.findById.mockResolvedValue({ id: 1, username: 'testuser' });
      rolesRepository.findById.mockResolvedValue({ id: 2, code: 'MANAGER' });
      
      const accessData = {
        userId: 1,
        roleId: 2,
        status: 'active'
      };

      const result = await accessesService.createAccess(accessData, 1);

      expect(result).toBeDefined();
      expect(usersRepository.findById).toHaveBeenCalledWith(1);
      expect(rolesRepository.findById).toHaveBeenCalledWith(2);
    });

    it('should throw error for invalid user ID', async () => {
      const accessData = {
        userId: 0,
        roleId: 2,
        status: 'active'
      };

      await expect(accessesService.createAccess(accessData))
        .rejects.toThrow('ID d\'utilisateur invalide');
    });

    it('should throw error for invalid role ID', async () => {
      const accessData = {
        userId: 1,
        roleId: 0,
        status: 'active'
      };

      await expect(accessesService.createAccess(accessData))
        .rejects.toThrow('ID de rôle invalide');
    });

    it('should throw error for invalid status', async () => {
      const accessData = {
        userId: 1,
        roleId: 2,
        status: 'invalid'
      };

      await expect(accessesService.createAccess(accessData))
        .rejects.toThrow('Statut invalide');
    });
  });

  describe('getAllAccesses', () => {
    it('should return accesses with default options', async () => {
      const mockResult = {
        data: [{ id: 1, userId: 1, roleId: 2 }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      };

      const accessesRepository = require('../../../src/modules/accesses/accesses.repository');
      jest.mock('../../../src/modules/accesses/accesses.repository');
      accessesRepository.findAll = jest.fn().mockResolvedValue(mockResult);

      const result = await accessesService.getAllAccesses();

      expect(accessesRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: null,
        status: null,
        userId: null,
        roleId: null,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw error for invalid page', async () => {
      await expect(accessesService.getAllAccesses({ page: 0 }))
        .rejects.toThrow('Le numéro de page doit être supérieur à 0');
    });

    it('should throw error for invalid limit', async () => {
      await expect(accessesService.getAllAccesses({ limit: 101 }))
        .rejects.toThrow('La limite doit être entre 1 et 100');
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles successfully', async () => {
      usersRepository.findById.mockResolvedValue({ id: 1, username: 'testuser' });
      
      const accessesRepository = require('../../../src/modules/accesses/accesses.repository');
      jest.mock('../../../src/modules/accesses/accesses.repository');
      accessesRepository.findByUserId = jest.fn().mockResolvedValue([
        { id: 1, userId: 1, roleId: 2, code: 'MANAGER' }
      ]);

      const result = await accessesService.getUserRoles(1, true);

      expect(usersRepository.findById).toHaveBeenCalledWith(1);
      expect(accessesRepository.findByUserId).toHaveBeenCalledWith(1, true);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error for invalid user ID', async () => {
      await expect(accessesService.getUserRoles(0))
        .rejects.toThrow('ID d\'utilisateur invalide');
    });
  });

  describe('checkUserHasRole', () => {
    it('should return true if user has role', async () => {
      const accessesRepository = require('../../../src/modules/accesses/accesses.repository');
      jest.mock('../../../src/modules/accesses/accesses.repository');
      accessesRepository.userHasRole = jest.fn().mockResolvedValue(true);

      const result = await accessesService.checkUserHasRole(1, 2, true);

      expect(accessesRepository.userHasRole).toHaveBeenCalledWith(1, 2, true);
      expect(result).toBe(true);
    });

    it('should throw error for invalid user ID', async () => {
      await expect(accessesService.checkUserHasRole(0, 2))
        .rejects.toThrow('ID d\'utilisateur invalide');
    });

    it('should throw error for invalid role ID', async () => {
      await expect(accessesService.checkUserHasRole(1, 0))
        .rejects.toThrow('ID de rôle invalide');
    });
  });

  describe('assignMultipleRoles', () => {
    it('should assign multiple roles successfully', async () => {
      usersRepository.findById.mockResolvedValue({ id: 1, username: 'testuser' });
      rolesRepository.findById.mockResolvedValue({ id: 2, code: 'MANAGER' });
      
      const accessesRepository = require('../../../src/modules/accesses/accesses.repository');
      jest.mock('../../../src/modules/accesses/accesses.repository');
      accessesRepository.create = jest.fn().mockResolvedValue({ id: 1, userId: 1, roleId: 2 });
      accessesRepository.findByUserIdAndRoleId = jest.fn().mockResolvedValue(null);

      const result = await accessesService.assignMultipleRoles(1, [2, 3], 1);

      expect(result).toHaveProperty('assigned');
      expect(result).toHaveProperty('skipped');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.assigned)).toBe(true);
    });

    it('should throw error for empty roleIds array', async () => {
      await expect(accessesService.assignMultipleRoles(1, []))
        .rejects.toThrow('La liste des rôles doit être un tableau non vide');
    });

    it('should throw error for invalid user ID', async () => {
      await expect(accessesService.assignMultipleRoles(0, [2, 3]))
        .rejects.toThrow('ID d\'utilisateur invalide');
    });
  });
});
