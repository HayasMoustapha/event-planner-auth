const usersService = require('./users.service');
const { successResponse, errorResponse } = require('../../utils/response');

class UsersController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const result = await usersService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status
      });
      res.json(successResponse('Liste des utilisateurs', result));
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await usersService.getById(req.params.id);
      res.json(successResponse('Détails de l\'utilisateur', user));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const user = await usersService.create(req.body, req.user.id);
      res.status(201).json(successResponse('Utilisateur créé avec succès', user));
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await usersService.update(req.params.id, req.body);
      res.json(successResponse('Utilisateur mis à jour avec succès', user));
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await usersService.delete(req.params.id);
      res.json(successResponse('Utilisateur supprimé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  async getUserRoles(req, res, next) {
    try {
      const roles = await usersService.getUserRoles(req.params.id);
      res.json(successResponse('Rôles de l\'utilisateur', roles));
    } catch (error) {
      next(error);
    }
  }

  async assignRole(req, res, next) {
    try {
      const { roleId } = req.body;
      await usersService.assignRole(req.params.id, roleId, req.user.id);
      res.json(successResponse('Rôle assigné avec succès'));
    } catch (error) {
      next(error);
    }
  }

  async removeRole(req, res, next) {
    try {
      await usersService.removeRole(req.params.id, req.params.roleId);
      res.json(successResponse('Rôle retiré avec succès'));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { isActive, isVerified } = req.body;
      const user = await usersService.updateStatus(req.params.id, { isActive, isVerified });
      res.json(successResponse('Statut mis à jour avec succès', user));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsersController();
