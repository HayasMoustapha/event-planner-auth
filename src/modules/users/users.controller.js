const usersService = require('./users.service');
const { createResponse } = require('../../utils/response');

/**
 * Controller HTTP pour la gestion des utilisateurs
 * Gère les requêtes et réponses HTTP avec validation et gestion d'erreurs
 */
class UsersController {
  /**
   * Récupère tous les utilisateurs avec pagination et filtres
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search, status, role } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        role
      };

      const result = await usersService.getAll(options);
      
      res.status(200).json(createResponse(
        true,
        'Utilisateurs récupérés avec succès',
        result
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère un utilisateur par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await usersService.getById(parseInt(id));
      
      // Retirer le mot de passe s'il est présent
      if (user.password) {
        delete user.password;
      }
      
      res.status(200).json(createResponse(
        true,
        'Utilisateur récupéré avec succès',
        user
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère un utilisateur par son email
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getByEmail(req, res, next) {
    try {
      const { email } = req.params;
      
      const user = await usersService.getByEmail(email);
      
      // Retirer le mot de passe s'il est présent
      if (user.password) {
        delete user.password;
      }
      
      res.status(200).json(createResponse(
        true,
        'Utilisateur récupéré avec succès',
        user
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère un utilisateur par son username
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getByUsername(req, res, next) {
    try {
      const { username } = req.params;
      
      const user = await usersService.getByUsername(username);
      
      // Retirer le mot de passe s'il est présent
      if (user.password) {
        delete user.password;
      }
      
      res.status(200).json(createResponse(
        true,
        'Utilisateur récupéré avec succès',
        user
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée un nouvel utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async create(req, res, next) {
    try {
      let userData = req.body;
      
      // Convertir user_code en userCode pour le service
      if (userData.user_code && !userData.userCode) {
        userData.userCode = userData.user_code;
        delete userData.user_code;
      }
      
      // Récupérer l'ID de l'utilisateur authentifié si disponible
      const createdBy = req.user?.id || null;
      
      const user = await usersService.create(userData, createdBy);
      
      // Retirer le mot de passe de la réponse
      if (user.password) {
        delete user.password;
      }
      
      res.status(201).json(createResponse(
        true,
        'Utilisateur créé avec succès',
        user
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      
      // Utiliser req.body directement avec validation simple
      const updateData = req.body;
      
      // Debug: afficher les données reçues
      console.log('🔍 Debug update - req.body:', req.body);
      
      // Vérifier qu'il y a des données à mettre à jour
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json(createResponse(
          false,
          'Aucune donnée à mettre à jour'
        ));
      }
      
      // Valider manuellement les champs autorisés
      const allowedFields = ['username', 'email', 'password', 'firstName', 'lastName', 'phone', 'status', 'personId', 'person_id'];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(400).json(createResponse(
          false,
          `Champs non autorisés: ${invalidFields.join(', ')}`
        ));
      }
      
      // Récupérer l'ID de l'utilisateur authentifié si disponible
      const updatedBy = req.user?.id || null;
      
      const user = await usersService.update(parseInt(id), updateData, updatedBy);
      
      // Retirer le mot de passe de la réponse
      if (user.password) {
        delete user.password;
      }
      
      res.status(200).json(createResponse(
        true,
        'Utilisateur mis à jour avec succès',
        user
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime logiquement un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      // Récupérer l'ID de l'utilisateur authentifié si disponible
      const deletedBy = req.user?.id || null;
      
      const success = await usersService.delete(parseInt(id), deletedBy);
      
      if (success) {
        res.status(200).json(createResponse(
          true,
          'Utilisateur supprimé avec succès'
        ));
      } else {
        res.status(400).json(createResponse(
          false,
          'Échec de la suppression de l\'utilisateur'
        ));
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async updatePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      
      // Récupérer l'ID de l'utilisateur authentifié si disponible
      const updatedBy = req.user?.id || null;
      
      const user = await usersService.updatePassword(parseInt(id), currentPassword, newPassword, updatedBy);
      
      // Retirer le mot de passe de la réponse
      if (user.password) {
        delete user.password;
      }
      
      res.status(200).json(createResponse(
        true,
        'Mot de passe mis à jour avec succès',
        user
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authentifie un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async authenticate(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const user = await usersService.authenticate(email, password);
      
      // Retirer le mot de passe de la réponse
      if (user.password) {
        delete user.password;
      }
      
      res.status(200).json(createResponse(
        true,
        'Authentification réussie',
        user
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Active ou désactive un utilisateur
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
      
      const user = await usersService.updateStatus(parseInt(id), status, updatedBy);
      
      // Retirer le mot de passe de la réponse
      if (user.password) {
        delete user.password;
      }
      
      res.status(200).json(createResponse(
        true,
        `Utilisateur ${status === 'active' ? 'activé' : status === 'inactive' ? 'désactivé' : 'verrouillé'} avec succès`,
        user
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recherche des utilisateurs par critères multiples
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async search(req, res, next) {
    try {
      const criteria = req.query;
      
      const result = await usersService.search(criteria);
      
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
   * Récupère les statistiques sur les utilisateurs
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async getStats(req, res, next) {
    try {
      const stats = await usersService.getStats();
      
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
   * Vérifie si un utilisateur existe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async exists(req, res, next) {
    try {
      const { id } = req.params;
      
      const exists = await usersService.exists(parseInt(id));
      
      res.status(200).json(createResponse(
        true,
        'Vérification effectuée',
        { exists }
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async resetPassword(req, res, next) {
    try {
      const { email, newPassword } = req.body;
      
      // Récupérer l'ID de l'utilisateur authentifié si disponible
      const updatedBy = req.user?.id || null;
      
      const user = await usersService.resetPassword(email, newPassword, updatedBy);
      
      // Retirer le mot de passe de la réponse
      if (user.password) {
        delete user.password;
      }
      
      res.status(200).json(createResponse(
        true,
        'Mot de passe réinitialisé avec succès',
        user
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un username est disponible
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkUsernameAvailability(req, res, next) {
    try {
      const { username } = req.params;
      
      // Validation du format du username
      if (username.length < 3 || username.length > 50) {
        return res.status(400).json(createResponse(
          false,
          'Le username doit contenir entre 3 et 50 caractères'
        ));
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json(createResponse(
          false,
          'Le username ne peut contenir que des lettres, chiffres et underscores'
        ));
      }
      
      try {
        await usersService.getByUsername(username);
        // Si on arrive ici, le username existe
        res.status(200).json(createResponse(
          true,
          'Vérification effectuée',
          { available: false }
        ));
      } catch (error) {
        // Si l'erreur est "Utilisateur non trouvé", le username est disponible
        if (error.message.includes('non trouvé')) {
          res.status(200).json(createResponse(
            true,
            'Vérification effectuée',
            { available: true }
          ));
        } else {
          throw error;
        }
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si un email est disponible
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Middleware suivant
   */
  async checkEmailAvailability(req, res, next) {
    try {
      const { email } = req.params;
      
      // Validation du format de l'email
      const { validateEmail } = require('../../utils/validators');
      if (!validateEmail(email)) {
        return res.status(400).json(createResponse(
          false,
          'Format d\'email invalide'
        ));
      }
      
      try {
        await usersService.getByEmail(email);
        // Si on arrive ici, l'email existe
        res.status(200).json(createResponse(
          true,
          'Vérification effectuée',
          { available: false }
        ));
      } catch (error) {
        // Si l'erreur est "Utilisateur non trouvé", l'email est disponible
        if (error.message.includes('non trouvé')) {
          res.status(200).json(createResponse(
            true,
            'Vérification effectuée',
            { available: true }
          ));
        } else {
          throw error;
        }
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsersController();
