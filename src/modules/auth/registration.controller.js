const registrationService = require('./registration.service');
const authService = require('./auth.service');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const { mapFields } = require('../../utils/field-mapper');

/**
 * Controller pour gérer les routes d'inscription
 * Gère l'inscription, la vérification OTP et l'authentification post-inscription
 */
class RegistrationController {
  /**
   * Inscrit un nouvel utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async register(req, res, next) {
    try {
      // Utiliser le mapper pour standardiser les champs
      const registrationData = mapFields(req.body);

      logger.info(`Tentative d'inscription: ${registrationData.email}`);

      const result = await registrationService.register(registrationData);

      res.status(201).json(createResponse(
        true,
        result.message,
        result.data,
        result.timestamp
      ));
    } catch (error) {
      logger.error(`Erreur inscription controller: ${error.message}`);
      next(error);
    }
  }

  /**
   * Vérifie l'email avec un code OTP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async verifyEmail(req, res, next) {
    try {
      const { email, otpCode, token, code: codeField } = req.body;
      const code = codeField || otpCode || token;

      logger.info(`Tentative de vérification email: ${email}`);

      const result = await registrationService.verifyEmail(email, code);

      res.status(200).json(createResponse(
        true,
        result.message,
        result.data,
        result.timestamp
      ));
    } catch (error) {
      logger.error(`Erreur vérification email controller: ${error.message}`);
      next(error);
    }
  }

  /**
   * Renvoie un code OTP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async resendOTP(req, res, next) {
    try {
      const { email } = req.body;

      logger.info(`Demande de renvoi OTP: ${email}`);

      const result = await registrationService.resendOTP(email);

      res.status(200).json(createResponse(
        true,
        result.message,
        result.data,
        result.timestamp
      ));
    } catch (error) {
      logger.error(`Erreur renvoi OTP controller: ${error.message}`);
      next(error);
    }
  }

  /**
   * Connecte un utilisateur après vérification de l'email
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async loginAfterVerification(req, res, next) {
    try {
      const { email, password } = req.body;

      logger.info(`Tentative de connexion post-vérification: ${email}`);

      // Utiliser le service d'authentification standard
      const result = await authService.authenticate(email, password);

      res.status(200).json(createResponse(
        true,
        result.message,
        result.data,
        result.timestamp
      ));
    } catch (error) {
      logger.error(`Erreur connexion post-vérification: ${error.message}`);
      next(error);
    }
  }

  /**
   * Vérifie la disponibilité d'un email
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkEmailAvailability(req, res, next) {
    try {
      const { email } = req.params;

      const exists = await authService.userExists(email);

      res.status(200).json(createResponse(
        true,
        'Disponibilité vérifiée',
        {
          email: email,
          available: !exists,
          message: exists ? 'Email déjà utilisé' : 'Email disponible'
        },
        new Date().toISOString()
      ));
    } catch (error) {
      logger.error(`Erreur vérification disponibilité email: ${error.message}`);
      next(error);
    }
  }

  /**
   * Vérifie la disponibilité d'un username
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkUsernameAvailability(req, res, next) {
    try {
      const { username } = req.params;

      const available = await authService.isUsernameAvailable(username);

      res.status(200).json(createResponse(
        true,
        'Disponibilité vérifiée',
        {
          username: username,
          available: available,
          message: available ? 'Username disponible' : 'Username déjà utilisé'
        },
        new Date().toISOString()
      ));
    } catch (error) {
      logger.error(`Erreur vérification disponibilité username: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new RegistrationController();
