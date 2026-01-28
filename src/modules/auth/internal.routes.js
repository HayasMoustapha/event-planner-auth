const express = require('express');
const usersController = require('../users/users.controller'); // CORRECTION: Utiliser usersController
const { createResponse } = require('../../utils/response');

const router = express.Router();

/**
 * Routes internes pour la communication inter-services
 * Ces routes utilisent un token de service dédié au lieu des tokens utilisateur
 * SEULEMENT les routes de lecture sont autorisées pour respecter l'isolation des services
 */

// Middleware pour valider le token de service
const validateServiceToken = (req, res, next) => {
  const serviceToken = req.headers['x-service-token'];
  
  if (!serviceToken) {
    return res.status(401).json(createResponse(
      false,
      'Service token required for inter-service communication',
      { code: 'SERVICE_TOKEN_REQUIRED' }
    ));
  }
  
  const expectedToken = process.env.SHARED_SERVICE_TOKEN || 'shared-service-token-abcdef12345678901234567890';
  
  if (serviceToken !== expectedToken) {
    return res.status(401).json(createResponse(
      false,
      'Invalid service token',
      { code: 'INVALID_SERVICE_TOKEN' }
    ));
  }
  
  next();
};

// Appliquer le middleware de validation à toutes les routes internes
router.use(validateServiceToken);

/**
 * Routes internes LECTURE SEULEMENT pour la communication inter-services
 */

// Route pour récupérer les utilisateurs (utilisé par event-planner-core)
router.get('/users', usersController.getAll);

// Route pour récupérer un utilisateur par ID (utilisé par event-planner-core)
router.get('/users/:id', usersController.getById);

// Route pour récupérer un utilisateur par email (utilisé par event-planner-core)
router.get('/users/email/:email', usersController.getByEmail);

// Route pour récupérer un utilisateur par username (utilisé par event-planner-core)
router.get('/users/username/:username', usersController.getByUsername);

// Route pour rechercher des utilisateurs (utilisé par event-planner-core)
router.get('/users/search', usersController.search);

// Route pour récupérer les statistiques des utilisateurs (utilisé par event-planner-core)
router.get('/users/stats', usersController.getStats);

// Route pour vérifier l'existence d'un utilisateur (utilisé par event-planner-core)
router.get('/users/:id/exists', usersController.exists);

module.exports = router;
