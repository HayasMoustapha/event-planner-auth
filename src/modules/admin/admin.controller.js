/**
 * CONTROLLER ADMIN POUR LA GESTION RBAC
 * Endpoints pour gérer les rôles, permissions et autorisations dynamiquement
 */

const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const rbacSeeder = require('../../database/seeders/rbac-seeder');
const permissionsService = require('../../services/permissions.service');

class AdminController {
  /**
   * Initialise/peuple la base de données RBAC
   */
  async seedRbac(req, res, next) {
    try {
      logger.info('🌱 Admin requesting RBAC seeding...');
      
      const result = await rbacSeeder.seed();
      
      res.status(200).json(createResponse(
        true,
        'RBAC database seeded successfully',
        result
      ));
    } catch (error) {
      logger.error('❌ RBAC seeding failed:', error);
      next(error);
    }
  }

  /**
   * Vérifie le statut du peuplement RBAC
   */
  async getRbacStatus(req, res, next) {
    try {
      const status = await rbacSeeder.isSeeded();
      const allRoles = await permissionsService.getAllRoles();
      const allPermissions = await permissionsService.getAllPermissions();
      
      res.status(200).json(createResponse(
        true,
        'RBAC status retrieved successfully',
        {
          seeded: status,
          totalRoles: allRoles.length,
          totalPermissions: allPermissions.length,
          roles: allRoles.map(r => ({ id: r.id, code: r.code, group: r.group })),
          permissions: allPermissions.map(p => ({ id: p.id, code: p.code, group: p.group }))
        }
      ));
    } catch (error) {
      logger.error('❌ Failed to get RBAC status:', error);
      next(error);
    }
  }

  /**
   * Récupère tous les rôles avec leurs permissions
   */
  async getAllRolesWithPermissions(req, res, next) {
    try {
      const roles = await permissionsService.getAllRoles();
      
      // Pour chaque rôle, récupérer ses permissions
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await permissionsService.getRolePermissions(role.id);
          return {
            ...role,
            permissions: permissions,
            permissionCount: permissions.length
          };
        })
      );
      
      res.status(200).json(createResponse(
        true,
        'Roles with permissions retrieved successfully',
        {
          roles: rolesWithPermissions,
          total: rolesWithPermissions.length
        }
      ));
    } catch (error) {
      logger.error('❌ Failed to get roles with permissions:', error);
      next(error);
    }
  }

  /**
   * Récupère les permissions d'un utilisateur spécifique
   */
  async getUserPermissions(req, res, next) {
    try {
      const { userId } = req.params;
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid user ID',
          { code: 'INVALID_USER_ID' }
        ));
      }
      
      const [roles, permissions] = await Promise.all([
        permissionsService.getUserRoles(parseInt(userId)),
        permissionsService.getUserPermissions(parseInt(userId))
      ]);
      
      res.status(200).json(createResponse(
        true,
        'User permissions retrieved successfully',
        {
          userId: parseInt(userId),
          roles,
          permissions,
          roleCount: roles.length,
          permissionCount: permissions.length
        }
      ));
    } catch (error) {
      logger.error(`❌ Failed to get permissions for user ${req.params.userId}:`, error);
      next(error);
    }
  }

  /**
   * Assigne un rôle à un utilisateur
   */
  async assignRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;
      
      if (!userId || isNaN(userId) || !roleId || isNaN(roleId)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid user ID or role ID',
          { code: 'INVALID_IDS' }
        ));
      }
      
      // Vérifier si le rôle existe
      const roleCheck = await permissionsService.connection.query(
        'SELECT id, code FROM roles WHERE id = $1 AND deleted_at IS NULL',
        [roleId]
      );
      
      if (roleCheck.rows.length === 0) {
        return res.status(404).json(createResponse(
          false,
          'Role not found',
          { code: 'ROLE_NOT_FOUND' }
        ));
      }
      
      // Assigner le rôle
      await permissionsService.connection.query(`
        INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, [userId, roleId]);
      
      // Vider le cache utilisateur
      permissionsService.clearCache('user', userId);
      
      res.status(200).json(createResponse(
        true,
        'Role assigned successfully',
        {
          userId: parseInt(userId),
          roleId: parseInt(roleId),
          roleCode: roleCheck.rows[0].code
        }
      ));
    } catch (error) {
      logger.error(`❌ Failed to assign role to user ${req.params.userId}:`, error);
      next(error);
    }
  }

  /**
   * Retire un rôle d'un utilisateur
   */
  async removeRole(req, res, next) {
    try {
      const { userId, roleId } = req.params;
      
      if (!userId || isNaN(userId) || !roleId || isNaN(roleId)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid user ID or role ID',
          { code: 'INVALID_IDS' }
        ));
      }
      
      const result = await permissionsService.connection.query(`
        UPDATE user_roles 
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND role_id = $2 AND deleted_at IS NULL
        RETURNING *
      `, [userId, roleId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json(createResponse(
          false,
          'User role assignment not found',
          { code: 'ASSIGNMENT_NOT_FOUND' }
        ));
      }
      
      // Vider le cache utilisateur
      permissionsService.clearCache('user', userId);
      
      res.status(200).json(createResponse(
        true,
        'Role removed successfully',
        {
          userId: parseInt(userId),
          roleId: parseInt(roleId)
        }
      ));
    } catch (error) {
      logger.error(`❌ Failed to remove role from user ${req.params.userId}:`, error);
      next(error);
    }
  }

  /**
   * Ajoute une permission à un rôle
   */
  async addPermissionToRole(req, res, next) {
    try {
      const { roleId } = req.params;
      const { permissionId } = req.body;
      
      if (!roleId || isNaN(roleId) || !permissionId || isNaN(permissionId)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid role ID or permission ID',
          { code: 'INVALID_IDS' }
        ));
      }
      
      // Vérifier si la permission existe
      const permissionCheck = await permissionsService.connection.query(
        'SELECT id, code FROM permissions WHERE id = $1 AND deleted_at IS NULL',
        [permissionId]
      );
      
      if (permissionCheck.rows.length === 0) {
        return res.status(404).json(createResponse(
          false,
          'Permission not found',
          { code: 'PERMISSION_NOT_FOUND' }
        ));
      }
      
      // Ajouter la permission au rôle
      await permissionsService.connection.query(`
        INSERT INTO authorizations (role_id, permission_id, created_at, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, [roleId, permissionId]);
      
      // Vider les caches
      permissionsService.clearCache('role', roleId);
      permissionsService.clearCache('all');
      
      res.status(200).json(createResponse(
        true,
        'Permission added to role successfully',
        {
          roleId: parseInt(roleId),
          permissionId: parseInt(permissionId),
          permissionCode: permissionCheck.rows[0].code
        }
      ));
    } catch (error) {
      logger.error(`❌ Failed to add permission to role ${req.params.roleId}:`, error);
      next(error);
    }
  }

  /**
   * Retire une permission d'un rôle
   */
  async removePermissionFromRole(req, res, next) {
    try {
      const { roleId, permissionId } = req.params;
      
      if (!roleId || isNaN(roleId) || !permissionId || isNaN(permissionId)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid role ID or permission ID',
          { code: 'INVALID_IDS' }
        ));
      }
      
      const result = await permissionsService.connection.query(`
        UPDATE authorizations 
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE role_id = $1 AND permission_id = $2 AND deleted_at IS NULL
        RETURNING *
      `, [roleId, permissionId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json(createResponse(
          false,
          'Role permission assignment not found',
          { code: 'ASSIGNMENT_NOT_FOUND' }
        ));
      }
      
      // Vider les caches
      permissionsService.clearCache('role', roleId);
      permissionsService.clearCache('all');
      
      res.status(200).json(createResponse(
        true,
        'Permission removed from role successfully',
        {
          roleId: parseInt(roleId),
          permissionId: parseInt(permissionId)
        }
      ));
    } catch (error) {
      logger.error(`❌ Failed to remove permission from role ${req.params.roleId}:`, error);
      next(error);
    }
  }

  /**
   * Crée un nouveau rôle
   */
  async createRole(req, res, next) {
    try {
      const { code, label, description, group } = req.body;
      
      if (!code || !label) {
        return res.status(400).json(createResponse(
          false,
          'Role code and label are required',
          { code: 'MISSING_REQUIRED_FIELDS' }
        ));
      }
      
      const result = await permissionsService.connection.query(`
        INSERT INTO roles (code, label, description, "group", created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, code, label, "group", description
      `, [
        code.trim(),
        JSON.stringify(label),
        JSON.stringify(description || {}),
        group || 'custom'
      ]);
      
      // Vider le cache des rôles
      permissionsService.clearCache('all');
      
      res.status(201).json(createResponse(
        true,
        'Role created successfully',
        result.rows[0]
      ));
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json(createResponse(
          false,
          'Role code already exists',
          { code: 'ROLE_CODE_EXISTS' }
        ));
      }
      
      logger.error('❌ Failed to create role:', error);
      next(error);
    }
  }

  /**
   * Crée une nouvelle permission
   */
  async createPermission(req, res, next) {
    try {
      const { code, label, description, group } = req.body;
      
      if (!code || !label) {
        return res.status(400).json(createResponse(
          false,
          'Permission code and label are required',
          { code: 'MISSING_REQUIRED_FIELDS' }
        ));
      }
      
      const result = await permissionsService.connection.query(`
        INSERT INTO permissions (code, label, description, "group", created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, code, label, "group", description
      `, [
        code.trim(),
        JSON.stringify(label),
        JSON.stringify(description || {}),
        group || 'custom'
      ]);
      
      // Vider le cache des permissions
      permissionsService.clearCache('all');
      
      res.status(201).json(createResponse(
        true,
        'Permission created successfully',
        result.rows[0]
      ));
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json(createResponse(
          false,
          'Permission code already exists',
          { code: 'PERMISSION_CODE_EXISTS' }
        ));
      }
      
      logger.error('❌ Failed to create permission:', error);
      next(error);
    }
  }

  /**
   * Rafraîchit le cache des permissions
   */
  async refreshCache(req, res, next) {
    try {
      permissionsService.clearCache('all');
      
      res.status(200).json(createResponse(
        true,
        'Cache refreshed successfully',
        { timestamp: new Date().toISOString() }
      ));
    } catch (error) {
      logger.error('❌ Failed to refresh cache:', error);
      next(error);
    }
  }

  /**
   * Assigne TOUS les rôles à un utilisateur super admin
   */
  async assignAllRolesToSuperAdmin(req, res, next) {
    try {
      const { userId } = req.params;
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid user ID',
          { code: 'INVALID_USER_ID' }
        ));
      }
      
      const userIdInt = parseInt(userId);
      
      logger.info(`👑 Admin requesting all roles assignment for super admin ${userIdInt}`);
      
      const result = await rbacSeeder.ensureSuperAdminCompleteAccess(userIdInt);
      
      res.status(200).json(createResponse(
        true,
        'All roles assigned to super admin successfully',
        result
      ));
    } catch (error) {
      logger.error(`❌ Failed to assign all roles to super admin ${req.params.userId}:`, error);
      next(error);
    }
  }

  /**
   * Vérifie et corrige les accès d'un super admin
   */
  async ensureSuperAdminAccess(req, res, next) {
    try {
      const { userId } = req.params;
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid user ID',
          { code: 'INVALID_USER_ID' }
        ));
      }
      
      const userIdInt = parseInt(userId);
      
      logger.info(`🔍 Admin requesting super admin access check for user ${userIdInt}`);
      
      // Récupérer l'état actuel
      const [currentRoles, currentPermissions] = await Promise.all([
        permissionsService.getUserRoles(userIdInt),
        permissionsService.getUserPermissions(userIdInt)
      ]);
      
      // Corriger les accès si nécessaire
      const result = await rbacSeeder.ensureSuperAdminCompleteAccess(userIdInt);
      
      // Récupérer le nouvel état
      const [newRoles, newPermissions] = await Promise.all([
        permissionsService.getUserRoles(userIdInt),
        permissionsService.getUserPermissions(userIdInt)
      ]);
      
      res.status(200).json(createResponse(
        true,
        'Super admin access verified and corrected',
        {
          user: result.user,
          before: {
            roles: currentRoles,
            permissions: currentPermissions,
            roleCount: currentRoles.length,
            permissionCount: currentPermissions.length
          },
          after: {
            roles: newRoles,
            permissions: newPermissions,
            roleCount: newRoles.length,
            permissionCount: newPermissions.length
          },
          changes: {
            rolesAdded: newRoles.length - currentRoles.length,
            permissionsAdded: newPermissions.length - currentPermissions.length
          },
          stats: result.roles
        }
      ));
    } catch (error) {
      logger.error(`❌ Failed to ensure super admin access for user ${req.params.userId}:`, error);
      next(error);
    }
  }
}

module.exports = new AdminController();
module.exports.AdminController = AdminController;
