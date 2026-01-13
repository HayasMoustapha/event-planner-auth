const peopleService = require('./people.service');
const { successResponse, errorResponse } = require('../../utils/response');

class PeopleController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const result = await peopleService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });
      res.json(successResponse('Liste des personnes', result));
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const person = await peopleService.getById(req.params.id);
      res.json(successResponse('Détails de la personne', person));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const person = await peopleService.create(req.body);
      res.status(201).json(successResponse('Personne créée avec succès', person));
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const person = await peopleService.update(req.params.id, req.body);
      res.json(successResponse('Personne mise à jour avec succès', person));
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await peopleService.delete(req.params.id);
      res.json(successResponse('Personne supprimée avec succès'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PeopleController();
