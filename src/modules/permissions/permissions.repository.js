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
      name,
      description,
      resource,
      action,
      status = 'active',
      createdBy = null
    } = permissionData;

    const query = `
      INSERT INTO permissions (
        code, label, "group", description, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, code, label, "group", description, created_by, created_at, updated_at
    `;

    const values = [
      name?.trim(), // name sera utilisé comme code
      JSON.stringify({en: name?.trim(), fr: name?.trim()}), // label en JSONB
      resource?.trim() || null, // resource sera utilisé comme group
      description ? JSON.stringify({en: description, fr: description}) : null, // description en JSONB
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
      resource = null,
      action = null,
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

    // Filtre de groupe (anciennement resource)
    if (resource) {
      whereClause += ` AND "group" = $${paramIndex}`;
      countClause += ` AND "group" = $${paramIndex}`;
      params.push(resource);
      paramIndex++;
    }

    // Le filtre d'action n'existe plus dans la nouvelle structure

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
      const [dataResult, countResult] = await Promise.all([
        connection.query(dataQuery, [...params, limit, offset]),
        connection.query(countQuery, params)
      ]);

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
      SELECT id, name, description, resource, action, status, created_by, created_at, updated_at
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
  async findByName(name) {
    const query = `
      SELECT id, name, description, resource, action, status, created_by, created_at, updated_at
      FROM permissions
      WHERE name = $1
    `;

    try {
      const result = await connection.query(query, [name.trim()]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche de la permission par nom: ${error.message}`);
    }
  }

  /**
   * Récupère des permissions par ressource
   * @param {string} resource - Nom de la ressource
   * @returns {Promise<Array>} Permissions de la ressource
   */
  async findByResource(resource) {
    const query = `
      SELECT id, name, description, resource, action, status, created_by, created_at, updated_at
      FROM permissions
      WHERE resource = $1 AND status = 'active'
      ORDER BY action ASC
    `;

    try {
      const result = await connection.query(query, [resource.trim()]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche des permissions par ressource: ${error.message}`);
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
      name,
      description,
      resource,
      action,
      status
    } = updateData;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description.trim());
      paramIndex++;
    }

    if (resource !== undefined) {
      updates.push(`resource = $${paramIndex}`);
      values.push(resource.trim());
      paramIndex++;
    }

    if (action !== undefined) {
      updates.push(`action = $${paramIndex}`);
      values.push(action.trim());
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
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
      RETURNING id, name, description, resource, action, status, created_by, created_at, updated_at, updated_by
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
      SET status = 'deleted', deleted_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status != 'deleted'
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
      SELECT p.id, p.name, p.description, p.resource, p.action, p.status
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1 AND rp.status = 'active' AND p.status = 'active'
      ORDER BY p.resource, p.action
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
      SELECT DISTINCT p.id, p.name, p.description, p.resource, p.action, p.status
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN accesses a ON rp.role_id = a.role_id
      WHERE a.user_id = $1 
        AND a.status = 'active' 
        AND rp.status = 'active' 
        AND p.status = 'active'
      ORDER BY p.resource, p.action
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
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN accesses a ON rp.role_id = a.role_id
      WHERE a.user_id = $1 
        AND p.name = $2
        AND a.status = 'active' 
        AND rp.status = 'active' 
        AND p.status = 'active'
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
      SELECT DISTINCT resource
      FROM permissions
      WHERE status = 'active'
      ORDER BY resource ASC
    `;

    try {
      const result = await connection.query(query);
      return result.rows.map(row => row.resource);
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
      SELECT DISTINCT action
      FROM permissions
      WHERE resource = $1 AND status = 'active'
      ORDER BY action ASC
    `;

    try {
      const result = await connection.query(query, [resource]);
      return result.rows.map(row => row.action);
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
        COUNT(DISTINCT resource) as total_resources,
        COUNT(DISTINCT action) as total_actions
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
   * Active ou désactive une permission
   * @param {number} id - ID de la permission
   * @param {string} status - Nouveau statut
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<boolean>} True si mise à jour
   */
  async updateStatus(id, status, updatedBy = null) {
    const validStatuses = ['active', 'inactive', 'deleted'];
    if (!validStatuses.includes(status)) {
      throw new Error('Statut invalide');
    }

    const query = `
      UPDATE permissions
      SET status = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      const result = await connection.query(query, [id, status, updatedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
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
      SELECT id, name, description, resource, action, status, created_by, created_at, updated_at
      FROM permissions
      WHERE id = ANY($1) AND status = 'active'
      ORDER BY resource, action
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
