const { connection } = require('../../config/database');

/**
 * Repository pour la gestion des autorisations (rôles-permissions-menus)
 * Gère les associations entre rôles, permissions et menus
 */
class AuthorizationsRepository {
  /**
   * Crée une nouvelle autorisation rôle-permission(-menu)
   * @param {Object} authorizationData - Données de l'autorisation
   * @returns {Promise<Object>} Autorisation créée
   */
  async create(authorizationData) {
    const {
      roleId,
      permissionId,
      menuId,
      createdBy = null
    } = authorizationData;

    // Colonnes selon schéma : id, role_id, permission_id, menu_id, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    const query = `
      INSERT INTO authorizations (
        role_id, permission_id, menu_id, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, role_id, permission_id, menu_id, created_by, created_at, updated_at
    `;

    const values = [
      roleId,
      permissionId,
      menuId,
      createdBy
    ];

    try {
      const result = await connection.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Cette autorisation existe déjà');
      }
      throw new Error(`Erreur lors de la création de l\'autorisation: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les autorisations avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Autorisations et pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = null,
      roleId = null,
      permissionId = null,
      menuId = null,
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
      whereClause += ` AND (r.code ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex} OR m.label::text ILIKE $${paramIndex})`;
      countClause += ` AND (r.code ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex} OR m.label::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtre par rôle
    if (roleId) {
      whereClause += ` AND a.role_id = $${paramIndex}`;
      countClause += ` AND a.role_id = $${paramIndex}`;
      params.push(roleId);
      paramIndex++;
    }

    // Filtre par permission
    if (permissionId) {
      whereClause += ` AND a.permission_id = $${paramIndex}`;
      countClause += ` AND a.permission_id = $${paramIndex}`;
      params.push(permissionId);
      paramIndex++;
    }

    // Filtre par menu
    if (menuId) {
      whereClause += ` AND a.menu_id = $${paramIndex}`;
      countClause += ` AND a.menu_id = $${paramIndex}`;
      params.push(menuId);
      paramIndex++;
    }

    // Validation du tri
    const validSortFields = ['created_at', 'updated_at', 'role_id', 'permission_id', 'menu_id'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Colonnes selon schéma : id, role_id, permission_id, menu_id, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    const dataQuery = `
      SELECT a.id, a.role_id, a.permission_id, a.menu_id, a.created_at, a.updated_at,
             r.code as role_code, r.label as role_label,
             p.code as permission_code, p.label as permission_label, p."group" as permission_group,
             m.label as menu_label, m.route as menu_route
      FROM authorizations a
      LEFT JOIN roles r ON a.role_id = r.id
      LEFT JOIN permissions p ON a.permission_id = p.id
      LEFT JOIN menus m ON a.menu_id = m.id
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM authorizations a
      LEFT JOIN roles r ON a.role_id = r.id
      LEFT JOIN permissions p ON a.permission_id = p.id
      LEFT JOIN menus m ON a.menu_id = m.id
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
      throw new Error(`Erreur lors de la récupération des autorisations: ${error.message}`);
    }
  }

  /**
   * Récupère une autorisation par son ID
   * @param {number} id - ID de l'autorisation
   * @returns {Promise<Object|null>} Données de l'autorisation
   */
  async findById(id) {
    const query = `
      SELECT a.id, a.role_id, a.permission_id, a.menu_id, a.created_at, a.updated_at,
             r.code as role_code, r.label as role_label,
             p.code as permission_code, p.label as permission_label, p."group" as permission_group,
             m.label as menu_label, m.route as menu_route
      FROM authorizations a
      LEFT JOIN roles r ON a.role_id = r.id
      LEFT JOIN permissions p ON a.permission_id = p.id
      LEFT JOIN menus m ON a.menu_id = m.id
      WHERE a.id = $1
    `;

    try {
      const result = await connection.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l\'autorisation ${id}: ${error.message}`);
    }
  }

  /**
   * Récupère les permissions d'un rôle
   * @param {number} roleId - ID du rôle
   * @param {boolean} includeMenus - Inclure les informations des menus
   * @returns {Promise<Array>} Liste des permissions du rôle
   */
  async findByRoleId(roleId, includeMenus = false) {
    let query = `
      SELECT a.id, a.role_id, a.permission_id, a.menu_id, a.created_at, a.updated_at,
             p.code, p.label, p."group", p.description
    `;
    if (includeMenus) {
      query += `, m.label as menu_label, m.route as menu_route`;
    }
    query += `
      FROM authorizations a
      LEFT JOIN permissions p ON a.permission_id = p.id
      LEFT JOIN menus m ON a.menu_id = m.id
      WHERE a.role_id = $1
    `;
    const params = [roleId];

    query += ' ORDER BY p."group" ASC, p.code ASC';

    try {
      const result = await connection.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des permissions du rôle ${roleId}: ${error.message}`);
    }
  }

  /**
   * Récupère les rôles ayant une permission spécifique
   * @param {number} permissionId - ID de la permission
   * @returns {Promise<Array>} Liste des rôles
   */
  async findByPermissionId(permissionId) {
    let query = `
      SELECT a.id, a.role_id, a.permission_id, a.menu_id, a.created_at, a.updated_at,
             r.code, r.label, r.description, r.level, r.is_system
      FROM authorizations a
      LEFT JOIN roles r ON a.role_id = r.id
      WHERE a.permission_id = $1
    `;
    const params = [permissionId];

    query += ' ORDER BY r.level ASC, r.code ASC';

    try {
      const result = await connection.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des rôles pour la permission ${permissionId}: ${error.message}`);
    }
  }

  /**
   * Met à jour une autorisation
   * @param {number} id - ID de l'autorisation
   * @param {Object} updateData - Données de mise à jour
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async update(id, updateData, updatedBy = null) {
    const {
      roleId,
      permissionId,
      menuId
    } = updateData;

    const updates = [];
    const values = [id];
    let paramIndex = 2;

    if (roleId !== undefined) {
      updates.push(`role_id = $${paramIndex++}`);
      values.push(roleId);
    }
    if (permissionId !== undefined) {
      updates.push(`permission_id = $${paramIndex++}`);
      values.push(permissionId);
    }
    if (menuId !== undefined) {
      updates.push(`menu_id = $${paramIndex++}`);
      values.push(menuId);
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push(`updated_by = $${paramIndex++}`, `updated_at = CURRENT_TIMESTAMP`);
    values.push(updatedBy);

    const query = `
      UPDATE authorizations 
      SET ${updates.join(', ')}
      WHERE id = $1
    `;

    try {
      const result = await connection.query(query, values);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'autorisation: ${error.message}`);
    }
  }

  /**
   * Supprime une autorisation (soft delete)
   * @param {number} id - ID de l'autorisation
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async softDelete(id, deletedBy = null) {
    const query = `
      UPDATE authorizations 
      SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $2
      WHERE id = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await connection.query(query, [id, deletedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l\'autorisation: ${error.message}`);
    }
  }

  /**
   * Supprime définitivement une autorisation
   * @param {number} id - ID de l'autorisation
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async delete(id) {
    const query = 'DELETE FROM authorizations WHERE id = $1';

    try {
      const result = await connection.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l\'autorisation: ${error.message}`);
    }
  }

  /**
   * Vérifie si un rôle a une permission spécifique
   * @param {number} roleId - ID du rôle
   * @param {number} permissionId - ID de la permission
   * @returns {Promise<boolean>} True si le rôle a la permission
   */
  async roleHasPermission(roleId, permissionId) {
    const query = `
      SELECT COUNT(*) as count
      FROM authorizations
      WHERE role_id = $1 AND permission_id = $2
    `;
    const params = [roleId, permissionId];

    try {
      const result = await connection.query(query, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification de la permission: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les permissions d'un utilisateur (via ses rôles)
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des permissions
   */
  async findUserPermissions(userId) {
    const query = `
      SELECT DISTINCT p.id, p.code, p.label, p."group", p.description
      FROM authorizations a
      INNER JOIN accesses acc ON a.role_id = acc.role_id
      INNER JOIN permissions p ON a.permission_id = p.id
      WHERE acc.user_id = $1 AND acc.status = 'active'
      ORDER BY p."group" ASC, p.code ASC
    `;
    const params = [userId];

    try {
      const result = await connection.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des permissions de l'utilisateur ${userId}: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique (via ses rôles)
   * @param {number} userId - ID de l'utilisateur
   * @param {string} permissionCode - Code de la permission
   * @returns {Promise<boolean>} True si l'utilisateur a la permission
   */
  async userHasPermission(userId, permissionCode) {
    const query = `
      SELECT COUNT(*) as count
      FROM authorizations a
      INNER JOIN accesses acc ON a.role_id = acc.role_id
      INNER JOIN permissions p ON a.permission_id = p.id
      WHERE acc.user_id = $1 AND p.code = $2 AND acc.status = 'active'
    `;
    const params = [userId, permissionCode];

    try {
      const result = await connection.query(query, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification de la permission utilisateur: ${error.message}`);
    }
  }
}

module.exports = new AuthorizationsRepository();
