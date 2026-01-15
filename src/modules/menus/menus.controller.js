const menuService = require('./menus.service');
const { createResponse } = require('../../utils/response');

/**
 * Controller HTTP pour la gestion des menus
 * Gère les requêtes et réponses HTTP avec validation et gestion d'erreurs
 */
class MenuController {
  /**
   * Crée un nouveau menu
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async createMenu(req, res, next) {
    try {
      const { 
        label, 
        description, 
        icon, 
        route, 
        parentMenuId, 
        sortOrder, 
        isVisible, 
        status 
      } = req.body;
      const createdBy = req.user?.id;

      const menu = await menuService.createMenu({
        label,
        description,
        icon,
        route,
        parentMenuId,
        sortOrder,
        isVisible,
        status,
        createdBy
      });

      res.status(201).json(createResponse(
        true,
        'Menu créé avec succès',
        menu
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère tous les menus avec pagination et filtres
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getMenus(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        isVisible,
        parentMenuId,
        sortBy = 'sort_order',
        sortOrder = 'ASC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        isVisible: isVisible !== undefined ? isVisible === 'true' : undefined,
        parentMenuId: parentMenuId ? parseInt(parentMenuId) : undefined,
        sortBy,
        sortOrder
      };

      const result = await menuService.getMenus(options);

      res.status(200).json(createResponse(
        true,
        'Menus récupérés avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère un menu par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getMenuById(req, res, next) {
    try {
      const { id } = req.params;

      const menu = await menuService.getMenuById(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Menu récupéré avec succès',
        menu
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère l'arborescence complète des menus
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getMenuTree(req, res, next) {
    try {
      const { status, isVisible } = req.query;

      const options = {
        status,
        isVisible: isVisible !== undefined ? isVisible === 'true' : undefined
      };

      const menuTree = await menuService.getMenuTree(options);

      res.status(200).json(createResponse(
        true,
        'Arborescence des menus récupérée avec succès',
        menuTree
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les menus de premier niveau (racine)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getRootMenus(req, res, next) {
    try {
      const { status, isVisible } = req.query;

      const options = {
        status,
        isVisible: isVisible !== undefined ? isVisible === 'true' : undefined
      };

      const menus = await menuService.getRootMenus(options);

      res.status(200).json(createResponse(
        true,
        'Menus racine récupérés avec succès',
        menus
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour un menu
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async updateMenu(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        label, 
        description, 
        icon, 
        route, 
        parentMenuId, 
        sortOrder, 
        isVisible, 
        status 
      } = req.body;
      const updatedBy = req.user?.id;

      const menu = await menuService.updateMenu(
        parseInt(id),
        { label, description, icon, route, parentMenuId, sortOrder, isVisible, status },
        updatedBy
      );

      res.status(200).json(createResponse(
        true,
        'Menu mis à jour avec succès',
        menu
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime un menu
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async deleteMenu(req, res, next) {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id;

      const deleted = await menuService.deleteMenu(parseInt(id), deletedBy);

      if (deleted) {
        res.status(200).json(createResponse(
          true,
          'Menu supprimé avec succès',
          { deleted }
        ));
      } else {
        res.status(404).json(createResponse(
          false,
          'Menu non trouvé ou déjà supprimé'
        ));
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Active ou désactive un menu
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async updateMenuStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = req.user?.id;

      const result = await menuService.updateMenuStatus(
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
   * Récupère les menus accessibles à un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getUserMenus(req, res, next) {
    try {
      const { userId } = req.params;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur requis'
        ));
      }

      const menus = await menuService.getUserMenus(targetUserId);

      res.status(200).json(createResponse(
        true,
        'Menus utilisateur récupérés avec succès',
        { userId: targetUserId, menus }
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
  async checkUserMenuAccess(req, res, next) {
    try {
      const { userId, menuId } = req.query;
      const targetUserId = userId ? parseInt(userId) : req.user?.id;

      if (!targetUserId || !menuId) {
        return res.status(400).json(createResponse(
          false,
          'ID utilisateur et ID du menu requis'
        ));
      }

      const hasAccess = await menuService.checkUserMenuAccess(targetUserId, parseInt(menuId));

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
   * Associe des permissions à un menu
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async assignMenuPermissions(req, res, next) {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;
      const createdBy = req.user?.id;

      const result = await menuService.assignMenuPermissions(
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
   * Supprime toutes les permissions d'un menu
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async removeAllMenuPermissions(req, res, next) {
    try {
      const { id } = req.params;

      const result = await menuService.removeAllMenuPermissions(parseInt(id));

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
   * Récupère les statistiques des menus
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getMenuStats(req, res, next) {
    try {
      const stats = await menuService.getMenuStats();

      res.status(200).json(createResponse(
        true,
        'Statistiques des menus récupérées avec succès',
        stats
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Réorganise l'ordre des menus
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async reorderMenus(req, res, next) {
    try {
      const { menuOrders } = req.body;
      const updatedBy = req.user?.id;

      const result = await menuService.reorderMenus(menuOrders, updatedBy);

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
   * Duplique un menu avec ses permissions
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async duplicateMenu(req, res, next) {
    try {
      const { id } = req.params;
      const { label, description } = req.body;
      const createdBy = req.user?.id;

      const newMenu = await menuService.duplicateMenu(
        parseInt(id),
        { name, description },
        createdBy
      );

      res.status(201).json(createResponse(
        true,
        'Menu dupliqué avec succès',
        newMenu
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les permissions d'un menu
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getMenuPermissions(req, res, next) {
    try {
      const { id } = req.params;

      const menuRepository = require('./menus.repository');
      const menu = await menuRepository.findById(parseInt(id));
      if (!menu) {
        return res.status(404).json(createResponse(
          false,
          'Menu non trouvé'
        ));
      }

      const permissions = await menuRepository.getMenuPermissions(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Permissions du menu récupérées avec succès',
        {
          menuId: parseInt(id),
          menuName: menu.name,
          permissions
        }
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuController();
