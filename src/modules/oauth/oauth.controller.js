const { validationResult } = require('express-validator');
const oauthService = require('./oauth.service');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Controller HTTP pour l'authentification OAuth
 * Gère les requêtes Google Sign-In et Apple Sign-In
 */
class OAuthController {
  /**
   * Authentifie un utilisateur avec Google Sign-In
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async loginWithGoogle(req, res, next) {
    try {
      // Validation des entrées
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Données invalides',
          { errors: errors.array() }
        ));
      }

      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json(createResponse(
          false,
          'Token Google requis',
          { code: 'GOOGLE_TOKEN_REQUIRED' }
        ));
      }

      // Options supplémentaires depuis la requête
      const options = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Authentifier via OAuth
      const result = await oauthService.authenticateWithOAuth('google', idToken, options);

      res.status(200).json(createResponse(
        true,
        result.message,
        result.data
      ));

    } catch (error) {
      logger.error('Google OAuth login failed', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next(error);
    }
  }

  /**
   * Authentifie un utilisateur avec Apple Sign-In
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async loginWithApple(req, res, next) {
    try {
      // Validation des entrées
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Données invalides',
          { errors: errors.array() }
        ));
      }

      const { identityToken, user } = req.body;

      if (!identityToken) {
        return res.status(400).json(createResponse(
          false,
          'Token d\'identité Apple requis',
          { code: 'APPLE_IDENTITY_TOKEN_REQUIRED' }
        ));
      }

      // Options supplémentaires depuis la requête
      const options = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Préparer les données Apple
      const appleData = {
        identityToken,
        user // ID utilisateur Apple optionnel
      };

      // Authentifier via OAuth
      const result = await oauthService.authenticateWithOAuth('apple', appleData, options);

      res.status(200).json(createResponse(
        true,
        result.message,
        result.data
      ));

    } catch (error) {
      logger.error('Apple OAuth login failed', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next(error);
    }
  }

  /**
   * Lie un compte Google à un utilisateur existant
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async linkGoogle(req, res, next) {
    try {
      // Validation des entrées
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Données invalides',
          { errors: errors.array() }
        ));
      }

      const { idToken } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(createResponse(
          false,
          'Authentification requise',
          { code: 'AUTHENTICATION_REQUIRED' }
        ));
      }

      if (!idToken) {
        return res.status(400).json(createResponse(
          false,
          'Token Google requis',
          { code: 'GOOGLE_TOKEN_REQUIRED' }
        ));
      }

      // Lier le compte Google
      const result = await oauthService.linkOAuthToUser(userId, 'google', idToken);

      res.status(200).json(createResponse(
        true,
        result.message,
        result.data
      ));

    } catch (error) {
      logger.error('Google OAuth linking failed', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip
      });
      next(error);
    }
  }

  /**
   * Lie un compte Apple à un utilisateur existant
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async linkApple(req, res, next) {
    try {
      // Validation des entrées
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(createResponse(
          false,
          'Données invalides',
          { errors: errors.array() }
        ));
      }

      const { identityToken, user } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(createResponse(
          false,
          'Authentification requise',
          { code: 'AUTHENTICATION_REQUIRED' }
        ));
      }

      if (!identityToken) {
        return res.status(400).json(createResponse(
          false,
          'Token d\'identité Apple requis',
          { code: 'APPLE_IDENTITY_TOKEN_REQUIRED' }
        ));
      }

      // Préparer les données Apple
      const appleData = {
        identityToken,
        user // ID utilisateur Apple optionnel
      };

      // Lier le compte Apple
      const result = await oauthService.linkOAuthToUser(userId, 'apple', appleData);

      res.status(200).json(createResponse(
        true,
        result.message,
        result.data
      ));

    } catch (error) {
      logger.error('Apple OAuth linking failed', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip
      });
      next(error);
    }
  }

  /**
   * Vérifie la configuration OAuth
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkConfiguration(req, res, next) {
    try {
      const config = oauthService.checkConfiguration();

      res.status(200).json(createResponse(
        true,
        'Configuration OAuth récupérée',
        {
          configuration: config,
          timestamp: new Date().toISOString()
        }
      ));

    } catch (error) {
      logger.error('OAuth configuration check failed', {
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Récupère les identités OAuth d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getUserIdentities(req, res, next) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(createResponse(
          false,
          'Authentification requise',
          { code: 'AUTHENTICATION_REQUIRED' }
        ));
      }

      const identitiesService = require('../identities/identities.service');
      const identities = await identitiesService.getUserIdentities(userId);

      res.status(200).json(createResponse(
        true,
        'Identités OAuth récupérées',
        {
          identities,
          count: identities.length
        }
      ));

    } catch (error) {
      logger.error('Get user OAuth identities failed', {
        error: error.message,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * Détache une identité OAuth d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async unlinkIdentity(req, res, next) {
    try {
      const userId = req.user?.id;
      const { provider } = req.params;

      if (!userId) {
        return res.status(401).json(createResponse(
          false,
          'Authentification requise',
          { code: 'AUTHENTICATION_REQUIRED' }
        ));
      }

      if (!['google', 'apple'].includes(provider)) {
        return res.status(400).json(createResponse(
          false,
          'Fournisseur invalide',
          { code: 'INVALID_PROVIDER' }
        ));
      }

      const identitiesService = require('../identities/identities.service');
      const success = await identitiesService.unlinkIdentity(userId, provider, userId);

      if (success) {
        res.status(200).json(createResponse(
          true,
          `Identité ${provider} détachée avec succès`
        ));
      } else {
        res.status(400).json(createResponse(
          false,
          'Impossible de détacher cette identité',
          { code: 'UNLINK_FAILED' }
        ));
      }

    } catch (error) {
      logger.error('Unlink OAuth identity failed', {
        error: error.message,
        userId: req.user?.id,
        provider: req.params.provider
      });
      next(error);
    }
  }
}

module.exports = new OAuthController();
