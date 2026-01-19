const { connection } = require('../../config/database');

/**
 * Repository pour la gestion des accès (rôles utilisateurs)
 * Gère les associations entre utilisateurs et rôles
 */
class AccessesRepository {
  /**
   * Crée une nouvelle association utilisateur-rôle
   * @param {Object} accessData - Données de l'accès
   * @returns {Promise<Object>} Accès créé
   */
  async create(accessData) {
    const {
      userId,
      roleId,
      status = 'active',
      createdBy = null
    } = accessData;

    // Colonnes selon schéma de référence : id, user_id, role_id, status, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    const query = `
      INSERT INTO accesses (
        user_id, role_id, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, user_id, role_id, status, created_by, created_at, updated_at
    `;

    const values = [
      userId,
      roleId,
      status,
      createdBy
    ];

    try {
      const result = await connection.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Cet utilisateur a déjà ce rôle');
      }
      throw new Error(`Erreur lors de la création de l\'accès: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les associations utilisateur-rôle avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Accès et pagination
   */
  async findAll(options = {}) {
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

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let countClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR r.code ILIKE $${paramIndex})`;
      countClause += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR r.code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtre de statut
    if (status) {
      whereClause += ` AND a.status = $${paramIndex}`;
      countClause += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Filtre par utilisateur
    if (userId) {
      whereClause += ` AND a.user_id = $${paramIndex}`;
      countClause += ` AND a.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Filtre par rôle
    if (roleId) {
      whereClause += ` AND a.role_id = $${paramIndex}`;
      countClause += ` AND a.role_id = $${paramIndex}`;
      params.push(roleId);
      paramIndex++;
    }

    // Validation du tri
    const validSortFields = ['created_at', 'updated_at', 'status', 'user_id', 'role_id'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Colonnes selon schéma de référence : id, user_id, role_id, status, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    const dataQuery = `
      SELECT a.id, a.user_id, a.role_id, a.status, a.created_at, a.updated_at,
             u.username, u.email, u.user_code,
             r.code as role_code, r.label as role_label
      FROM accesses a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN roles r ON a.role_id = r.id
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM accesses a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN roles r ON a.role_id = r.id
      ${countClause}
    `;

    try {
      const [dataResult, countResult] = await Promise.all([
        connection.query(dataQuery, [...params, limit, offset]),
        connection.query(countQuery, params)
      ]);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des accès: ${error.message}`);
    }
  }

  /**
   * Récupère un accès par son ID
   * @param {number} id - ID de l'accès
   * @returns {Promise<Object|null>} Données de l'accès
   */
  async findById(id) {
    const query = `
      SELECT a.id, a.user_id, a.role_id, a.status, a.created_at, a.updated_at,
             u.username, u.email, u.user_code,
             r.code as role_code, r.label as role_label
      FROM accesses a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN roles r ON a.role_id = r.id
      WHERE a.id = $1
    `;

    try {
      const result = await connection.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l\'accès ${id}: ${error.message}`);
    }
  }

  /**
   * Récupère les rôles d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {boolean} onlyActive - Uniquement les rôles actifs
   * @returns {Promise<Array>} Liste des rôles de l'utilisateur
   */
  async findByUserId(userId, onlyActive = true) {
    let query = `
      SELECT a.id, a.user_id, a.role_id, a.status, a.created_at, a.updated_at,
             r.code, r.label, r.description, r.level, r.is_system
      FROM accesses a
      LEFT JOIN roles r ON a.role_id = r.id
      WHERE a.user_id = $1
    `;
    const params = [userId];

    if (onlyActive) {
      query += ' AND a.status = \'active\'';
    }

    query += ' ORDER BY r.level ASC, r.created_at ASC';

    try {
      const result = await connection.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des rôles de l\'utilisateur ${userId}: ${error.message}`);
    }
  }

  /**
   * Récupère les utilisateurs ayant un rôle spécifique
   * @param {number} roleId - ID du rôle
   * @param {boolean} onlyActive - Uniquement les utilisateurs actifs
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  async findByRoleId(roleId, onlyActive = true) {
    let query = `
      SELECT a.id, a.user_id, a.role_id, a.status, a.created_at, a.updated_at,
             u.username, u.email, u.user_code, u.status as user_status
      FROM accesses a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.role_id = $1
    `;
    const params = [roleId];

    if (onlyActive) {
      query += ' AND a.status = \'active\' AND u.status = \'active\'';
    }

    query += ' ORDER BY u.username ASC';

    try {
      const result = await connection.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des utilisateurs du rôle ${roleId}: ${error.message}`);
    }
  }

  /**
   * Met à jour le statut d'un accès
   * @param {number} id - ID de l'accès
   * @param {string} status - Nouveau statut
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async updateStatus(id, status, updatedBy = null) {
    const query = `
      UPDATE accesses 
      SET status = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      const result = await connection.query(query, [id, status, updatedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l\'accès: ${error.message}`);
    }
  }

  /**
   * Supprime un accès (soft delete)
   * @param {number} id - ID de l'accès
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async softDelete(id, deletedBy = null) {
    const query = `
      UPDATE accesses 
      SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $2
      WHERE id = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await connection.query(query, [id, deletedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l\'accès: ${error.message}`);
    }
  }

  /**
   * Supprime définitivement un accès
   * @param {number} id - ID de l'accès
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async delete(id) {
    const query = 'DELETE FROM accesses WHERE id = $1';

    try {
      const result = await connection.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l\'accès: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {number} roleId - ID du rôle
   * @param {boolean} onlyActive - Vérifier uniquement les accès actifs
   * @returns {Promise<boolean>} True si l'utilisateur a le rôle
   */
  async userHasRole(userId, roleId, onlyActive = true) {
    let query = `
      SELECT COUNT(*) as count
      FROM accesses
      WHERE user_id = $1 AND role_id = $2
    `;
    const params = [userId, roleId];

    if (onlyActive) {
      query += ' AND status = \'active\'';
    }

    try {
      const result = await connection.query(query, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification du rôle: ${error.message}`);
    }
  }

  /**
   * Trouve un accès spécifique par utilisateur et rôle
   * @param {number} userId - ID de l'utilisateur
   * @param {number} roleId - ID du rôle
   * @returns {Promise<Object|null>} Accès trouvé ou null
   */
  async findByUserIdAndRoleId(userId, roleId) {
    const query = `
      SELECT a.id, a.user_id, a.role_id, a.status, a.created_at, a.updated_at,
             u.username, u.email, u.user_code,
             r.code as role_code, r.label as role_label
      FROM accesses a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN roles r ON a.role_id = r.id
      WHERE a.user_id = $1 AND a.role_id = $2 AND a.deleted_at IS NULL
    `;

    try {
      const result = await connection.query(query, [userId, roleId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche de l'accès: ${error.message}`);
    }
  }
}

module.exports = new AccessesRepository();
