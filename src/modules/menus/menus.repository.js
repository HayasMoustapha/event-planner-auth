const { connection } = require('../../config/database');

/**
 * Repository pour la gestion des menus
 * Gère les opérations CRUD sur les menus et leurs associations
 */
class MenuRepository {
  /**
   * Crée un nouveau menu
   * @param {Object} menuData - Données du menu
   * @returns {Promise<Object>} Menu créé
   */
  async create(menuData) {
    const {
      label,
      description,
      icon,
      route,
      parentMenuId = null,
      sortOrder = 0,
      isVisible = true,
      status = 'active',
      createdBy = null
    } = menuData;

    const query = `
      INSERT INTO menus (
        label, description, icon, route, parent_menu_id, sort_order, 
        is_visible, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, label, description, icon, route, parent_menu_id, sort_order, 
                is_visible, status, created_by, created_at, updated_at
    `;

    const values = [
      label?.trim(),
      description?.trim(),
      icon?.trim(),
      route?.trim(),
      parentMenuId,
      sortOrder,
      isVisible,
      status,
      createdBy
    ];

    try {
      const result = await connection.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Ce menu existe déjà');
      }
      throw new Error(`Erreur lors de la création du menu: ${error.message}`);
    }
  }

  /**
   * Récupère tous les menus avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Menus et pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = null,
      status = null,
      isVisible = null,
      parentMenuId = null,
      sortBy = 'sort_order',
      sortOrder = 'ASC'
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let countClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (label ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR route ILIKE $${paramIndex})`;
      countClause += ` AND (label ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR route ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtre de statut
    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      countClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Filtre de visibilité
    if (isVisible !== null) {
      whereClause += ` AND is_visible = $${paramIndex}`;
      countClause += ` AND is_visible = $${paramIndex}`;
      params.push(isVisible);
      paramIndex++;
    }

    // Filtre de menu parent
    if (parentMenuId !== null) {
      whereClause += ` AND parent_menu_id = $${paramIndex}`;
      countClause += ` AND parent_menu_id = $${paramIndex}`;
      params.push(parentMenuId);
      paramIndex++;
    }

    // Validation du tri
    const validSortFields = ['label', 'description', 'route', 'sort_order', 'status', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'sort_order';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT id, label, description, icon, route, parent_menu_id, sort_order, 
             is_visible, status, created_by, created_at, updated_at
      FROM menus
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM menus
      ${countClause}
    `;

    try {
      const [dataResult, countResult] = await Promise.all([
        connection.query(dataQuery, [...params, limit, offset]),
        connection.query(countQuery, params)
      ]);

      const total = parseInt(countResult.rows[0].total);
      const menus = dataResult.rows;

      return {
        menus,
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
      throw new Error(`Erreur lors de la récupération des menus: ${error.message}`);
    }
  }

  /**
   * Récupère un menu par son ID
   * @param {number} id - ID du menu
   * @returns {Promise<Object|null>} Menu trouvé ou null
   */
  async findById(id) {
    const query = `
      SELECT id, label, description, icon, route, parent_menu_id, sort_order, 
             is_visible, status, created_by, created_at, updated_at
      FROM menus
      WHERE id = $1
    `;

    try {
      const result = await connection.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche du menu: ${error.message}`);
    }
  }

  /**
   * Récupère un menu par son label
   * @param {string} label - Label du menu
   * @returns {Promise<Object|null>} Menu trouvé ou null
   */
  async findByLabel(label) {
    const query = `
      SELECT id, label, description, icon, route, parent_menu_id, sort_order, 
             is_visible, status, created_by, created_at, updated_at
      FROM menus
      WHERE label = $1
    `;

    try {
      const result = await connection.query(query, [label.trim()]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche du menu par label: ${error.message}`);
    }
  }

  /**
   * Récupère l'arborescence complète des menus
   * @param {Object} options - Options de filtre
   * @returns {Promise<Array>} Arborescence des menus
   */
  async getMenuTree(options = {}) {
    const { status = 'active', isVisible = true } = options;

    const query = `
      SELECT id, label, description, icon, route, parent_menu_id, sort_order, 
             is_visible, status, created_by, created_at, updated_at
      FROM menus
      WHERE status = $1 AND is_visible = $2
      ORDER BY sort_order ASC, label ASC
    `;

    try {
      const result = await connection.query(query, [status, isVisible]);
      const menus = result.rows;
      
      // Construire l'arborescence
      return this.buildMenuTree(menus);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'arborescence: ${error.message}`);
    }
  }

  /**
   * Construit l'arborescence des menus à partir d'une liste plate
   * @param {Array} menus - Liste des menus
   * @param {number} parentId - ID du menu parent
   * @returns {Array} Arborescence construite
   */
  buildMenuTree(menus, parentId = null) {
    const tree = [];
    
    for (const menu of menus) {
      if (menu.parent_menu_id === parentId) {
        const children = this.buildMenuTree(menus, menu.id);
        if (children.length > 0) {
          menu.children = children;
        }
        tree.push(menu);
      }
    }
    
    return tree;
  }

  /**
   * Récupère les menus de premier niveau (racine)
   * @param {Object} options - Options de filtre
   * @returns {Promise<Array>} Menus racine
   */
  async getRootMenus(options = {}) {
    const { status = 'active', isVisible = true } = options;

    const query = `
      SELECT id, label, description, icon, route, parent_menu_id, sort_order, 
             is_visible, status, created_by, created_at, updated_at
      FROM menus
      WHERE parent_menu_id IS NULL AND status = $1 AND is_visible = $2
      ORDER BY sort_order ASC, label ASC
    `;

    try {
      const result = await connection.query(query, [status, isVisible]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des menus racine: ${error.message}`);
    }
  }

  /**
   * Récupère les sous-menus d'un menu parent
   * @param {number} parentMenuId - ID du menu parent
   * @param {Object} options - Options de filtre
   * @returns {Promise<Array>} Sous-menus
   */
  async getSubMenus(parentMenuId, options = {}) {
    const { status = 'active', isVisible = true } = options;

    const query = `
      SELECT id, label, description, icon, route, parent_menu_id, sort_order, 
             is_visible, status, created_by, created_at, updated_at
      FROM menus
      WHERE parent_menu_id = $1 AND status = $2 AND is_visible = $3
      ORDER BY sort_order ASC, label ASC
    `;

    try {
      const result = await connection.query(query, [parentMenuId, status, isVisible]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des sous-menus: ${error.message}`);
    }
  }

  /**
   * Met à jour un menu
   * @param {number} id - ID du menu
   * @param {Object} updateData - Données à mettre à jour
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Menu mis à jour
   */
  async update(id, updateData, updatedBy = null) {
    const {
      label,
      description,
      icon,
      route,
      parentMenuId,
      sortOrder,
      isVisible,
      status
    } = updateData;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (label !== undefined) {
      updates.push(`label = $${paramIndex}`);
      values.push(label.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description.trim());
      paramIndex++;
    }

    if (icon !== undefined) {
      updates.push(`icon = $${paramIndex}`);
      values.push(icon.trim());
      paramIndex++;
    }

    if (route !== undefined) {
      updates.push(`route = $${paramIndex}`);
      values.push(route.trim());
      paramIndex++;
    }

    if (parentMenuId !== undefined) {
      updates.push(`parent_menu_id = $${paramIndex}`);
      values.push(parentMenuId);
      paramIndex++;
    }

    if (sortOrder !== undefined) {
      updates.push(`sort_order = $${paramIndex}`);
      values.push(sortOrder);
      paramIndex++;
    }

    if (isVisible !== undefined) {
      updates.push(`is_visible = $${paramIndex}`);
      values.push(isVisible);
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
      UPDATE menus
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, label, description, icon, route, parent_menu_id, sort_order, 
                is_visible, status, created_by, created_at, updated_at, updated_by
    `;

    values.push(id);

    try {
      const result = await connection.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Menu non trouvé');
      }
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Ce menu existe déjà');
      }
      throw new Error(`Erreur lors de la mise à jour du menu: ${error.message}`);
    }
  }

  /**
   * Supprime un menu (soft delete)
   * @param {number} id - ID du menu
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} True si supprimé
   */
  async delete(id, deletedBy = null) {
    const query = `
      UPDATE menus
      SET status = 'deleted', deleted_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status != 'deleted'
    `;

    try {
      const result = await connection.query(query, [id, deletedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du menu: ${error.message}`);
    }
  }

  /**
   * Supprime définitivement un menu
   * @param {number} id - ID du menu
   * @returns {Promise<boolean>} True si supprimé
   */
  async hardDelete(id) {
    const query = 'DELETE FROM menus WHERE id = $1';

    try {
      const result = await connection.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      if (error.code === '23503') {
        throw new Error('Ce menu a des sous-menus et ne peut être supprimé');
      }
      throw new Error(`Erreur lors de la suppression du menu: ${error.message}`);
    }
  }

  /**
   * Récupère les menus accessibles à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Menus accessibles
   */
  async getUserMenus(userId) {
    const query = `
      SELECT DISTINCT m.id, m.label, m.description, m.icon, m.route, 
             m.parent_menu_id, m.sort_order, m.is_visible, m.status, m.created_at, m.updated_at
      FROM menus m
      INNER JOIN menu_permissions mp ON m.id = mp.menu_id
      INNER JOIN permissions p ON mp.permission_id = p.id
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN accesses a ON rp.role_id = a.role_id
      WHERE a.user_id = $1 
        AND m.status = 'active' 
        AND m.is_visible = true
        AND a.status = 'active'
        AND rp.status = 'active'
        AND mp.status = 'active'
        AND p.status = 'active'
      ORDER BY m.sort_order ASC, m.name ASC
    `;

    try {
      const result = await connection.query(query, [userId]);
      const menus = result.rows;
      
      // Construire l'arborescence
      return this.buildMenuTree(menus);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des menus utilisateur: ${error.message}`);
    }
  }

  /**
   * Récupère les permissions associées à un menu
   * @param {number} menuId - ID du menu
   * @returns {Promise<Array>} Permissions du menu
   */
  async getMenuPermissions(menuId) {
    const query = `
      SELECT p.id, p.name, p.description, p.resource, p.action, p.status
      FROM permissions p
      INNER JOIN menu_permissions mp ON p.id = mp.permission_id
      WHERE mp.menu_id = $1 AND mp.status = 'active' AND p.status = 'active'
      ORDER BY p.resource, p.action
    `;

    try {
      const result = await connection.query(query, [menuId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des permissions du menu: ${error.message}`);
    }
  }

  /**
   * Associe des permissions à un menu
   * @param {number} menuId - ID du menu
   * @param {Array<number>} permissionIds - IDs des permissions à associer
   * @param {number} createdBy - ID de l'utilisateur qui crée l'association
   * @returns {Promise<number>} Nombre d'associations créées
   */
  async assignPermissions(menuId, permissionIds, createdBy = null) {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return 0;
    }

    // Supprimer d'abord les associations existantes
    await this.removeAllPermissions(menuId);

    const values = permissionIds.map((permissionId, index) => {
      const baseIndex = index * 3;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
    }).join(', ');

    const flatValues = permissionIds.flatMap(permissionId => [
      menuId,
      permissionId,
      createdBy
    ]);

    const query = `
      INSERT INTO menu_permissions (menu_id, permission_id, created_by, created_at)
      VALUES ${values}
      RETURNING id
    `;

    try {
      const result = await connection.query(query, flatValues);
      return result.rows.length;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Certaines permissions sont déjà associées à ce menu');
      }
      throw new Error(`Erreur lors de l'association des permissions: ${error.message}`);
    }
  }

  /**
   * Supprime toutes les permissions d'un menu
   * @param {number} menuId - ID du menu
   * @returns {Promise<number>} Nombre d'associations supprimées
   */
  async removeAllPermissions(menuId) {
    const query = 'DELETE FROM menu_permissions WHERE menu_id = $1';

    try {
      const result = await connection.query(query, [menuId]);
      return result.rowCount;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression des permissions du menu: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur a accès à un menu
   * @param {number} userId - ID de l'utilisateur
   * @param {number} menuId - ID du menu
   * @returns {Promise<boolean>} True si l'utilisateur a accès
   */
  async userHasMenuAccess(userId, menuId) {
    const query = `
      SELECT 1
      FROM menus m
      INNER JOIN menu_permissions mp ON m.id = mp.menu_id
      INNER JOIN permissions p ON mp.permission_id = p.id
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN accesses a ON rp.role_id = a.role_id
      WHERE a.user_id = $1 
        AND m.id = $2
        AND m.status = 'active' 
        AND m.is_visible = true
        AND a.status = 'active'
        AND rp.status = 'active'
        AND mp.status = 'active'
        AND p.status = 'active'
      LIMIT 1
    `;

    try {
      const result = await connection.query(query, [userId, menuId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification d'accès au menu: ${error.message}`);
    }
  }

  /**
   * Récupère les statistiques des menus
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_menus,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_menus,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_menus,
        COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted_menus,
        COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_menus,
        COUNT(CASE WHEN is_visible = false THEN 1 END) as hidden_menus,
        COUNT(CASE WHEN parent_menu_id IS NULL THEN 1 END) as root_menus,
        COUNT(CASE WHEN parent_menu_id IS NOT NULL THEN 1 END) as sub_menus
      FROM menus
    `;

    try {
      const result = await connection.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  /**
   * Active ou désactive un menu
   * @param {number} id - ID du menu
   * @param {string} status - Nouveau statut
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<boolean>} True si mis à jour
   */
  async updateStatus(id, status, updatedBy = null) {
    const validStatuses = ['active', 'inactive', 'deleted'];
    if (!validStatuses.includes(status)) {
      throw new Error('Statut invalide');
    }

    const query = `
      UPDATE menus
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
   * Réorganise l'ordre des menus
   * @param {Array<Object>} menuOrders - Liste des menus avec leur ordre
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<number>} Nombre de menus mis à jour
   */
  async reorderMenus(menuOrders, updatedBy = null) {
    if (!Array.isArray(menuOrders) || menuOrders.length === 0) {
      return 0;
    }

    let updatedCount = 0;
    
    for (const menuOrder of menuOrders) {
      const { menuId, sortOrder } = menuOrder;
      
      const query = `
        UPDATE menus
        SET sort_order = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      try {
        const result = await connection.query(query, [menuId, sortOrder, updatedBy]);
        if (result.rowCount > 0) {
          updatedCount++;
        }
      } catch (error) {
        console.error(`Erreur lors de la réorganisation du menu ${menuId}:`, error);
      }
    }
    
    return updatedCount;
  }
}

module.exports = new MenuRepository();
