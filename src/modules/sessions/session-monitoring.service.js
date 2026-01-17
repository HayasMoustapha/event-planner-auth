const sessionRepository = require('./sessions.repository');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Service de monitoring des sessions utilisateur
 * Fournit des statistiques et informations sur les sessions actives
 */
class SessionMonitoringService {
  /**
   * Récupère les statistiques des sessions
   * @returns {Promise<Object>} Statistiques des sessions
   */
  async getSessionStats() {
    try {
      const stats = await sessionRepository.getSessionStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de sessions', { error: error.message });
      return {
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      };
    }
  }

  /**
   * Récupère les sessions actives avec pagination
   * @param {Object} options - Options de pagination et filtrage
   * @returns {Promise<Object>} Sessions actives
   */
  async getActiveSessions(options = {}) {
    try {
      const { page = 1, limit = 20, userId, status = 'active' } = options;
      
      const sessions = await sessionRepository.getActiveSessions({
        page,
        limit,
        userId,
        status
      });

      return {
        success: true,
        data: sessions
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des sessions actives', { error: error.message });
      return {
        success: false,
        message: 'Erreur lors de la récupération des sessions',
        error: error.message
      };
    }
  }

  /**
   * Récupère les sessions d'un utilisateur spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Sessions de l'utilisateur
   */
  async getUserSessions(userId, options = {}) {
    try {
      const { page = 1, limit = 10, includeExpired = false } = options;
      
      const sessions = await sessionRepository.getUserSessions(userId, {
        page,
        limit,
        includeExpired
      });

      return {
        success: true,
        data: sessions
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des sessions utilisateur', { 
        error: error.message, 
        userId 
      });
      return {
        success: false,
        message: 'Erreur lors de la récupération des sessions utilisateur',
        error: error.message
      };
    }
  }

  /**
   * Récupère les tokens blacklistés
   * @param {Object} options - Options de pagination et filtrage
   * @returns {Promise<Object>} Tokens blacklistés
   */
  async getBlacklistedTokens(options = {}) {
    try {
      const { page = 1, limit = 20, userId, reason } = options;
      
      const tokens = await sessionRepository.getBlacklistedTokens({
        page,
        limit,
        userId,
        reason
      });

      return {
        success: true,
        data: tokens
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des tokens blacklistés', { error: error.message });
      return {
        success: false,
        message: 'Erreur lors de la récupération des tokens blacklistés',
        error: error.message
      };
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
      const result = await sessionRepository.revokeAllUserSessions(userId, revokedBy, reason);
      
      logger.info('Toutes les sessions utilisateur révoquées', { 
        userId, 
        revokedBy, 
        reason,
        revokedCount: result.revokedCount 
      });

      return {
        success: true,
        message: `${result.revokedCount} session(s) révoquée(s) avec succès`,
        data: result
      };
    } catch (error) {
      logger.error('Erreur lors de la révocation des sessions utilisateur', { 
        error: error.message, 
        userId 
      });
      return {
        success: false,
        message: 'Erreur lors de la révocation des sessions utilisateur',
        error: error.message
      };
    }
  }

  /**
   * Nettoie les sessions expirées
   * @param {Object} options - Options de nettoyage
   * @returns {Promise<Object>} Résultat du nettoyage
   */
  async cleanupExpiredSessions(options = {}) {
    try {
      const { olderThan = 7 } = options; // jours
      
      const result = await sessionRepository.cleanupExpiredSessions(olderThan);
      
      logger.info('Nettoyage des sessions expirées', { 
        olderThan,
        deletedCount: result.deletedCount 
      });

      return {
        success: true,
        message: `${result.deletedCount} session(s) expirée(s) supprimée(s)`,
        data: result
      };
    } catch (error) {
      logger.error('Erreur lors du nettoyage des sessions expirées', { error: error.message });
      return {
        success: false,
        message: 'Erreur lors du nettoyage des sessions expirées',
        error: error.message
      };
    }
  }

  /**
   * Vérifie les limites de sessions par utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} limits - Limites à vérifier
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkSessionLimits(userId, limits = {}) {
    try {
      const { maxActiveSessions = 5, maxTotalSessions = 20 } = limits;
      
      const stats = await sessionRepository.getUserSessionStats(userId);
      
      const isOverLimit = {
        active: stats.activeSessions >= maxActiveSessions,
        total: stats.totalSessions >= maxTotalSessions
      };

      return {
        success: true,
        data: {
          userId,
          stats,
          limits: { maxActiveSessions, maxTotalSessions },
          isOverLimit,
          canCreateNewSession: !isOverLimit.active && !isOverLimit.total
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la vérification des limites de sessions', { 
        error: error.message, 
        userId 
      });
      return {
        success: false,
        message: 'Erreur lors de la vérification des limites de sessions',
        error: error.message
      };
    }
  }

  /**
   * Récupère les sessions suspectes (anomalies)
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Object>} Sessions suspectes
   */
  async getSuspiciousSessions(options = {}) {
    try {
      const { hours = 24, maxSessionsPerUser = 10 } = options;
      
      const suspiciousSessions = await sessionRepository.getSuspiciousSessions({
        hours,
        maxSessionsPerUser
      });

      return {
        success: true,
        data: suspiciousSessions
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des sessions suspectes', { error: error.message });
      return {
        success: false,
        message: 'Erreur lors de la récupération des sessions suspectes',
        error: error.message
      };
    }
  }
}

module.exports = new SessionMonitoringService();
