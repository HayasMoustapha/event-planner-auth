const { connection } = require('../../config/database');
const bcrypt = require('bcrypt');

/**
 * Repository pour la gestion des utilisateurs
 * Implémente le CRUD complet avec hashage de mot de passe et historique
 */
class UsersRepository {
  /**
   * Récupère tous les utilisateurs avec pagination et filtres
   * @param {Object} options - Options de pagination et recherche
   * @returns {Promise<Object>} Données paginées
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, search, status = null, userAccess = null } = options;
    const offset = (page - 1) * limit;

    // Colonnes selon schéma SQL : id, person_id, user_code, username, phone, email, status, email_verified_at, password, remember_token, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    let query = `
      SELECT u.id, u.username, u.email, u.status, u.user_code, u.phone, u.email_verified_at, u.created_at, u.updated_at,
             p.first_name, p.last_name, p.phone as person_phone
      FROM users u
      LEFT JOIN people p ON u.person_id = p.id
      WHERE u.deleted_at IS NULL
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM users u 
      LEFT JOIN people p ON u.person_id = p.id
      WHERE u.deleted_at IS NULL
    `;
    const params = [];

    // Ajout du filtre de recherche
    if (search) {
      const searchCondition = ` AND (u.username ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1} OR p.first_name ILIKE $${params.length + 1} OR p.last_name ILIKE $${params.length + 1})`;
      query += searchCondition;
      countQuery += searchCondition;
      params.push(`%${search}%`);
    }

    // Ajout du filtre de statut
    if (status) {
      const statusIndex = params.length + 1;
      const statusCondition = ` AND u.status = $${statusIndex}`;
      query += statusCondition;
      countQuery += statusCondition;
      params.push(status);
    }


    // Tri et pagination
    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    try {
      const usersResult = await connection.query(query, params);
      const countResult = await connection.query(countQuery, search || status ? params.slice(0, -2) : []);

      return {
        data: usersResult.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }
  }

  /**
   * Récupère un utilisateur par son ID
   * @param {number} id - ID de l'utilisateur
   * @param {boolean} includePassword - Inclure le mot de passe (pour authentification)
   * @returns {Promise<Object>} Données de l'utilisateur
   */
  async findById(id, includePassword = false) {
    // Colonnes selon schéma SQL : id, person_id, user_code, username, phone, email, status, email_verified_at, password, remember_token, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    const fields = includePassword 
      ? 'u.*, p.first_name, p.last_name, p.phone as person_phone, p.email as person_email'
      : 'u.id, u.username, u.email, u.status, u.user_code, u.phone, u.email_verified_at, u.created_at, u.updated_at, p.first_name, p.last_name, p.phone as person_phone, p.email as person_email';
    
    const query = `
      SELECT ${fields}
      FROM users u
      LEFT JOIN people p ON u.person_id = p.id
      WHERE u.id = $1 AND u.deleted_at IS NULL
    `;
    
    try {
      const result = await connection.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'utilisateur ${id}: ${error.message}`);
    }
  }

  /**
   * Trouve un utilisateur par son téléphone
   * @param {string} phone - Téléphone de l'utilisateur
   * @returns {Promise<Object|null>} Données de l'utilisateur
   */
  async findByPhone(phone) {
    const query = 'SELECT * FROM users WHERE phone = $1 AND deleted_at IS NULL';
    
    try {
      const result = await connection.query(query, [phone]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'utilisateur par téléphone:', error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son email
   * @param {string} email - Email de l'utilisateur
   * @param {boolean} includePassword - Inclure le mot de passe
   * @returns {Promise<Object>} Données de l'utilisateur
   */
  async findByEmail(email, includePassword = false) {
    const fields = includePassword 
      ? 'u.*, p.first_name, p.last_name, p.phone as person_phone'
      : 'u.id, u.username, u.email, u.status, u.user_code, u.phone, u.email_verified_at, u.created_at, u.updated_at, p.first_name, p.last_name, p.phone as person_phone';
    
    const query = `
      SELECT ${fields}
      FROM users u
      LEFT JOIN people p ON u.person_id = p.id
      WHERE u.email = $1 AND u.deleted_at IS NULL
    `;
    
    try {
      const result = await connection.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par email ${email}: ${error.message}`);
    }
  }

  /**
   * Récupère un utilisateur par son username
   * @param {string} username - Username de l'utilisateur
   * @param {boolean} includePassword - Inclure le mot de passe
   * @returns {Promise<Object>} Données de l'utilisateur
   */
  async findByUsername(username, includePassword = false) {
    const fields = includePassword 
      ? 'u.*, p.first_name, p.last_name, p.phone as person_phone'
      : 'u.id, u.username, u.email, u.status, u.user_code, u.phone, u.email_verified_at, u.created_at, u.updated_at, p.first_name, p.last_name, p.phone as person_phone';
    
    const query = `
      SELECT ${fields}
      FROM users u
      LEFT JOIN people p ON u.person_id = p.id
      WHERE u.username = $1 AND u.deleted_at IS NULL
    `;
    
    try {
      const result = await connection.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par username ${username}: ${error.message}`);
    }
  }

  /**
   * Récupère un utilisateur par son ID de personne
   * @param {number} personId - ID de la personne
   * @param {boolean} includePassword - Inclure le mot de passe
   * @returns {Promise<Object|null>} Données de l'utilisateur
   */
  async findByPersonId(personId, includePassword = false) {
    const fields = includePassword 
      ? 'u.*, p.first_name, p.last_name, p.phone as person_phone, p.email as person_email'
      : 'u.id, u.username, u.email, u.status, u.user_code, u.phone, u.email_verified_at, u.created_at, u.updated_at, p.first_name, p.last_name, p.phone as person_phone';
    
    const query = `
      SELECT ${fields}
      FROM users u
      LEFT JOIN people p ON u.person_id = p.id
      WHERE u.person_id = $1 AND u.deleted_at IS NULL
    `;
    
    try {
      const result = await connection.query(query, [personId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche de l'utilisateur par person_id: ${error.message}`);
    }
  }

  /**
   * Crée un nouvel utilisateur avec mot de passe hashé
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<Object>} Utilisateur créé
   */
  async create(userData) {
    const {
      username,
      email,
      password,
      userCode = null,
      phone = null,
      status = 'active',
      person_id,
      createdBy = null
    } = userData;

    console.log('🔍 Debug users.repository.create - userData:', userData);
    console.log('🔍 Debug users.repository.create - person_id:', person_id);
    console.log('🔍 Debug users.repository.create - typeof person_id:', typeof person_id);

    if (!person_id) {
      throw new Error('person_id est requis pour créer un utilisateur');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (person_id, username, email, password, user_code, phone, status, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, person_id, username, email, user_code, phone, status, created_at, updated_at
    `;

    try {
      console.log('🔍 Debug users.repository.create - Avant requête SQL');
      const result = await connection.query(query, [
        person_id,
        username,
        email,
        hashedPassword,
        userCode,
        phone,
        status,
        createdBy
      ]);

      console.log('🔍 Debug users.repository.create - result.rows[0]:', result.rows[0]);

      // Ajouter à l'historique des mots de passe
      await this.addPasswordHistory(result.rows[0].id, hashedPassword);

      return result.rows[0];
    } catch (error) {
      // Gestion des erreurs de contrainte unique
      if (error.code === '23505') {
        if (error.constraint.includes('email')) {
          throw new Error('Cet email est déjà utilisé');
        }
        if (error.constraint.includes('username')) {
          throw new Error('Ce nom d\'utilisateur est déjà utilisé');
        }
      }
      throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}, person_id: ${userData.person_id}`);
    }
  }

  /**
   * Met à jour un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async update(id, updateData) {
    const {
      person_id,
      username,
      email,
      password,
      userCode,
      phone,
      status,
      emailVerifiedAt,
      updatedBy = null
    } = updateData;

    // Construction dynamique de la requête
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (person_id !== undefined) {
      updates.push(`person_id = $${paramIndex++}`);
      values.push(person_id);
    }

    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updates.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
      
      // Ajouter à l'historique des mots de passe
      await this.addPasswordHistory(id, hashedPassword);
    }
    if (userCode !== undefined) {
      updates.push(`user_code = $${paramIndex++}`);
      values.push(userCode);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (emailVerifiedAt !== undefined) {
      updates.push(`email_verified_at = $${paramIndex++}`);
      values.push(emailVerifiedAt);
    }

    if (updates.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    updates.push(`updated_by = $${paramIndex++}`);
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(updatedBy);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, person_id, username, email, user_code, phone, status, created_at, updated_at
    `;
    values.push(id);

    try {
      const result = await connection.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint.includes('email')) {
          throw new Error('Cet email est déjà utilisé par un autre utilisateur');
        }
        if (error.constraint.includes('username')) {
          throw new Error('Ce nom d\'utilisateur est déjà utilisé par un autre utilisateur');
        }
      }
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {string} newPassword - Nouveau mot de passe
   * @param {number} updatedBy - ID de l'utilisateur qui met à jour
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async updatePassword(id, newPassword, updatedBy = null) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Ajouter à l'historique avant la mise à jour
    await this.addPasswordHistory(id, hashedPassword);

    const query = `
      UPDATE users 
      SET password = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, person_id,  username, email, user_code, phone, status, updated_at
    `;

    try {
      const result = await connection.query(query, [id, hashedPassword, updatedBy]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du mot de passe: ${error.message}`);
    }
  }

  /**
   * Supprime logiquement un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async softDelete(id, deletedBy = null) {
    const query = `
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await connection.query(query, [id, deletedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Vérifie si un mot de passe est correct
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe à vérifier
   * @returns {Promise<Object|null>} Utilisateur si le mot de passe est correct
   */
  async verifyPassword(email, password) {
    // D'abord chercher par email utilisateur exact
    let user = await this.findByEmail(email, true);
    
    // Si pas trouvé, chercher par email de personne
    if (!user) {
      const query = `
        SELECT u.*, p.first_name, p.last_name, p.phone as person_phone
        FROM users u
        LEFT JOIN people p ON u.person_id = p.id
        WHERE p.email = $1 AND u.deleted_at IS NULL
      `;
      
      try {
        const result = await connection.query(query, [email]);
        user = result.rows[0] || null;
      } catch (error) {
        throw new Error(`Erreur lors de la recherche par email personne ${email}: ${error.message}`);
      }
    }
    
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return null;
    }

    // Retourner l'utilisateur sans le mot de passe
    delete user.password;
    return user;
  }

  /**
   * Met à jour la date de dernière connexion
   * @param {number} id - ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async updateLastLogin(id) {
    // Note: last_login_at n'existe pas dans le schéma SQL actuel
  }

  /**
   * Ajoute un mot de passe à l'historique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} passwordHash - Hash du mot de passe
   * @returns {Promise<void>}
   */
  async addPasswordHistory(userId, passwordHash) {
    const query = `
      INSERT INTO password_histories (user_id, password, created_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `;

    try {
      await connection.query(query, [userId, passwordHash]);
    } catch (error) {
      // Ne pas bloquer l'opération si l'historique échoue
      console.warn(`Impossible d'ajouter à l'historique des mots de passe: ${error.message}`);
    }
  }

  /**
   * Met à jour le statut d'un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {string} status - Nouveau statut
   * @param {number} updatedBy - ID de l'utilisateur qui modifie
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async updateStatus(id, status, updatedBy = null) {
    const validStatuses = ['active', 'inactive', 'lock'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Statut invalide: ${status}. Valeurs autorisées: ${validStatuses.join(', ')}`);
    }

    return await this.update(id, { status, updatedBy });
  }

  /**
   * Vérifie si un mot de passe a déjà été utilisé
   * @param {number} userId - ID de l'utilisateur
   * @param {string} password - Mot de passe à vérifier
   * @returns {Promise<boolean>} True si le mot de passe a déjà été utilisé
   */
  async isPasswordAlreadyUsed(userId, password) {
    const query = `
      SELECT password 
      FROM password_histories 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    try {
      const result = await connection.query(query, [userId]);
      
      for (const row of result.rows) {
        const isSame = await bcrypt.compare(password, row.password);
        if (isSame) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn(`Erreur lors de la vérification de l'historique des mots de passe: ${error.message}`);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur existe
   * @param {number} id - ID de l'utilisateur
   * @returns {Promise<boolean>} True si l'utilisateur existe
   */
  async exists(id) {
    const query = 'SELECT COUNT(*) as count FROM users WHERE id = $1 AND deleted_at IS NULL';
    
    try {
      const result = await connection.query(query, [id]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification de l'existence: ${error.message}`);
    }
  }

  /**
   * Récupère les statistiques sur les utilisateurs
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    try {
      const active = await connection.query('SELECT COUNT(*) as count FROM users WHERE status = $1 AND deleted_at IS NULL', ['active']);
      const inactive = await connection.query('SELECT COUNT(*) as count FROM users WHERE status = $1 AND deleted_at IS NULL', ['inactive']);
      const locked = await connection.query('SELECT COUNT(*) as count FROM users WHERE status = $1 AND deleted_at IS NULL', ['locked']);
      const all = await connection.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL');

      return {
        total: parseInt(all.rows[0].count),
        active: parseInt(active.rows[0].count),
        inactive: parseInt(inactive.rows[0].count),
        locked: parseInt(locked.rows[0].count)
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }
}

module.exports = new UsersRepository();
