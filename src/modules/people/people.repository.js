const { connection } = require('../../config/database');

/**
 * Repository pour la gestion des personnes
 * Implémente le CRUD complet avec soft delete et validation
 */
class PeopleRepository {
  /**
   * Récupère toutes les personnes avec pagination et recherche
   * @param {Object} options - Options de pagination et recherche
   * @returns {Promise<Object>} Données paginées
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, search, status = null } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM people WHERE deleted_at IS NULL';
    let countQuery = 'SELECT COUNT(*) as total FROM people WHERE deleted_at IS NULL';
    const params = [];

    // Ajout du filtre de recherche
    if (search) {
      const searchCondition = ' AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)';
      query += searchCondition;
      countQuery += searchCondition;
      params.push(`%${search}%`);
    }

    // Ajout du filtre de statut
    if (status) {
      const statusIndex = params.length + 1;
      const statusCondition = ` AND status = $${statusIndex}`;
      query += statusCondition;
      countQuery += statusCondition;
      params.push(status);
    }

    // Tri et pagination
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    try {
      const [people] = await connection.query(query, params);
      const [countResult] = await connection.query(countQuery, search || status ? params.slice(0, -2) : []);

      return {
        data: people.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des personnes: ${error.message}`);
    }
  }

  /**
   * Récupère une personne par son ID
   * @param {number} id - ID de la personne
   * @returns {Promise<Object|null>} Données de la personne
   */
  async findById(id) {
    const query = 'SELECT * FROM people WHERE id = $1 AND deleted_at IS NULL';
    
    try {
      const result = await connection.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de la personne ${id}: ${error.message}`);
    }
  }

  /**
   * Récupère une personne par son email
   * @param {string} email - Email de la personne
   * @returns {Promise<Object|null>} Données de la personne
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM people WHERE email = $1 AND deleted_at IS NULL';
    
    try {
      const result = await connection.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par email ${email}: ${error.message}`);
    }
  }

  /**
   * Récupère une personne par son téléphone
   * @param {string} phone - Téléphone de la personne
   * @returns {Promise<Object|null>} Données de la personne
   */
  async findByPhone(phone) {
    const query = 'SELECT * FROM people WHERE phone = $1 AND deleted_at IS NULL';
    
    try {
      const result = await connection.query(query, [phone]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par téléphone ${phone}: ${error.message}`);
    }
  }

  /**
   * Récupère une personne par son UID
   * @param {string} uid - UID de la personne
   * @returns {Promise<Object|null>} Données de la personne
   */
  async findByUid(uid) {
    const query = 'SELECT * FROM people WHERE uid = $1 AND deleted_at IS NULL';
    
    try {
      const result = await connection.query(query, [uid]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par UID ${uid}: ${error.message}`);
    }
  }

  /**
   * Crée une nouvelle personne
   * @param {Object} personData - Données de la personne
   * @returns {Promise<Object>} Personne créée
   */
  async create(personData) {
    const {
      first_name,
      last_name,
      email,
      phone,
      photo,
      status = 'active',
      createdBy = null
    } = personData;

    const query = `
      INSERT INTO people (first_name, last_name, email, phone, photo, status, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    try {
      const result = await connection.query(query, [
        first_name,
        last_name,
        email,
        phone,
        photo,
        status,
        createdBy
      ]);

      return result.rows[0];
    } catch (error) {
      // Gestion des erreurs de contrainte unique
      if (error.code === '23505') {
        if (error.constraint.includes('email')) {
          throw new Error('Cet email est déjà utilisé');
        }
        if (error.constraint.includes('phone')) {
          throw new Error('Ce numéro de téléphone est déjà utilisé');
        }
      }
      throw new Error(`Erreur lors de la création de la personne: ${error.message}`);
    }
  }

  /**
   * Met à jour une personne
   * @param {number} id - ID de la personne
   * @param {Object} personData - Données à mettre à jour
   * @returns {Promise<Object>} Personne mise à jour
   */
  async update(id, personData) {
    const {
      first_name,
      last_name,
      email,
      phone,
      photo,
      status,
      updatedBy = null
    } = personData;

    // Construction dynamique de la requête
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (first_name !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(last_name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (photo !== undefined) {
      updates.push(`photo = $${paramIndex++}`);
      values.push(photo);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    updates.push(`updated_by = $${paramIndex++}`);
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(updatedBy);

    const query = `
      UPDATE people 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;
    values.push(id);

    try {
      const result = await connection.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Personne non trouvée');
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint.includes('email')) {
          throw new Error('Cet email est déjà utilisé par une autre personne');
        }
        if (error.constraint.includes('phone')) {
          throw new Error('Ce numéro de téléphone est déjà utilisé par une autre personne');
        }
      }
      throw new Error(`Erreur lors de la mise à jour de la personne: ${error.message}`);
    }
  }

  /**
   * Met à jour la photo d'une personne
   * @param {number} id - ID de la personne
   * @param {string} photoUrl - URL de la photo
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Personne mise à jour
   */
  async updatePhoto(id, photoUrl, updatedBy = null) {
    const query = `
      UPDATE people 
      SET photo = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, first_name, last_name, email, phone, photo, status, updated_at
    `;

    try {
      const result = await connection.query(query, [id, photoUrl, updatedBy]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de la photo: ${error.message}`);
    }
  }

  /**
   * Supprime logiquement une personne (soft delete)
   * @param {number} id - ID de la personne
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async softDelete(id, deletedBy = null) {
    // Vérifier si la personne a des utilisateurs associés
    const hasUsers = await this.hasAssociatedUser(id);
    if (hasUsers) {
      throw new Error('Impossible de supprimer une personne ayant des utilisateurs associés');
    }

    const query = `
      UPDATE people 
      SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await connection.query(query, [id, deletedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de la personne: ${error.message}`);
    }
  }

  /**
   * Vérifie si une personne a des utilisateurs associés
   * @param {number} personId - ID de la personne
   * @returns {Promise<boolean>} True si des utilisateurs sont associés
   */
  async hasAssociatedUser(personId) {
    const query = 'SELECT COUNT(*) as count FROM users WHERE person_id = $1 AND deleted_at IS NULL';
    
    try {
      const result = await connection.query(query, [personId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification des utilisateurs associés: ${error.message}`);
    }
  }
}

module.exports = new PeopleRepository();
