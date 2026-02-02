const { connection } = require('../../config/database');

/**
 * Extension du repository users avec les méthodes manquantes
 * Ajoute le support du remember_token
 */
class UsersRepositoryExtension {
  /**
   * Récupère un utilisateur par son remember token
   * @param {string} rememberToken - Remember token à rechercher
   * @returns {Promise<Object|null>} Utilisateur trouvé ou null
   */
  async findByRememberToken(rememberToken) {
    const query = `
      SELECT u.id, u.username, u.email, u.status, u.user_code, u.phone, u.email_verified_at, u.created_at, u.updated_at, u.remember_token,
             p.first_name, p.last_name, p.phone as person_phone
      FROM users u
      LEFT JOIN people p ON u.person_id = p.id
      WHERE u.remember_token = $1 
        AND u.deleted_at IS NULL
        AND u.status = 'active'
    `;

    try {
      const result = await connection.query(query, [rememberToken]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      
      // Combiner les données de l'utilisateur et de la personne
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        user_code: user.user_code,
        phone: user.phone,
        email_verified_at: user.email_verified_at,
        remember_token: user.remember_token,
        created_at: user.created_at,
        updated_at: user.updated_at,
        first_name: user.first_name,
        last_name: user.last_name,
        person_phone: user.person_phone
      };
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par remember token: ${error.message}`);
    }
  }

  /**
   * Met à jour le remember token d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} rememberToken - Nouveau remember token
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async updateRememberToken(userId, rememberToken) {
    const query = `
      UPDATE users 
      SET remember_token = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, username, email, status, remember_token, updated_at
    `;

    try {
      const result = await connection.query(query, [rememberToken, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du remember token: ${error.message}`);
    }
  }
}

module.exports = new UsersRepositoryExtension();
