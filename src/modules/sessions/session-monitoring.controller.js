const { validationResult } = require('express-validator');
const sessionMonitoringService = require('./session-monitoring.service');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Controller pour le monitoring des sessions
 * Gère les requêtes HTTP pour les statistiques et le monitoring des sessions
 */
class SessionMonitoringController {
  /**
   * Récupère les statistiques générales des sessions
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getSessionStats(req, res, next) {
    try {
      const result = await sessionMonitoringService.getSessionStats();
      
      res.status(200).json(createResponse(
        true,
        'Statistiques des sessions récupérées avec succès',
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les sessions actives avec pagination
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getActiveSessions(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Paramètres de requête invalides',
          { errors: errors.array() }
        ));
      }

      const { page, limit, userId, status } = req.query;
      
      const result = await sessionMonitoringService.getActiveSessions({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        userId: userId ? parseInt(userId) : undefined,
        status
      });

      res.status(200).json(createResponse(
        true,
        'Sessions actives récupérées avec succès',
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les sessions d'un utilisateur spécifique
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getUserSessions(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Paramètres de requête invalides',
          { errors: errors.array() }
        ));
      }

      const { userId } = req.params;
      const { page, limit, includeExpired } = req.query;
      
      const result = await sessionMonitoringService.getUserSessions(parseInt(userId), {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        includeExpired: includeExpired === 'true'
      });

      res.status(200).json(createResponse(
        true,
        'Sessions utilisateur récupérées avec succès',
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les tokens blacklistés
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getBlacklistedTokens(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Paramètres de requête invalides',
          { errors: errors.array() }
        ));
      }

      const { page, limit, userId, reason } = req.query;
      
      const result = await sessionMonitoringService.getBlacklistedTokens({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        userId: userId ? parseInt(userId) : undefined,
        reason
      });

      res.status(200).json(createResponse(
        true,
        'Tokens blacklistés récupérés avec succès',
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Révoque toutes les sessions d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async revokeAllUserSessions(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Paramètres de requête invalides',
          { errors: errors.array() }
        ));
      }

      const { userId } = req.params;
      const { reason, revokedBy } = req.body;
      
      const result = await sessionMonitoringService.revokeAllUserSessions(
        parseInt(userId),
        revokedBy ? parseInt(revokedBy) : null,
        reason || 'admin_action'
      );

      res.status(200).json(createResponse(
        true,
        result.message,
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Nettoie les sessions expirées
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async cleanupExpiredSessions(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Paramètres de requête invalides',
          { errors: errors.array() }
        ));
      }

      const { olderThan } = req.body;
      
      const result = await sessionMonitoringService.cleanupExpiredSessions(
        olderThan ? parseInt(olderThan) : 7
      );

      res.status(200).json(createResponse(
        true,
        result.message,
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie les limites de sessions d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkSessionLimits(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Paramètres de requête invalides',
          { errors: errors.array() }
        ));
      }

      const { userId } = req.params;
      const { maxActiveSessions, maxTotalSessions } = req.query;
      
      const result = await sessionMonitoringService.checkSessionLimits(
        parseInt(userId),
        {
          maxActiveSessions: maxActiveSessions ? parseInt(maxActiveSessions) : 5,
          maxTotalSessions: maxTotalSessions ? parseInt(maxTotalSessions) : 20
        }
      );

      res.status(200).json(createResponse(
        true,
        'Limites de sessions vérifiées avec succès',
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les sessions suspectes
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getSuspiciousSessions(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Paramètres de requête invalides',
          { errors: errors.array() }
        ));
      }

      const { hours, maxSessionsPerUser } = req.query;
      
      const result = await sessionMonitoringService.getSuspiciousSessions({
        hours: hours ? parseInt(hours) : 24,
        maxSessionsPerUser: maxSessionsPerUser ? parseInt(maxSessionsPerUser) : 10
      });

      res.status(200).json(createResponse(
        true,
        'Sessions suspectes récupérées avec succès',
        result.data
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionMonitoringController();
