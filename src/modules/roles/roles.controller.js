const roleService = require('./roles.service');
const { createResponse } = require('../../utils/response');

/**
 * Controller HTTP pour la gestion des rôles
 * Gère les requêtes et réponses HTTP avec validation et gestion d'erreurs
 */
class RoleController {
  /**
   * Crée un nouveau rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async createRole(req, res, next) {
    try {
      const { code, label, description, level } = req.body;
      const createdBy = req.user?.id;

      const role = await roleService.createRole({
        code,
        label,
        description,
        level,
        createdBy
      });

      res.status(201).json(createResponse(
        true,
        'Rôle créé avec succès',
        role
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère tous les rôles avec pagination et filtres
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getRoles(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sortBy,
        sortOrder
      };

      const result = await roleService.getRoles(options);

      res.status(200).json(createResponse(
        true,
        'Rôles récupérés avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère un rôle par son ID avec ses permissions
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getRoleById(req, res, next) {
    try {
      const { id } = req.params;

      const role = await roleService.getRoleById(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Rôle récupéré avec succès',
        role
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour un rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { code, description, status, level } = req.body;
      const updatedBy = req.user?.id;

      const role = await roleService.updateRole(
        parseInt(id),
        { code, description, status, level },
        updatedBy
      );

      res.status(200).json(createResponse(
        true,
        'Rôle mis à jour avec succès',
        role
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime un rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async deleteRole(req, res, next) {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id;

      const deleted = await roleService.deleteRole(parseInt(id), deletedBy);

      if (deleted) {
        res.status(200).json(createResponse(
          true,
          'Rôle supprimé avec succès',
          { deleted }
        ));
      } else {
        res.status(404).json(createResponse(
          false,
          'Rôle non trouvé ou déjà supprimé'
        ));
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Associe des permissions à un rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async assignPermissions(req, res, next) {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;
      const createdBy = req.user?.id;

      const result = await roleService.assignPermissions(
        parseInt(id),
        permissionIds,
        createdBy
      );

      res.status(200).json(createResponse(
        true,
        result.message,
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime toutes les permissions d'un rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async removeAllPermissions(req, res, next) {
    try {
      const { id } = req.params;

      const result = await roleService.removeAllPermissions(parseInt(id));

      res.status(200).json(createResponse(
        true,
        result.message,
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Active ou désactive un rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async updateRoleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = req.user?.id;

      const result = await roleService.updateRoleStatus(
        parseInt(id),
        status,
        updatedBy
      );

      res.status(200).json(createResponse(
        true,
        result.message,
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les rôles d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getUserRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const roles = await roleService.getUserRoles(targetUserId);

      res.status(200).json(createResponse(
        true,
        'Rôles utilisateur récupérés avec succès',
        { userId: targetUserId, roles }
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
  async checkUserRole(req, res, next) {
    try {
      const { userId, roleCode } = req.query;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !roleCode) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et code du rôle requis'
        ));
      }

      const hasRole = await roleService.checkUserRole(targetUserId, roleCode);

      res.status(200).json(createResponse(
        true,
        'Vérification de rôle effectuée',
        {
          userId: targetUserId,
          roleCode,
          hasRole
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

      const role = await roleService.getUserHighestRole(targetUserId);

      res.status(200).json(createResponse(
        true,
        'Rôle de plus haut niveau récupéré avec succès',
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
   * Récupère les statistiques des rôles
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getRoleStats(req, res, next) {
    try {
      const stats = await roleService.getRoleStats();

      res.status(200).json(createResponse(
        true,
        'Statistiques des rôles récupérées avec succès',
        stats
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplique un rôle avec ses permissions
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async duplicateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { code, description } = req.body;
      const createdBy = req.user?.id;

      const newRole = await roleService.duplicateRole(
        parseInt(id),
        { code, description },
        createdBy
      );

      res.status(201).json(createResponse(
        true,
        'Rôle dupliqué avec succès',
        newRole
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
      const { id } = req.params;

      const role = await roleService.getRoleById(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Permissions du rôle récupérées avec succès',
        {
          roleId: parseInt(id),
          permissions: role.permissions
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les utilisateurs ayant un rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getRoleUsers(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const roleRepository = require('./roles.repository');
      const result = await roleRepository.getRoleUsers(parseInt(id), {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.status(200).json(createResponse(
        true,
        'Utilisateurs du rôle récupérés avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoleController();
