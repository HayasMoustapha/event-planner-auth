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
      userId,
      type,
      identifier, // email ou téléphone
      code,
      expiresAt,
      isUsed = false,
      createdBy = null
    } = otpData;

    // Colonnes selon schéma de référence : id, person_id, otp_code, expires_at, is_used, purpose, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
    const query = `
      INSERT INTO otps (person_id, otp_code, expires_at, is_used, purpose, created_at, created_by)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
      RETURNING id, person_id, otp_code, expires_at, is_used, purpose, created_at
    `;

    try {
      const result = await connection.query(query, [
        identifier, // identifier sera utilisé comme person_id (colonne 'person_id' du schéma)
        code, // code sera utilisé comme otp_code (colonne 'otp_code' du schéma)
        expiresAt,
        isUsed,
        type, // type sera utilisé comme purpose (colonne 'purpose' du schéma)
        createdBy
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'OTP: ${error.message}`);
    }
  }

  /**
   * Récupère un OTP par son code et identifiant
   * @param {string} code - Code OTP
   * @param {string} identifier - Email ou téléphone
   * @param {string} type - Type d'OTP (email/phone)
   * @returns {Promise<Object|null>} OTP trouvé ou null
   */
  // Colonnes selon schéma de référence : id, person_id, otp_code, expires_at, is_used, purpose, created_by, updated_by, deleted_by, uid, created_at, updated_at, deleted_at
  async findByCodeAndIdentifier(code, identifier, type) {
    const query = `
      SELECT * FROM otps 
      WHERE otp_code = $1 AND person_id = $2 AND purpose = $3 
        AND is_used = FALSE 
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `;

    try {
      const result = await connection.query(query, [code, identifier, type]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche de l'OTP: ${error.message}`);
    }
  }

  /**
   * Récupère tous les OTP pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type d'OTP (optionnel)
   * @returns {Promise<Array>} Liste des OTP
   */
  async findByUserId(userId, type = null) {
    let query = `
      SELECT * FROM otps 
      WHERE person_id = $1
    `;
    const params = [userId];

    if (type) {
      query += ' AND purpose = $2';
      params.push(type);
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
   * Supprime tous les OTP pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre d'OTP supprimés
   */
  async deleteByUserId(userId) {
    const query = `
      DELETE FROM otp_codes 
      WHERE user_id = $1
    `;

    try {
      const result = await connection.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression des OTP utilisateur: ${error.message}`);
    }
  }

  /**
   * Vérifie si un code OTP est valide
   * @param {string} code - Code OTP à vérifier
   * @param {string} identifier - Email ou téléphone
   * @param {string} type - Type d'OTP
   * @returns {Promise<Object|null>} OTP valide ou null
   */
  async validateOtp(code, identifier, type) {
    const otp = await this.findByCodeAndIdentifier(code, identifier, type);
    
    if (!otp) {
      return null;
    }

    // Marquer comme utilisé
    await this.markAsUsed(otp.id);

    return otp;
  }

  /**
   * Compte le nombre d'OTP actifs pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   *param {string} type - Type d'OTP (optionnel)
   * @returns {Promise<number>} Nombre d'OTP actifs
   */
  async countActiveOtp(userId, type = null) {
    let query = `
      SELECT COUNT(*) as count FROM otp_codes 
      WHERE user_id = $1 AND is_used = FALSE 
        AND expires_at > CURRENT_TIMESTAMP
    `;
    const params = [userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
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
      const [total] = await connection.query('SELECT COUNT(*) as count FROM otp_codes');
      const [active] = await connection.query('SELECT COUNT(*) as count FROM otp_codes WHERE is_used = FALSE AND expires_at > CURRENT_TIMESTAMP');
      const [used] = await connection.query('SELECT COUNT(*) as count FROM otp_codes WHERE is_used = TRUE');
      const [expired] = await connection.query('SELECT COUNT(*) as count FROM otp_codes WHERE expires_at < CURRENT_TIMESTAMP');

      return {
        total: parseInt(total.rows[0].count),
        active: parseInt(active.rows[0].count),
        used: parseInt(used.rows[0].count),
        expired: parseInt(expired.rows[0].count)
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques OTP: ${error.message}`);
    }
  }
}

module.exports = new OtpRepository();
