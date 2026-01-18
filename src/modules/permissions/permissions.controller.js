const permissionService = require('./permissions.service');
const { createResponse } = require('../../utils/response');

/**
 * Controller HTTP pour la gestion des permissions
 * Gère les requêtes et réponses HTTP avec validation et gestion d'erreurs
 */
class PermissionController {
  /**
   * Crée une nouvelle permission
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async createPermission(req, res, next) {
    try {
      const { code, label, description, group } = req.body;
      const createdBy = req.user?.id;

      const permission = await permissionService.createPermission({
        code,
        label,
        description,
        group,
        createdBy
      });

      res.status(201).json(createResponse(
        true,
        'Permission créée avec succès',
        permission
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère toutes les permissions avec pagination et filtres
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getPermissions(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        group,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        group,
        sortBy,
        sortOrder
      };

      const result = await permissionService.getPermissions(options);

      res.status(200).json(createResponse(
        true,
        'Permissions récupérées avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère une permission par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getPermissionById(req, res, next) {
    try {
      const { id } = req.params;

      const permission = await permissionService.getPermissionById(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Permission récupérée avec succès',
        permission
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour une permission
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async updatePermission(req, res, next) {
    try {
      const { id } = req.params;
      const { code, description, group } = req.body;
      const updatedBy = req.user?.id;

      const permission = await permissionService.updatePermission(
        parseInt(id),
        { code, description, group },
        updatedBy
      );

      res.status(200).json(createResponse(
        true,
        'Permission mise à jour avec succès',
        permission
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime une permission
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async deletePermission(req, res, next) {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id;

      const deleted = await permissionService.deletePermission(parseInt(id), deletedBy);

      if (deleted) {
        res.status(200).json(createResponse(
          true,
          'Permission supprimée avec succès',
          { deleted }
        ));
      } else {
        res.status(404).json(createResponse(
          false,
          'Permission non trouvée ou déjà supprimée'
        ));
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les permissions d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getUserPermissions(req, res, next) {
    try {
      const { userId } = req.params;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const permissions = await permissionService.getUserPermissions(targetUserId);

      res.status(200).json(createResponse(
        true,
        'Permissions utilisateur récupérées avec succès',
        { userId: targetUserId, permissions }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkUserPermission(req, res, next) {
    try {
      const { userId, permissionCode } = req.query;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !permissionCode) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et code de la permission requis'
        ));
      }

      const hasPermission = await permissionService.checkUserPermission(targetUserId, permissionCode);

      res.status(200).json(createResponse(
        true,
        'Vérification de permission effectuée',
        {
          userId: targetUserId,
          permissionCode,
          hasPermission
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les permissions d'un rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getRolePermissions(req, res, next) {
    try {
      const { roleId } = req.params;

      if (!roleId) {
        return res.status(400).json(createResponse(
          false,
          'ID de rôle requis'
        ));
      }

      const permissions = await permissionService.getRolePermissions(parseInt(roleId));

      res.status(200).json(createResponse(
        true,
        'Permissions du rôle récupérées avec succès',
        { roleId: parseInt(roleId), permissions }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère toutes les ressources disponibles
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getResources(req, res, next) {
    try {
      const resources = await permissionService.getResources();

      res.status(200).json(createResponse(
        true,
        'Ressources récupérées avec succès',
        resources
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les actions disponibles pour une ressource
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getActionsByResource(req, res, next) {
    try {
      const { resource } = req.params;

      if (!resource) {
        return res.status(400).json(createResponse(
          false,
          'Nom de ressource requis'
        ));
      }

      const actions = await permissionService.getActionsByResource(resource);

      res.status(200).json(createResponse(
        true,
        'Actions récupérées avec succès',
        { resource, actions }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les statistiques des permissions
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getPermissionStats(req, res, next) {
    try {
      const stats = await permissionService.getPermissionStats();

      res.status(200).json(createResponse(
        true,
        'Statistiques des permissions récupérées avec succès',
        stats
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Génère les permissions de base pour une ressource
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async generateResourcePermissions(req, res, next) {
    try {
      const { resource, actions } = req.body;
      const createdBy = req.user?.id;

      const permissions = await permissionService.generateResourcePermissions(
        resource,
        actions,
        createdBy
      );

      res.status(201).json(createResponse(
        true,
        `${permissions.length} permissions générées avec succès`,
        { resource, permissions }
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
  async hasAnyPermission(req, res, next) {
    try {
      const { userId, permissions } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !Array.isArray(permissions)) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et liste de permissions requis'
        ));
      }

      const hasPermission = await permissionService.hasAnyPermission(targetUserId, permissions);

      res.status(200).json(createResponse(
        true,
        'Vérification de permissions effectuée',
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
  async hasAllPermissions(req, res, next) {
    try {
      const { userId, permissions } = req.body;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !Array.isArray(permissions)) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et liste de permissions requis'
        ));
      }

      const hasPermission = await permissionService.hasAllPermissions(targetUserId, permissions);

      res.status(200).json(createResponse(
        true,
        'Vérification de permissions effectuée',
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
}

module.exports = new PermissionController();
