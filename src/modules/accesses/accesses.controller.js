const accessesService = require('./accesses.service');
const { createResponse } = require('../../utils/response');

/**
 * Controller pour la gestion des accès (associations utilisateur-rôle)
 * Gère les requêtes HTTP et les réponses API
 */
class AccessesController {
  /**
   * Crée une nouvelle association utilisateur-rôle
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async createAccess(req, res, next) {
    try {
      const { userId, roleId, status } = req.body;
      const createdBy = req.user?.id;

      const result = await accessesService.createAccess({
        userId,
        roleId,
        status
      }, createdBy);

      res.status(201).json(createResponse(
        true,
        'Accès créé avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère toutes les associations avec pagination et filtres
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAllAccesses(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        userId,
        roleId,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const result = await accessesService.getAllAccesses({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        userId: userId ? parseInt(userId) : null,
        roleId: roleId ? parseInt(roleId) : null,
        sortBy,
        sortOrder
      });

      res.status(200).json(createResponse(
        true,
        'Accès récupérés avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère un accès par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAccessById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await accessesService.getAccessById(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Accès récupéré avec succès',
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
      const { onlyActive = 'true' } = req.query;

      const result = await accessesService.getUserRoles(
        parseInt(userId),
        onlyActive === 'true'
      );

      res.status(200).json(createResponse(
        true,
        'Rôles de l\'utilisateur récupérés avec succès',
        {
          userId: parseInt(userId),
          roles: result,
          count: result.length
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les utilisateurs ayant un rôle spécifique
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getRoleUsers(req, res, next) {
    try {
      const { roleId } = req.params;
      const { onlyActive = 'true' } = req.query;

      const result = await accessesService.getRoleUsers(
        parseInt(roleId),
        onlyActive === 'true'
      );

      res.status(200).json(createResponse(
        true,
        'Utilisateurs du rôle récupérés avec succès',
        {
          roleId: parseInt(roleId),
          users: result,
          count: result.length
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour le statut d'un accès
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async updateAccessStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = req.user?.id;

      const result = await accessesService.updateAccessStatus(
        parseInt(id),
        status,
        updatedBy
      );

      res.status(200).json(createResponse(
        true,
        'Statut de l\'accès mis à jour avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime un accès (soft delete)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async deleteAccess(req, res, next) {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id;

      await accessesService.deleteAccess(parseInt(id), deletedBy);

      res.status(200).json(createResponse(
        true,
        'Accès supprimé avec succès'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime définitivement un accès
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async hardDeleteAccess(req, res, next) {
    try {
      const { id } = req.params;

      await accessesService.hardDeleteAccess(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Accès supprimé définitivement avec succès'
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
  async checkUserHasRole(req, res, next) {
    try {
      const { userId, roleId } = req.params;
      const { onlyActive = 'true' } = req.query;

      const hasRole = await accessesService.checkUserHasRole(
        parseInt(userId),
        parseInt(roleId),
        onlyActive === 'true'
      );

      res.status(200).json(createResponse(
        true,
        'Vérification de rôle effectuée avec succès',
        {
          userId: parseInt(userId),
          roleId: parseInt(roleId),
          hasRole,
          onlyActive: onlyActive === 'true'
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assigne plusieurs rôles à un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async assignMultipleRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleIds } = req.body;
      const createdBy = req.user?.id;

      const result = await accessesService.assignMultipleRoles(
        parseInt(userId),
        roleIds,
        createdBy
      );

      res.status(200).json(createResponse(
        true,
        'Assignation multiple de rôles terminée',
        {
          userId: parseInt(userId),
          ...result
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retire plusieurs rôles d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async removeMultipleRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleIds } = req.body;
      const deletedBy = req.user?.id;

      const result = await accessesService.removeMultipleRoles(
        parseInt(userId),
        roleIds,
        deletedBy
      );

      res.status(200).json(createResponse(
        true,
        'Retrait multiple de rôles terminé',
        {
          userId: parseInt(userId),
          ...result
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les statistiques des accès
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAccessStats(req, res, next) {
    try {
      // Cette méthode pourrait implémenter des statistiques avancées
      // Pour l'instant, on retourne un message de fonctionnalité non implémentée
      res.status(501).json(createResponse(
        false,
        'Statistiques des accès non encore implémentées'
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccessesController();
