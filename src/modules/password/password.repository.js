const { connection } = require('../../config/database');

/**
 * Repository pour la gestion des mots de passe
 * Gère les tokens de réinitialisation et l'historique des mots de passe
 */
class PasswordRepository {
  /**
   * Crée un token de réinitialisation de mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} token - Token de réinitialisation
   * @returns {Promise<Object>} Token créé
   */
  async createResetToken(email, token) {
    const query = `
      INSERT INTO password_reset_tokens (email, token, created_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        token = EXCLUDED.token,
        created_at = CURRENT_TIMESTAMP
      RETURNING email, token, created_at
    `;

    try {
      const result = await connection.query(query, [email, token]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la création du token de réinitialisation: ${error.message}`);
    }
  }

  /**
   * Récupère un token de réinitialisation par email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object|null>} Token trouvé ou null
   */
  async getResetToken(email) {
    const query = `
      SELECT email, token, created_at
      FROM password_reset_tokens
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    try {
      const result = await connection.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du token de réinitialisation: ${error.message}`);
    }
  }

  /**
   * Supprime un token de réinitialisation
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<boolean>} True si supprimé
   */
  async deleteResetToken(email) {
    const query = `
      DELETE FROM password_reset_tokens
      WHERE email = $1
    `;

    try {
      const result = await connection.query(query, [email]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du token de réinitialisation: ${error.message}`);
    }
  }

  /**
   * Ajoute un mot de passe à l'historique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} hashedPassword - Mot de passe hashé
   * @returns {Promise<Object>} Entrée créée
   */
  async addPasswordHistory(userId, hashedPassword) {
    const query = `
      INSERT INTO password_histories (user_id, password, created_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING id, user_id, created_at
    `;

    try {
      const result = await connection.query(query, [userId, hashedPassword]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout à l'historique des mots de passe: ${error.message}`);
    }
  }

  /**
   * Récupère l'historique des mots de passe d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Historique paginé
   */
  async getPasswordHistory(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT id, user_id, created_at
      FROM password_histories
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM password_histories
      WHERE user_id = $1
    `;

    try {
      const [result, countResult] = await Promise.all([
        connection.query(query, [userId, limit, offset]),
        connection.query(countQuery, [userId])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const pages = Math.ceil(total / limit);

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'historique des mots de passe: ${error.message}`);
    }
  }

  /**
   * Vérifie si un mot de passe a déjà été utilisé
   * @param {number} userId - ID de l'utilisateur
   * @param {string} hashedPassword - Mot de passe hashé
   * @returns {Promise<boolean>} True si déjà utilisé
   */
  async isPasswordAlreadyUsed(userId, hashedPassword) {
    const query = `
      SELECT COUNT(*) as count
      FROM password_histories
      WHERE user_id = $1 AND password = $2
    `;

    try {
      const result = await connection.query(query, [userId, hashedPassword]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification de l'historique des mots de passe: ${error.message}`);
    }
  }
}

module.exports = new PasswordRepository();
