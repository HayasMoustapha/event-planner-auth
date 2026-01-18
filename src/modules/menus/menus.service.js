const menuRepository = require('./menus.repository');
const { createResponse } = require('../../utils/response');

/**
 * Service métier pour la gestion des menus
 * Gère la logique métier, validation et opérations complexes
 */
class MenuService {
  /**
   * Crée un nouveau menu avec validation
   * @param {Object} menuData - Données du menu
   * @returns {Promise<Object>} Menu créé
   */
  async createMenu(menuData) {
    const {
      label,
      description,
      icon,
      route,
      component,
      parentPath,
      menuGroup,
      sortOrder = 0,
      depth = 0,
      createdBy = null
    } = menuData;

    // Validation des entrées
    if (!label || !label.trim()) {
      throw new Error('Le label du menu est requis');
    }

    if (label.trim().length < 2 || label.trim().length > 255) {
      throw new Error('Le label du menu doit contenir entre 2 et 255 caractères');
    }

    if (typeof sortOrder !== 'number' || sortOrder < 0 || sortOrder > 9999) {
      throw new Error('L\'ordre de tri doit être un nombre entre 0 et 9999');
    }

    if (typeof depth !== 'number' || depth < 0 || depth > 10) {
      throw new Error('La profondeur doit être un nombre entre 0 et 10');
    }

    if (typeof menuGroup !== 'number' || menuGroup < 1) {
      throw new Error('Le groupe de menu doit être un nombre positif');
    }

    // Validation du menu parent si spécifié
    if (parentMenuId !== null) {
      if (parentMenuId <= 0) {
        throw new Error('L\'ID du menu parent doit être positif');
      }
      
      // Vérifier si le menu parent existe
      const parentMenu = await menuRepository.findById(parentMenuId);
      if (!parentMenu) {
        throw new Error('Le menu parent spécifié n\'existe pas');
      }
      
      // Empêcher la création de boucles dans l'arborescence
      if (parentMenuId === createdBy) {
        throw new Error('Un menu ne peut pas être son propre parent');
      }
    }

    // Vérifier si le label existe déjà au même niveau
    const existingMenus = await menuRepository.findAll({
      page: 1,
      limit: 100,
      parentMenuId,
      status: 'active'
    });
    
    const duplicateLabel = existingMenus.menus.find(menu => 
      menu.label.toLowerCase() === label.trim().toLowerCase()
    );
    
    if (duplicateLabel) {
      throw new Error('Un menu avec ce label existe déjà au même niveau');
    }

    // Créer le menu
    const menu = await menuRepository.create({
      label: label.trim(),
      description: description || null,
      icon: icon?.trim() || null,
      route: route?.trim() || null,
      component: component?.trim() || null,
      parentPath: parentPath?.trim() || null,
      menuGroup,
      sortOrder,
      depth,
      createdBy
    });

    console.log(`📋 Menu créé: ${menu.label} (ID: ${menu.id}) par l'utilisateur ${createdBy}`);
    
    return menu;
  }

  /**
   * Récupère les menus avec filtres et pagination
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} Menus et pagination
   */
  async getMenus(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      parentMenuId
    } = options;

    // Validation des options
    if (page < 1) {
      throw new Error('Le numéro de page doit être supérieur à 0');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('La limite doit être entre 1 et 100');
    }

    return await menuRepository.findAll({
      page,
      limit,
      search,
      parentMenuId
    });
  }

  /**
   * Récupère un menu par son ID
   * @param {number} id - ID du menu
   * @returns {Promise<Object>} Menu trouvé
   */
  async getMenuById(id) {
    if (!id || id <= 0) {
      throw new Error('ID de menu invalide');
    }

    const menu = await menuRepository.findById(id);
    if (!menu) {
      throw new Error('Menu non trouvé');
    }

    return menu;
  }

  /**
   * Récupère l'arborescence complète des menus
   * @param {Object} options - Options de filtre
   * @returns {Promise<Array>} Arborescence des menus
   */
  async getMenuTree(options = {}) {
    const { status = 'active', isVisible = true } = options;

    return await menuRepository.getMenuTree({ status, isVisible });
  }

  /**
   * Récupère les menus de premier niveau (racine)
   * @param {Object} options - Options de filtre
   * @returns {Promise<Array>} Menus racine
   */
  async getRootMenus(options = {}) {
    const { status = 'active', isVisible = true } = options;

    return await menuRepository.getRootMenus({ status, isVisible });
  }

  /**
   * Met à jour un menu avec validation
   * @param {number} id - ID du menu
   * @param {Object} updateData - Données à mettre à jour
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Menu mis à jour
   */
  async updateMenu(id, updateData, updatedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de menu invalide');
    }

    // Vérifier si le menu existe
    const existingMenu = await menuRepository.findById(id);
    if (!existingMenu) {
      throw new Error('Menu non trouvé');
    }

    // Validation des données de mise à jour
    const {
      label,
      description,
      icon,
      route,
      parentMenuId,
      sortOrder,
      isVisible,
      status
    } = updateData;

    if (label !== undefined) {
      if (!label || !label.trim()) {
        throw new Error('Le label du menu est requis');
      }
      if (label.trim().length < 2 || label.trim().length > 100) {
        throw new Error('Le label du menu doit contenir entre 2 et 100 caractères');
      }

      // Vérifier si le nouveau label est déjà utilisé au même niveau
      const finalParentId = parentMenuId !== undefined ? parentMenuId : existingMenu.parent_menu_id;
      const existingMenus = await menuRepository.findAll({
        page: 1,
        limit: 100,
        parentMenuId: finalParentId,
        status: 'active'
      });
      
      const duplicateLabel = existingMenus.menus.find(menu => 
        menu.label.toLowerCase() === label.trim().toLowerCase() && menu.id !== id
      );
      
      if (duplicateLabel) {
        throw new Error('Un menu avec ce label existe déjà au même niveau');
      }
    }

    if (description !== undefined && description && description.length > 255) {
      throw new Error('La description ne peut pas dépasser 255 caractères');
    }

    if (icon !== undefined && icon && icon.length > 100) {
      throw new Error('L\'icône ne peut pas dépasser 100 caractères');
    }

    if (route !== undefined && route && route.length > 255) {
      throw new Error('La route ne peut pas dépasser 255 caractères');
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        throw new Error('Le statut doit être "active" ou "inactive"');
      }
    }

    if (isVisible !== undefined && typeof isVisible !== 'boolean') {
      throw new Error('La visibilité doit être un booléen');
    }

    if (sortOrder !== undefined) {
      if (typeof sortOrder !== 'number' || sortOrder < 0 || sortOrder > 9999) {
        throw new Error('L\'ordre de tri doit être un nombre entre 0 et 9999');
      }
    }

    // Validation du menu parent si modifié
    if (parentMenuId !== undefined) {
      if (parentMenuId !== null && parentMenuId <= 0) {
        throw new Error('L\'ID du menu parent doit être positif');
      }
      
      if (parentMenuId !== null) {
        // Vérifier si le menu parent existe
        const parentMenu = await menuRepository.findById(parentMenuId);
        if (!parentMenu) {
          throw new Error('Le menu parent spécifié n\'existe pas');
        }
        
        // Empêcher la création de boucles dans l'arborescence
        if (parentMenuId === id) {
          throw new Error('Un menu ne peut pas être son propre parent');
        }
      }
    }

    // Mettre à jour le menu
    const updatedMenu = await menuRepository.update(id, {
      label: label?.trim(),
      description: description?.trim(),
      icon: icon?.trim(),
      route: route?.trim(),
      parentMenuId,
      sortOrder,
      isVisible,
      status
    }, updatedBy);

    console.log(`📋 Menu mis à jour: ${updatedMenu.label} (ID: ${updatedMenu.id}) par l'utilisateur ${updatedBy}`);
    
    return updatedMenu;
  }

  /**
   * Supprime un menu (soft delete)
   * @param {number} id - ID du menu
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} True si supprimé
   */
  async deleteMenu(id, deletedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de menu invalide');
    }

    // Vérifier si le menu existe
    const menu = await menuRepository.findById(id);
    if (!menu) {
      throw new Error('Menu non trouvé');
    }

    // Empêcher la suppression de menus système critiques
    const criticalMenus = [1, 2, 3]; // IDs des menus critiques
    if (criticalMenus.includes(id)) {
      throw new Error('Impossible de supprimer un menu système critique');
    }

    // Vérifier si le menu a des sous-menus
    const subMenus = await menuRepository.getSubMenus(id);
    if (subMenus.length > 0) {
      throw new Error('Impossible de supprimer un menu qui contient des sous-menus');
    }

    // Supprimer le menu
    const deleted = await menuRepository.delete(id, deletedBy);
    
    if (deleted) {
      console.log(`🗑️ Menu supprimé: ${menu.label} (ID: ${menu.id}) par l'utilisateur ${deletedBy}`);
    }
    
    return deleted;
  }

  /**
   * Active ou désactive un menu
   * @param {number} id - ID du menu
   * @param {string} status - Nouveau statut
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateMenuStatus(id, status, updatedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de menu invalide');
    }

    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new Error('Le statut doit être "active" ou "inactive"');
    }

    const menu = await menuRepository.findById(id);
    if (!menu) {
      throw new Error('Menu non trouvé');
    }

    const updated = await menuRepository.updateStatus(id, status, updatedBy);
    
    if (updated) {
      console.log(`🔄 Menu ${status === 'active' ? 'activé' : 'désactivé'}: ${menu.label} (ID: ${id})`);
    }
    
    return {
      updated,
      menuId: id,
      status,
      message: `Menu ${status === 'active' ? 'activé' : 'désactivé'} avec succès`
    };
  }

  /**
   * Récupère les menus accessibles à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Menus accessibles
   */
  async getUserMenus(userId) {
    if (!userId || userId <= 0) {
      throw new Error('ID utilisateur invalide');
    }

    return await menuRepository.getUserMenus(userId);
  }

  /**
   * Vérifie si un utilisateur a accès à un menu
   * @param {number} userId - ID de l'utilisateur
   * @param {number} menuId - ID du menu
   * @returns {Promise<boolean>} True si l'utilisateur a accès
   */
  async checkUserMenuAccess(userId, menuId) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!menuId || menuId <= 0) {
      return false;
    }

    return await menuRepository.userHasMenuAccess(userId, menuId);
  }

  /**
   * Associe des permissions à un menu
   * @param {number} menuId - ID du menu
   * @param {Array<number>} permissionIds - IDs des permissions
   * @param {number} createdBy - ID de l'utilisateur qui effectue l'association
   * @returns {Promise<Object>} Résultat de l'association
   */
  async assignMenuPermissions(menuId, permissionIds, createdBy = null) {
    if (!menuId || menuId <= 0) {
      throw new Error('ID de menu invalide');
    }

    if (!Array.isArray(permissionIds)) {
      throw new Error('Les IDs de permissions doivent être un tableau');
    }

    if (permissionIds.length === 0) {
      return { assigned: 0, message: 'Aucune permission à associer' };
    }

    // Vérifier si le menu existe
    const menu = await menuRepository.findById(menuId);
    if (!menu) {
      throw new Error('Menu non trouvé');
    }

    // Valider les IDs de permissions
    const validPermissionIds = permissionIds.filter(id => 
      id && typeof id === 'number' && id > 0
    );

    if (validPermissionIds.length !== permissionIds.length) {
      throw new Error('Certains IDs de permissions sont invalides');
    }

    // Associer les permissions
    const assignedCount = await menuRepository.assignPermissions(
      menuId, 
      validPermissionIds, 
      createdBy
    );

    console.log(`🔐 ${assignedCount} permissions associées au menu ${menu.label} (ID: ${menuId})`);
    
    return {
      assigned: assignedCount,
      menuId,
      permissionIds: validPermissionIds,
      message: `${assignedCount} permissions associées avec succès`
    };
  }

  /**
   * Supprime toutes les permissions d'un menu
   * @param {number} menuId - ID du menu
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async removeAllMenuPermissions(menuId) {
    if (!menuId || menuId <= 0) {
      throw new Error('ID de menu invalide');
    }

    const menu = await menuRepository.findById(menuId);
    if (!menu) {
      throw new Error('Menu non trouvé');
    }

    const removedCount = await menuRepository.removeAllPermissions(menuId);
    
    console.log(`🗑️ ${removedCount} permissions supprimées du menu ${menu.label} (ID: ${menuId})`);
    
    return {
      removed: removedCount,
      menuId,
      message: `${removedCount} permissions supprimées avec succès`
    };
  }

  /**
   * Récupère les statistiques des menus
   * @returns {Promise<Object>} Statistiques
   */
  async getMenuStats() {
    return await menuRepository.getStats();
  }

  /**
   * Réorganise l'ordre des menus
   * @param {Array<Object>} menuOrders - Liste des menus avec leur ordre
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Résultat de la réorganisation
   */
  async reorderMenus(menuOrders, updatedBy = null) {
    if (!Array.isArray(menuOrders) || menuOrders.length === 0) {
      throw new Error('La liste des menus est requise');
    }

    // Valider chaque entrée
    for (const menuOrder of menuOrders) {
      if (!menuOrder.menuId || !menuOrder.sortOrder !== undefined) {
        throw new Error('Chaque entrée doit contenir menuId et sortOrder');
      }
      
      if (menuOrder.menuId <= 0) {
        throw new Error('L\'ID du menu doit être positif');
      }
      
      if (typeof menuOrder.sortOrder !== 'number' || menuOrder.sortOrder < 0) {
        throw new Error('L\'ordre de tri doit être un nombre positif');
      }
    }

    const updatedCount = await menuRepository.reorderMenus(menuOrders, updatedBy);
    
    console.log(`🔄 ${updatedCount} menus réorganisés par l'utilisateur ${updatedBy}`);
    
    return {
      updated: updatedCount,
      total: menuOrders.length,
      message: `${updatedCount} menus réorganisés avec succès`
    };
  }

  /**
   * Duplique un menu avec ses permissions
   * @param {number} sourceMenuId - ID du menu source
   * @param {Object} newMenuData - Données du nouveau menu
   * @param {number} createdBy - ID de l'utilisateur qui crée
   * @returns {Promise<Object>} Nouveau menu créé
   */
  async duplicateMenu(sourceMenuId, newMenuData, createdBy = null) {
    if (!sourceMenuId || sourceMenuId <= 0) {
      throw new Error('ID du menu source invalide');
    }

    const { label, description } = newMenuData;

    // Vérifier si le menu source existe
    const sourceMenu = await menuRepository.findById(sourceMenuId);
    if (!sourceMenu) {
      throw new Error('Menu source non trouvé');
    }

    // Créer le nouveau menu avec les mêmes propriétés
    const newMenu = await this.createMenu({
      name: name || `${sourceMenu.name} (copie)`,
      description: description || sourceMenu.description,
      icon: sourceMenu.icon,
      route: sourceMenu.route,
      parentMenuId: sourceMenu.parent_menu_id,
      sortOrder: sourceMenu.sort_order + 1,
      isVisible: sourceMenu.is_visible,
      status: sourceMenu.status,
      createdBy
    });

    // Copier les permissions
    const permissions = await menuRepository.getMenuPermissions(sourceMenuId);
    if (permissions.length > 0) {
      const permissionIds = permissions.map(p => p.id);
      await this.assignMenuPermissions(newMenu.id, permissionIds, createdBy);
    }

    console.log(`📋 Menu dupliqué: ${sourceMenu.name} → ${newMenu.name}`);
    
    return newMenu;
  }
}

module.exports = new MenuService();
