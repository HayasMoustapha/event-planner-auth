const authorizationService = require('./authorizations.service');
const { createResponse } = require('../../utils/response');

/**
 * Controller HTTP pour la gestion des autorisations
 * Gère les requêtes et réponses HTTP pour la vérification des droits
 */
class AuthorizationController {
  /**
   * Vérifie si un utilisateur a une permission spécifique
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkPermission(req, res, next) {
    try {
      const { user_id, permission } = req.body;
      const targetUserId = user_id ? parseInt(user_id) : req.user?.id;

      if (!targetUserId || !permission) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et nom de la permission requis'
        ));
      }

      const hasPermission = await authorizationService.hasPermission(targetUserId, permission);

      res.status(200).json(createResponse(
        true,
        'Vérification de permission effectuée',
        {
          userId: targetUserId,
          permission,
          hasPermission
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur a l'une des permissions requises
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkAnyPermission(req, res, next) {
    try {
      const { userId, permissions } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !Array.isArray(permissions)) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et liste de permissions requis'
        ));
      }

      const hasPermission = await authorizationService.hasAnyPermission(targetUserId, permissions);

      res.status(200).json(createResponse(
        true,
        'Vérification de permissions multiples effectuée',
        {
          userId: targetUserId,
          permissions,
          hasPermission
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur a toutes les permissions requises
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkAllPermissions(req, res, next) {
    try {
      const { userId, permissions } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !Array.isArray(permissions)) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et liste de permissions requis'
        ));
      }

      const hasPermission = await authorizationService.hasAllPermissions(targetUserId, permissions);

      res.status(200).json(createResponse(
        true,
        'Vérification de permissions complètes effectuée',
        {
          userId: targetUserId,
          permissions,
          hasPermission
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkRole(req, res, next) {
    try {
      const { userId, roleName } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !roleName) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et nom du rôle requis'
        ));
      }

      const hasRole = await authorizationService.hasRole(targetUserId, roleName);

      res.status(200).json(createResponse(
        true,
        'Vérification de rôle effectuée',
        {
          userId: targetUserId,
          roleName,
          hasRole
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur a l'un des rôles requis
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkAnyRole(req, res, next) {
    try {
      const { userId, roles } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !Array.isArray(roles)) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et liste de rôles requis'
        ));
      }

      const hasRole = await authorizationService.hasAnyRole(targetUserId, roles);

      res.status(200).json(createResponse(
        true,
        'Vérification de rôles multiples effectuée',
        {
          userId: targetUserId,
          roles,
          hasRole
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur a tous les rôles requis
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkAllRoles(req, res, next) {
    try {
      const { userId, roles } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !Array.isArray(roles)) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et liste de rôles requis'
        ));
      }

      const hasRole = await authorizationService.hasAllRoles(targetUserId, roles);

      res.status(200).json(createResponse(
        true,
        'Vérification de rôles complets effectuée',
        {
          userId: targetUserId,
          roles,
          hasRole
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur a accès à un menu
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkMenuAccess(req, res, next) {
    try {
      const { userId, menuId } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !menuId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et ID du menu requis'
        ));
      }

      const hasAccess = await authorizationService.hasMenuAccess(targetUserId, parseInt(menuId));

      res.status(200).json(createResponse(
        true,
        'Vérification d\'accès au menu effectuée',
        {
          userId: targetUserId,
          menuId: parseInt(menuId),
          hasAccess
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur peut accéder à une ressource avec une action spécifique
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkResourceAccess(req, res, next) {
    try {
      const { userId, resource, action } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !resource || !action) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur, ressource et action requis'
        ));
      }

      const hasAccess = await authorizationService.canAccessResource(targetUserId, resource, action);

      res.status(200).json(createResponse(
        true,
        'Vérification d\'accès à la ressource effectuée',
        {
          userId: targetUserId,
          resource,
          action,
          hasAccess
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère toutes les autorisations d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getUserAuthorizations(req, res, next) {
    try {
      const { userId } = req.params;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const [permissions, roles, menus] = await Promise.all([
        authorizationService.getUserPermissions(targetUserId),
        authorizationService.getUserRoles(targetUserId),
        authorizationService.getUserMenus(targetUserId)
      ]);

      res.status(200).json(createResponse(
        true,
        'Autorisations utilisateur récupérées avec succès',
        {
          userId: targetUserId,
          permissions,
          roles,
          menus
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur est administrateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkAdminStatus(req, res, next) {
    try {
      const { userId } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const isAdmin = await authorizationService.isAdmin(targetUserId);
      const isSuperAdmin = await authorizationService.isSuperAdmin(targetUserId);

      res.status(200).json(createResponse(
        true,
        'Statut administrateur vérifié',
        {
          userId: targetUserId,
          isAdmin,
          isSuperAdmin
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère le rôle de plus haut niveau d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getUserHighestRole(req, res, next) {
    try {
      const { userId } = req.params;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const role = await authorizationService.getUserHighestRole(targetUserId);

      res.status(200).json(createResponse(
        true,
        'Rôle le plus élevé récupéré avec succès',
        {
          userId: targetUserId,
          role
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie les autorisations basées sur une politique complexe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkPolicy(req, res, next) {
    try {
      const { userId, policy } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !policy) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et politique requis'
        ));
      }

      const authorized = await authorizationService.checkPolicy(targetUserId, policy);

      res.status(200).json(createResponse(
        true,
        'Vérification de politique effectuée',
        {
          userId: targetUserId,
          policy,
          authorized
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée un cache des autorisations pour un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async cacheUserAuthorizations(req, res, next) {
    try {
      const { userId, ttl } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const cacheTtl = ttl ? parseInt(ttl) : 300; // 5 minutes par défaut
      const authorizations = await authorizationService.cacheUserAuthorizations(targetUserId, cacheTtl);

      res.status(200).json(createResponse(
        true,
        'Autorisations mises en cache avec succès',
        {
          userId: targetUserId,
          ttl: cacheTtl,
          authorizations
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invalide le cache des autorisations pour un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async invalidateUserAuthorizationCache(req, res, next) {
    try {
      const { userId } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const invalidated = await authorizationService.invalidateUserAuthorizationCache(targetUserId);

      res.status(200).json(createResponse(
        true,
        'Cache des autorisations invalidé avec succès',
        {
          userId: targetUserId,
          invalidated
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère toutes les autorisations avec pagination et filtres
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAllAuthorizations(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        roleId,
        permissionId,
        menuId,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const result = await authorizationService.getAllAuthorizations({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        roleId: roleId ? parseInt(roleId) : null,
        permissionId: permissionId ? parseInt(permissionId) : null,
        menuId: menuId ? parseInt(menuId) : null,
        sortBy,
        sortOrder
      });

      res.status(200).json(createResponse(
        true,
        'Autorisations récupérées avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère une autorisation par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAuthorizationById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await authorizationService.getAuthorizationById(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Autorisation récupérée avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée une nouvelle autorisation
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async createAuthorization(req, res, next) {
    try {
      const { roleId, permissionId, menuId } = req.body;
      const createdBy = req.user?.id;

      const result = await authorizationService.createAuthorization({
        roleId,
        permissionId,
        menuId
      }, createdBy);

      res.status(201).json(createResponse(
        true,
        'Autorisation créée avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour une autorisation
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async updateAuthorization(req, res, next) {
    try {
      const { id } = req.params;
      const { roleId, permissionId, menuId } = req.body;
      const updatedBy = req.user?.id;

      const result = await authorizationService.updateAuthorization(
        parseInt(id),
        {
          roleId,
          permissionId,
          menuId
        },
        updatedBy
      );

      res.status(200).json(createResponse(
        true,
        'Autorisation mise à jour avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime une autorisation (soft delete)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async deleteAuthorization(req, res, next) {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id;

      await authorizationService.deleteAuthorization(parseInt(id), deletedBy);

      res.status(200).json(createResponse(
        true,
        'Autorisation supprimée avec succès'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime définitivement une autorisation
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async hardDeleteAuthorization(req, res, next) {
    try {
      const { id } = req.params;

      await authorizationService.hardDeleteAuthorization(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Autorisation supprimée définitivement avec succès'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les autorisations d'un rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAuthorizationsByRole(req, res, next) {
    try {
      const { roleId } = req.params;

      const result = await authorizationService.getAuthorizationsByRole(parseInt(roleId));

      res.status(200).json(createResponse(
        true,
        'Autorisations du rôle récupérées avec succès',
        {
          roleId: parseInt(roleId),
          authorizations: result,
          count: result.length
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les autorisations d'une permission
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAuthorizationsByPermission(req, res, next) {
    try {
      const { permissionId } = req.params;

      const result = await authorizationService.getAuthorizationsByPermission(parseInt(permissionId));

      res.status(200).json(createResponse(
        true,
        'Autorisations de la permission récupérées avec succès',
        {
          permissionId: parseInt(permissionId),
          authorizations: result,
          count: result.length
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les autorisations d'un menu
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAuthorizationsByMenu(req, res, next) {
    try {
      const { menuId } = req.params;

      const result = await authorizationService.getAuthorizationsByMenu(parseInt(menuId));

      res.status(200).json(createResponse(
        true,
        'Autorisations du menu récupérées avec succès',
        {
          menuId: parseInt(menuId),
          authorizations: result,
          count: result.length
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  // ===== NOUVELLES MÉTHODES POUR LES ROUTES MANQUANTES =====

  /**
   * Crée un cache d'autorisations
   */
  async createCache(req, res, next) {
    try {
      const result = await authorizationService.createCache();
      res.status(200).json(createResponse(
        true,
        'Cache d\'autorisations créé',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invalide le cache d'autorisations
   */
  async invalidateCache(req, res, next) {
    try {
      const result = await authorizationService.invalidateCache();
      res.status(200).json(createResponse(
        true,
        'Cache d\'autorisations invalidé',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les dépendances des permissions
   */
  async getPermissionsDependencies(req, res, next) {
    try {
      const result = await authorizationService.getPermissionsDependencies();
      res.status(200).json(createResponse(
        true,
        'Dépendances des permissions récupérées',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère la politique d'autorisations
   */
  async getPolicy(req, res, next) {
    try {
      const result = await authorizationService.getPolicy();
      res.status(200).json(createResponse(
        true,
        'Politique d\'autorisations récupérée',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère la hiérarchie des rôles
   */
  async getRolesHierarchy(req, res, next) {
    try {
      const result = await authorizationService.getRolesHierarchy();
      res.status(200).json(createResponse(
        true,
        'Hiérarchie des rôles récupérée',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les autorisations d'un utilisateur
   */
  async getUserAuthorizations(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await authorizationService.getUserAuthorizations(parseInt(userId));
      res.status(200).json(createResponse(
        true,
        'Autorisations utilisateur récupérées',
        { userId: parseInt(userId), authorizations: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les permissions effectives d'un utilisateur
   */
  async getUserEffectivePermissions(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await authorizationService.getUserEffectivePermissions(parseInt(userId));
      res.status(200).json(createResponse(
        true,
        'Permissions effectives utilisateur récupérées',
        { userId: parseInt(userId), permissions: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère le rôle le plus élevé d'un utilisateur
   */
  async getUserHighestRole(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await authorizationService.getUserHighestRole(parseInt(userId));
      res.status(200).json(createResponse(
        true,
        'Rôle le plus élevé utilisateur récupéré',
        { userId: parseInt(userId), highestRole: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur est admin
   */
  async getUserIsAdmin(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await authorizationService.getUserIsAdmin(parseInt(userId));
      res.status(200).json(createResponse(
        true,
        'Statut admin utilisateur récupéré',
        { userId: parseInt(userId), isAdmin: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie toutes les permissions requises
   */
  async verifyAllPermissions(req, res, next) {
    try {
      const { permissions } = req.params;
      const permissionList = permissions.split(',');
      const userId = req.user.id;
      
      const result = await authorizationService.verifyAllPermissions(userId, permissionList);
      res.status(200).json(createResponse(
        true,
        'Vérification de toutes les permissions effectuée',
        { userId, permissions: permissionList, hasAll: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie au moins une permission requise
   */
  async verifyAnyPermissions(req, res, next) {
    try {
      const { permissions } = req.params;
      const permissionList = permissions.split(',');
      const userId = req.user.id;
      
      const result = await authorizationService.verifyAnyPermissions(userId, permissionList);
      res.status(200).json(createResponse(
        true,
        'Vérification d\'au moins une permission effectuée',
        { userId, permissions: permissionList, hasAny: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie l'accès à un menu
   */
  async verifyMenuAccess(req, res, next) {
    try {
      const { menuId } = req.params;
      const userId = req.user.id;
      
      const result = await authorizationService.verifyMenuAccess(userId, parseInt(menuId));
      res.status(200).json(createResponse(
        true,
        'Vérification d\'accès menu effectuée',
        { userId, menuId: parseInt(menuId), hasAccess: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie l'accès à une ressource
   */
  async verifyResourceAccess(req, res, next) {
    try {
      const { resource } = req.params;
      const userId = req.user.id;
      
      const result = await authorizationService.verifyResourceAccess(userId, resource);
      res.status(200).json(createResponse(
        true,
        'Vérification d\'accès ressource effectuée',
        { userId, resource, hasAccess: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie l'accès à un rôle
   */
  async verifyRoleAccess(req, res, next) {
    try {
      const { role } = req.params;
      const userId = req.user.id;
      
      const result = await authorizationService.verifyRoleAccess(userId, role);
      res.status(200).json(createResponse(
        true,
        'Vérification d\'accès rôle effectuée',
        { userId, role, hasAccess: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie l'accès à tous les rôles
   */
  async verifyAllRolesAccess(req, res, next) {
    try {
      const { roles } = req.params;
      const roleList = roles.split(',');
      const userId = req.user.id;
      
      const result = await authorizationService.verifyAllRolesAccess(userId, roleList);
      res.status(200).json(createResponse(
        true,
        'Vérification d\'accès tous les rôles effectuée',
        { userId, roles: roleList, hasAll: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie l'accès à au moins un rôle
   */
  async verifyAnyRolesAccess(req, res, next) {
    try {
      const { roles } = req.params;
      const roleList = roles.split(',');
      const userId = req.user.id;
      
      const result = await authorizationService.verifyAnyRolesAccess(userId, roleList);
      res.status(200).json(createResponse(
        true,
        'Vérification d\'accès au moins un rôle effectuée',
        { userId, roles: roleList, hasAny: result }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie une permission spécifique
   */
  async verifyPermission(req, res, next) {
    try {
      const { permission } = req.params;
      const userId = req.user.id;
      
      const result = await authorizationService.verifyPermission(userId, permission);
      res.status(200).json(createResponse(
        true,
        'Vérification permission effectuée',
        { userId, permission, hasPermission: result }
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthorizationController();
