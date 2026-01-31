const { connection } = require('../../config/database');

/**
 * Repository pour la gestion des OTP (One-Time Password)
 * Implémente la génération, validation et suppression des OTP
 */
class OtpRepository {
  /**
   * Crée un nouveau code OTP
   * @param {Object} otpData - Données de l'OTP
   * @returns {Promise<Object>} OTP créé
   */
  async create(otpData) {
    const {
      personId,
      purpose,
      otpCode,
      expiresAt,
      isUsed = false,
      createdBy = null
    } = otpData;

    // Colonnes selon schéma : id, person_id, otp_code, expires_at, is_used, purpose, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    const query = `
      INSERT INTO otps (person_id, purpose, otp_code, expires_at, is_used, created_at, created_by)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
      RETURNING id, person_id, purpose, otp_code, expires_at, is_used, created_at
    `;

    try {
      const result = await connection.query(query, [
        personId, // person_id (colonne 'person_id' du schéma)
        purpose, // purpose (colonne 'purpose' du schéma)
        otpCode, // otp_code (colonne 'otp_code' du schéma)
        expiresAt,
        isUsed,
        createdBy
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'OTP: ${error.message}`);
    }
  }

  /**
   * Récupère un OTP par son code et ID utilisateur
   * @param {string} otpCode - Code OTP
   * @param {number} userId - ID de l'utilisateur
   * @param {string} purpose - Purpose de l'OTP
   * @returns {Promise<Object|null>} OTP trouvé ou null
   */
  // Colonnes selon schéma : id, person_id, otp_code, expires_at, is_used, purpose, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
  async findByCodeAndUserId(otpCode, userId, purpose) {
    const query = `
      SELECT * FROM otps 
        WHERE otp_code = $1 AND person_id = $2 AND purpose = $3 
          AND is_used = FALSE 
            AND expires_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC
        LIMIT 1
    `;

    // Debug log
    console.log('🔍 Debug Repository Query:', {
      otpCode,
      userId,
      purpose,
      query: query.replace(/\s+/g, ' ').trim()
    });

    try {
      const result = await connection.query(query, [otpCode, userId, purpose]);
      console.log('🔍 Debug Repository Result:', result.rows.length, 'OTP(s) trouvé(s)');
      if (result.rows.length > 0) {
        console.log('🔍 Debug OTP Details:', {
          id: result.rows[0].id,
          otp_code: result.rows[0].otp_code,
          personId: result.rows[0].person_id,
          purpose: result.rows[0].purpose,
          isUsed: result.rows[0].is_used,
          expiresAt: result.rows[0].expires_at
        });
      }
      return result.rows[0] || null;
    } catch (error) {
      console.log('❌ Debug Repository Error:', error.message);
      throw new Error(`Erreur lors de la recherche de l'OTP: ${error.message}`);
    }
  }

  /**
   * Récupère un OTP par son code et identifiant
   * @param {string} otpCode - Code OTP
   * @param {number} personId - ID de la personne
   * @param {string} purpose - Purpose de l'OTP
   * @returns {Promise<Object|null>} OTP trouvé ou null
   */
  // Colonnes selon schéma : id, person_id, otp_code, expires_at, is_used, purpose, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
  async findByCodeAndPersonId(otpCode, personId, purpose) {
    const query = `
      SELECT * FROM otps 
        WHERE otp_code = $1 AND person_id = $2 AND purpose = $3 
          AND is_used = FALSE 
            AND expires_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC
        LIMIT 1
    `;

    // Debug log
    console.log('🔍 Debug Repository Query:', {
      otpCode,
      personId,
      purpose,
      query: query.replace(/\s+/g, ' ').trim()
    });

    try {
      const result = await connection.query(query, [otpCode, personId, purpose]);
      console.log('🔍 Debug Repository Result:', result.rows.length, 'OTP(s) trouvé(s)');
      if (result.rows.length > 0) {
        console.log('🔍 Debug OTP Details:', {
          id: result.rows[0].id,
          otp_code: result.rows[0].otp_code,
          personId: result.rows[0].person_id,
          purpose: result.rows[0].purpose,
          isUsed: result.rows[0].is_used,
          expiresAt: result.rows[0].expires_at
        });
      }
      return result.rows[0] || null;
    } catch (error) {
      console.log('❌ Debug Repository Error:', error.message);
      throw new Error(`Erreur lors de la recherche de l'OTP: ${error.message}`);
    }
  }

  /**
   * Récupère tous les OTP pour une personne
   * @param {number} personId - ID de la personne
   * @param {string} purpose - Purpose de l'OTP (optionnel)
   * @returns {Promise<Array>} Liste des OTP
   */
  async findByPersonId(personId, purpose = null) {
    let query = `
      SELECT * FROM otps 
      WHERE person_id = $1
    `;
    const params = [personId];

    if (purpose) {
      query += ' AND purpose = $2';
      params.push(purpose);
    }

    query += ' ORDER BY created_at DESC';

    try {
      const result = await connection.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des OTP: ${error.message}`);
    }
  }

  /**
   * Marque un OTP comme utilisé
   * @param {number} id - ID de l'OTP
   * @param {number} usedBy - ID de l'utilisateur qui l'utilise
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async markAsUsed(id, usedBy = null) {
    const query = `
      UPDATE otps 
      SET is_used = TRUE, updated_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_used = FALSE
    `;

    try {
      const result = await connection.query(query, [id, usedBy]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors du marquage de l'OTP: ${error.message}`);
    }
  }

  /**
   * Supprime les OTP expirés
   * @returns {Promise<number>} Nombre d'OTP supprimés
   */
  async deleteExpired() {
    const query = `
      DELETE FROM otps 
      WHERE expires_at < CURRENT_TIMESTAMP
    `;

    try {
      const result = await connection.query(query);
      return result.rowCount;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression des OTP expirés: ${error.message}`);
    }
  }

  /**
   * Supprime tous les OTP pour une personne
   * @param {number} personId - ID de la personne
   * @returns {Promise<number>} Nombre d'OTP supprimés
   */
  async deleteByPersonId(personId) {
    const query = `
      DELETE FROM otps 
        WHERE person_id = $1
    `;

    try {
      const result = await connection.query(query, [personId]);
      return result.rowCount;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression des OTP personne: ${error.message}`);
    }
  }

  /**
   * Vérifie si un code OTP est valide
   * @param {string} otpCode - Code OTP à vérifier
   * @param {number} userId - ID de l'utilisateur
   * @param {string} purpose - Purpose de l'OTP
   * @returns {Promise<Object|null>} OTP valide ou null
   */
  async validateOtp(otpCode, userId, purpose) {
    const otp = await this.findByCodeAndUserId(otpCode, userId, purpose);
    
    if (!otp) {
      return null;
    }

    // Marquer comme utilisé
    await this.markAsUsed(otp.id);

    return otp;
  }

  /**
   * Compte le nombre d'OTP actifs pour une personne
   * @param {number} personId - ID de la personne
   * @param {string} purpose - Purpose de l'OTP (optionnel)
   * @returns {Promise<number>} Nombre d'OTP actifs
   */
  async countActiveOtp(personId, purpose = null) {
    let query = `
      SELECT COUNT(*) as count FROM otps 
      WHERE person_id = $1 AND is_used = FALSE 
        AND expires_at > CURRENT_TIMESTAMP
    `;
    const params = [personId];

    if (purpose) {
      query += ' AND purpose = $2';
      params.push(purpose);
    }

    try {
      const result = await connection.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Erreur lors du comptage des OTP: ${error.message}`);
    }
  }

  /**
   * Nettoie les anciens OTP expirés
   * @returns {Promise<void>}
   */
  async cleanupExpired() {
    try {
      await this.deleteExpired();
      console.log('🧹 Nettoyage des OTP expirés effectué');
    } catch (error) {
      console.warn('⚠️ Erreur lors du nettoyage des OTP expirés:', error.message);
    }
  }

  /**
   * Récupère les statistiques sur les OTP
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    try {
      // Vérifier si la connexion est disponible
      if (!connection || !connection.query) {
        // Retourner des statistiques simulées si la DB n'est pas disponible
        return {
          total: 0,
          active: 0,
          used: 0,
          expired: 0,
          note: 'Database unavailable - simulated stats'
        };
      }
      
      const [total] = await connection.query('SELECT COUNT(*) as count FROM otps');
      const [active] = await connection.query('SELECT COUNT(*) as count FROM otps WHERE is_used = FALSE AND expires_at > CURRENT_TIMESTAMP');
      const [used] = await connection.query('SELECT COUNT(*) as count FROM otps WHERE is_used = TRUE');
      const [expired] = await connection.query('SELECT COUNT(*) as count FROM otps WHERE expires_at < CURRENT_TIMESTAMP');

      return {
        total: parseInt(total.rows[0].count),
        active: parseInt(active.rows[0].count),
        used: parseInt(used.rows[0].count),
        expired: parseInt(expired.rows[0].count)
      };
    } catch (error) {
      // En cas d'erreur de base de données, retourner des stats simulées
      return {
        total: 0,
        active: 0,
        used: 0,
        expired: 0,
        note: 'Database error - simulated stats',
        error: error.message
      };
    }
  }
}

module.exports = new OtpRepository();
