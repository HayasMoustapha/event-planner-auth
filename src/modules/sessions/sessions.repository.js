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
      refreshToken,
      userId,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresIn = 86400 // 24 heures par défaut
    } = sessionData;

    console.log('🔍 Debug repository.create - Données reçues:', {
      accessToken: accessToken ? accessToken.substring(0, 20) + '...' : 'null',
      refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : 'null',
      userId,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresIn
    });

    try {
      // Insérer dans la table sessions
      const sessionQuery = `
        INSERT INTO sessions (
          id, user_id, ip_address, user_agent, payload, last_activity
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id, ip_address, user_agent, payload, last_activity
      `;

      const sessionValues = [
        accessToken, // id
        userId,       // user_id
        ipAddress || null,  // ip_address
        userAgent || null,  // user_agent
        JSON.stringify({ userId }), // payload
        Date.now() // last_activity
      ];

      console.log('🔍 Debug repository.create - Insertion session...');
      const sessionResult = await connection.query(sessionQuery, sessionValues);
      console.log('🔍 Debug repository.create - Session insérée:', !!sessionResult.rows[0]);

      // Insérer dans la table personal_access_tokens (pour le blacklistage)
      if (accessToken) {
        const tokenQuery = `
          INSERT INTO personal_access_tokens (
            token, user_id, token_type, expires_at, is_active, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (token) DO UPDATE SET
            is_active = EXCLUDED.is_active,
            updated_at = CURRENT_TIMESTAMP
        `;

        const expiresAt = new Date(Date.now() + (expiresIn * 1000));
        const tokenValues = [
          accessToken,
          userId,
          'access',
          expiresAt,
          true, // is_active = true initialement
          JSON.stringify({ deviceInfo, ipAddress, userAgent })
        ];

        console.log('🔍 Debug repository.create - Insertion token...');
        await connection.query(tokenQuery, tokenValues);
        console.log('🔍 Debug repository.create - Token inséré');

        // Insérer le refresh token aussi s'il existe
        if (refreshToken) {
          const refreshExpiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 jours
          const refreshValues = [
            refreshToken,
            userId,
            'refresh',
            refreshExpiresAt,
            true,
            JSON.stringify({ deviceInfo, ipAddress, userAgent })
          ];

          await connection.query(tokenQuery, refreshValues);
          console.log('🔍 Debug repository.create - Refresh token inséré');
        }
      }

      return sessionResult.rows[0];
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
      SELECT id, user_id, 
             ip_address, user_agent, payload, last_activity
      FROM sessions 
      WHERE id = $1
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
      WHERE token = $1 AND is_active = false AND expires_at > CURRENT_TIMESTAMP
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
    const { token, userId, expiresAt, reason = 'logout', revokedBy = null } = tokenData;
    
    try {
      const checkTable = await connection.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'personal_access_tokens'
        );
      `);
      
      if (!checkTable.rows[0].exists) {
        console.log('⚠️ Table personal_access_tokens non trouvée - fallback blacklist');
        return true;
      }
      
      const query = `
        INSERT INTO personal_access_tokens (
          token, user_id, token_type, expires_at, created_at, 
          is_active, reason, revoked_by, revoked_at, metadata
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, false, $5, $6, CURRENT_TIMESTAMP, $7)
        ON CONFLICT (token) DO UPDATE SET
          is_active = false,
          revoked_at = CURRENT_TIMESTAMP,
          reason = EXCLUDED.reason,
          revoked_by = EXCLUDED.revoked_by,
          updated_at = CURRENT_TIMESTAMP
      `;

      const result = await connection.query(query, [
        token,
        userId,
        'access',
        expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h par défaut
        reason,
        revokedBy,
        JSON.stringify({
          blacklisted_at: new Date().toISOString(),
          blacklisted_by: revokedBy || 'system',
          original_expires_at: expiresAt
        })
      ]);

      console.log('✅ Token blacklisté avec succès:', token.substring(0, 20) + '...');
      return result.rowCount > 0;
    } catch (error) {
      console.log('⚠️ Erreur blacklist token, fallback activé:', error.message);
      return true;
    }
  }

  /**
   * Récupère les statistiques des sessions
   * @returns {Promise<Object>} Statistiques des sessions
   */
  async getSessionStats() {
    try {
      const queries = {
        totalSessions: 'SELECT COUNT(*) as count FROM sessions',
        activeSessions: 'SELECT COUNT(*) as count FROM sessions WHERE last_activity > $1',
        blacklistedTokens: 'SELECT COUNT(*) as count FROM personal_access_tokens WHERE is_active = false',
        expiredSessions: 'SELECT COUNT(*) as count FROM sessions WHERE last_activity < $1',
        uniqueUsers: 'SELECT COUNT(DISTINCT user_id) as count FROM sessions'
      };

      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      const [
        totalResult,
        activeResult,
        blacklistedResult,
        expiredResult,
        uniqueUsersResult
      ] = await Promise.all([
        connection.query(queries.totalSessions),
        connection.query(queries.activeSessions, [twentyFourHoursAgo]),
        connection.query(queries.blacklistedTokens),
        connection.query(queries.expiredSessions, [twentyFourHoursAgo]),
        connection.query(queries.uniqueUsers)
      ]);

      return {
        totalSessions: parseInt(totalResult.rows[0].count),
        activeSessions: parseInt(activeResult.rows[0].count),
        blacklistedTokens: parseInt(blacklistedResult.rows[0].count),
        expiredSessions: parseInt(expiredResult.rows[0].count),
        uniqueUsers: parseInt(uniqueUsersResult.rows[0].count),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  /**
   * Récupère les sessions actives avec pagination
   * @param {Object} options - Options de pagination et filtrage
   * @returns {Promise<Object>} Sessions actives paginées
   */
  async getActiveSessions(options = {}) {
    const { page = 1, limit = 20, userId, status = 'active' } = options;
    const offset = (page - 1) * limit;
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    let whereClause = 'WHERE last_activity > $1';
    let queryParams = [twentyFourHoursAgo];
    let paramIndex = 2;

    if (userId) {
      whereClause += ` AND user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM sessions ${whereClause}`;
    const dataQuery = `
      SELECT id, user_id, last_activity, ip_address, user_agent
      FROM sessions ${whereClause}
      ORDER BY last_activity DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery, queryParams.slice(0, paramIndex - 1)),
        connection.query(dataQuery, queryParams)
      ]);

      return {
        sessions: dataResult.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des sessions actives: ${error.message}`);
    }
  }

  /**
   * Récupère les sessions d'un utilisateur spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Sessions de l'utilisateur
   */
  async getUserSessions(userId, options = {}) {
    const { page = 1, limit = 10, includeExpired = false } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = $1';
    let queryParams = [userId];
    let paramIndex = 2;

    if (!includeExpired) {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      whereClause += ` AND last_activity > $${paramIndex}`;
      queryParams.push(twentyFourHoursAgo);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM sessions ${whereClause}`;
    const dataQuery = `
      SELECT id, last_activity, ip_address, user_agent
      FROM sessions ${whereClause}
      ORDER BY last_activity DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery, queryParams.slice(0, paramIndex - 1)),
        connection.query(dataQuery, queryParams)
      ]);

      return {
        sessions: dataResult.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des sessions utilisateur: ${error.message}`);
    }
  }

  /**
   * Récupère les tokens blacklistés
   * @param {Object} options - Options de pagination et filtrage
   * @returns {Promise<Object>} Tokens blacklistés
   */
  async getBlacklistedTokens(options = {}) {
    const { page = 1, limit = 20, userId, reason } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_active = false';
    let queryParams = [];
    let paramIndex = 1;

    if (userId) {
      whereClause += ` AND user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    if (reason) {
      whereClause += ` AND reason = $${paramIndex}`;
      queryParams.push(reason);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM personal_access_tokens ${whereClause}`;
    const dataQuery = `
      SELECT token, user_id, reason, created_at, revoked_at, metadata
      FROM personal_access_tokens ${whereClause}
      ORDER BY revoked_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        connection.query(countQuery, queryParams.slice(0, paramIndex - 1)),
        connection.query(dataQuery, queryParams)
      ]);

      return {
        tokens: dataResult.rows.map(row => ({
          ...row,
          token: row.token.substring(0, 20) + '...' // Masquer le token pour la sécurité
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des tokens blacklistés: ${error.message}`);
    }
  }

  /**
   * Révoque toutes les sessions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} revokedBy - ID de l'utilisateur qui révoque
   * @param {string} reason - Raison de la révocation
   * @returns {Promise<Object>} Résultat de la révocation
   */
  async revokeAllUserSessions(userId, revokedBy = null, reason = 'admin_action') {
    try {
      // Récupérer toutes les sessions actives de l'utilisateur
      const sessionsQuery = 'SELECT id FROM sessions WHERE user_id = $1';
      const sessionsResult = await connection.query(sessionsQuery, [userId]);
      
      const revokedCount = sessionsResult.rows.length;
      
      // Blacklister tous les tokens
      if (revokedCount > 0) {
        const blacklistPromises = sessionsResult.rows.map(session => 
          this.blacklistToken({
            token: session.id,
            userId,
            reason,
            revokedBy
          })
        );
        
        await Promise.all(blacklistPromises);
        
        // Supprimer les sessions
        const deleteQuery = 'DELETE FROM sessions WHERE user_id = $1';
        await connection.query(deleteQuery, [userId]);
      }

      return {
        revokedCount,
        userId,
        reason,
        revokedBy,
        revokedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Erreur lors de la révocation des sessions utilisateur: ${error.message}`);
    }
  }

  /**
   * Nettoie les sessions expirées
   * @param {number} olderThan - Nombre de jours d'ancienneté
   * @returns {Promise<Object>} Résultat du nettoyage
   */
  async cleanupExpiredSessions(olderThan = 7) {
    try {
      const cutoffDate = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);
      
      const deleteQuery = 'DELETE FROM sessions WHERE last_activity < $1 RETURNING id';
      const result = await connection.query(deleteQuery, [cutoffDate]);

      return {
        deletedCount: result.rowCount,
        cutoffDate: cutoffDate.toISOString(),
        olderThan
      };
    } catch (error) {
      throw new Error(`Erreur lors du nettoyage des sessions expirées: ${error.message}`);
    }
  }

  /**
   * Récupère les statistiques de sessions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statistiques de l'utilisateur
   */
  async getUserSessionStats(userId) {
    try {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      const queries = {
        totalSessions: 'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1',
        activeSessions: 'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1 AND last_activity > $2'
      };

      const [totalResult, activeResult] = await Promise.all([
        connection.query(queries.totalSessions, [userId]),
        connection.query(queries.activeSessions, [userId, twentyFourHoursAgo])
      ]);

      return {
        userId,
        totalSessions: parseInt(totalResult.rows[0].count),
        activeSessions: parseInt(activeResult.rows[0].count),
        blacklistedTokens: 0
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques utilisateur: ${error.message}`);
    }
  }

  /**
   * Récupère les sessions suspectes (anomalies)
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Object>} Sessions suspectes
   */
  async getSuspiciousSessions(options = {}) {
    const { hours = 24, maxSessionsPerUser = 10 } = options;
    const cutoffDate = Date.now() - hours * 60 * 60 * 1000;

    try {
      const query = `
        SELECT user_id, COUNT(*) as session_count
        FROM sessions 
        WHERE last_activity > $1
        GROUP BY user_id
        HAVING COUNT(*) > $2
        ORDER BY session_count DESC
      `;

      const result = await connection.query(query, [cutoffDate, maxSessionsPerUser]);

      return {
        suspiciousUsers: result.rows,
        criteria: {
          hours,
          maxSessionsPerUser,
          cutoffDate: new Date(cutoffDate).toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des sessions suspectes: ${error.message}`);
    }
  }

  /**
   * Récupère l'historique des connexions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Historique et pagination
   */
  async getLoginHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      
      // Vérifier que userId est valide
      if (!userId || isNaN(parseInt(userId))) {
        throw new Error('ID utilisateur invalide');
      }
      
      // Requête principale pour l'historique
      const historyQuery = `
        SELECT 
          s.id,
          s.user_id,
          s.device_info,
          s.ip_address,
          s.user_agent,
          s.created_at,
          s.last_activity,
          s.is_active,
          u.username,
          u.email
        FROM sessions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const [history] = await connection.query(historyQuery, [userId, limit, offset]);
      
      // Requête pour le total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sessions s
        WHERE s.user_id = $1
      `;
      
      const [countResult] = await connection.query(countQuery, [userId]);
      const total = parseInt(countResult.total);
      
      return {
        success: true,
        data: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
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
   * Récupère les statistiques des sessions
   * @param {number} userId - ID de l'utilisateur (optionnel)
   * @returns {Promise<Object>} Statistiques des sessions
   */
  async getStats(userId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN last_activity > (EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000) THEN 1 END) as active_sessions_last_hour,
          COUNT(CASE WHEN last_activity > (EXTRACT(EPOCH FROM NOW()) * 1000 - 86400000) THEN 1 END) as active_sessions_last_day,
          0 as new_sessions_last_day,
          0 as avg_session_duration_minutes
        FROM sessions
      `;

      let params = [];

      if (userId) {
        query += ' WHERE user_id = $1';
        params.push(userId);
      }

      const result = await connection.query(query, params);
      const stats = result.rows[0] || {};

      return {
        total_sessions: parseInt(stats.total_sessions) || 0,
        unique_users: parseInt(stats.unique_users) || 0,
        active_sessions_last_hour: parseInt(stats.active_sessions_last_hour) || 0,
        active_sessions_last_day: parseInt(stats.active_sessions_last_day) || 0,
        new_sessions_last_day: parseInt(stats.new_sessions_last_day) || 0,
        avg_session_duration_minutes: parseFloat(stats.avg_session_duration_minutes) || 0,
        user_specific: !!userId
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques de sessions: ${error.message}`);
    }
  }
}

module.exports = new SessionRepository(); /**/
