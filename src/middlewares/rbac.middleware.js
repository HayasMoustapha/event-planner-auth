const authorizationService = require('../modules/authorizations/authorizations.service');
const { createResponse } = require('../utils/response');

/**
 * Middleware RBAC (Role-Based Access Control)
 * Contrôle d'accès basé sur les rôles et permissions
 */
class RBACMiddleware {
  /**
   * Vérifie si l'utilisateur a une permission spécifique
   * @param {string} permissionName - Nom de la permission requise
   * @returns {Function} Middleware Express
   */
  requirePermission(permissionName) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        const hasPermission = await authorizationService.hasPermission(req.user.id, permissionName);
        
        if (!hasPermission) {
          return res.status(403).json(createResponse(
            false,
            'Permission refusée',
            { 
              code: 'PERMISSION_DENIED',
              requiredPermission: permissionName,
              userId: req.user.id
            }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification des permissions',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Vérifie si l'utilisateur a l'une des permissions requises
   * @param {Array<string>} permissions - Liste des permissions requises
   * @param {string} operator - Opérateur: 'any' ou 'all'
   * @returns {Function} Middleware Express
   */
  requirePermissions(permissions, operator = 'any') {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        let hasPermission;
        
        if (operator === 'any') {
          hasPermission = await authorizationService.hasAnyPermission(req.user.id, permissions);
        } else if (operator === 'all') {
          hasPermission = await authorizationService.hasAllPermissions(req.user.id, permissions);
        } else {
          return res.status(400).json(createResponse(
            false,
            'Opérateur invalide. Utilisez "any" ou "all"',
            { code: 'INVALID_OPERATOR' }
          ));
        }

        if (!hasPermission) {
          return res.status(403).json(createResponse(
            false,
            'Permissions refusées',
            { 
              code: 'PERMISSIONS_DENIED',
              requiredPermissions: permissions,
              operator,
              userId: req.user.id
            }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification des permissions',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param {string} roleName - Nom du rôle requis
   * @returns {Function} Middleware Express
   */
  requireRole(roleName) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        const hasRole = await authorizationService.hasRole(req.user.id, roleName);
        
        if (!hasRole) {
          return res.status(403).json(createResponse(
            false,
            'Rôle requis',
            { 
              code: 'ROLE_REQUIRED',
              requiredRole: roleName,
              userId: req.user.id
            }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification des rôles',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Vérifie si l'utilisateur a l'un des rôles requis
   * @param {Array<string>} roles - Liste des rôles requis
   * @param {string} operator - Opérateur: 'any' ou 'all'
   * @returns {Function} Middleware Express
   */
  requireRoles(roles, operator = 'any') {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        let hasRole;
        
        if (operator === 'any') {
          hasRole = await authorizationService.hasAnyRole(req.user.id, roles);
        } else if (operator === 'all') {
          hasRole = await authorizationService.hasAllRoles(req.user.id, roles);
        } else {
          return res.status(400).json(createResponse(
            false,
            'Opérateur invalide. Utilisez "any" ou "all"',
            { code: 'INVALID_OPERATOR' }
          ));
        }

        if (!hasRole) {
          return res.status(403).json(createResponse(
            false,
            'Rôles requis',
            { 
              code: 'ROLES_REQUIRED',
              requiredRoles: roles,
              operator,
              userId: req.user.id
            }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification des rôles',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Vérifie si l'utilisateur a au moins l'un des rôles spécifiés
   * @param {Array<string>} roles - Liste des rôles requis
   * @returns {Function} Middleware Express
   */
  requireAnyRole(roles) {
    return this.requireRoles(roles, 'any');
  }

  /**
   * Vérifie si l'utilisateur a tous les rôles spécifiés
   * @param {Array<string>} roles - Liste des rôles requis
   * @returns {Function} Middleware Express
   */
  requireAllRoles(roles) {
    return this.requireRoles(roles, 'all');
  }

  /**
   * Vérifie si l'utilisateur peut accéder à une ressource avec une action spécifique
   * @param {string} resource - Nom de la ressource
   * @param {string} action - Action requise
   * @returns {Function} Middleware Express
   */
  requireResourceAccess(resource, action) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        const hasAccess = await authorizationService.canAccessResource(req.user.id, resource, action);
        
        if (!hasAccess) {
          return res.status(403).json(createResponse(
            false,
            'Accès à la ressource refusé',
            { 
              code: 'RESOURCE_ACCESS_DENIED',
              resource,
              action,
              userId: req.user.id
            }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification d\'accès à la ressource',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Vérifie si l'utilisateur est administrateur
   * @returns {Function} Middleware Express
   */
  requireAdmin() {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        const isAdmin = await authorizationService.isAdmin(req.user.id);
        
        if (!isAdmin) {
          return res.status(403).json(createResponse(
            false,
            'Privilèges administrateur requis',
            { code: 'ADMIN_REQUIRED' }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification des privilèges administrateur',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Vérifie si l'utilisateur est super administrateur
   * @returns {Function} Middleware Express
   */
  requireSuperAdmin() {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        const isSuperAdmin = await authorizationService.isSuperAdmin(req.user.id);
        
        if (!isSuperAdmin) {
          return res.status(403).json(createResponse(
            false,
            'Privilèges super administrateur requis',
            { code: 'SUPER_ADMIN_REQUIRED' }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification des privilèges super administrateur',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Vérifie si l'utilisateur est le propriétaire de la ressource
   * @param {string} resourceIdField - Champ contenant l'ID du propriétaire
   * @returns {Function} Middleware Express
   */
  requireOwnership(resourceIdField = 'userId') {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        const resourceUserId = req.params[resourceIdField] || req.body[resourceIdField];
        
        if (!resourceUserId) {
          return res.status(400).json(createResponse(
            false,
            'ID de propriétaire de ressource requis',
            { code: 'RESOURCE_OWNER_ID_REQUIRED' }
          ));
        }

        const targetUserId = parseInt(resourceUserId);
        const currentUserId = req.user.id;

        // Les administrateurs peuvent accéder à toutes les ressources
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
          return next();
        }

        if (targetUserId !== currentUserId) {
          return res.status(403).json(createResponse(
            false,
            'Accès à la ressource refusé (propriétaire requis)',
            { 
              code: 'RESOURCE_OWNERSHIP_REQUIRED',
              resourceOwnerId: targetUserId,
              currentUserId
            }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification de propriété',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Vérifie une politique d'autorisation complexe
   * @param {Object} policy - Politique d'autorisation
   * @returns {Function} Middleware Express
   */
  requirePolicy(policy) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        const authorized = await authorizationService.checkPolicy(req.user.id, policy);
        
        if (!authorized) {
          return res.status(403).json(createResponse(
            false,
            'Autorisation refusée selon la politique',
            { 
              code: 'POLICY_DENIED',
              policy,
              userId: req.user.id
            }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification de la politique',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Middleware optionnel - ne bloque pas si l'utilisateur n'est pas authentifié
   * @param {Function} middleware - Middleware RBAC à appliquer
   * @returns {Function} Middleware Express
   */
  optional(middleware) {
    return async (req, res, next) => {
      if (!req.user || !req.user.id) {
        return next();
      }
      
      return middleware(req, res, next);
    };
  }

  /**
   * Middleware conditionnel - applique le middleware RBAC seulement si une condition est remplie
   * @param {Function} condition - Fonction de condition
   * @param {Function} middleware - Middleware RBAC à appliquer
   * @returns {Function} Middleware Express
   */
  conditional(condition, middleware) {
    return async (req, res, next) => {
      try {
        const shouldApply = await condition(req);
        
        if (!shouldApply) {
          return next();
        }
        
        return middleware(req, res, next);
      } catch (error) {
        console.error('Erreur dans le middleware RBAC conditionnel:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur dans la condition du middleware RBAC',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Vérifie si l'utilisateur peut accéder à sa propre ressource ou a un rôle spécifique
   * @param {string} roleName - Nom du rôle requis pour accéder aux autres ressources
   * @returns {Function} Middleware Express
   */
  requireOwnershipOrRole(roleName) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json(createResponse(
            false,
            'Authentification requise',
            { code: 'AUTHENTICATION_REQUIRED' }
          ));
        }

        const targetUserId = req.params.id || req.params.userId;
        
        // Vérifier si l'utilisateur accède à sa propre ressource
        if (req.user.id === parseInt(targetUserId)) {
          return next();
        }

        // Sinon, vérifier si l'utilisateur a le rôle requis
        const hasRole = await authorizationService.hasRole(req.user.id, roleName);

        if (!hasRole) {
          return res.status(403).json(createResponse(
            false,
            'Accès refusé: vous ne pouvez accéder qu\'à vos propres ressources ou avoir le rôle requis',
            { 
              code: 'OWNERSHIP_OR_ROLE_REQUIRED',
              requiredRole: roleName,
              targetUserId,
              userId: req.user.id
            }
          ));
        }

        next();
      } catch (error) {
        console.error('Erreur dans le middleware RBAC:', error);
        return res.status(500).json(createResponse(
          false,
          'Erreur lors de la vérification des permissions',
          { code: 'RBAC_ERROR' }
        ));
      }
    };
  }

  /**
   * Middleware de logging pour les vérifications RBAC
   * @returns {Function} Middleware Express
   */
  withLogging() {
    return (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Logger les vérifications RBAC
        if (res.statusCode === 403) {
          console.log(`🚫 [RBAC] Accès refusé: ${req.method} ${req.originalUrl}`);
          if (req.user) {
            console.log(`   User: ${req.user.id} (${req.user.email || req.user.username}) - Role: ${req.user.role}`);
          }
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }
}

// Créer une instance de la classe pour l'export
const rbacMiddleware = new RBACMiddleware();

module.exports = {
  requirePermission: rbacMiddleware.requirePermission.bind(rbacMiddleware),
  requireRole: rbacMiddleware.requireRole.bind(rbacMiddleware),
  requireAnyRole: rbacMiddleware.requireAnyRole.bind(rbacMiddleware),
  requireAllRoles: rbacMiddleware.requireAllRoles.bind(rbacMiddleware),
  requireOwnershipOrRole: rbacMiddleware.requireOwnershipOrRole.bind(rbacMiddleware),
  requireSuperAdmin: rbacMiddleware.requireSuperAdmin.bind(rbacMiddleware)
};
