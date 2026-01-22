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
        sortOrder
      } = req.body;
      const createdBy = req.user?.id;

      const menu = await menuService.createMenu({
        label,
        description,
        icon,
        route,
        parentMenuId,
        sortOrder,
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
        parentMenuId,
        sortBy = 'sort_order',
        sortOrder = 'ASC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
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

      // Validation et conversion de permissionIds
      let processedPermissionIds;
      if (Array.isArray(permissionIds)) {
        processedPermissionIds = permissionIds;
      } else if (permissionIds === undefined || permissionIds === null) {
        processedPermissionIds = [];
      } else if (typeof permissionIds === 'string') {
        // Si c'est une chaîne JSON, essayer de la parser
        try {
          processedPermissionIds = JSON.parse(permissionIds);
        } catch {
          // Si ce n'est pas du JSON, traiter comme une seule valeur
          processedPermissionIds = [permissionIds];
        }
      } else {
        // Pour tout autre type, le convertir en tableau
        processedPermissionIds = [permissionIds];
      }

      // S'assurer que tous les IDs sont des entiers
      processedPermissionIds = processedPermissionIds.map(id => {
        const numId = parseInt(id);
        return isNaN(numId) ? null : numId;
      }).filter(id => id !== null);

      const result = await menuService.assignMenuPermissions(
        parseInt(id),
        processedPermissionIds,
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
        { label, description },
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
          menuLabel: menu.label,
          permissions
        }
      ));
    } catch (error) {
      next(error);
    }
  }

  // ===== NOUVELLES MÉTHODES POUR LES ROUTES MANQUANTES =====

  /**
   * Récupère un menu par son ID
   */
  async getMenuById(req, res, next) {
    try {
      const { menuId } = req.params;
      const menuRepository = require('./menus.repository');
      const menu = await menuRepository.findById(parseInt(menuId));
      
      if (!menu) {
        return res.status(404).json(createResponse(
          false,
          'Menu non trouvé'
        ));
      }

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
   * Récupère l'accès à un menu
   */
  async getMenuAccess(req, res, next) {
    try {
      const { menuId } = req.params;
      const menuRepository = require('./menus.repository');
      const access = await menuRepository.getMenuAccess(parseInt(menuId));
      
      res.status(200).json(createResponse(
        true,
        'Accès menu récupéré',
        { menuId: parseInt(menuId), access }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplique un menu
   */
  async duplicateMenu(req, res, next) {
    try {
      const { menuId } = req.params;
      const menuRepository = require('./menus.repository');
      const duplicatedMenu = await menuRepository.duplicateMenu(parseInt(menuId));
      
      res.status(201).json(createResponse(
        true,
        'Menu dupliqué avec succès',
        duplicatedMenu
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère une permission de menu par son ID
   */
  async getMenuPermissionById(req, res, next) {
    try {
      const { menuId, permissionId } = req.params;
      const menuRepository = require('./menus.repository');
      const permission = await menuRepository.getMenuPermissionById(parseInt(menuId), parseInt(permissionId));
      
      if (!permission) {
        return res.status(404).json(createResponse(
          false,
          'Permission de menu non trouvée'
        ));
      }

      res.status(200).json(createResponse(
        true,
        'Permission de menu récupérée',
        permission
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les menus cachés
   */
  async getHiddenMenus(req, res, next) {
    try {
      const menuRepository = require('./menus.repository');
      const menus = await menuRepository.getHiddenMenus();
      
      res.status(200).json(createResponse(
        true,
        'Menus cachés récupérés',
        { menus, count: menus.length }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les menus par parent
   */
  async getMenusByParent(req, res, next) {
    try {
      const { menuId } = req.params;
      const menuRepository = require('./menus.repository');
      const menus = await menuRepository.getMenusByParent(parseInt(menuId));
      
      res.status(200).json(createResponse(
        true,
        'Menus par parent récupérés',
        { parentId: parseInt(menuId), menus, count: menus.length }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Réorganise les menus
   */
  async reorderMenus(req, res, next) {
    try {
      const { menuOrders } = req.body;
      const menuRepository = require('./menus.repository');
      const result = await menuRepository.reorderMenus(menuOrders);
      
      res.status(200).json(createResponse(
        true,
        'Menus réorganisés avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les menus racines
   */
  async getRootMenus(req, res, next) {
    try {
      const menuRepository = require('./menus.repository');
      const menus = await menuRepository.getRootMenus();
      
      res.status(200).json(createResponse(
        true,
        'Menus racines récupérés',
        { menus, count: menus.length }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère uniquement les menus racines
   */
  async getRootOnlyMenus(req, res, next) {
    try {
      const menuRepository = require('./menus.repository');
      const menus = await menuRepository.getRootOnlyMenus();
      
      res.status(200).json(createResponse(
        true,
        'Menus racines uniquement récupérés',
        { menus, count: menus.length }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les menus actifs
   */
  async getActiveMenus(req, res, next) {
    try {
      const menuRepository = require('./menus.repository');
      const menus = await menuRepository.getActiveMenus();
      
      res.status(200).json(createResponse(
        true,
        'Menus actifs récupérés',
        { menus, count: menus.length }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les menus d'un utilisateur
   */
  async getUserMenus(req, res, next) {
    try {
      const { userId } = req.params;
      const menuRepository = require('./menus.repository');
      const menus = await menuRepository.getUserMenus(parseInt(userId));
      
      res.status(200).json(createResponse(
        true,
        'Menus utilisateur récupérés',
        { userId: parseInt(userId), menus, count: menus.length }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les menus visibles
   */
  async getVisibleMenus(req, res, next) {
    try {
      const menuRepository = require('./menus.repository');
      const menus = await menuRepository.getVisibleMenus();
      
      res.status(200).json(createResponse(
        true,
        'Menus visibles récupérés',
        { menus, count: menus.length }
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuController();
