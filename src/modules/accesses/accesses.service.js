const accessesRepository = require('./accesses.repository');
const usersRepository = require('../users/users.repository');
const rolesRepository = require('../roles/roles.repository');

/**
 * Service pour la gestion des accès (associations utilisateur-rôle)
 * Implémente la logique métier avec validation et cohérence des données
 */
class AccessesService {
  /**
   * Crée une nouvelle association utilisateur-rôle avec validation
   * @param {Object} accessData - Données de l'accès
   * @param {number} createdBy - ID de l'utilisateur qui crée l'accès
   * @returns {Promise<Object>} Accès créé
   */
  async createAccess(accessData, createdBy = null) {
    const {
      userId,
      roleId,
      status = 'active'
    } = accessData;

    // Validation des IDs
    if (!userId || userId <= 0) {
      throw new Error('ID d\'utilisateur invalide');
    }

    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    // Validation du statut
    if (!['active', 'inactive', 'lock'].includes(status)) {
      throw new Error('Statut invalide. Valeurs autorisées: active, inactive, lock');
    }

    // Vérifier si l'utilisateur existe
    const userExists = await usersRepository.findById(userId);
    if (!userExists) {
      throw new Error('L\'utilisateur spécifié n\'existe pas');
    }

    // Vérifier si le rôle existe
    const roleExists = await rolesRepository.findById(roleId);
    if (!roleExists) {
      throw new Error('Le rôle spécifié n\'existe pas');
    }

    // Vérifier si l'association existe déjà
    const existingAccess = await accessesRepository.findByUserIdAndRoleId(userId, roleId);
    if (existingAccess) {
      throw new Error('Cet utilisateur a déjà ce rôle');
    }

    // Créer l'accès
    const accessDataToCreate = {
      userId,
      roleId,
      status,
      createdBy
    };

    return await accessesRepository.create(accessDataToCreate);
  }

  /**
   * Récupère toutes les associations avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Accès et pagination
   */
  async getAllAccesses(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = null,
      status = null,
      userId = null,
      roleId = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    // Validation de la pagination
    if (page < 1) {
      throw new Error('Le numéro de page doit être supérieur à 0');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('La limite doit être entre 1 et 100');
    }

    // Validation des filtres
    if (status && !['active', 'inactive', 'lock'].includes(status)) {
      throw new Error('Statut de filtre invalide');
    }

    if (userId && userId <= 0) {
      throw new Error('ID d\'utilisateur de filtre invalide');
    }

    if (roleId && roleId <= 0) {
      throw new Error('ID de rôle de filtre invalide');
    }

    return await accessesRepository.findAll({
      page,
      limit,
      search,
      status,
      userId,
      roleId,
      sortBy,
      sortOrder
    });
  }

  /**
   * Récupère un accès par son ID
   * @param {number} id - ID de l'accès
   * @returns {Promise<Object|null>} Données de l'accès
   */
  async getAccessById(id) {
    if (!id || id <= 0) {
      throw new Error('ID d\'accès invalide');
    }

    const access = await accessesRepository.findById(id);
    if (!access) {
      throw new Error('Accès non trouvé');
    }

    return access;
  }

  /**
   * Récupère les rôles d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {boolean} onlyActive - Uniquement les rôles actifs
   * @returns {Promise<Array>} Liste des rôles de l'utilisateur
   */
  async getUserRoles(userId, onlyActive = true) {
    if (!userId || userId <= 0) {
      throw new Error('ID d\'utilisateur invalide');
    }

    // Vérifier si l'utilisateur existe
    const userExists = await usersRepository.findById(userId);
    if (!userExists) {
      throw new Error('L\'utilisateur spécifié n\'existe pas');
    }

    return await accessesRepository.findByUserId(userId, onlyActive);
  }

  /**
   * Récupère les utilisateurs ayant un rôle spécifique
   * @param {number} roleId - ID du rôle
   * @param {boolean} onlyActive - Uniquement les utilisateurs actifs
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  async getRoleUsers(roleId, onlyActive = true) {
    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    // Vérifier si le rôle existe
    const roleExists = await rolesRepository.findById(roleId);
    if (!roleExists) {
      throw new Error('Le rôle spécifié n\'existe pas');
    }

    return await accessesRepository.findByRoleId(roleId, onlyActive);
  }

  /**
   * Met à jour le statut d'un accès
   * @param {number} id - ID de l'accès
   * @param {string} status - Nouveau statut
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Accès mis à jour
   */
  async updateAccessStatus(id, status, updatedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID d\'accès invalide');
    }

    if (!['active', 'inactive', 'lock'].includes(status)) {
      throw new Error('Statut invalide. Valeurs autorisées: active, inactive, lock');
    }

    // Vérifier si l'accès existe
    const existingAccess = await accessesRepository.findById(id);
    if (!existingAccess) {
      throw new Error('Accès non trouvé');
    }

    const updated = await accessesRepository.updateStatus(id, status, updatedBy);
    if (!updated) {
      throw new Error('Échec de la mise à jour du statut');
    }

    // Retourner l'accès mis à jour
    return await accessesRepository.findById(id);
  }

  /**
   * Supprime un accès (soft delete)
   * @param {number} id - ID de l'accès
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async deleteAccess(id, deletedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID d\'accès invalide');
    }

    // Vérifier si l'accès existe
    const existingAccess = await accessesRepository.findById(id);
    if (!existingAccess) {
      throw new Error('Accès non trouvé');
    }

    const deleted = await accessesRepository.softDelete(id, deletedBy);
    if (!deleted) {
      throw new Error('Échec de la suppression de l\'accès');
    }

    return true;
  }

  /**
   * Supprime définitivement un accès
   * @param {number} id - ID de l'accès
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async hardDeleteAccess(id) {
    if (!id || id <= 0) {
      throw new Error('ID d\'accès invalide');
    }

    // Vérifier si l'accès existe
    const existingAccess = await accessesRepository.findById(id);
    if (!existingAccess) {
      throw new Error('Accès non trouvé');
    }

    const deleted = await accessesRepository.delete(id);
    if (!deleted) {
      throw new Error('Échec de la suppression définitive de l\'accès');
    }

    return true;
  }

  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {number} roleId - ID du rôle
   * @param {boolean} onlyActive - Vérifier uniquement les accès actifs
   * @returns {Promise<boolean>} True si l'utilisateur a le rôle
   */
  async checkUserHasRole(userId, roleId, onlyActive = true) {
    if (!userId || userId <= 0) {
      throw new Error('ID d\'utilisateur invalide');
    }

    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    return await accessesRepository.userHasRole(userId, roleId, onlyActive);
  }

  /**
   * Assigne plusieurs rôles à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Array} roleIds - Liste des IDs de rôles
   * @param {number} createdBy - ID de l'utilisateur qui effectue l'assignation
   * @returns {Promise<Object>} Résultat de l'assignation
   */
  async assignMultipleRoles(userId, roleIds, createdBy = null) {
    if (!userId || userId <= 0) {
      throw new Error('ID d\'utilisateur invalide');
    }

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new Error('La liste des rôles doit être un tableau non vide');
    }

    // Validation des IDs de rôles
    for (const roleId of roleIds) {
      if (!roleId || roleId <= 0) {
        throw new Error('ID de rôle invalide dans la liste');
      }
    }

    // Vérifier si l'utilisateur existe
    const userExists = await usersRepository.findById(userId);
    if (!userExists) {
      throw new Error('L\'utilisateur spécifié n\'existe pas');
    }

    // Vérifier si tous les rôles existent
    const existingRoles = await Promise.all(
      roleIds.map(roleId => rolesRepository.findById(roleId))
    );

    const nonExistingRoles = existingRoles.filter(role => !role);
    if (nonExistingRoles.length > 0) {
      throw new Error(`${nonExistingRoles.length} rôle(s) spécifié(s) n'existent pas`);
    }

    const results = {
      assigned: [],
      skipped: [],
      errors: []
    };

    // Assigner chaque rôle
    for (const roleId of roleIds) {
      try {
        const existingAccess = await accessesRepository.findByUserIdAndRoleId(userId, roleId);
        if (existingAccess) {
          results.skipped.push({
            roleId,
            reason: 'L\'utilisateur a déjà ce rôle'
          });
        } else {
          await accessesRepository.create({
            userId,
            roleId,
            status: 'active',
            createdBy
          });
          results.assigned.push(roleId);
        }
      } catch (error) {
        results.errors.push({
          roleId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Retire plusieurs rôles d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Array} roleIds - Liste des IDs de rôles à retirer
   * @param {number} deletedBy - ID de l'utilisateur qui effectue le retrait
   * @returns {Promise<Object>} Résultat du retrait
   */
  async removeMultipleRoles(userId, roleIds, deletedBy = null) {
    if (!userId || userId <= 0) {
      throw new Error('ID d\'utilisateur invalide');
    }

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new Error('La liste des rôles doit être un tableau non vide');
    }

    const results = {
      removed: [],
      notFound: [],
      errors: []
    };

    // Retirer chaque rôle
    for (const roleId of roleIds) {
      try {
        const existingAccess = await accessesRepository.findByUserIdAndRoleId(userId, roleId);
        if (!existingAccess) {
          results.notFound.push({
            roleId,
            reason: 'L\'utilisateur n\'a pas ce rôle'
          });
        } else {
          const deleted = await accessesRepository.softDelete(existingAccess.id, deletedBy);
          if (deleted) {
            results.removed.push(roleId);
          } else {
            results.errors.push({
              roleId,
              error: 'Échec de la suppression du rôle'
            });
          }
        }
      } catch (error) {
        results.errors.push({
          roleId,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new AccessesService();
