const { connection } = require('../../config/database');

/**
 * Repository pour la gestion des permissions
 * Gère les opérations CRUD sur les permissions et leurs associations
 */
class PermissionRepository {
  /**
   * Crée une nouvelle permission
   * @param {Object} permissionData - Données de la permission
   * @returns {Promise<Object>} Permission créée
   */
  async create(permissionData) {
    const {
      code,
      label,
      description,
      group,
      createdBy = null
    } = permissionData;

    // Colonnes selon schéma de référence : id, code, label (JSON), "group", description (JSON), created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    const query = `
      INSERT INTO permissions (
        code, label, "group", description, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, code, label, "group", description, created_by, created_at, updated_at
    `;

    const values = [
      code?.trim(), // code sera utilisé comme code (colonne 'code' du schéma)
      label ? JSON.stringify(label) : JSON.stringify({en: code?.trim(), fr: code?.trim()}), // label en JSONB (colonne 'label' du schéma)
      group?.trim() || null, // group sera utilisé comme group (colonne 'group' du schéma)
      description ? JSON.stringify({en: description, fr: description}) : null, // description en JSONB (colonne 'description' du schéma)
      createdBy
    ];

    try {
      const result = await connection.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Cette permission existe déjà');
      }
      throw new Error(`Erreur lors de la création de la permission: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les permissions avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Permissions et pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = null,
      status = null,
      group = null,
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
      whereClause += ` AND (code ILIKE $${paramIndex} OR label::text ILIKE $${paramIndex} OR "group" ILIKE $${paramIndex} OR description::text ILIKE $${paramIndex})`;
      countClause += ` AND (code ILIKE $${paramIndex} OR label::text ILIKE $${paramIndex} OR "group" ILIKE $${paramIndex} OR description::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Pas de filtre de statut dans la table permissions

    // Filtre de groupe
    if (group) {
      whereClause += ` AND "group" = $${paramIndex}`;
      countClause += ` AND "group" = $${paramIndex}`;
      params.push(group);
      paramIndex++;
    }

    // Colonnes selon schéma de référence : id, code, label (JSON), "group", description (JSON), created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    // Validation du tri
    const validSortFields = ['code', 'label', 'group', 'description', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT id, code, label, "group", description, created_by, created_at, updated_at
      FROM permissions
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM permissions
      ${countClause}
    `;

    try {
      const results = await Promise.all([
        connection.query(dataQuery, [...params, limit, offset]),
        connection.query(countQuery, params)
      ]);

      const dataResult = results[0];
      const countResult = results[1];

      const total = parseInt(countResult.rows[0].total);
      const permissions = dataResult.rows;

      return {
        permissions,
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
      throw new Error(`Erreur lors de la récupération des permissions: ${error.message}`);
    }
  }

  /**
   * Récupère une permission par son ID
   * @param {number} id - ID de la permission
   * @returns {Promise<Object|null>} Permission trouvée ou null
   */
  async findById(id) {
    const query = `
      SELECT id, code, label, "group", description, created_by, created_at, updated_at
      FROM permissions
      WHERE id = $1
    `;

    try {
      const result = await connection.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche de la permission: ${error.message}`);
    }
  }

  /**
   * Récupère une permission par son nom
   * @param {string} name - Nom de la permission
   * @returns {Promise<Object|null>} Permission trouvée ou null
   */
  async findByCode(code) {
    const query = `
      SELECT id, code, label, "group", description, created_by, created_at, updated_at
      FROM permissions
      WHERE code = $1
    `;

    try {
      const result = await connection.query(query, [code.trim()]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche de la permission par code: ${error.message}`);
    }
  }

  /**
   * Récupère des permissions par ressource
   * @param {string} resource - Nom de la ressource
   * @returns {Promise<Array>} Permissions de la ressource
   */
  async findByResource(resource) {
    const query = `
      SELECT id, code, label, "group", description, created_by, created_at, updated_at
      FROM permissions
      WHERE "group" = $1
      ORDER BY code ASC
    `;

    try {
      const result = await connection.query(query, [resource.trim()]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche des permissions par groupe: ${error.message}`);
    }
  }

  /**
   * Met à jour une permission
   * @param {number} id - ID de la permission
   * @param {Object} updateData - Données à mettre à jour
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Permission mise à jour
   */
  async update(id, updateData, updatedBy = null) {
    const {
      code,
      description,
      group
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

    if (group !== undefined) {
      updates.push(`"group" = $${paramIndex}`);
      values.push(group.trim());
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
      UPDATE permissions
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, code, label, "group", description, created_by, created_at, updated_at, updated_by
    `;

    values.push(id);

    try {
      const result = await connection.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Permission non trouvée');
      }
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Cette permission existe déjà');
      }
      throw new Error(`Erreur lors de la mise à jour de la permission: ${error.message}`);
    }
  }

  /**
   * Supprime une permission (soft delete)
   * @param {number} id - ID de la permission
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} True si supprimée
   */
  async delete(id, deletedBy = null) {
    const query = `
      UPDATE permissions
      SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await connection.query(query, [id, deletedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de la permission: ${error.message}`);
    }
  }

  /**
   * Supprime définitivement une permission
   * @param {number} id - ID de la permission
   * @returns {Promise<boolean>} True si supprimée
   */
  async hardDelete(id) {
    const query = 'DELETE FROM permissions WHERE id = $1';

    try {
      const result = await connection.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      if (error.code === '23503') {
        throw new Error('Cette permission est utilisée par des rôles et ne peut être supprimée');
      }
      throw new Error(`Erreur lors de la suppression de la permission: ${error.message}`);
    }
  }

  /**
   * Récupère les permissions associées à un rôle
   * @param {number} roleId - ID du rôle
   * @returns {Promise<Array>} Permissions du rôle
   */
  async getRolePermissions(roleId) {
    const query = `
      SELECT p.id, p.code, p.label, p."group", p.description
      FROM permissions p
      INNER JOIN authorizations a ON p.id = a.permission_id
      WHERE a.role_id = $1 AND a.permission_id = p.id AND p.deleted_at IS NULL
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
   * Récupère les permissions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Permissions de l'utilisateur
   */
  async getUserPermissions(userId) {
    const query = `
      SELECT DISTINCT p.id, p.code, p.label, p."group", p.description
      FROM permissions p
      INNER JOIN authorizations a ON p.id = a.permission_id
      INNER JOIN accesses acc ON a.role_id = acc.role_id
      WHERE acc.user_id = $1 
        AND acc.status = 'active' 
        AND a.permission_id = p.id
        AND p.deleted_at IS NULL
      ORDER BY p."group" ASC, p.code ASC
    `;

    try {
      const result = await connection.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des permissions utilisateur: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} permissionName - Nom de la permission
   * @returns {Promise<boolean>} True si l'utilisateur a la permission
   */
  async userHasPermission(userId, permissionName) {
    const query = `
      SELECT 1
      FROM permissions p
      INNER JOIN authorizations a ON p.id = a.permission_id
      INNER JOIN accesses acc ON a.role_id = acc.role_id
      WHERE acc.user_id = $1 
        AND p.code = $2
        AND acc.status = 'active' 
        AND a.permission_id = p.id
        AND p.deleted_at IS NULL
      LIMIT 1
    `;

    try {
      const result = await connection.query(query, [userId, permissionName]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification de la permission utilisateur: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les ressources disponibles
   * @returns {Promise<Array>} Liste des ressources
   */
  async getResources() {
    const query = `
      SELECT DISTINCT "group"
      FROM permissions
      WHERE status = 'active'
      ORDER BY "group" ASC
    `;

    try {
      const result = await connection.query(query);
      return result.rows.map(row => row.group);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des ressources: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les actions disponibles pour une ressource
   * @param {string} resource - Nom de la ressource
   * @returns {Promise<Array>} Liste des actions
   */
  async getActionsByResource(resource) {
    const query = `
      SELECT DISTINCT code
      FROM permissions
      WHERE "group" = $1 AND status = 'active'
      ORDER BY code ASC
    `;

    try {
      const result = await connection.query(query, [resource]);
      return result.rows.map(row => row.code);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des actions: ${error.message}`);
    }
  }

  /**
   * Récupère les statistiques des permissions
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_permissions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_permissions,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_permissions,
        COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted_permissions,
        COUNT(DISTINCT "group") as total_resources,
        COUNT(DISTINCT code) as total_actions
      FROM permissions
    `;

    try {
      const result = await connection.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  /**
   * Récupère les permissions par lots
   * @param {Array<number>} permissionIds - IDs des permissions
   * @returns {Promise<Array>} Permissions trouvées
   */
  async findByIds(permissionIds) {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return [];
    }

    const query = `
      SELECT id, code, label, "group", description, created_by, created_at, updated_at
      FROM permissions
      WHERE id = ANY($1) AND status = 'active'
      ORDER BY "group" ASC, code ASC
    `;

    try {
      const result = await connection.query(query, [permissionIds]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des permissions par lots: ${error.message}`);
    }
  }
}

module.exports = new PermissionRepository();
