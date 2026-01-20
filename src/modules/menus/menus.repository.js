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
      parentMenuId = null,
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
      parentMenuId, // parent_id
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
    const { page = 1, limit = 10, search, parentMenuId, isVisible = true } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE deleted_at IS NULL';
    let countClause = 'WHERE deleted_at IS NULL';
    const params = [];
    let paramIndex = 1;

    // Filtre de visibilité
    if (isVisible !== undefined) {
      whereClause += ` AND is_visible = $${paramIndex}`;
      countClause += ` AND is_visible = $${paramIndex}`;
      params.push(isVisible);
      paramIndex++;
    }

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
      SELECT id, parent_id, label, icon, route, component, parent_path, 
             menu_group, sort_order, depth, description, 
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
      SELECT id, parent_id, label, icon, route, component, parent_path, 
             menu_group, sort_order, depth, description, 
             created_by, created_at, updated_at
      FROM menus
      WHERE label = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await connection.query(query, [label]);
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
      SELECT id, parent_id, label, icon, route, component, parent_path, 
             menu_group, sort_order, depth, description, 
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
      SELECT id, parent_id, label, icon, route, component, parent_path, 
             menu_group, sort_order, depth, description, 
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
    const values = [];
    let paramIndex = 1;

    if (label !== undefined) {
      updates.push(`label = $${paramIndex}`);
      values.push(label);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (icon !== undefined) {
      updates.push(`icon = $${paramIndex}`);
      values.push(icon ? icon.trim() : null);
      paramIndex++;
    }

    if (route !== undefined) {
      updates.push(`route = $${paramIndex}`);
      values.push(route ? route.trim() : null);
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
    values.push(updatedBy);
    paramIndex++;

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE menus
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, label, description, icon, route, parent_id, sort_order, 
                created_by, created_at, updated_at, updated_by
    `;

    values.push(id);

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
      const result = await connection.query(query, [id, deletedBy]);
      return result.rowCount > 0;
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
      SELECT id, parent_id, label, icon, route, component, parent_path, 
             menu_group, sort_order, depth, description, 
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
   * Récupère les menus accessibles à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Menus accessibles
   */
  async getUserMenus(userId) {
    const query = `
      SELECT DISTINCT m.id, m.parent_id, m.label, m.icon, m.route, m.component, m.parent_path, 
             m.menu_group, m.sort_order, m.depth, m.description, 
             m.created_by, m.created_at, m.updated_at
      FROM menus m
      INNER JOIN authorizations a ON m.id = a.menu_id
      INNER JOIN accesses acc ON a.role_id = acc.role_id
      WHERE acc.user_id = $1 AND acc.status = 'active' AND m.deleted_at IS NULL
      ORDER BY m.sort_order ASC, m.label ASC
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
   * @returns {Promise<Array>} Liste des permissions
   */
  async getMenuPermissions(menuId) {
    const query = `
      SELECT DISTINCT p.id, p.code, p.label, p."group", p.description
      FROM permissions p
      INNER JOIN authorizations a ON p.id = a.permission_id
      WHERE a.menu_id = $1
      ORDER BY p."group" ASC, p.code ASC
    `;

    try {
      const result = await connection.query(query, [menuId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des permissions du menu: ${error.message}`);
    }
  }

  /**
   * Supprime toutes les permissions d'un menu
   * @param {number} menuId - ID du menu
   * @returns {Promise<number>} Nombre de permissions supprimées
   */
  async removeAllPermissions(menuId) {
    const query = `
      DELETE FROM authorizations
      WHERE menu_id = $1
    `;

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
   * @returns {Promise<boolean>} True si l'accès est autorisé
   */
  async userHasMenuAccess(userId, menuId) {
    const query = `
      SELECT COUNT(*) as count
      FROM authorizations a
      INNER JOIN accesses acc ON a.role_id = acc.role_id
      WHERE acc.user_id = $1 AND a.menu_id = $2 AND acc.status = 'active'
    `;

    try {
      const result = await connection.query(query, [userId, menuId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification de l'accès au menu: ${error.message}`);
    }
  }

  /**
   * Associe des permissions à un menu (pour le rôle super_admin par défaut)
   * @param {number} menuId - ID du menu
   * @param {Array<number>} permissionIds - IDs des permissions
   * @param {number} createdBy - ID de l'utilisateur qui effectue l'association
   * @returns {Promise<number>} Nombre d'associations créées
   */
  async assignPermissions(menuId, permissionIds, createdBy = null) {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return 0;
    }

    let count = 0;
    // Note: Utilise le rôle super_admin (1) par défaut car l'API ne spécifie pas de rôle
    for (const permissionId of permissionIds) {
      const query = `
        INSERT INTO authorizations (role_id, permission_id, menu_id, created_by, created_at, updated_at)
        VALUES (1, $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING
      `;
      try {
        const res = await connection.query(query, [permissionId, menuId, createdBy]);
        count += res.rowCount;
      } catch (error) {
        console.error(`Erreur lors de l'association permission ${permissionId} au menu ${menuId}:`, error);
      }
    }
    return count;
  }

  /**
   * Réorganise l'ordre des menus
   * @param {Array<Object>} menuOrders - Liste des menus et leur ordre
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<number>} Nombre de menus mis à jour
   */
  async reorderMenus(menuOrders, updatedBy = null) {
    if (!Array.isArray(menuOrders) || menuOrders.length === 0) {
      return 0;
    }

    await connection.query('BEGIN');
    try {
      let count = 0;
      for (const order of menuOrders) {
        const query = `
          UPDATE menus 
          SET sort_order = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1
        `;
        const res = await connection.query(query, [order.menuId, order.sortOrder, updatedBy]);
        count += res.rowCount;
      }
      await connection.query('COMMIT');
      return count;
    } catch (error) {
      await connection.query('ROLLBACK');
      throw new Error(`Erreur lors de la réorganisation des menus: ${error.message}`);
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
        deletedMenus: parseInt(result.rows[0].deleted_menus),
        totalMenus: parseInt(result.rows[0].total_menus),
        activeMenus: parseInt(result.rows[0].total_menus) - parseInt(result.rows[0].deleted_menus)
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  /**
   * Construit l'arborescence des menus
   * @param {Array} menus - Liste des menus
   * @returns {Array} Arborescence des menus
   */
  buildMenuTree(menus) {
    const menuMap = new Map();
    const rootMenus = [];

    // Créer une map de tous les menus
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    // Construire l'arborescence
    menus.forEach(menu => {
      if (menu.parent_id === null) {
        rootMenus.push(menuMap.get(menu.id));
      } else {
        const parent = menuMap.get(menu.parent_id);
        if (parent) {
          parent.children.push(menuMap.get(menu.id));
        }
      }
    });

    return rootMenus;
  }

  /**
   * Récupère l'arborescence complète des menus
   * @param {Object} options - Options de filtre
   * @returns {Promise<Array>} Arborescence des menus
   */
  async getMenuTree() {
    const query = `
      SELECT id, parent_id, label, icon, route, component, parent_path, 
             menu_group, sort_order, depth, description, 
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
* Récupère les menus accessibles à un utilisateur
* @param {number} userId - ID de l'utilisateur
* @returns {Promise<Array>} Menus accessibles
*/
async getUserMenus(userId) {
    const query = `
      SELECT DISTINCT m.id, m.parent_id, m.label, m.icon, m.route, m.component, m.parent_path, 
             m.menu_group, m.sort_order, m.depth, m.description, 
             m.created_by, m.created_at, m.updated_at
      FROM menus m
      INNER JOIN authorizations a ON m.id = a.menu_id
      INNER JOIN accesses acc ON a.role_id = acc.role_id
      WHERE acc.user_id = $1 AND acc.status = 'active' AND m.deleted_at IS NULL
      ORDER BY m.sort_order ASC, m.label ASC
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
   * @returns {Promise<Array>} Liste des permissions
   */
  async getMenuPermissions(menuId) {
    const query = `
      SELECT DISTINCT p.id, p.code, p.label, p."group", p.description
      FROM permissions p
      INNER JOIN authorizations a ON p.id = a.permission_id
      WHERE a.menu_id = $1
      ORDER BY p."group" ASC, p.code ASC
    `;

try {
      const result = await connection.query(query, [menuId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des permissions du menu: ${error.message}`);
    }
  }

  /**
   * Supprime toutes les permissions d'un menu
   * @param {number} menuId - ID du menu
   * @returns {Promise<number>} Nombre de permissions supprimées
   */
  async removeAllPermissions(menuId) {
    const query = `
      DELETE FROM authorizations
      WHERE menu_id = $1
    `;

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
   * @returns {Promise<boolean>} True si l'accès est autorisé
   */
  async userHasMenuAccess(userId, menuId) {
    const query = `
      SELECT COUNT(*) as count
      FROM authorizations a
      INNER JOIN accesses acc ON a.role_id = acc.role_id
      WHERE acc.user_id = $1 AND a.menu_id = $2 AND acc.status = 'active'
    `;

try {
      const result = await connection.query(query, [userId, menuId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification de l'accès au menu: ${error.message}`);
    }
  }

  /**
   * Associe des permissions à un menu (pour le rôle super_admin par défaut)
   * @param {number} menuId - ID du menu
   * @param {Array<number>} permissionIds - IDs des permissions
   * @param {number} createdBy - ID de l'utilisateur qui effectue l'association
   * @returns {Promise<number>} Nombre d'associations créées
   */
  async assignPermissions(menuId, permissionIds, createdBy = null) {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return 0;
    }

    let count = 0;
    // Note: Utilise le rôle super_admin (1) par défaut car l'API ne spécifie pas de rôle
    for (const permissionId of permissionIds) {
      const query = `
        INSERT INTO authorizations (role_id, permission_id, menu_id, created_by, created_at, updated_at)
        VALUES (1, $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING
      `;
      try {
        const res = await connection.query(query, [permissionId, menuId, createdBy]);
        count += res.rowCount;
      } catch (error) {
        console.error(`Erreur lors de l'association permission ${permissionId} au menu ${menuId}:`, error);
      }
    }
    return count;
  }

  /**
   * Réorganise l'ordre des menus
   * @param {Array<Object>} menuOrders - Liste des menus et leur ordre
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<number>} Nombre de menus mis à jour
   */
  async reorderMenus(menuOrders, updatedBy = null) {
    if (!Array.isArray(menuOrders) || menuOrders.length === 0) {
      return 0;
    }

    await connection.query('BEGIN');
    try {
      let count = 0;
      for (const order of menuOrders) {
        const query = `
          UPDATE menus 
      SET sort_order = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1
        `;
        const res = await connection.query(query, [order.menuId, order.sortOrder, updatedBy]);
        count += res.rowCount;
      }
      await connection.query('COMMIT');
      return count;
    } catch (error) {
      await connection.query('ROLLBACK');
  throw new Error(`Erreur lors de la réorganisation des menus: ${error.message}`);
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
        deletedMenus: parseInt(result.rows[0].deleted_menus),
        totalMenus: parseInt(result.rows[0].total_menus),
        activeMenus: parseInt(result.rows[0].total_menus) - parseInt(result.rows[0].deleted_menus)
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  /**
   * Récupère tous les menus avec pagination et filtres
   * @param {Object} options - Options de pagination et recherche
   * @returns {Promise<Object>} Données paginées
   */
  async getMenus(options = {}) {
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
}

module.exports = new MenuRepository();
