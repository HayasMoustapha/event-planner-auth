const roleRepository = require('./roles.repository');
const { createResponse } = require('../../utils/response');

/**
 * Service métier pour la gestion des rôles
 * Gère la logique métier, validation et opérations complexes
 */
class RoleService {
  /**
   * Crée un nouveau rôle avec validation
   * @param {Object} roleData - Données du rôle
   * @returns {Promise<Object>} Rôle créé
   */
  async createRole(roleData) {
    const {
      code,
      label,
      description,
      level = 0,
      isSystem = false,
      createdBy = null
    } = roleData;

    // Validation des entrées
    if (!code || !code.trim()) {
      throw new Error('Le code du rôle est requis');
    }

    if (code.trim().length < 2 || code.trim().length > 50) {
      throw new Error('Le code du rôle doit contenir entre 2 et 50 caractères');
    }

    // Validation du format du code (alphanumérique avec underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(code.trim())) {
      throw new Error('Le code du rôle ne peut contenir que des lettres, chiffres et underscores');
    }

    // Validation du niveau
    if (level !== null && (isNaN(level) || level < 0)) {
      throw new Error('Le niveau doit être un entier positif ou null');
    }

    // Validation du label (JSONB requis)
    if (!label) {
      throw new Error('Le label est requis');
    }

    if (typeof label !== 'object') {
      throw new Error('Le label doit être un objet JSON');
    }

    // Validation du type boolean
    if (typeof isSystem !== 'boolean') {
      throw new Error('is_system doit être un boolean');
    }

    // Préparation des données pour le repository
    const cleanData = {
      code: code.trim(),
      label,
      description: description || null,
      level,
      isSystem,
      createdBy
    };

    // Vérifier si le code existe déjà
    const existingRole = await roleRepository.findAll({ search: code.trim(), limit: 1 });
    if (existingRole.roles && existingRole.roles.length > 0) {
      throw new Error('Un rôle avec ce code existe déjà');
    }

    // Créer le rôle
    const role = await roleRepository.create(cleanData);

    console.log(`🔐 Rôle créé: ${role.code} (ID: ${role.id}) par l'utilisateur ${createdBy}`);

    return role;
  }

  /**
   * Récupère les rôles avec filtres et pagination
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} Rôles et pagination
   */
  async getRoles(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
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

    if (sortBy && !['code', 'label', 'description', 'level', 'is_system', 'created_at', 'updated_at'].includes(sortBy)) {
      throw new Error('Le champ de tri est invalide');
    }

    if (sortOrder && !['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      throw new Error('L\'ordre de tri doit être ASC ou DESC');
    }

    return await roleRepository.findAll({
      page,
      limit,
      search: search?.trim(),
      sortBy,
      sortOrder
    });
  }

  /**
   * Récupère un rôle par son ID avec ses permissions
   * @param {number} id - ID du rôle
   * @returns {Promise<Object>} Rôle avec permissions
   */
  async getRoleById(id) {
    if (!id || id <= 0) {
      throw new Error('ID de rôle invalide');
    }

    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error('Rôle non trouvé');
    }

    // Récupérer les permissions associées
    const permissions = await roleRepository.getRolePermissions(id);

    return {
      ...role,
      permissions
    };
  }

  /**
   * Met à jour un rôle avec validation
   * @param {number} id - ID du rôle
   * @param {Object} updateData - Données à mettre à jour
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Rôle mis à jour
   */
  async updateRole(id, updateData, updatedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de rôle invalide');
    }

    // Vérifier si le rôle existe
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('Rôle non trouvé');
    }

    // Validation des données de mise à jour
    const {
      code,
      label,
      description,
      status,
      level
    } = updateData;

    if (code !== undefined) {
      if (!code || !code.trim()) {
        throw new Error('Le code du rôle est requis');
      }
      if (code.trim().length < 2 || code.trim().length > 50) {
        throw new Error('Le code du rôle doit contenir entre 2 et 50 caractères');
      }

      // Vérifier si le nouveau code est déjà utilisé par un autre rôle
      const codeExists = await roleRepository.findByCode(code.trim());
      if (codeExists && codeExists.id !== id) {
        throw new Error('Un rôle avec ce code existe déjà');
      }
    }

    if (label !== undefined) {
      if (typeof label !== 'object' || label === null) {
        throw new Error('Le label doit être un objet JSON');
      }
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== 'object') {
        throw new Error('La description doit être un objet JSON');
      }
    }

    if (level !== undefined) {
      if (typeof level !== 'number' || level < 0 || level > 100) {
        throw new Error('Le niveau doit être un nombre entre 0 et 100');
      }
    }

    // Mettre à jour le rôle
    const updatedRole = await roleRepository.update(id, {
      code: code?.trim(),
      label,
      description,
      status,
      level
    }, updatedBy);

    console.log(`🔐 Rôle mis à jour: ${updatedRole.code} (ID: ${updatedRole.id}) par l'utilisateur ${updatedBy}`);

    return updatedRole;
  }

  /**
   * Supprime un rôle (soft delete)
   * @param {number} id - ID du rôle
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} True si supprimé
   */
  async deleteRole(id, deletedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de rôle invalide');
    }

    // Vérifier si le rôle existe
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error('Rôle non trouvé');
    }

    // Empêcher la suppression du rôle si des utilisateurs l'utilisent
    const roleUsers = await roleRepository.getRoleUsers(id, { limit: 1 });
    if (roleUsers.users.length > 0) {
      throw new Error('Impossible de supprimer un rôle utilisé par des utilisateurs');
    }

    // Empêcher la suppression du rôle si des permissions y sont associées
    const permissions = await roleRepository.getRolePermissions(id);
    if (permissions.length > 0) {
      throw new Error('Impossible de supprimer un rôle avec des permissions associées');
    }

    // Supprimer le rôle
    const deleted = await roleRepository.delete(id, deletedBy);

    if (deleted) {
      console.log(`🗑️ Rôle supprimé: ${role.code} (ID: ${role.id}) par l'utilisateur ${deletedBy}`);
    }

    return deleted;
  }

  /**
   * Associe des permissions à un rôle
   * @param {number} roleId - ID du rôle
   * @param {Array<number>} permissionIds - IDs des permissions
   * @param {number} createdBy - ID de l'utilisateur qui effectue l'association
   * @returns {Promise<Object>} Résultat de l'association
   */
  async assignPermissions(roleId, permissionIds, createdBy = null) {
    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    if (!Array.isArray(permissionIds)) {
      throw new Error('Les IDs de permissions doivent être un tableau');
    }

    if (permissionIds.length === 0) {
      return { assigned: 0, message: 'Aucune permission à associer' };
    }

    // Vérifier si le rôle existe
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Rôle non trouvé');
    }

    // Valider les IDs de permissions
    const validPermissionIds = permissionIds.filter(id =>
      id && typeof id === 'number' && id > 0
    );

    if (validPermissionIds.length !== permissionIds.length) {
      throw new Error('Certains IDs de permissions sont invalides');
    }

    // Associer les permissions
    const assignedCount = await roleRepository.assignPermissions(
      roleId,
      validPermissionIds,
      createdBy
    );

    console.log(`🔐 ${assignedCount} permissions associées au rôle ${role.code} (ID: ${roleId})`);

    return {
      assigned: assignedCount,
      roleId,
      permissionIds: validPermissionIds,
      message: `${assignedCount} permissions associées avec succès`
    };
  }

  /**
   * Supprime toutes les permissions d'un rôle
   * @param {number} roleId - ID du rôle
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async removeAllPermissions(roleId) {
    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Rôle non trouvé');
    }

    const removedCount = await roleRepository.removeAllPermissions(roleId);

    console.log(`🗑️ ${removedCount} permissions supprimées du rôle ${role.code} (ID: ${roleId})`);

    return {
      removed: removedCount,
      roleId,
      message: `${removedCount} permissions supprimées avec succès`
    };
  }

  /**
   * Récupère les rôles d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Rôles de l'utilisateur
   */
  async getUserRoles(userId) {
    if (!userId || userId <= 0) {
      throw new Error('ID utilisateur invalide');
    }

    return await roleRepository.getUserRoles(userId);
  }

  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} roleName - Nom du rôle
   * @returns {Promise<boolean>} True si l'utilisateur a le rôle
   */
  async checkUserRole(userId, roleName) {
    if (!userId || userId <= 0) {
      return false;
    }

    if (!roleName || !roleName.trim()) {
      return false;
    }

    return await roleRepository.userHasRole(userId, roleName.trim());
  }

  /**
   * Récupère le rôle de plus haut niveau d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object|null>} Rôle de plus haut niveau
   */
  async getUserHighestRole(userId) {
    if (!userId || userId <= 0) {
      return null;
    }

    const roles = await roleRepository.getUserRoles(userId);
    return roles.length > 0 ? roles[0] : null; // Trié par level DESC
  }

  /**
   * Récupère les statistiques des rôles
   * @returns {Promise<Object>} Statistiques
   */
  async getRoleStats() {
    return await roleRepository.getStats();
  }

  /**
   * Duplique un rôle avec ses permissions
   * @param {number} sourceRoleId - ID du rôle source
   * @param {Object} newRoleData - Données du nouveau rôle
   * @param {number} createdBy - ID de l'utilisateur qui crée
   * @returns {Promise<Object>} Nouveau rôle créé
   */
  async duplicateRole(sourceRoleId, newRoleData, createdBy = null) {
    if (!sourceRoleId || sourceRoleId <= 0) {
      throw new Error('ID du rôle source invalide');
    }

    const { name, description } = newRoleData;

    // Vérifier si le rôle source existe
    const sourceRole = await roleRepository.findById(sourceRoleId);
    if (!sourceRole) {
      throw new Error('Rôle source non trouvé');
    }

    // Créer le nouveau rôle avec les mêmes propriétés
    const newRole = await this.createRole({
      name: name || `${sourceRole.name} (copie)`,
      description: description || sourceRole.description,
      status: sourceRole.status,
      level: sourceRole.level,
      createdBy
    });

    // Copier les permissions
    const permissions = await roleRepository.getRolePermissions(sourceRoleId);
    if (permissions.length > 0) {
      const permissionIds = permissions.map(p => p.id);
      await this.assignPermissions(newRole.id, permissionIds, createdBy);
    }

    console.log(`📋 Rôle dupliqué: ${sourceRole.name} → ${newRole.name}`);

    return newRole;
  }
}

module.exports = new RoleService();
