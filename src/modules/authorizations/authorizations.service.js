const roleRepository = require('../roles/roles.repository');
const permissionRepository = require('../permissions/permissions.repository');
const menuRepository = require('../menus/menus.repository');
const authorizationRepository = require('./authorizations.repository');
const cacheService = require('../../services/cache.service');
const logger = require('../../utils/logger');

/**
 * Service métier pour la gestion des autorisations
 * Gère la logique d'autorisation complexe entre rôles, permissions et menus
 */
class AuthorizationService {
  /**
   * Vérifie si un utilisateur a une permission spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} permissionName - Nom de la permission
   * @returns {Promise<boolean>} True si autorisé
   */
  async hasPermission(userId, permissionName) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!permissionName || !permissionName.trim()) {
      return false;
    }

    try {
      // 🚨 RÈGLE ABSOLUE - SUPER ADMIN COURT-CIRCUIT
      // Le super admin a TOUS les droits, SANS vérification supplémentaire
      const isSuperAdmin = await this.isSuperAdmin(userId);
      if (isSuperAdmin) {
        logger.info('SUPER ADMIN ACCESS GRANTED', {
          userId,
          permission: permissionName,
          reason: 'SUPER_ADMIN_CIRCUIT_BREAKER'
        });
        return true;
      }

      // Essayer le cache d'abord
      const cachedAuthorizations = await cacheService.getUserAuthorizations(userId);
      if (cachedAuthorizations) {
        const hasPermission = cachedAuthorizations.some(auth => 
          auth.permission_code === permissionName.trim()
        );
        
        logger.debug('Permission checked from cache', {
          userId,
          permission: permissionName,
          result: hasPermission
        });
        
        return hasPermission;
      }

      // Récupérer depuis la base de données si pas en cache
      const hasPermission = await authorizationRepository.userHasPermission(userId, permissionName.trim());
      
      logger.debug('Permission checked from database', {
        userId,
        permission: permissionName,
        result: hasPermission
      });
      
      return hasPermission;
    } catch (error) {
      logger.error('Permission check error', {
        userId,
        permission: permissionName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur a l'une des permissions requises
   * @param {number} userId - ID de l'utilisateur
   * @param {Array<string>} permissions - Liste des permissions requises
   * @returns {Promise<boolean>} True si au moins une permission autorisée
   */
  async hasAnyPermission(userId, permissions) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }

    try {
      // 🚨 RÈGLE ABSOLUE - SUPER ADMIN COURT-CIRCUIT
      const isSuperAdmin = await this.isSuperAdmin(userId);
      if (isSuperAdmin) {
        logger.info('SUPER ADMIN ACCESS GRANTED (ANY)', {
          userId,
          permissions,
          reason: 'SUPER_ADMIN_CIRCUIT_BREAKER'
        });
        return true;
      }

      for (const permission of permissions) {
        if (await this.hasPermission(userId, permission)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur a toutes les permissions requises
   * @param {number} userId - ID de l'utilisateur
   * @param {Array<string>} permissions - Liste des permissions requises
   * @returns {Promise<boolean>} True si toutes les permissions autorisées
   */
  async hasAllPermissions(userId, permissions) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }

    try {
      // 🚨 RÈGLE ABSOLUE - SUPER ADMIN COURT-CIRCUIT
      const isSuperAdmin = await this.isSuperAdmin(userId);
      if (isSuperAdmin) {
        logger.info('SUPER ADMIN ACCESS GRANTED (ALL)', {
          userId,
          permissions,
          reason: 'SUPER_ADMIN_CIRCUIT_BREAKER'
        });
        return true;
      }

      for (const permission of permissions) {
        if (!await this.hasPermission(userId, permission)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} roleName - Nom du rôle
   * @returns {Promise<boolean>} True si le rôle est possédé
   */
  async hasRole(userId, roleName) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!roleName || !roleName.trim()) {
      return false;
    }

    try {
      return await roleRepository.userHasRole(userId, roleName.trim());
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur a l'un des rôles requis
   * @param {number} userId - ID de l'utilisateur
   * @param {Array<string>} roles - Liste des rôles requis
   * @returns {Promise<boolean>} True si au moins un rôle est possédé
   */
  async hasAnyRole(userId, roles) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return false;
    }

    try {
      for (const role of roles) {
        if (await this.hasRole(userId, role)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification des rôles:', error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur a tous les rôles requis
   * @param {number} userId - ID de l'utilisateur
   * @param {Array<string>} roles - Liste des rôles requis
   * @returns {Promise<boolean>} True si tous les rôles sont possédés
   */
  async hasAllRoles(userId, roles) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return false;
    }

    try {
      for (const role of roles) {
        if (!await this.hasRole(userId, role)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification des rôles:', error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur a accès à un menu
   * @param {number} userId - ID de l'utilisateur
   * @param {number} menuId - ID du menu
   * @returns {Promise<boolean>} True si l'accès au menu est autorisé
   */
  async hasMenuAccess(userId, menuId) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!menuId || menuId <= 0) {
      return false;
    }

    try {
      return await menuRepository.userHasMenuAccess(userId, menuId);
    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès au menu:', error);
      return false;
    }
  }

  /**
   * Récupère toutes les permissions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des permissions
   */
  async getUserPermissions(userId) {
    if (!userId || userId <= 0) {
      return [];
    }

    try {
      return await permissionRepository.getUserPermissions(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions utilisateur:', error);
      return [];
    }
  }

  /**
   * Récupère tous les rôles d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des rôles
   */
  async getUserRoles(userId) {
    if (!userId || userId <= 0) {
      return [];
    }

    try {
      return await roleRepository.getUserRoles(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles utilisateur:', error);
      return [];
    }
  }

  /**
   * Récupère tous les menus accessibles à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Arborescence des menus accessibles
   */
  async getUserMenus(userId) {
    if (!userId || userId <= 0) {
      return [];
    }

    try {
      return await menuRepository.getUserMenus(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des menus utilisateur:', error);
      return [];
    }
  }

  /**
   * Vérifie si un utilisateur peut accéder à une ressource avec une action spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} resource - Nom de la ressource
   * @param {string} action - Action requise
   * @returns {Promise<boolean>} True si l'accès est autorisé
   */
  async canAccessResource(userId, resource, action) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!resource || !resource.trim()) {
      return false;
    }

    if (!action || !action.trim()) {
      return false;
    }

    // 🚨 RÈGLE ABSOLUE - SUPER ADMIN COURT-CIRCUIT
    const isSuperAdmin = await this.isSuperAdmin(userId);
    if (isSuperAdmin) {
      logger.info('SUPER ADMIN ACCESS GRANTED (RESOURCE)', {
        userId,
        resource,
        action,
        reason: 'SUPER_ADMIN_CIRCUIT_BREAKER'
      });
      return true;
    }

    const permissionName = `${resource.trim()}.${action.trim()}`;
    return await this.hasPermission(userId, permissionName);
  }

  /**
   * Vérifie si un utilisateur est administrateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} True si administrateur
   */
  async isAdmin(userId) {
    return await this.hasAnyRole(userId, ['admin', 'super_admin']);
  }

  /**
   * Vérifie si un utilisateur est super administrateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} True si super administrateur
   */
  async isSuperAdmin(userId) {
    return await this.hasRole(userId, 'super_admin');
  }

  /**
   * Récupère le rôle de plus haut niveau d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object|null>} Rôle de plus haut niveau
   */
  async getUserHighestRole(userId) {
    if (!userId || userId <= 0) {
      return null;
    }

    try {
      const roles = await this.getUserRoles(userId);
      return roles.length > 0 ? roles[0] : null; // Trié par level DESC
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle le plus élevé:', error);
      return null;
    }
  }

  /**
   * Vérifie les autorisations basées sur une politique complexe
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} policy - Politique d'autorisation
   * @returns {Promise<boolean>} True si autorisé selon la politique
   */
  async checkPolicy(userId, policy) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!policy || typeof policy !== 'object') {
      return false;
    }

    try {
      const { type, conditions } = policy;

      switch (type) {
        case 'permission':
          return await this.checkPermissionPolicy(userId, conditions);
        
        case 'role':
          return await this.checkRolePolicy(userId, conditions);
        
        case 'menu':
          return await this.checkMenuPolicy(userId, conditions);
        
        case 'resource':
          return await this.checkResourcePolicy(userId, conditions);
        
        case 'complex':
          return await this.checkComplexPolicy(userId, conditions);
        
        default:
          console.warn(`Type de politique non reconnu: ${type}`);
          return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la politique:', error);
      return false;
    }
  }

  /**
   * Vérifie une politique basée sur des permissions
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} conditions - Conditions de la politique
   * @returns {Promise<boolean>} True si autorisé
   */
  async checkPermissionPolicy(userId, conditions) {
    const { operator, permissions } = conditions;

    if (!operator || !Array.isArray(permissions)) {
      return false;
    }

    switch (operator) {
      case 'any':
        return await this.hasAnyPermission(userId, permissions);
      
      case 'all':
        return await this.hasAllPermissions(userId, permissions);
      
      default:
        console.warn(`Opérateur de politique non reconnu: ${operator}`);
        return false;
    }
  }

  /**
   * Vérifie une politique basée sur des rôles
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} conditions - Conditions de la politique
   * @returns {Promise<boolean>} True si autorisé
   */
  async checkRolePolicy(userId, conditions) {
    const { operator, roles } = conditions;

    if (!operator || !Array.isArray(roles)) {
      return false;
    }

    switch (operator) {
      case 'any':
        return await this.hasAnyRole(userId, roles);
      
      case 'all':
        return await this.hasAllRoles(userId, roles);
      
      default:
        console.warn(`Opérateur de politique non reconnu: ${operator}`);
        return false;
    }
  }

  /**
   * Vérifie une politique basée sur des menus
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} conditions - Conditions de la politique
   * @returns {Promise<boolean>} True si autorisé
   */
  async checkMenuPolicy(userId, conditions) {
    const { operator, menuIds } = conditions;

    if (!operator || !Array.isArray(menuIds)) {
      return false;
    }

    switch (operator) {
      case 'any':
        for (const menuId of menuIds) {
          if (await this.hasMenuAccess(userId, menuId)) {
            return true;
          }
        }
        return false;
      
      case 'all':
        for (const menuId of menuIds) {
          if (!await this.hasMenuAccess(userId, menuId)) {
            return false;
          }
        }
        return true;
      
      default:
        console.warn(`Opérateur de politique non reconnu: ${operator}`);
        return false;
    }
  }

  /**
   * Vérifie une politique complexe avec multiples conditions
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} conditions - Conditions complexes
   * @returns {Promise<boolean>} True si autorisé
   */
  async checkComplexPolicy(userId, conditions) {
    const { rules } = conditions;

    if (!Array.isArray(rules)) {
      return false;
    }

    for (const rule of rules) {
      const { type, operator, values, required = true } = rule;
      
      let result = required ? false : true; // Si la règle est requise, par défaut false
      
      switch (type) {
        case 'permission':
          result = await this.checkPermissionPolicy(userId, { operator, permissions: values });
          break;
        
        case 'role':
          result = await this.checkRolePolicy(userId, { operator, roles: values });
          break;
        
        case 'menu':
          result = await this.checkMenuPolicy(userId, { operator, menuIds: values });
          break;
        
        default:
          console.warn(`Type de règle non reconnu: ${type}`);
          result = false;
      }
      
      // Si la règle est requise et n'est pas satisfaite, retourner false
      if (required && !result) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Crée un cache des autorisations pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} ttl - Durée de vie du cache en secondes
   * @returns {Promise<Object>} Autorisations mises en cache
   */
  async cacheUserAuthorizations(userId, ttl = 300) { // 5 minutes par défaut
    try {
      const [permissions, roles, menus] = await Promise.all([
        this.getUserPermissions(userId),
        this.getUserRoles(userId),
        this.getUserMenus(userId)
      ]);

      const authorizations = {
        userId,
        permissions,
        roles,
        menus,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + (ttl * 1000))
      };

      // TODO: Implémenter le cache Redis ou mémoire
      console.log(`🔐 Autorisations mises en cache pour l'utilisateur ${userId}`);
      
      return authorizations;
    } catch (error) {
      console.error('Erreur lors de la mise en cache des autorisations:', error);
      return null;
    }
  }

  /**
   * Invalide le cache des autorisations pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} True si invalidé
   */
  async invalidateUserAuthorizationCache(userId) {
    // TODO: Implémenter l'invalidation du cache Redis ou mémoire
    console.log(`🗑️ Cache des autorisations invalidé pour l'utilisateur ${userId}`);
    return true;
  }

  /**
   * Récupère toutes les autorisations avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Autorisations et pagination
   */
  async getAllAuthorizations(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = null,
      roleId = null,
      permissionId = null,
      menuId = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    // Validation de la pagination
    if (page < 1) {
      throw new Error('Le numéro de page doit être supérieur à 0');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('La limite doit être entre 1 et 100');
    }

    return await authorizationRepository.findAll({
      page,
      limit,
      search,
      roleId,
      permissionId,
      menuId,
      sortBy,
      sortOrder
    });
  }

  /**
   * Récupère une autorisation par son ID
   * @param {number} id - ID de l'autorisation
   * @returns {Promise<Object|null>} Données de l'autorisation
   */
  async getAuthorizationById(id) {
    if (!id || id <= 0) {
      throw new Error('ID d\'autorisation invalide');
    }

    const authorization = await authorizationRepository.findById(id);
    if (!authorization) {
      throw new Error('Autorisation non trouvée');
    }

    return authorization;
  }

  /**
   * Crée une nouvelle autorisation
   * @param {Object} authorizationData - Données de l'autorisation
   * @param {number} createdBy - ID de l'utilisateur qui crée
   * @returns {Promise<Object>} Autorisation créée
   */
  async createAuthorization(authorizationData, createdBy = null) {
    const {
      roleId,
      permissionId,
      menuId
    } = authorizationData;

    // Validation des IDs
    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    if (!permissionId || permissionId <= 0) {
      throw new Error('ID de permission invalide');
    }

    if (!menuId || menuId <= 0) {
      throw new Error('ID de menu invalide');
    }

    // Vérifier si le rôle existe
    const roleExists = await roleRepository.findById(roleId);
    if (!roleExists) {
      throw new Error('Le rôle spécifié n\'existe pas');
    }

    // Vérifier si la permission existe
    const permissionExists = await permissionRepository.findById(permissionId);
    if (!permissionExists) {
      throw new Error('La permission spécifiée n\'existe pas');
    }

    // Vérifier si le menu existe
    const menuExists = await menuRepository.findById(menuId);
    if (!menuExists) {
      throw new Error('Le menu spécifié n\'existe pas');
    }

    // Vérifier si l'autorisation existe déjà
    const existingAuthorization = await authorizationRepository.findByRolePermissionMenu(
      roleId, permissionId, menuId
    );
    if (existingAuthorization) {
      throw new Error('Cette autorisation existe déjà');
    }

    // Créer l'autorisation
    return await authorizationRepository.create({
      roleId,
      permissionId,
      menuId,
      createdBy
    });
  }

  /**
   * Met à jour une autorisation
   * @param {number} id - ID de l'autorisation
   * @param {Object} updateData - Données de mise à jour
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Autorisation mise à jour
   */
  async updateAuthorization(id, updateData, updatedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID d\'autorisation invalide');
    }

    const {
      roleId,
      permissionId,
      menuId
    } = updateData;

    // Vérifier si l'autorisation existe
    const existingAuthorization = await authorizationRepository.findById(id);
    if (!existingAuthorization) {
      throw new Error('Autorisation non trouvée');
    }

    // Validation des nouvelles données
    if (roleId && roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    if (permissionId && permissionId <= 0) {
      throw new Error('ID de permission invalide');
    }

    if (menuId && menuId <= 0) {
      throw new Error('ID de menu invalide');
    }

    // Vérifier l'existence des entités si elles sont spécifiées
    if (roleId) {
      const roleExists = await roleRepository.findById(roleId);
      if (!roleExists) {
        throw new Error('Le rôle spécifié n\'existe pas');
      }
    }

    if (permissionId) {
      const permissionExists = await permissionRepository.findById(permissionId);
      if (!permissionExists) {
        throw new Error('La permission spécifiée n\'existe pas');
      }
    }

    if (menuId) {
      const menuExists = await menuRepository.findById(menuId);
      if (!menuExists) {
        throw new Error('Le menu spécifié n\'existe pas');
      }
    }

    // Vérifier l'unicité si les trois éléments sont spécifiés
    if (roleId && permissionId && menuId) {
      const duplicateAuthorization = await authorizationRepository.findByRolePermissionMenu(
        roleId, permissionId, menuId
      );
      if (duplicateAuthorization && duplicateAuthorization.id !== id) {
        throw new Error('Cette autorisation existe déjà');
      }
    }

    // Mettre à jour l'autorisation
    await authorizationRepository.update(id, {
      roleId,
      permissionId,
      menuId,
      updatedBy
    });

    // Retourner l'autorisation mise à jour
    return await authorizationRepository.findById(id);
  }

  /**
   * Supprime une autorisation (soft delete)
   * @param {number} id - ID de l'autorisation
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async deleteAuthorization(id, deletedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID d\'autorisation invalide');
    }

    // Vérifier si l'autorisation existe
    const existingAuthorization = await authorizationRepository.findById(id);
    if (!existingAuthorization) {
      throw new Error('Autorisation non trouvée');
    }

    return await authorizationRepository.softDelete(id, deletedBy);
  }

  /**
   * Supprime définitivement une autorisation
   * @param {number} id - ID de l'autorisation
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async hardDeleteAuthorization(id) {
    if (!id || id <= 0) {
      throw new Error('ID d\'autorisation invalide');
    }

    // Vérifier si l'autorisation existe
    const existingAuthorization = await authorizationRepository.findById(id);
    if (!existingAuthorization) {
      throw new Error('Autorisation non trouvée');
    }

    return await authorizationRepository.delete(id);
  }

  /**
   * Récupère les autorisations d'un rôle
   * @param {number} roleId - ID du rôle
   * @returns {Promise<Array>} Liste des autorisations du rôle
   */
  async getAuthorizationsByRole(roleId) {
    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    // Vérifier si le rôle existe
    const roleExists = await roleRepository.findById(roleId);
    if (!roleExists) {
      throw new Error('Le rôle spécifié n\'existe pas');
    }

    return await authorizationRepository.findByRoleId(roleId);
  }

  /**
   * Récupère les autorisations d'une permission
   * @param {number} permissionId - ID de la permission
   * @returns {Promise<Array>} Liste des autorisations de la permission
   */
  async getAuthorizationsByPermission(permissionId) {
    if (!permissionId || permissionId <= 0) {
      throw new Error('ID de permission invalide');
    }

    // Vérifier si la permission existe
    const permissionExists = await permissionRepository.findById(permissionId);
    if (!permissionExists) {
      throw new Error('La permission spécifiée n\'existe pas');
    }

    return await authorizationRepository.findByPermissionId(permissionId);
  }

  /**
   * Récupère les autorisations d'un menu
   * @param {number} menuId - ID du menu
   * @returns {Promise<Array>} Liste des autorisations du menu
   */
  async getAuthorizationsByMenu(menuId) {
    if (!menuId || menuId <= 0) {
      throw new Error('ID de menu invalide');
    }

    // Vérifier si le menu existe
    const menuExists = await menuRepository.findById(menuId);
    if (!menuExists) {
      throw new Error('Le menu spécifié n\'existe pas');
    }

    return await authorizationRepository.findByMenuId(menuId);
  }
}

module.exports = new AuthorizationService();
