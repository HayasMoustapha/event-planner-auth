const accessesRepository = require('./accesses.repository');
const usersRepository = require('../users/users.repository');
const rolesRepository = require('../roles/roles.repository');
const authService = require('../auth/auth.service');

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
   * Récupère la liste des rôles métier disponibles pour la sélection post-inscription
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Liste des rôles métier disponibles
   */
  async getBusinessRoles(userId) {
    if (!userId || userId <= 0) {
      throw new Error('ID d\'utilisateur invalide');
    }

    // Récupérer les rôles métier disponibles
    const rolesResult = await accessesRepository.getClient().then(client => {
      return client.query(`
        SELECT r.id, r.code, r.label, r.description
        FROM roles r
        WHERE r.code IN ('designer', 'organizer', 'manager', 'user')
        AND (r.is_system = false OR r.code = 'user')
        AND r.deleted_at IS NULL
        ORDER BY r.code
      `);
    });

    const roles = rolesResult.rows;

    // Vérifier si l'utilisateur a déjà un rôle métier
    const existingRoleResult = await accessesRepository.getClient().then(client => {
      return client.query(`
        SELECT r.id, r.code, r.label
        FROM accesses a
        JOIN roles r ON a.role_id = r.id
        WHERE a.user_id = $1 
        AND r.code IN ('designer', 'organizer', 'manager', 'user')
        AND a.status = 'active'
        AND a.deleted_at IS NULL
      `, [userId]);
    });

    const existingRole = existingRoleResult.rows.length > 0 ? existingRoleResult.rows[0] : null;

    return {
      roles: roles.map(role => ({
        id: role.id,
        code: role.code,
        label: role.label,
        description: role.description
      })),
      userHasBusinessRole: existingRole !== null,
      currentRole: existingRole ? {
        id: existingRole.id,
        code: existingRole.code,
        label: existingRole.label
      } : null
    };
  }

  /**
   * Sélectionne un rôle métier post-inscription avec transaction
   * @param {number} userId - ID de l'utilisateur
   * @param {number} roleId - ID du rôle métier (provenant de la table roles)
   * @returns {Promise<Object>} Résultat de l'assignation avec permissions
   */
  async selectBusinessRole(userId, roleId) {
    if (!userId || userId <= 0) {
      throw new Error('ID d\'utilisateur invalide');
    }

    if (!roleId || roleId <= 0) {
      throw new Error('ID de rôle invalide');
    }

    // Démarrer une transaction PostgreSQL
    const client = await accessesRepository.getClient();
    
    try {
      await client.query('BEGIN');

      // 1. Vérifier que l'utilisateur existe
      const userResult = await client.query(
        'SELECT id, email, username, status FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      // 2. Vérifier que l'utilisateur n'a pas déjà de rôle métier
      const existingBusinessRoleResult = await client.query(`
        SELECT r.code, r.id 
        FROM accesses a
        JOIN roles r ON a.role_id = r.id
        WHERE a.user_id = $1 
        AND r.code IN ('designer', 'organizer', 'manager', 'user')
        AND a.status = 'active'
        AND a.deleted_at IS NULL
        FOR UPDATE
      `, [userId]);

      if (existingBusinessRoleResult.rows.length > 0) {
        const existingRole = existingBusinessRoleResult.rows[0].code;
        throw new Error(`L'utilisateur a déjà un rôle métier: ${existingRole}`);
      }

      // 3. Récupérer et valider le rôle demandé
      const roleResult = await client.query(
        'SELECT id, code, label FROM roles WHERE id = $1 AND code IN (\'designer\', \'organizer\', \'manager\', \'user\') AND deleted_at IS NULL',
        [roleId]
      );

      if (roleResult.rows.length === 0) {
        throw new Error('Rôle métier non trouvé ou non autorisé');
      }

      const role = roleResult.rows[0];

      // 4. Créer l'association utilisateur-rôle
      const accessResult = await client.query(`
        INSERT INTO accesses (user_id, role_id, status, created_at, updated_at)
        VALUES ($1, $2, 'active', NOW(), NOW())
        ON CONFLICT (user_id, role_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING id, user_id, role_id, status, created_at
      `, [userId, role.id]);

      const access = accessResult.rows[0];

      // 5. Récupérer toutes les permissions associées à ce rôle
      const permissionsResult = await client.query(`
        SELECT DISTINCT p.code, p.label, p."group"
        FROM authorizations a
        JOIN permissions p ON a.permission_id = p.id
        WHERE a.role_id = $1
        AND a.granted = TRUE
        AND a.deleted_at IS NULL
        AND p.deleted_at IS NULL
        ORDER BY p."group", p.code
      `, [role.id]);

      const permissions = permissionsResult.rows;

      const roleCodes = [role.code];
      const permissionCodes = permissions.map((perm) => perm.code);

      const userForToken = {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        username: userResult.rows[0].username,
        status: userResult.rows[0].status
      };

      const loginToken = authService.generateToken(userForToken, {
        roles: roleCodes,
        permissions: permissionCodes
      });

      // 6. Valider la transaction
      await client.query('COMMIT');

      return {
        access: {
          id: access.id,
          userId: access.user_id,
          roleId: access.role_id,
          status: access.status,
          createdAt: access.created_at
        },
        role: {
          id: role.id,
          code: role.code,
          label: role.label
        },
        permissions: permissions.map(perm => ({
          code: perm.code,
          label: perm.label,
          group: perm.group
        })),
        user: {
          id: userId,
          email: userResult.rows[0].email
        },
        login: {
          token: loginToken,
          roles: roleCodes,
          permissions: permissionCodes
        }
      };

    } catch (error) {
      // Rollback en cas d'erreur
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
