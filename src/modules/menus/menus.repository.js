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
      component,
      parentPath,
      menuGroup,
      sortOrder = 0,
      depth = 0,
      createdBy = null
    } = menuData;

    const query = `
      INSERT INTO menus (
        parent_id, label, icon, route, component, parent_path, 
        menu_group, sort_order, depth, description, 
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, parent_id, label, icon, route, component, parent_path, 
                menu_group, sort_order, depth, description, 
                created_by, created_at, updated_at
    `;

    const values = [
      null, // parent_id par défaut
      label,
      icon || null,
      route || null,
      component || null,
      parentPath || null,
      menuGroup,
      sortOrder,
      depth,
      description ? JSON.stringify(description) : null,
      createdBy
    ];

    try {
      const result = await connection.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la création du menu: ${error.message}`);
    }
  }

  /**
   * Récupère tous les menus avec pagination et filtres
   * @param {Object} options - Options de pagination et recherche
   * @returns {Promise<Object>} Données paginées
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, search, parentMenuId } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE deleted_at IS NULL';
    let countClause = 'WHERE deleted_at IS NULL';
    const params = [];
    let paramIndex = 1;

    // Filtre de recherche
    if (search) {
      whereClause += ` AND (label::text ILIKE $${paramIndex} OR description::text ILIKE $${paramIndex})`;
      countClause += ` AND (label::text ILIKE $${paramIndex} OR description::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtre de menu parent
    if (parentMenuId !== null) {
      whereClause += ` AND parent_id = $${paramIndex}`;
      countClause += ` AND parent_id = $${paramIndex}`;
      params.push(parentMenuId);
      paramIndex++;
    }

    // Tri et pagination
    const dataQuery = `
      SELECT id, parent_id, label, icon, route, component, parent_path, 
             menu_group, sort_order, depth, description, 
             created_by, created_at, updated_at
      FROM menus
      ${whereClause}
      ORDER BY sort_order ASC, label ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    try {
      const results = await Promise.all([
        connection.query(dataQuery, params),
        connection.query(`SELECT COUNT(*) as total FROM menus ${countClause}`, params.slice(0, -2))
      ]);

      const dataResult = results[0];
      const countResult = results[1];

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
      SELECT id, label, description, icon, route, parent_id, sort_order, 
             created_by, created_at, updated_at
      FROM menus
      WHERE id = $1 AND deleted_at IS NULL
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
      SELECT id, label, description, icon, route, parent_id, sort_order, 
             created_by, created_at, updated_at
      FROM menus
      WHERE label = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await connection.query(query, [label.trim()]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche du menu par label: ${error.message}`);
    }
  }

  /**
   * Récupère les menus de premier niveau (racine)
   * @param {Object} options - Options de filtre
   * @returns {Promise<Array>} Menus racine
   */
  async getRootMenus() {
    const query = `
      SELECT id, label, description, icon, route, parent_id, sort_order, 
             created_by, created_at, updated_at
      FROM menus
      WHERE parent_id IS NULL AND deleted_at IS NULL
      ORDER BY sort_order ASC, label ASC
    `;

    try {
      const result = await connection.query(query);
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
  async getSubMenus(parentMenuId) {
    const query = `
      SELECT id, label, description, icon, route, parent_id, sort_order, 
             created_by, created_at, updated_at
      FROM menus
      WHERE parent_id = $1 AND deleted_at IS NULL
      ORDER BY sort_order ASC, label ASC
    `;

    try {
      const result = await connection.query(query, [parentMenuId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des sous-menus: ${error.message}`);
    }
  }

  /**
   * Met à jour un menu
   * @param {number} id - ID du menu
   * @param {Object} menuData - Données à mettre à jour
   * @returns {Promise<Object>} Menu mis à jour
   */
  async update(id, menuData) {
    const {
      label,
      description,
      icon,
      route,
      parentMenuId,
      sortOrder,
      updatedBy
    } = menuData;

    const updates = [];
    const values = [updatedBy];

    let paramIndex = 2;

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
      updates.push(`parent_id = $${paramIndex}`);
      values.push(parentMenuId);
      paramIndex++;
    }

    if (sortOrder !== undefined) {
      updates.push(`sort_order = $${paramIndex}`);
      values.push(sortOrder);
      paramIndex++;
    }

    updates.push(`updated_by = $${paramIndex}`);
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE menus
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, label, description, icon, route, parent_id, sort_order, 
                created_by, created_at, updated_at, updated_by
    `;

    values.unshift(id);

    try {
      const result = await connection.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Menu non trouvé');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du menu: ${error.message}`);
    }
  }

  /**
   * Supprime un menu
   * @param {number} id - ID du menu à supprimer
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async delete(id, deletedBy) {
    const query = `
      UPDATE menus 
      SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $2
      WHERE id = $1
    `;

    try {
      await connection.query(query, [id, deletedBy]);
      return true;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du menu: ${error.message}`);
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
      if (menu.parent_id === parentId) {
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
   * Récupère l'arborescence complète des menus
   * @param {Object} options - Options de filtre
   * @returns {Promise<Array>} Arborescence des menus
   */
  async getMenuTree() {
    const query = `
      SELECT id, label, description, icon, route, parent_id, sort_order, 
             created_by, created_at, updated_at
      FROM menus
      WHERE deleted_at IS NULL
      ORDER BY sort_order ASC, label ASC
    `;

    try {
      const result = await connection.query(query);
      const menus = result.rows;
      
      // Construire l'arborescence
      return this.buildMenuTree(menus);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'arborescence: ${error.message}`);
    }
  }

  /**
   * Récupère les menus de premier niveau (racine)
   * @param {Object} options - Options de filtre
   * @returns {Promise<Array>} Menus racine
   */
  async getRootMenus() {
    const query = `
      SELECT id, label, description, icon, route, parent_id, sort_order, 
             created_by, created_at, updated_at
      FROM menus
      WHERE parent_id IS NULL AND deleted_at IS NULL
      ORDER BY sort_order ASC, label ASC
    `;

    try {
      const result = await connection.query(query);
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
  async getSubMenus(parentMenuId) {
    const query = `
      SELECT id, label, description, icon, route, parent_id, sort_order, 
             created_by, created_at, updated_at
      FROM menus
      WHERE parent_id = $1 AND deleted_at IS NULL
      ORDER BY sort_order ASC, label ASC
    `;

    try {
      const result = await connection.query(query, [parentMenuId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des sous-menus: ${error.message}`);
    }
  }

  /**
   * Récupère les menus accessibles à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Menus accessibles
   */
  async getUserMenus(userId) {
    const query = `
      SELECT id, label, description, icon, route, parent_id, sort_order, 
             created_by, created_at, updated_at
      FROM menus
      WHERE deleted_at IS NULL
      ORDER BY sort_order ASC, label ASC
    `;

    try {
      const result = await connection.query(query);
      const menus = result.rows;
      
      // Construire l'arborescence
      return this.buildMenuTree(menus);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des menus utilisateur: ${error.message}`);
    }
  }

  /**
   * Récupère les statistiques des menus
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_menus,
        COUNT(*) as total_menus
      FROM menus
    `;

    try {
      const result = await connection.query(query);
      return {
        deletedMenus: result.rows[0].deleted_menus,
        totalMenus: result.rows[0].total_menus,
        activeMenus: result.rows[0].total_menus - result.rows[0].deleted_menus
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }
}

module.exports = new MenuRepository();
