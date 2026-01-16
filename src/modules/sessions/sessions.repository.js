const { connection } = require('../../config/database');

/**
 * Repository pour la gestion des sessions et tokens
 * Gère les sessions utilisateur, refresh tokens et blacklisting
 */
class SessionRepository {
  /**
   * Crée une nouvelle session utilisateur
   * @param {Object} sessionData - Données de la session
   * @returns {Promise<Object>} Session créée
   */
  async create(sessionData) {
    const {
      userId,
      accessToken,
      refreshToken,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresIn = 3600 // 1 heure par défaut
    } = sessionData;

    const query = `
      INSERT INTO sessions (
        user_id, access_token, refresh_token, device_info, 
        ip_address, user_agent, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, user_id, access_token, refresh_token, device_info, 
                ip_address, user_agent, expires_at, created_at, updated_at, is_active
    `;

    const values = [
      userId,
      accessToken,
      refreshToken,
      deviceInfo || null,
      ipAddress || null,
      userAgent || null,
      new Date(Date.now() + (expiresIn * 1000))
    ];

    try {
      const result = await connection.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la création de la session: ${error.message}`);
    }
  }

  /**
   * Récupère une session par son access token
   * @param {string} accessToken - Token d'accès
   * @returns {Promise<Object|null>} Session trouvée ou null
   */
  async findByAccessToken(accessToken) {
    const query = `
      SELECT id, user_id, device_info, 
             ip_address, user_agent, payload, last_activity
      FROM sessions 
      WHERE id = $1
    `;

    try {
      const result = await connection.query(query, [accessToken]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche de session: ${error.message}`);
    }
  }

  /**
   * Récupère une session par son refresh token
   * @param {string} refreshToken - Token de rafraîchissement
   * @returns {Promise<Object|null>} Session trouvée ou null
   */
  async findByRefreshToken(refreshToken) {
    const query = `
      SELECT id, user_id, access_token, refresh_token, device_info, 
             ip_address, user_agent, expires_at, created_at, updated_at, is_active
      FROM sessions 
      WHERE refresh_token = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
    `;

    try {
      const result = await connection.query(query, [refreshToken]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche de session par refresh token: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les sessions actives d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Sessions et pagination
   */
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM sessions 
      WHERE user_id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
    `;

    const dataQuery = `
      SELECT id, user_id, access_token, refresh_token, device_info, 
             ip_address, user_agent, expires_at, created_at, updated_at, is_active
      FROM sessions 
      WHERE user_id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery, [userId]),
        connection.query(dataQuery, [userId, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const sessions = dataResult.rows;

      return {
        sessions,
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
      throw new Error(`Erreur lors de la récupération des sessions: ${error.message}`);
    }
  }

  /**
   * Met à jour une session (généralement pour rafraîchir les tokens)
   * @param {number} sessionId - ID de la session
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Session mise à jour
   */
  async update(sessionId, updateData) {
    const {
      accessToken,
      refreshToken,
      expiresIn = 3600
    } = updateData;

    const query = `
      UPDATE sessions 
      SET 
        access_token = $2, 
        refresh_token = $3, 
        expires_at = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        id = $1 AND 
        is_active = TRUE
      RETURNING 
        id, 
        user_id, 
        access_token, 
        refresh_token, 
        device_info, 
        ip_address, 
        user_agent, 
        expires_at, 
        created_at, 
        updated_at, 
        is_active
    `;

    const values = [
      sessionId,
      accessToken,
      refreshToken,
      new Date(Date.now() + (expiresIn * 1000))
    ];

    try {
      const result = await connection.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de la session: ${error.message}`);
    }
  }

  /**
   * Désactive une session (logout)
   * @param {number} sessionId - ID de la session
   * @returns {Promise<boolean>} True si désactivée
   */
  async deactivate(sessionId) {
    let query = `
      UPDATE sessions 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_active = TRUE
    `;

    try {
      const result = await connection.query(query, [sessionId]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la désactivation de la session: ${error.message}`);
    }
  }

  /**
   * Désactive toutes les sessions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} True si désactivées
   */
  async deactivateAllSessions(userId) {
    const query = `
      UPDATE sessions 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_active = TRUE
    `;

    try {
      const result = await connection.query(query, [userId]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la désactivation de toutes les sessions: ${error.message}`);
    }
  }

  /**
   * Récupère l'historique des sessions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} page - Page actuelle
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} Sessions avec pagination
   */
  async getSessionHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM sessions 
      WHERE user_id = $1
    `;
    
    const dataQuery = `
      SELECT 
        id, user_id, device_info, ip_address, user_agent, 
        created_at, updated_at, expires_at, is_active
      FROM sessions 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery, [userId]),
        connection.query(dataQuery, [userId, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const sessions = dataResult.rows;

      return {
        sessions,
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
      throw new Error(`Erreur lors de la récupération de l'historique: ${error.message}`);
    }
  }

  /**
   * Vérifie si un token est blacklisté
   * @param {string} token - Token à vérifier
   * @returns {Promise<boolean>} True si le token est blacklisté
   */
  async isTokenBlacklisted(token) {
    const query = `
      SELECT id FROM blacklisted_tokens 
      WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP
    `;

    try {
      const result = await connection.query(query, [token]);
      return result.rows.length > 0;
    } catch (error) {
      // Si la table n'existe pas, considérer que le token n'est pas blacklisté
      if (error.message.includes('relation "blacklisted_tokens" does not exist')) {
        return false;
      }
      throw new Error(`Erreur lors de la vérification du token blacklisté: ${error.message}`);
    }
  }
}

module.exports = new SessionRepository(); /**/
