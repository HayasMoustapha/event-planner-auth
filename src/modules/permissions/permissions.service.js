const permissionRepository = require('./permissions.repository');
const { createResponse } = require('../../utils/response');
const { ValidationError, NotFoundError, ConflictError } = require('../../utils/app-errors');

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
      code,
      label,
      description,
      group,
      createdBy
    } = permissionData;

    // Validation des entrées
    if (!code || !code.trim()) {
      throw new ValidationError('Le code de la permission est requis', 'PERMISSION_CODE_REQUIRED');
    }

    if (code.trim().length < 3 || code.trim().length > 100) {
      throw new ValidationError('Le code de la permission doit contenir entre 3 et 100 caractères', 'PERMISSION_CODE_LENGTH_INVALID');
    }

    // Validation du format du code (format: resource.action)
    if (!/^[a-z_.]+[a-z_.]*$/.test(code.trim())) {
      throw new ValidationError('Le code doit être en minuscules avec underscores et/ou points (ex: users.read, user.read)', 'PERMISSION_CODE_FORMAT_INVALID');
    }

    if (group && group.trim().length > 50) {
      throw new ValidationError('Le groupe ne peut pas dépasser 50 caractères', 'PERMISSION_GROUP_INVALID');
    }

    if (group && !/^[a-z_]+$/.test(group.trim())) {
      throw new ValidationError('Le groupe doit être en minuscules avec underscores uniquement', 'PERMISSION_GROUP_FORMAT_INVALID');
    }

    if (description && description.length > 255) {
      throw new ValidationError('La description ne peut pas dépasser 255 caractères', 'PERMISSION_DESCRIPTION_INVALID');
    }

    // Préparation des données pour le repository
    const cleanData = {
      code: code.trim(),
      label,
      description: description?.trim(),
      group: group?.trim(),
      createdBy
    };

    // Vérifier si la permission existe déjà
    const existingPermission = await permissionRepository.findAll({ search: code.trim(), limit: 1 });
    if (existingPermission.permissions.length > 0) {
      throw new ConflictError('Une permission avec ce code existe déjà', 'PERMISSION_CODE_ALREADY_EXISTS');
    }

    // Créer la permission
    const permission = await permissionRepository.create(cleanData);

    console.log(`🔐 Permission créée: ${permission.code} (ID: ${permission.id}) par l'utilisateur ${createdBy}`);

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
      resource,
      action,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    // Validation des options
    if (page < 1) {
      throw new ValidationError('Le numéro de page doit être supérieur à 0', 'PAGE_INVALID');
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError('La limite doit être entre 1 et 100', 'LIMIT_INVALID');
    }

    if (sortBy && !['code', 'description', 'group', 'created_at', 'updated_at'].includes(sortBy)) {
      throw new ValidationError('Le champ de tri est invalide', 'SORT_BY_INVALID');
    }

    if (sortOrder && !['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      throw new ValidationError('L\'ordre de tri doit être ASC ou DESC', 'SORT_ORDER_INVALID');
    }

    const searchOptions = {
      page,
      limit,
      search: search?.trim(),
      resource,
      action,
      sortBy,
      sortOrder
    };

    return await permissionRepository.findAll(searchOptions);
  }

  /**
   * Récupère une permission par son ID
   * @param {number} id - ID de la permission
   * @returns {Promise<Object>} Permission trouvée
   */
  async getPermissionById(id) {
    if (!id || id <= 0) {
      throw new ValidationError('ID de permission invalide', 'PERMISSION_ID_INVALID');
    }

    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission non trouvée', 'PERMISSION_NOT_FOUND');
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
      throw new ValidationError('ID de permission invalide', 'PERMISSION_ID_INVALID');
    }

    // Vérifier si la permission existe
    const existingPermission = await permissionRepository.findById(id);
    if (!existingPermission) {
      throw new NotFoundError('Permission non trouvée', 'PERMISSION_NOT_FOUND');
    }

    // Validation des données de mise à jour
    const {
      code,
      label,
      description,
      group
    } = updateData;

    if (code !== undefined) {
      if (!code || !code.trim()) {
        throw new ValidationError('Le code de la permission est requis', 'PERMISSION_CODE_REQUIRED');
      }
      if (code.trim().length < 3 || code.trim().length > 100) {
        throw new ValidationError('Le code de la permission doit contenir entre 3 et 100 caractères', 'PERMISSION_CODE_LENGTH_INVALID');
      }

      // Vérifier si le nouveau code est déjà utilisé par une autre permission
      const codeExists = await permissionRepository.findByCode(code.trim());
      if (codeExists && codeExists.id !== id) {
        throw new ConflictError('Une permission avec ce code existe déjà', 'PERMISSION_CODE_ALREADY_EXISTS');
      }
    }

    if (label !== undefined) {
      if (typeof label !== 'object' || label === null) {
        throw new ValidationError('Le label doit être un objet JSON', 'PERMISSION_LABEL_INVALID');
      }
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== 'object') {
        throw new ValidationError('La description doit être un objet JSON', 'PERMISSION_DESCRIPTION_INVALID');
      }
    }

    if (group !== undefined) {
      if (!group || !group.trim()) {
        throw new ValidationError('Le groupe est requis', 'PERMISSION_GROUP_REQUIRED');
      }
      if (group.trim().length < 2 || group.trim().length > 50) {
        throw new ValidationError('Le groupe doit contenir entre 2 et 50 caractères', 'PERMISSION_GROUP_INVALID');
      }
      if (!/^[a-z_]+$/.test(group.trim())) {
        throw new ValidationError('Le groupe doit être en minuscules avec underscores uniquement', 'PERMISSION_GROUP_FORMAT_INVALID');
      }
    }

    // Mettre à jour la permission
    const updatedPermission = await permissionRepository.update(id, {
      code: code?.trim(),
      label,
      description,
      group: group?.trim()
    }, updatedBy);

    console.log(`🔐 Permission mise à jour: ${updatedPermission.code} (ID: ${updatedPermission.id}) par l'utilisateur ${updatedBy}`);

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
      throw new ValidationError('ID de permission invalide', 'PERMISSION_ID_INVALID');
    }

    // Vérifier si la permission existe
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission non trouvée', 'PERMISSION_NOT_FOUND');
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

    if (criticalPermissions.includes(permission.code)) {
      throw new ConflictError('Impossible de supprimer une permission système critique', 'PERMISSION_SYSTEM_PROTECTED');
    }

    // Supprimer la permission
    const deleted = await permissionRepository.delete(id, deletedBy);

    if (deleted) {
      console.log(`🗑️ Permission supprimée: ${permission.code} (ID: ${permission.id}) par l'utilisateur ${deletedBy}`);
    }

    return deleted;
  }

  /**
   * Récupère les permissions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Permissions de l'utilisateur
   */
  async getUserPermissions(userId) {
    if (!userId || userId <= 0) {
      throw new ValidationError('ID utilisateur invalide', 'USER_ID_INVALID');
    }

    return await permissionRepository.getUserPermissions(userId);
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} permissionName - Nom de la permission
   * @returns {Promise<boolean>} True si l'utilisateur a la permission
   */
  async checkUserPermission(userId, permissionCode) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!permissionCode || !permissionCode.trim()) {
      return false;
    }

    return await permissionRepository.userHasPermission(userId, permissionCode.trim());
  }

  /**
   * Récupère les permissions d'un rôle
   * @param {number} roleId - ID du rôle
   * @returns {Promise<Array>} Permissions du rôle
   */
  async getRolePermissions(roleId) {
    if (!roleId || roleId <= 0) {
      throw new ValidationError('ID de rôle invalide', 'ROLE_ID_INVALID');
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
      throw new ValidationError('Nom de ressource requis', 'RESOURCE_REQUIRED');
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
   * @param {string} group - Nom du groupe
   * @param {Array<string>} actions - Liste des actions
   * @param {number} createdBy - ID de l'utilisateur qui crée
   * @returns {Promise<Array>} Permissions créées
   */
  async generateResourcePermissions(group, actions, createdBy = null) {
    if (!group || !group.trim()) {
      throw new ValidationError('Nom de groupe requis', 'PERMISSION_GROUP_REQUIRED');
    }

    if (!Array.isArray(actions) || actions.length === 0) {
      throw new ValidationError('Liste d\'actions requise', 'ACTIONS_REQUIRED');
    }

    const validActions = ['create', 'read', 'update', 'delete', 'manage', 'view', 'list'];
    const invalidActions = actions.filter(action => !validActions.includes(action));

    if (invalidActions.length > 0) {
      throw new ValidationError(`Actions invalides: ${invalidActions.join(', ')}`, 'ACTIONS_INVALID');
    }

    const createdPermissions = [];

    for (const action of actions) {
      try {
        const permissionName = `${group.trim()}.${action}`;
        const permission = await this.createPermission({
          code: permissionName,
          description: `Permission pour le groupe ${group} - action ${action}`,
          group: group.trim(),
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

    console.log(`🔐 ${createdPermissions.length} permissions générées pour le groupe ${group}`);

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
