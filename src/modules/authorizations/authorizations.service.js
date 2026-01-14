const roleRepository = require('../roles/roles.repository');
const permissionRepository = require('../permissions/permissions.repository');
const menuRepository = require('../menus/menus.repository');

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
      return await permissionRepository.userHasPermission(userId, permissionName.trim());
    } catch (error) {
      console.error('Erreur lors de la vérification de permission:', error);
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
}

module.exports = new AuthorizationService();
