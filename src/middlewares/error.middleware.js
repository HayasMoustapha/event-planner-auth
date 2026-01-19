const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      message: err.message,
      details: err.details || []
    });
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Erreur d\'authentification',
      message: 'Token invalide'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Erreur d\'authentification',
      message: 'Token expiré'
    });
  }

  // Erreurs de base de données
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Conflit de données',
      message: 'Une entrée avec ces données existe déjà'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      error: 'Erreur de référence',
      message: 'Référence à une ligne inexistante'
    });
  }

  // Erreurs personnalisées
  if (err.message) {
    const statusCode = getStatusCodeFromError(err.message);
    return res.status(statusCode).json({
      error: getErrorTypeFromError(err.message),
      message: err.message
    });
  }

  // Erreur par défaut
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') ? err.message : 'Une erreur est survenue',
    ...((env.NODE_ENV === 'development' || env.NODE_ENV === 'test') && { stack: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
    availableRoutes: getAvailableRoutes(req.app)
  });
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Fonctions utilitaires
const getStatusCodeFromError = (message) => {
  const lowercaseMessage = message.toLowerCase();
  if (lowercaseMessage.includes('non trouvé') || lowercaseMessage.includes('not found')) return 404;
  if (lowercaseMessage.includes('déjà') || lowercaseMessage.includes('already') || lowercaseMessage.includes('existe déjà')) return 409;
  if (lowercaseMessage.includes('incorrect') || lowercaseMessage.includes('invalide') || lowercaseMessage.includes('invalid') || lowercaseMessage.includes('échec')) return 401;
  if (lowercaseMessage.includes('autorisé') || lowercaseMessage.includes('unauthorized') || lowercaseMessage.includes('non autorisé')) return 401;
  if (lowercaseMessage.includes('interdit') || lowercaseMessage.includes('forbidden') || lowercaseMessage.includes('accès refusé')) return 403;
  if (lowercaseMessage.includes('requis') || lowercaseMessage.includes('required') || lowercaseMessage.includes('manquant')) return 400;
  return 500;
};

const getErrorTypeFromError = (message) => {
  if (message.includes('non trouvé') || message.includes('not found')) return 'Ressource non trouvée';
  if (message.includes('déjà') || message.includes('already') || message.includes('existe déjà')) return 'Conflit';
  if (message.includes('autorisé') || message.includes('unauthorized') || message.includes('interdit')) return 'Accès refusé';
  if (message.includes('requis') || message.includes('required') || message.includes('manquant')) return 'Erreur de validation';
  return 'Erreur';
};

const getAvailableRoutes = (app) => {
  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes directes
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path
      });
    } else if (middleware.name === 'router') {
      // Routes depuis les routers
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: handler.route.path
          });
        }
      });
    }
  });

  return routes;
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
