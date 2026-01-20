const { validationResult } = require('express-validator');
const passwordService = require('./password.service');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Controller HTTP pour la gestion des mots de passe
 */
class PasswordController {
  /**
   * Demande une réinitialisation de mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async requestPasswordReset(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Erreur de validation',
          { errors: errors.array() }
        ));
      }

      const { email } = req.body;
      
      const result = await passwordService.requestPasswordReset(email);
      
      res.status(200).json(createResponse(
        true,
        result.message,
        result
      ));
    } catch (error) {
      logger.error('Password reset request error', {
        error: error.message,
        body: req.body
      });
      next(error);
    }
  }

  /**
   * Réinitialise un mot de passe avec un token
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async resetPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Erreur de validation',
          { errors: errors.array() }
        ));
      }

      const { email, token, password } = req.body;
      
      const result = await passwordService.resetPassword(email, token, password);
      
      if (result.success) {
        res.status(200).json(createResponse(
          true,
          result.message
        ));
      } else {
        res.status(400).json(createResponse(
          false,
          result.message
        ));
      }
    } catch (error) {
      logger.error('Password reset error', {
        error: error.message,
        body: req.body
      });
      next(error);
    }
  }

  /**
   * Récupère l'historique des mots de passe d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getPasswordHistory(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createResponse(
          false,
          'Authentification requise'
        ));
      }

      const { page = 1, limit = 20 } = req.query;
      
      const result = await passwordService.getPasswordHistory(
        parseInt(userId), 
        { page: parseInt(page), limit: parseInt(limit) }
      );
      
      res.status(200).json(createResponse(
        true,
        'Historique récupéré avec succès',
        result
      ));
    } catch (error) {
      logger.error('Password history error', {
        error: error.message,
        userId: req.user?.id
      });
      next(error);
    }
  }
}

module.exports = new PasswordController();
