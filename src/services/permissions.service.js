/**
 * SERVICE DE PERMISSIONS DYNAMIQUE
 * Gestion des permissions depuis la base de données
 * Approche robuste et dynamique pour le RBAC
 */

const { connection } = require('../config/database');
const logger = require('../utils/logger');

class PermissionsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.connection = connection;
  }

  /**
   * Récupère toutes les permissions d'un utilisateur depuis la base de données
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des permissions de l'utilisateur
   */
  async getUserPermissions(userId) {
    const cacheKey = `user_permissions_${userId}`;
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.permissions;
      }
    }

    try {
      // Vérifier d'abord si l'utilisateur est super admin
      const userQuery = `
        SELECT u.email, r.code as role_code
        FROM users u
        LEFT JOIN accesses ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `;
      
      const userResult = await connection.query(userQuery, [userId]);
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        
        // SUPER ADMIN : TOUS LES DROITS
        if (user.email === 'admin@eventplanner.com' || user.role_code === 'super_admin') {
          console.log('👑 Super Admin detected - granting all permissions');
          const allPermissions = ['*']; // Wildcard pour toutes les permissions
          
          // Mettre en cache
          this.cache.set(cacheKey, {
            permissions: allPermissions,
            timestamp: Date.now()
          });
          
          return allPermissions;
        }
      }
      
      // Requête normale pour les autres utilisateurs
      const query = `
        SELECT DISTINCT p.code, p.label, p."group", p.description
        FROM permissions p
        INNER JOIN authorizations a ON p.id = a.permission_id
        INNER JOIN accesses ur ON a.role_id = ur.role_id
        WHERE ur.user_id = $1
          AND p.deleted_at IS NULL
          AND a.deleted_at IS NULL
          AND (ur.status = 'active' OR ur.status IS NULL)
        ORDER BY p."group" ASC, p.code ASC
      `;

      const result = await connection.query(query, [userId]);
      const permissions = result.rows.map(row => row.code);

      // Mettre en cache
      this.cache.set(cacheKey, {
        permissions,
        timestamp: Date.now()
      });

      if (process.env.NODE_ENV === 'development') {
        logger.info(`🔐 Permissions loaded for user ${userId}:`, {
          count: permissions.length,
          permissions: permissions.slice(0, 10) // Montrer les 10 premières en dev
        });
      }

      return permissions;
    } catch (error) {
      logger.error(`Error loading permissions for user ${userId}:`, error);
      throw new Error(`Failed to load user permissions: ${error.message}`);
    }
  }

  /**
   * Récupère tous les rôles d'un utilisateur depuis la base de données
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des rôles de l'utilisateur
   */
  async getUserRoles(userId) {
    const cacheKey = `user_roles_${userId}`;
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.roles;
      }
    }

    try {
      const query = `
        SELECT r.id, r.code, r.label, r.description
        FROM roles r
        INNER JOIN accesses ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
          AND r.deleted_at IS NULL
          AND (ur.status = 'active' OR ur.status IS NULL)
        ORDER BY r.code ASC
      `;

      const result = await connection.query(query, [userId]);
      const roles = result.rows.map(row => row.code);

      // Mettre en cache
      this.cache.set(cacheKey, {
        roles,
        timestamp: Date.now()
      });

      if (process.env.NODE_ENV === 'development') {
        logger.info(`👥 Roles loaded for user ${userId}:`, roles);
      }

      return roles;
    } catch (error) {
      logger.error(`Error loading roles for user ${userId}:`, error);
      throw new Error(`Failed to load user roles: ${error.message}`);
    }
  }

  /**
   * Récupère les permissions d'un rôle spécifique
   * @param {number} roleId - ID du rôle
   * @returns {Promise<Array>} Liste des permissions du rôle
   */
  async getRolePermissions(roleId) {
    const cacheKey = `role_permissions_${roleId}`;
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.permissions;
      }
    }

    try {
      const query = `
        SELECT p.code, p.label, p."group", p.description
        FROM permissions p
        INNER JOIN authorizations a ON p.id = a.permission_id
        WHERE a.role_id = $1 
          AND p.deleted_at IS NULL 
          AND a.deleted_at IS NULL
        ORDER BY p."group" ASC, p.code ASC
      `;

      const result = await connection.query(query, [roleId]);
      const permissions = result.rows.map(row => row.code);

      // Mettre en cache
      this.cache.set(cacheKey, {
        permissions,
        timestamp: Date.now()
      });

      return permissions;
    } catch (error) {
      logger.error(`Error loading permissions for role ${roleId}:`, error);
      throw new Error(`Failed to load role permissions: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} permission - Code de la permission
   * @returns {Promise<boolean>} True si l'utilisateur a la permission
   */
  async hasPermission(userId, permission) {
    try {
      // Vérifier d'abord si l'utilisateur est super admin
      const userQuery = `
        SELECT u.email, r.code as role_code
        FROM users u
        LEFT JOIN accesses ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `;
      
      const userResult = await connection.query(userQuery, [userId]);
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        
        // SUPER ADMIN : TOUS LES DROITS
        if (user.email === 'admin@eventplanner.com' || user.role_code === 'super_admin') {
          console.log('👑 Super Admin permission check - always true');
          return true;
        }
      }
      
      // Vérification normale pour les autres utilisateurs
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission);
    } catch (error) {
      logger.error(`Error checking permission ${permission} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} role - Code du rôle
   * @returns {Promise<boolean>} True si l'utilisateur a le rôle
   */
  async hasRole(userId, role) {
    try {
      const roles = await this.getUserRoles(userId);
      return roles.includes(role);
    } catch (error) {
      logger.error(`Error checking role ${role} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Récupère toutes les permissions disponibles dans le système
   * @returns {Promise<Array>} Liste de toutes les permissions
   */
  async getAllPermissions() {
    const cacheKey = 'all_permissions';
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout * 2) { // Cache plus long pour toutes les permissions
        return cached.permissions;
      }
    }

    try {
      const query = `
        SELECT p.id, p.code, p.label, p."group", p.description
        FROM permissions p
        WHERE p.deleted_at IS NULL
        ORDER BY p."group" ASC, p.code ASC
      `;

      const result = await connection.query(query);
      const permissions = result.rows;

      // Mettre en cache
      this.cache.set(cacheKey, {
        permissions,
        timestamp: Date.now()
      });

      return permissions;
    } catch (error) {
      logger.error('Error loading all permissions:', error);
      throw new Error(`Failed to load all permissions: ${error.message}`);
    }
  }

  /**
   * Récupère tous les rôles disponibles dans le système
   * @returns {Promise<Array>} Liste de tous les rôles
   */
  async getAllRoles() {
    const cacheKey = 'all_roles';
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout * 2) { // Cache plus long pour tous les rôles
        return cached.roles;
      }
    }

    try {
      const query = `
        SELECT r.id, r.code, r.label, r.description, r.is_system, r.level
        FROM roles r
        WHERE r.deleted_at IS NULL
        ORDER BY r.code ASC
      `;

      const result = await connection.query(query);
      const roles = result.rows;

      // Mettre en cache
      this.cache.set(cacheKey, {
        roles,
        timestamp: Date.now()
      });

      return roles;
    } catch (error) {
      logger.error('Error loading all roles:', error);
      throw new Error(`Failed to load all roles: ${error.message}`);
    }
  }

  /**
   * Vide le cache pour un utilisateur ou rôle spécifique
   * @param {string} type - Type de cache ('user', 'role', 'all')
   * @param {number} id - ID de l'entité (optionnel)
   */
  clearCache(type = 'all', id = null) {
    switch (type) {
      case 'user':
        if (id) {
          this.cache.delete(`user_permissions_${id}`);
          this.cache.delete(`user_roles_${id}`);
        }
        break;
      case 'role':
        if (id) {
          this.cache.delete(`role_permissions_${id}`);
        }
        break;
      case 'all':
        this.cache.clear();
        break;
    }

    if (process.env.NODE_ENV === 'development') {
      logger.info(`🗑️ Cache cleared for type: ${type}, id: ${id || 'all'}`);
    }
  }

  /**
   * Initialise les permissions par défaut pour le super admin
   * @param {number} userId - ID de l'utilisateur super admin
   * @returns {Promise<void>}
   */
  async initializeSuperAdminPermissions(userId) {
    try {
      // Récupérer toutes les permissions disponibles
      const allPermissions = await this.getAllPermissions();
      
      // Vérifier si l'utilisateur a déjà des rôles
      const userRoles = await this.getUserRoles(userId);
      
      if (!userRoles.includes('super_admin')) {
        // Ajouter le rôle super admin
        await connection.query(`
          INSERT INTO accesses (user_id, role_id, created_at, updated_at)
          VALUES ($1, (SELECT id FROM roles WHERE code = 'super_admin'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, role_id) DO NOTHING
        `, [userId]);
      }

      // Donner toutes les permissions au rôle super admin
      if (allPermissions.length > 0) {
        const superAdminRoleId = await connection.query(
          'SELECT id FROM roles WHERE code = $1',
          ['super_admin']
        );

        if (superAdminRoleId.rows.length > 0) {
          const roleId = superAdminRoleId.rows[0].id;
          
          // Insérer toutes les permissions pour le rôle super admin
          for (const permission of allPermissions) {
            await connection.query(`
              INSERT INTO authorizations (role_id, permission_id, created_at, updated_at)
              VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT (role_id, permission_id) DO NOTHING
            `, [roleId, permission.id]);
          }
        }
      }

      // Vider le cache
      this.clearCache('user', userId);

      logger.info(`✅ Super admin permissions initialized for user ${userId}`);
    } catch (error) {
      logger.error(`Error initializing super admin permissions for user ${userId}:`, error);
      throw new Error(`Failed to initialize super admin permissions: ${error.message}`);
    }
  }
}

module.exports = new PermissionsService();
module.exports.PermissionsService = PermissionsService;
