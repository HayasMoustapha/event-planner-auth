const { Pool } = require('pg');
const logger = require('../../../utils/logger');

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  query_timeout: 10000,
  statement_timeout: 10000,
  max: 10
});

/**
 * Service pour gérer les identités OAuth des utilisateurs
 */
class IdentitiesService {
  /**
   * Récupérer toutes les identités OAuth d'un utilisateur
   */
  async getUserIdentities(userId) {
    try {
      const query = `
        SELECT 
          id,
          user_id,
          provider,
          provider_user_id,
          provider_email,
          provider_name,
          provider_avatar,
          is_active,
          created_at,
          updated_at
        FROM user_oauth_identities 
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      
      logger.info(`Retrieved ${result.rows.length} OAuth identities for user: ${userId}`);
      
      return {
        success: true,
        data: result.rows.map(identity => ({
          id: identity.id,
          provider: identity.provider,
          providerUserId: identity.provider_user_id,
          providerEmail: identity.provider_email,
          providerName: identity.provider_name,
          providerAvatar: identity.provider_avatar,
          isActive: identity.is_active,
          createdAt: identity.created_at,
          updatedAt: identity.updated_at
        }))
      };
    } catch (error) {
      logger.error('Error getting user OAuth identities:', error);
      return {
        success: false,
        error: 'Failed to retrieve OAuth identities'
      };
    }
  }

  /**
   * Détacher une identité OAuth d'un utilisateur
   */
  async unlinkIdentity(userId, provider, operatorId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Vérifier si l'identité existe et appartient à l'utilisateur
      const checkQuery = `
        SELECT id FROM user_oauth_identities 
        WHERE user_id = $1 AND provider = $2 AND is_active = true
      `;
      
      const checkResult = await client.query(checkQuery, [userId, provider]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'OAuth identity not found or already unlinked'
        };
      }
      
      const identityId = checkResult.rows[0].id;
      
      // Désactiver l'identité OAuth (soft delete)
      const unlinkQuery = `
        UPDATE user_oauth_identities 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
      `;
      
      await client.query(unlinkQuery, [identityId, userId]);
      
      // Logger l'action
      const logQuery = `
        INSERT INTO user_oauth_logs (user_id, identity_id, operator_id, action, created_at)
        VALUES ($1, $2, $3, 'unlink', CURRENT_TIMESTAMP)
      `;
      
      await client.query(logQuery, [userId, identityId, operatorId]);
      
      await client.query('COMMIT');
      
      logger.info(`Successfully unlinked OAuth identity: provider=${provider}, userId=${userId}, operatorId=${operatorId}`);
      
      return {
        success: true,
        message: 'OAuth identity successfully unlinked'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error unlinking OAuth identity:', error);
      return {
        success: false,
        error: 'Failed to unlink OAuth identity'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Lier une nouvelle identité OAuth à un utilisateur
   */
  async linkIdentity(userId, provider, providerData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Vérifier si l'identité n'existe pas déjà
      const checkQuery = `
        SELECT id FROM user_oauth_identities 
        WHERE user_id = $1 AND provider = $2 AND provider_user_id = $3
      `;
      
      const checkResult = await client.query(checkQuery, [
        userId, 
        provider, 
        providerData.providerUserId
      ]);
      
      if (checkResult.rows.length > 0) {
        // Réactiver si elle existe mais est désactivée
        const reactivateQuery = `
          UPDATE user_oauth_identities 
          SET is_active = true, 
              provider_email = $4,
              provider_name = $5,
              provider_avatar = $6,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
        `;
        
        await client.query(reactivateQuery, [
          providerData.providerEmail,
          providerData.providerName,
          providerData.providerAvatar,
          checkResult.rows[0].id
        ]);
      } else {
        // Créer une nouvelle identité
        const insertQuery = `
          INSERT INTO user_oauth_identities (
            user_id, provider, provider_user_id, provider_email, 
            provider_name, provider_avatar, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        
        await client.query(insertQuery, [
          userId,
          provider,
          providerData.providerUserId,
          providerData.providerEmail,
          providerData.providerName,
          providerData.providerAvatar
        ]);
      }
      
      await client.query('COMMIT');
      
      logger.info(`Successfully linked OAuth identity: provider=${provider}, userId=${userId}`);
      
      return {
        success: true,
        message: 'OAuth identity successfully linked'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error linking OAuth identity:', error);
      return {
        success: false,
        error: 'Failed to link OAuth identity'
      };
    } finally {
      client.release();
    }
  }
}

module.exports = new IdentitiesService();
