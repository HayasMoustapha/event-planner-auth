const permissionRepository = require('./permissions.repository');
const { createResponse } = require('../../utils/response');

/**
 * Service métier pour la gestion des permissions
 * Gère la logique métier, validation et opérations complexes
 */
class PermissionService {
  /**
   * Crée une nouvelle permission avec validation
   * @param {Object} permissionData - Données de la permission
   * @returns {Promise<Object>} Permission créée
   */
  async createPermission(permissionData) {
    const {
      name,
      description,
      resource,
      action,
      status = 'active',
      createdBy
    } = permissionData;

    // Validation des entrées
    if (!name || !name.trim()) {
      throw new Error('Le nom de la permission est requis');
    }

    if (name.trim().length < 3 || name.trim().length > 100) {
      throw new Error('Le nom de la permission doit contenir entre 3 et 100 caractères');
    }

    if (!resource || !resource.trim()) {
      throw new Error('La ressource est requise');
    }

    if (resource.trim().length < 2 || resource.trim().length > 50) {
      throw new Error('La ressource doit contenir entre 2 et 50 caractères');
    }

    if (!action || !action.trim()) {
      throw new Error('L\'action est requise');
    }

    if (action.trim().length < 2 || action.trim().length > 50) {
      throw new Error('L\'action doit contenir entre 2 et 50 caractères');
    }

    if (description && description.length > 255) {
      throw new Error('La description ne peut pas dépasser 255 caractères');
    }

    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new Error('Le statut doit être "active" ou "inactive"');
    }

    // Validation du format du nom (resource.action)
    const expectedName = `${resource.trim()}.${action.trim()}`;
    if (name.trim() !== expectedName) {
      throw new Error(`Le nom de la permission doit suivre le format: ${expectedName}`);
    }

    // Vérifier si la permission existe déjà
    const existingPermission = await permissionRepository.findByName(name.trim());
    if (existingPermission) {
      throw new Error('Une permission avec ce nom existe déjà');
    }

    // Créer la permission
    const permission = await permissionRepository.create({
      name: name.trim(),
      description: description?.trim() || null,
      resource: resource.trim(),
      action: action.trim(),
      status,
      createdBy
    });

    console.log(`🔐 Permission créée: ${permission.name} (ID: ${permission.id}) par l'utilisateur ${createdBy}`);
    
    return permission;
  }

  /**
   * Récupère les permissions avec filtres et pagination
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} Permissions et pagination
   */
  async getPermissions(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      resource,
      action,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    // Validation des options
    if (page < 1) {
      throw new Error('Le numéro de page doit être supérieur à 0');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('La limite doit être entre 1 et 100');
    }

    if (sortBy && !['name', 'description', 'resource', 'action', 'status', 'created_at', 'updated_at'].includes(sortBy)) {
      throw new Error('Le champ de tri est invalide');
    }

    if (sortOrder && !['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      throw new Error('L\'ordre de tri doit être ASC ou DESC');
    }

    if (status && !['active', 'inactive', 'deleted'].includes(status)) {
      throw new Error('Le statut de filtre est invalide');
    }

    return await permissionRepository.findAll({
      page,
      limit,
      search: search?.trim(),
      status,
      resource,
      action,
      sortBy,
      sortOrder
    });
  }

  /**
   * Récupère une permission par son ID
   * @param {number} id - ID de la permission
   * @returns {Promise<Object>} Permission trouvée
   */
  async getPermissionById(id) {
    if (!id || id <= 0) {
      throw new Error('ID de permission invalide');
    }

    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new Error('Permission non trouvée');
    }

    return permission;
  }

  /**
   * Met à jour une permission avec validation
   * @param {number} id - ID de la permission
   * @param {Object} updateData - Données à mettre à jour
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Permission mise à jour
   */
  async updatePermission(id, updateData, updatedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de permission invalide');
    }

    // Vérifier si la permission existe
    const existingPermission = await permissionRepository.findById(id);
    if (!existingPermission) {
      throw new Error('Permission non trouvée');
    }

    // Validation des données de mise à jour
    const {
      name,
      description,
      resource,
      action,
      status
    } = updateData;

    if (name !== undefined) {
      if (!name || !name.trim()) {
        throw new Error('Le nom de la permission est requis');
      }
      if (name.trim().length < 3 || name.trim().length > 100) {
        throw new Error('Le nom de la permission doit contenir entre 3 et 100 caractères');
      }

      // Vérifier si le nouveau nom est déjà utilisé par une autre permission
      const nameExists = await permissionRepository.findByName(name.trim());
      if (nameExists && nameExists.id !== id) {
        throw new Error('Une permission avec ce nom existe déjà');
      }
    }

    if (resource !== undefined) {
      if (!resource || !resource.trim()) {
        throw new Error('La ressource est requise');
      }
      if (resource.trim().length < 2 || resource.trim().length > 50) {
        throw new Error('La ressource doit contenir entre 2 et 50 caractères');
      }
    }

    if (action !== undefined) {
      if (!action || !action.trim()) {
        throw new Error('L\'action est requise');
      }
      if (action.trim().length < 2 || action.trim().length > 50) {
        throw new Error('L\'action doit contenir entre 2 et 50 caractères');
      }
    }

    if (description !== undefined && description && description.length > 255) {
      throw new Error('La description ne peut pas dépasser 255 caractères');
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        throw new Error('Le statut doit être "active" ou "inactive"');
      }
    }

    // Validation du format du nom si resource ou action sont modifiés
    if (name !== undefined && (resource !== undefined || action !== undefined)) {
      const finalResource = resource?.trim() || existingPermission.resource;
      const finalAction = action?.trim() || existingPermission.action;
      const expectedName = `${finalResource}.${finalAction}`;
      
      if (name.trim() !== expectedName) {
        throw new Error(`Le nom de la permission doit suivre le format: ${expectedName}`);
      }
    }

    // Mettre à jour la permission
    const updatedPermission = await permissionRepository.update(id, {
      name: name?.trim(),
      description: description?.trim(),
      resource: resource?.trim(),
      action: action?.trim(),
      status
    }, updatedBy);

    console.log(`🔐 Permission mise à jour: ${updatedPermission.name} (ID: ${updatedPermission.id}) par l'utilisateur ${updatedBy}`);
    
    return updatedPermission;
  }

  /**
   * Supprime une permission (soft delete)
   * @param {number} id - ID de la permission
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} True si supprimée
   */
  async deletePermission(id, deletedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de permission invalide');
    }

    // Vérifier si la permission existe
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new Error('Permission non trouvée');
    }

    // Empêcher la suppression de permissions système critiques
    const criticalPermissions = [
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'roles.create',
      'roles.read',
      'roles.update',
      'roles.delete'
    ];

    if (criticalPermissions.includes(permission.name)) {
      throw new Error('Impossible de supprimer une permission système critique');
    }

    // Supprimer la permission
    const deleted = await permissionRepository.delete(id, deletedBy);
    
    if (deleted) {
      console.log(`🗑️ Permission supprimée: ${permission.name} (ID: ${permission.id}) par l'utilisateur ${deletedBy}`);
    }
    
    return deleted;
  }

  /**
   * Active ou désactive une permission
   * @param {number} id - ID de la permission
   * @param {string} status - Nouveau statut
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updatePermissionStatus(id, status, updatedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de permission invalide');
    }

    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new Error('Le statut doit être "active" ou "inactive"');
    }

    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new Error('Permission non trouvée');
    }

    const updated = await permissionRepository.updateStatus(id, status, updatedBy);
    
    if (updated) {
      console.log(`🔄 Permission ${status === 'active' ? 'activée' : 'désactivée'}: ${permission.name} (ID: ${id})`);
    }
    
    return {
      updated,
      permissionId: id,
      status,
      message: `Permission ${status === 'active' ? 'activée' : 'désactivée'} avec succès`
    };
  }

  /**
   * Récupère les permissions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Permissions de l'utilisateur
   */
  async getUserPermissions(userId) {
    if (!userId || userId <= 0) {
      throw new Error('ID utilisateur invalide');
    }

    return await permissionRepository.getUserPermissions(userId);
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} permissionName - Nom de la permission
   * @returns {Promise<boolean>} True si l'utilisateur a la permission
   */
  async checkUserPermission(userId, permissionName) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!permissionName || !permissionName.trim()) {
      return false;
    }

    return await permissionRepository.userHasPermission(userId, permissionName.trim());
  }

  /**
   * Récupère les permissions d'un rôle
   * @param {number} roleId - ID du rôle
   * @returns {Promise<Array>} Permissions du rôle
   */
  async getRolePermissions(roleId) {
    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    return await permissionRepository.getRolePermissions(roleId);
  }

  /**
   * Récupère toutes les ressources disponibles
   * @returns {Promise<Array>} Liste des ressources
   */
  async getResources() {
    return await permissionRepository.getResources();
  }

  /**
   * Récupère les actions disponibles pour une ressource
   * @param {string} resource - Nom de la ressource
   * @returns {Promise<Array>} Liste des actions
   */
  async getActionsByResource(resource) {
    if (!resource || !resource.trim()) {
      throw new Error('Nom de ressource requis');
    }

    return await permissionRepository.getActionsByResource(resource.trim());
  }

  /**
   * Récupère les statistiques des permissions
   * @returns {Promise<Object>} Statistiques
   */
  async getPermissionStats() {
    return await permissionRepository.getStats();
  }

  /**
   * Génère les permissions de base pour une ressource
   * @param {string} resource - Nom de la ressource
   * @param {Array<string>} actions - Liste des actions
   * @param {number} createdBy - ID de l'utilisateur qui crée
   * @returns {Promise<Array>} Permissions créées
   */
  async generateResourcePermissions(resource, actions, createdBy = null) {
    if (!resource || !resource.trim()) {
      throw new Error('Nom de ressource requis');
    }

    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error('Liste d\'actions requise');
    }

    const validActions = ['create', 'read', 'update', 'delete', 'manage', 'view', 'list'];
    const invalidActions = actions.filter(action => !validActions.includes(action));
    
    if (invalidActions.length > 0) {
      throw new Error(`Actions invalides: ${invalidActions.join(', ')}`);
    }

    const createdPermissions = [];
    
    for (const action of actions) {
      try {
        const permissionName = `${resource.trim()}.${action}`;
        const permission = await this.createPermission({
          name: permissionName,
          description: `Permission ${action} pour la ressource ${resource}`,
          resource: resource.trim(),
          action,
          createdBy
        });
        createdPermissions.push(permission);
      } catch (error) {
        // Ignorer les erreurs de duplication pour les permissions existantes
        if (!error.message.includes('existe déjà')) {
          throw error;
        }
      }
    }

    console.log(`🔐 ${createdPermissions.length} permissions générées pour la ressource ${resource}`);
    
    return createdPermissions;
  }

  /**
   * Vérifie si un utilisateur a l'une des permissions requises
   * @param {number} userId - ID de l'utilisateur
   * @param {Array<string>} permissions - Liste des permissions requises
   * @returns {Promise<boolean>} True si l'utilisateur a au moins une permission
   */
  async hasAnyPermission(userId, permissions) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }

    for (const permission of permissions) {
      if (await this.checkUserPermission(userId, permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Vérifie si un utilisateur a toutes les permissions requises
   * @param {number} userId - ID de l'utilisateur
   * @param {Array<string>} permissions - Liste des permissions requises
   * @returns {Promise<boolean>} True si l'utilisateur a toutes les permissions
   */
  async hasAllPermissions(userId, permissions) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }

    for (const permission of permissions) {
      if (!await this.checkUserPermission(userId, permission)) {
        return false;
      }
    }

    return true;
  }
}

module.exports = new PermissionService();
