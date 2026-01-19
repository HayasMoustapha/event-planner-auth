const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware de validation pour express-validator
 * Vérifie les résultats de validation et renvoie une erreur si des erreurs sont trouvées
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    logger.warn('Validation failed', {
      url: req.url,
      method: req.method,
      errors: errorMessages
    });

    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Les données fournies sont invalides',
      details: errorMessages
    });
  }

  next();
};

module.exports = validate;
