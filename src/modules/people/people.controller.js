const peopleService = require('./people.service');
const { createResponse } = require('../../utils/response');

/**
 * Controller HTTP pour la gestion des personnes
 * Gère les requêtes et réponses HTTP avec validation et gestion d'erreurs
 */
class PeopleController {
  /**
   * Récupère toutes les personnes avec pagination et filtres
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status
      };

      const result = await peopleService.getAll(options);

      res.status(200).json(createResponse(
        true,
        'Personnes récupérées avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère une personne par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const person = await peopleService.getById(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Personne récupérée avec succès',
        person
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère une personne par son email
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getByEmail(req, res, next) {
    try {
      const { email } = req.params;

      const person = await peopleService.getByEmail(email);

      res.status(200).json(createResponse(
        true,
        'Personne récupérée avec succès',
        person
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère une personne par son téléphone
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getByPhone(req, res, next) {
    try {
      const { phone } = req.params;

      const person = await peopleService.getByPhone(phone);

      res.status(200).json(createResponse(
        true,
        'Personne récupérée avec succès',
        person
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée une nouvelle personne
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async create(req, res, next) {
    try {
      const personData = {
        ...req.body,
        first_name: req.body.first_name || req.body.firstName,
        last_name: req.body.last_name || req.body.lastName
      };

      // Récupérer l'ID de l'utilisateur authentifié si disponible
      const createdBy = req.user?.id || null;

      const person = await peopleService.create(personData, createdBy);

      res.status(201).json(createResponse(
        true,
        'Personne créée avec succès',
        person
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour une personne
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        first_name: req.body.first_name || req.body.firstName,
        last_name: req.body.last_name || req.body.lastName
      };

      // Récupérer l'ID de l'utilisateur authentifié si disponible
      const updatedBy = req.user?.id || null;

      const person = await peopleService.update(parseInt(id), updateData, updatedBy);

      res.status(200).json(createResponse(
        true,
        'Personne mise à jour avec succès',
        person
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime logiquement une personne
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Récupérer l'ID de l'utilisateur authentifié si disponible
      const deletedBy = req.user?.id || null;

      const success = await peopleService.delete(parseInt(id), deletedBy);

      if (success) {
        res.status(200).json(createResponse(
          true,
          'Personne supprimée avec succès'
        ));
      } else {
        res.status(400).json(createResponse(
          false,
          'Échec de la suppression de la personne'
        ));
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Active ou désactive une personne
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Récupérer l'ID de l'utilisateur authentifié si disponible
      const updatedBy = req.user?.id || null;

      const person = await peopleService.updateStatus(parseInt(id), status, updatedBy);

      res.status(200).json(createResponse(
        true,
        `Personne ${status === 'active' ? 'activée' : 'désactivée'} avec succès`,
        person
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recherche des personnes par critères multiples
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async search(req, res, next) {
    try {
      const criteria = req.query;

      const result = await peopleService.search(criteria);

      res.status(200).json(createResponse(
        true,
        'Résultats de la recherche',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les statistiques sur les personnes
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getStats(req, res, next) {
    try {
      const stats = await peopleService.getStats();

      res.status(200).json(createResponse(
        true,
        'Statistiques récupérées avec succès',
        stats
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si une personne existe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async exists(req, res, next) {
    try {
      const { id } = req.params;

      const exists = await peopleService.exists(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Vérification effectuée',
        { exists }
      ));
    } catch (error) {
      next(error);
    }
  }

  // ===== NOUVELLES MÉTHODES POUR LES ROUTES MANQUANTES =====

  /**
   * Récupère les personnes actives
   */
  async getActivePeople(req, res, next) {
    try {
      const peopleService = require('./people.service');
      const activePeople = await peopleService.getActivePeople();

      res.status(200).json(createResponse(
        true,
        'Personnes actives récupérées avec succès',
        { people: activePeople, count: activePeople.length }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour le statut d'une personne
   */
  async updatePersonStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const peopleService = require('./people.service');
      
      const updatedPerson = await peopleService.updateStatus(parseInt(id), status);

      res.status(200).json(createResponse(
        true,
        'Statut de personne mis à jour avec succès',
        updatedPerson
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si une personne existe (alias pour exists)
   */
  async checkPersonExists(req, res, next) {
    try {
      const { id } = req.params;
      const peopleService = require('./people.service');
      const exists = await peopleService.exists(parseInt(id));

      res.status(200).json(createResponse(
        true,
        'Vérification d\'existence de personne effectuée',
        { personId: parseInt(id), exists }
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PeopleController();
