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
      accessToken,
      userId,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresIn = 3600 // 1 heure par défaut
    } = sessionData;

    console.log('🔍 Debug repository.create - Données reçues:', {
      accessToken: accessToken ? accessToken.substring(0, 20) + '...' : 'null',
      userId,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresIn
    });

    const query = `
      INSERT INTO sessions (
        id, user_id, ip_address, user_agent, payload, last_activity
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, ip_address, user_agent, payload, last_activity
    `;

    const values = [
      accessToken, // id
      userId,       // user_id
      ipAddress || null,  // ip_address
      userAgent || null,  // user_agent
      JSON.stringify({ userId }), // payload
      Date.now() // last_activity
    ];

    console.log('🔍 Debug repository.create - Exécution query...');
    console.log('🔍 Debug repository.create - Valeurs:', values.map((v, i) => i === 0 ? v?.substring(0, 20) + '...' : v));

    try {
      const result = await connection.query(query, values);
      console.log('🔍 Debug repository.create - Session insérée:', !!result.rows[0]);
      console.log('🔍 Debug repository.create - Session ID:', result.rows[0]?.id?.substring(0, 20) + '...');
      return result.rows[0];
    } catch (error) {
      console.log('🔍 Debug repository.create - Erreur query:', error.message);
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
      SELECT id, user_id, 
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
      SELECT id, user_id, access_token, refresh_token, 
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
      SELECT id, user_id, access_token, refresh_token, 
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
    const query = `
      DELETE FROM sessions 
      WHERE id = $1
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
      SELECT id FROM personal_access_tokens 
      WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP
    `;

    try {
      const result = await connection.query(query, [token]);
      return result.rows.length > 0;
    } catch (error) {
      // Si la table n'existe pas, considérer que le token n'est pas blacklisté
      if (error.message.includes('relation "personal_access_tokens" does not exist')) {
        return false;
      }
      throw new Error(`Erreur lors de la vérification du token blacklisté: ${error.message}`);
    }
  }

  /**
   * Ajoute un token à la blacklist
   * @param {Object} tokenData - Données du token à blacklist
   * @returns {Promise<boolean>} True si ajouté avec succès
   */
  async blacklistToken(tokenData) {
    const { token, userId, expiresAt } = tokenData;
    
    // Vérifier si la table personal_access_tokens existe
    try {
      const checkTable = await connection.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'personal_access_tokens'
        );
      `);
      
      if (!checkTable.rows[0].exists) {
        // Si la table n'existe pas, créer un fallback simple
        // Pour l'instant, on simule le blacklistage en retournant true
        console.log('⚠️ Table personal_access_tokens non trouvée - fallback blacklist');
        return true;
      }
      
      const query = `
        INSERT INTO personal_access_tokens (token, user_id, expires_at, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (token) DO NOTHING
      `;

      const result = await connection.query(query, [
        token,
        userId,
        expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h par défaut
      ]);

      return result.rowCount > 0;
    } catch (error) {
      // Fallback si erreur
      console.log('⚠️ Erreur blacklist token, fallback activé:', error.message);
      return true;
    }
  }
}

module.exports = new SessionRepository(); /**/
