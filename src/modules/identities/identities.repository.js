const { getDatabase } = require('../../config/database');

/**
 * Repository pour la gestion des identités OAuth
 * Gère les opérations SQL sur la table user_identities
 */
class IdentitiesRepository {
  /**
   * Crée une nouvelle identité OAuth
   * @param {Object} identityData - Données de l'identité
   * @returns {Promise<Object>} Identité créée
   */
  async create(identityData) {
    const {
      user_id,
      provider,
      provider_user_id,
      email,
      provider_data = null,
      created_by = null
    } = identityData;

    const query = `
      INSERT INTO user_identities (
        user_id, provider, provider_user_id, email, 
        provider_data, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, user_id, provider, provider_user_id, email, 
                provider_data, last_used_at, created_at, updated_at, uid
    `;

    const values = [
      user_id,
      provider,
      provider_user_id,
      email.toLowerCase().trim(),
      provider_data ? JSON.stringify(provider_data) : null,
      created_by
    ];

    try {
      const db = getDatabase();
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        // Contrainte unique violée
        if (error.constraint.includes('provider_unique')) {
          throw new Error(`Cet utilisateur ${provider} est déjà lié à un compte`);
        }
      }
      throw new Error(`Erreur création identité OAuth: ${error.message}`);
    }
  }

  /**
   * Recherche une identité par fournisseur et ID utilisateur
   * @param {string} provider - Fournisseur (google, apple)
   * @param {string} providerUserId - ID utilisateur chez le fournisseur
   * @returns {Promise<Object|null>} Identité trouvée ou null
   */
  async findByProviderAndProviderId(provider, providerUserId) {
    const query = `
      SELECT id, user_id, provider, provider_user_id, email, 
             provider_data, last_used_at, created_at, updated_at, uid
      FROM user_identities
      WHERE provider = $1 AND provider_user_id = $2
      AND deleted_at IS NULL
    `;

    try {
      const db = getDatabase();
      const result = await db.query(query, [provider, providerUserId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur recherche identité OAuth: ${error.message}`);
    }
  }

  /**
   * Recherche les identités d'un utilisateur
   * @param {number} userId - ID utilisateur
   * @param {string} provider - Fournisseur optionnel
   * @returns {Promise<Array>} Liste des identités
   */
  async findByUserId(userId, provider = null) {
    let query = `
      SELECT id, user_id, provider, provider_user_id, email, 
             provider_data, last_used_at, created_at, updated_at, uid
      FROM user_identities
      WHERE user_id = $1
      AND deleted_at IS NULL
    `;
    let params = [userId];

    if (provider) {
      query += ' AND provider = $2';
      params.push(provider);
    }

    query += ' ORDER BY created_at DESC';

    try {
      const db = getDatabase();
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur recherche identités utilisateur: ${error.message}`);
    }
  }

  /**
   * Recherche une identité par email et fournisseur
   * @param {string} email - Email
   * @param {string} provider - Fournisseur
   * @returns {Promise<Object|null>} Identité trouvée ou null
   */
  async findByEmailAndProvider(email, provider) {
    const query = `
      SELECT id, user_id, provider, provider_user_id, email, 
             provider_data, last_used_at, created_at, updated_at, uid
      FROM user_identities
      WHERE email = $1 AND provider = $2
      AND deleted_at IS NULL
    `;

    try {
      const db = getDatabase();
      const result = await db.query(query, [email.toLowerCase().trim(), provider]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erreur recherche identité par email: ${error.message}`);
    }
  }

  /**
   * Met à jour la dernière utilisation d'une identité
   * @param {number} identityId - ID de l'identité
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async updateLastUsed(identityId) {
    const query = `
      UPDATE user_identities 
      SET last_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `;

    try {
      const db = getDatabase();
      const result = await db.query(query, [identityId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Erreur mise à jour dernière utilisation: ${error.message}`);
    }
  }

  /**
   * Met à jour les données du fournisseur
   * @param {number} identityId - ID de l'identité
   * @param {Object} providerData - Nouvelles données fournisseur
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async updateProviderData(identityId, providerData) {
    const query = `
      UPDATE user_identities 
      SET provider_data = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;

    try {
      const db = getDatabase();
      const result = await db.query(query, [
        providerData ? JSON.stringify(providerData) : null,
        identityId
      ]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Erreur mise à jour données fournisseur: ${error.message}`);
    }
  }

  /**
   * Supprime une identité (soft delete)
   * @param {number} identityId - ID de l'identité
   * @param {number} deletedBy - ID utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async softDelete(identityId, deletedBy = null) {
    const query = `
      UPDATE user_identities 
      SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    try {
      const db = getDatabase();
      const result = await db.query(query, [identityId, deletedBy]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Erreur suppression identité: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur a une identité pour un fournisseur
   * @param {number} userId - ID utilisateur
   * @param {string} provider - Fournisseur
   * @returns {Promise<boolean>} True si l'identité existe
   */
  async userHasProviderIdentity(userId, provider) {
    const query = `
      SELECT id FROM user_identities
      WHERE user_id = $1 AND provider = $2
      AND deleted_at IS NULL
      LIMIT 1
    `;

    try {
      const db = getDatabase();
      const result = await db.query(query, [userId, provider]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Erreur vérification identité fournisseur: ${error.message}`);
    }
  }

  /**
   * Compte le nombre d'identités pour un utilisateur
   * @param {number} userId - ID utilisateur
   * @returns {Promise<number>} Nombre d'identités
   */
  async countByIdentity(userId) {
    const query = `
      SELECT COUNT(*) as count FROM user_identities
      WHERE user_id = $1 AND deleted_at IS NULL
    `;

    try {
      const db = getDatabase();
      const result = await db.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Erreur comptage identités: ${error.message}`);
    }
  }

  /**
   * Récupère les statistiques des identités OAuth
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    const query = `
      SELECT 
        provider,
        COUNT(*) as total,
        COUNT(CASE WHEN last_used_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as active_last_30_days,
        COUNT(CASE WHEN created_at > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as created_last_7_days
      FROM user_identities
      WHERE deleted_at IS NULL
      GROUP BY provider
      ORDER BY total DESC
    `;

    try {
      const db = getDatabase();
      const result = await db.query(query);
      
      const stats = {
        total: 0,
        byProvider: {}
      };

      result.rows.forEach(row => {
        stats.total += parseInt(row.total);
        stats.byProvider[row.provider] = {
          total: parseInt(row.total),
          activeLast30Days: parseInt(row.active_last_30_days),
          createdLast7Days: parseInt(row.created_last_7_days)
        };
      });

      return stats;
    } catch (error) {
      throw new Error(`Erreur statistiques identités: ${error.message}`);
    }
  }
}

module.exports = new IdentitiesRepository();
