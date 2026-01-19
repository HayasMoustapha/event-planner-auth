const { createResponse } = require('../../utils/response');

/**
 * Gestionnaire d'erreurs pour le module accesses
 * Gère les erreurs spécifiques aux accès utilisateur-rôle
 */

/**
 * Gestionnaire d'erreurs principal
 * @param {Error} error - Erreur à gérer
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const accessesErrorHandler = (error, req, res, next) => {
  console.error(`[Accesses Error] ${error.message}`, {
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    stack: error.stack
  });

  // Erreurs de validation
  if (error.message.includes('invalide')) {
    if (error.message.includes('ID d\'utilisateur')) {
      return res.status(400).json(createResponse(
        false,
        'ID d\'utilisateur invalide',
        null,
        'INVALID_USER_ID'
      ));
    }

    if (error.message.includes('ID de rôle')) {
      return res.status(400).json(createResponse(
        false,
        'ID de rôle invalide',
        null,
        'INVALID_ROLE_ID'
      ));
    }

    if (error.message.includes('ID d\'accès')) {
      return res.status(400).json(createResponse(
        false,
        'ID d\'accès invalide',
        null,
        'INVALID_ACCESS_ID'
      ));
    }

    if (error.message.includes('Statut invalide')) {
      return res.status(400).json(createResponse(
        false,
        'Statut invalide. Valeurs autorisées: active, inactive, lock',
        null,
        'INVALID_STATUS'
      ));
    }

    if (error.message.includes('tableau non vide')) {
      return res.status(400).json(createResponse(
        false,
        'La liste des rôles doit être un tableau non vide',
        null,
        'EMPTY_ROLE_ARRAY'
      ));
    }

    return res.status(400).json(createResponse(
      false,
      'Données invalides',
      { details: error.message },
      'VALIDATION_ERROR'
    ));
  }

  // Erreurs de non-existence
  if (error.message.includes('n\'existe pas') || error.message.includes('non trouvé')) {
    if (error.message.includes('utilisateur')) {
      return res.status(404).json(createResponse(
        false,
        'L\'utilisateur spécifié n\'existe pas',
        null,
        'USER_NOT_FOUND'
      ));
    }

    if (error.message.includes('rôle')) {
      return res.status(404).json(createResponse(
        false,
        'Le rôle spécifié n\'existe pas',
        null,
        'ROLE_NOT_FOUND'
      ));
    }

    if (error.message.includes('Accès')) {
      return res.status(404).json(createResponse(
        false,
        'Accès non trouvé',
        null,
        'ACCESS_NOT_FOUND'
      ));
    }

    return res.status(404).json(createResponse(
      false,
      'Ressource non trouvée',
      { details: error.message },
      'RESOURCE_NOT_FOUND'
    ));
  }

  // Erreurs de conflit/doublons
  if (error.message.includes('déjà') || error.message.includes('already')) {
    if (error.message.includes('rôle')) {
      return res.status(409).json(createResponse(
        false,
        'Cet utilisateur a déjà ce rôle',
        null,
        'ROLE_ALREADY_ASSIGNED'
      ));
    }

    return res.status(409).json(createResponse(
      false,
      'Conflit de données',
      { details: error.message },
      'CONFLICT'
    ));
  }

  // Erreurs de système
  if (error.message.includes('Erreur lors de')) {
    return res.status(500).json(createResponse(
      false,
      'Erreur interne du serveur',
      { details: 'Une erreur est survenue lors du traitement de votre demande' },
      'INTERNAL_ERROR'
    ));
  }

  // Erreurs de permission
  if (error.message.includes('autorisé') || error.message.includes('permission')) {
    return res.status(403).json(createResponse(
      false,
      'Accès refusé',
      { details: error.message },
      'FORBIDDEN'
    ));
  }

  // Erreur par défaut
  res.status(500).json(createResponse(
    false,
    'Erreur interne du serveur',
    { details: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur inattendue est survenue' },
    'INTERNAL_SERVER_ERROR'
  ));
};

/**
 * Gestionnaire d'erreurs asynchrone
 * @param {Error} error - Erreur à gérer
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
const asyncAccessesErrorHandler = (error, req, res, next) => {
  if (!error) {
    return next();
  }

  // Si l'erreur n'est pas une instance d'Error, la convertir
  if (!(error instanceof Error)) {
    error = new Error(String(error));
  }

  accessesErrorHandler(error, req, res, next);
};

module.exports = {
  accessesErrorHandler,
  asyncAccessesErrorHandler
};
