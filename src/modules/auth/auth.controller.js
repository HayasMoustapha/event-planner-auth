const authService = require('./auth.service');
const { successResponse, errorResponse } = require('../../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(successResponse('Utilisateur créé avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body, req.ip, req.get('User-Agent'));
      res.json(successResponse('Connexion réussie', result));
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      res.json(successResponse('Token rafraîchi', result));
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id, req.body.refreshToken);
      res.json(successResponse('Déconnexion réussie'));
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      res.json(successResponse('Profil utilisateur', user));
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);
      res.json(successResponse('Profil mis à jour', user));
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      await authService.changePassword(req.user.id, req.body);
      res.json(successResponse('Mot de passe changé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      await authService.forgotPassword(req.body.email);
      res.json(successResponse('Email de réinitialisation envoyé'));
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      res.json(successResponse('Mot de passe réinitialisé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      await authService.verifyEmail(req.body.token);
      res.json(successResponse('Email vérifié avec succès'));
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req, res, next) {
    try {
      await authService.resendVerification(req.body.email);
      res.json(successResponse('Email de vérification renvoyé'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
