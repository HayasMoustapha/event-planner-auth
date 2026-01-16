const { connection } = require('../../config/database');

/**
 * Repository pour la gestion des rôles
 * Gère les opérations CRUD sur les rôles et leurs associations
 */
class RoleRepository {
  /**
   * Crée un nouveau rôle
   * @param {Object} roleData - Données du rôle
   * @returns {Promise<Object>} Rôle créé
   */
  async create(roleData) {
    const {
      code,
      description,
      status = 'active',
      level = 0,
      createdBy = null
    } = roleData;

    // Colonnes selon schéma de référence : id, code, label (JSON), description (JSON), is_system, level, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    const query = `
      INSERT INTO roles (
        code, label, description, level, is_system, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, code, label, description, level, is_system, created_by, created_at, updated_at
    `;

    const values = [
      code?.trim(), // code sera utilisé comme code (colonne 'code' du schéma)
      JSON.stringify({en: code?.trim(), fr: code?.trim()}), // label en JSONB (colonne 'label' du schéma)
      description ? JSON.stringify({en: description, fr: description}) : null, // description en JSONB (colonne 'description' du schéma)
      level,
      false, // is_system par défaut (colonne 'is_system' du schéma)
      createdBy
    ];

    try {
      const result = await connection.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Ce nom de rôle existe déjà');
      }
      throw new Error(`Erreur lors de la création du rôle: ${error.message}`);
    }
  }

  /**
   * Récupère tous les rôles avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Rôles et pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = null,
      status = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let countClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (code ILIKE $${paramIndex} OR label::text ILIKE $${paramIndex})`;
      countClause += ` AND (code ILIKE $${paramIndex} OR label::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Pas de filtre de statut dans la table roles (utilise is_system pour les rôles système)

    // Colonnes selon schéma de référence : id, code, label (JSON), description (JSON), is_system, level, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    // Validation du tri
    const validSortFields = ['code', 'label', 'description', 'level', 'is_system', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT id, code, label, description, level, is_system, created_by, created_at, updated_at
      FROM roles
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM roles
      ${countClause}
    `;

    try {
      const [dataResult, countResult] = await Promise.all([
        connection.query(dataQuery, [...params, limit, offset]),
        connection.query(countQuery, params)
      ]);

      const total = parseInt(countResult.rows[0].total);
      const roles = dataResult.rows;

      return {
        roles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des rôles: ${error.message}`);
    }
  }

  /**
   * Récupère un rôle par son ID
   * @param {number} id - ID du rôle
   * @returns {Promise<Object|null>} Rôle trouvé ou null
   */
  async findById(id) {
    const query = `
      SELECT id, code, label, description, level, is_system, created_by, created_at, updated_at
      FROM roles
      WHERE id = $1
    `;

    try {
      const result = await connection.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche du rôle: ${error.message}`);
    }
  }

  /**
   * Récupère un rôle par son nom
   * @param {string} name - Nom du rôle
   * @returns {Promise<Object|null>} Rôle trouvé ou null
   */
  async findByCode(code) {
    const query = `
      SELECT id, code, label, description, level, is_system, created_by, created_at, updated_at
      FROM roles
      WHERE code = $1
    `;

    try {
      const result = await connection.query(query, [code.trim()]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche du rôle par code: ${error.message}`);
    }
  }

  /**
   * Met à jour un rôle
   * @param {number} id - ID du rôle
   * @param {Object} updateData - Données à mettre à jour
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Rôle mis à jour
   */
  async update(id, updateData, updatedBy = null) {
    const {
      code,
      description,
      status,
      level
    } = updateData;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (code !== undefined) {
      updates.push(`code = $${paramIndex}`);
      values.push(code.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description.trim());
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (level !== undefined) {
      updates.push(`level = $${paramIndex}`);
      values.push(level);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    updates.push(`updated_by = $${paramIndex}`);
    values.push(updatedBy);
    paramIndex++;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE roles
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, code, label, description, level, is_system, created_by, created_at, updated_at, updated_by
    `;

    values.push(id);

    try {
      const result = await connection.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Rôle non trouvé');
      }
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Ce nom de rôle existe déjà');
      }
      throw new Error(`Erreur lors de la mise à jour du rôle: ${error.message}`);
    }
  }

  /**
   * Supprime un rôle (soft delete)
   * @param {number} id - ID du rôle
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} True si supprimé
   */
  async delete(id, deletedBy = null) {
    const query = `
      UPDATE roles
      SET is_system = true, updated_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_system = false
    `;

    try {
      const result = await connection.query(query, [id, deletedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du rôle: ${error.message}`);
    }
  }

  /**
   * Supprime définitivement un rôle
   * @param {number} id - ID du rôle
   * @returns {Promise<boolean>} True si supprimé
   */
  async hardDelete(id) {
    const query = 'DELETE FROM roles WHERE id = $1';

    try {
      const result = await connection.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      if (error.code === '23503') {
        throw new Error('Ce rôle est utilisé par des utilisateurs ou des permissions et ne peut être supprimé');
      }
      throw new Error(`Erreur lors de la suppression du rôle: ${error.message}`);
    }
  }

  /**
   * Récupère les permissions associées à un rôle
   * @param {number} roleId - ID du rôle
   * @returns {Promise<Array>} Permissions du rôle
   */
  async getRolePermissions(roleId) {
    const query = `
      SELECT p.id, p.code, p.description, p."group", p.status
      FROM permissions p
      INNER JOIN authorizations a ON p.id = a.permission_id
      WHERE a.role_id = $1 AND a.permission_id = p.id AND p.status = 'active'
      ORDER BY p."group" ASC, p.code ASC
    `;

    try {
      const result = await connection.query(query, [roleId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des permissions du rôle: ${error.message}`);
    }
  }

  /**
   * Associe des permissions à un rôle
   * @param {number} roleId - ID du rôle
   * @param {Array<number>} permissionIds - IDs des permissions à associer
   * @param {number} createdBy - ID de l'utilisateur qui crée l'association
   * @returns {Promise<number>} Nombre d'associations créées
   */
  async assignPermissions(roleId, permissionIds, createdBy = null) {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return 0;
    }

    // Supprimer d'abord les associations existantes
    await this.removeAllPermissions(roleId);

    const values = permissionIds.map((permissionId, index) => {
      const baseIndex = index * 3;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
    }).join(', ');

    const flatValues = permissionIds.flatMap(permissionId => [
      roleId,
      permissionId,
      createdBy
    ]);

    const query = `
      INSERT INTO authorizations (role_id, permission_id, menu_id, created_by, created_at)
      SELECT $1, p.id, 1, $2, CURRENT_TIMESTAMP
      FROM permissions p
      WHERE p.id = ANY($3)
    `;

    try {
      const result = await connection.query(query, flatValues);
      return result.rows.length;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Certaines permissions sont déjà associées à ce rôle');
      }
      throw new Error(`Erreur lors de l'association des permissions: ${error.message}`);
    }
  }

  /**
   * Supprime toutes les permissions d'un rôle
   * @param {number} roleId - ID du rôle
   * @returns {Promise<number>} Nombre d'associations supprimées
   */
  async removeAllPermissions(roleId) {
    const query = 'DELETE FROM authorizations WHERE role_id = $1';

    try {
      const result = await connection.query(query, [roleId]);
      return result.rowCount;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression des permissions du rôle: ${error.message}`);
    }
  }

  /**
   * Récupère les utilisateurs ayant un rôle
   * @param {number} roleId - ID du rôle
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Utilisateurs et pagination
   */
  async getRoleUsers(roleId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      INNER JOIN accesses a ON u.id = a.user_id
      WHERE a.role_id = $1 AND a.status = 'active'
    `;

    const dataQuery = `
      SELECT u.id, u.email, u.username, u.status, a.created_at as assigned_at
      FROM users u
      INNER JOIN accesses a ON u.id = a.user_id
      WHERE a.role_id = $1 AND a.status = 'active'
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery, [roleId]),
        connection.query(dataQuery, [roleId, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const users = dataResult.rows;

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des utilisateurs du rôle: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} roleName - Nom du rôle
   * @returns {Promise<boolean>} True si l'utilisateur a le rôle
   */
  async userHasRole(userId, roleName) {
    const query = `
      SELECT 1
      FROM users u
      INNER JOIN accesses a ON u.id = a.user_id
      INNER JOIN roles r ON a.role_id = r.id
      WHERE u.id = $1 AND r.code = $2 AND a.status = 'active' AND r.is_system = false
      LIMIT 1
    `;

    try {
      const result = await connection.query(query, [userId, roleName]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification du rôle utilisateur: ${error.message}`);
    }
  }

  /**
   * Récupère les rôles d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Rôles de l'utilisateur
   */
  async getUserRoles(userId) {
    const query = `
      SELECT r.id, r.code, r.label, r.description, r.level, a.created_at as assigned_at
      FROM roles r
      INNER JOIN accesses a ON r.id = a.role_id
      WHERE a.user_id = $1 AND a.status = 'active' AND r.is_system = false
      ORDER BY r.level DESC, r.code ASC
    `;

    try {
      const result = await connection.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des rôles utilisateur: ${error.message}`);
    }
  }

  /**
   * Récupère les statistiques des rôles
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_roles,
        COUNT(CASE WHEN is_system = false THEN 1 END) as active_roles,
        COUNT(CASE WHEN is_system = true THEN 1 END) as system_roles,
        AVG(level) as avg_level,
        MAX(level) as max_level,
        MIN(level) as min_level
      FROM roles
    `;

    try {
      const result = await connection.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  /**
   * Active ou désactive un rôle
   * @param {number} id - ID du rôle
   * @param {string} status - Nouveau statut
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<boolean>} True si mis à jour
   */
  async updateStatus(id, isActive, updatedBy = null) {
    const query = `
      UPDATE roles
      SET is_system = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      const result = await connection.query(query, [id, !isActive, updatedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  }
}

module.exports = new RoleRepository();
