const metricsService = require('../metrics/metrics.service');
const logger = require('../utils/logger');

/**
 * Middleware pour collecter les métriques HTTP
 * Enregistre les requêtes, temps de réponse et codes de statut
 */
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Intercepter la fin de la réponse
  const originalSend = res.send;
  res.send = function(data) {
    // Calculer la durée
    const duration = Date.now() - startTime;
    
    // Enregistrer les métriques
    metricsService.recordHttpRequest(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      !!req.user,
      duration
    );
    
    // Logger les requêtes lentes
    if (duration > 1000) {
      logger.performance('slow_request', duration, {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        userId: req.user?.id
      });
    }
    
    // Appeler la fonction send originale
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = metricsMiddleware;
