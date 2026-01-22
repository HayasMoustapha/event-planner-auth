const logger = require('../utils/logger');

/**
 * Middleware de monitoring et d'alertes pour les erreurs critiques
 * Tableau de bord des erreurs en temps réel
 */
class ErrorMonitor {
  constructor() {
    this.errorCounts = new Map();
    this.criticalErrors = [];
    this.alertThreshold = 10; // Seuil d'alerte
    this.lastCleanup = Date.now();
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Enregistre une erreur
   */
  recordError(error, req, severity = 'medium') {
    const errorKey = `${error.code || 'UNKNOWN'}_${Date.now()}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    
    const errorData = {
      timestamp: new Date().toISOString(),
      code: error.code || 'UNKNOWN',
      message: error.message,
      severity,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      userId: req.user?.id || null
    };

    // Ajouter aux erreurs critiques si nécessaire
    if (severity === 'critical') {
      this.criticalErrors.push(errorData);
    }

    // Logger l'erreur
    logger.error('Application error', {
      ...errorData,
      errorCount: currentCount
    });

    // Vérifier si une alerte est nécessaire
    if (currentCount >= this.alertThreshold) {
      this.sendAlert(errorData);
    }

    // Nettoyage périodique
    this.cleanup();
  }

  /**
   * Envoie une alerte (simulée ici)
   */
  sendAlert(errorData) {
    logger.error('🚨 CRITICAL ERROR ALERT', {
      ...errorData,
      alertThreshold: this.alertThreshold,
      criticalErrorsCount: this.criticalErrors.length
    });
    
    // Nettoyer les anciennes alertes
    this.criticalErrors = [];
  }

  /**
   * Nettoie les anciennes erreurs
   */
  cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.lastCleanup = now;
      
      // Nettoyer les erreurs de plus de 24h
      const cutoff = now - (24 * 60 * 60 * 1000);
      this.criticalErrors = this.criticalErrors.filter(err => 
        new Date(err.timestamp) > cutoff
      );
      
      // Nettoyer les comptes d'erreurs
      for (const [key, count] of this.errorCounts.entries()) {
        if (now - new Date(key.split('_')[1]) > (24 * 60 * 60 * 1000)) {
          this.errorCounts.delete(key);
        }
      }
    }
  }

  /**
   * Obtient les métriques
   */
  getMetrics() {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const criticalCount = this.criticalErrors.length;
    
    return {
      totalErrors,
      criticalCount,
      uniqueErrorTypes: new Set(this.errorCounts.keys()).size,
      errorCounts: Object.fromEntries(this.errorCounts),
      lastCleanup: this.lastCleanup
    };
  }
}

const errorMonitoring = (req, res, next) => {
  // Créer une instance du moniteur
  const monitor = new ErrorMonitor();
  
  // Remplacer les méthodes de logger pour utiliser le moniteur
  const originalError = logger.error;
  const originalWarn = logger.warn;
  
  logger.error = (...args) => {
    const error = args[0];
    if (error instanceof Error) {
      monitor.recordError(error, req, 'critical');
    } else {
      monitor.recordError(new Error(error), req, 'medium');
    }
  };
  
  logger.warn = (...args) => {
    const warning = args[0];
    monitor.recordError(new Error(warning), req, 'medium');
  };

  // Intercepter les erreurs non catchées
  const originalHandler = req.app.get('errorHandler') || ((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  });

  req.app.set('errorHandler', (err, req, res, next) => {
    originalHandler(err, req, res, next);
    monitor.recordError(err, req, 'critical');
  });

  next();
};

module.exports = {
  ErrorMonitor,
  errorMonitoring,
  getMetrics: () => new ErrorMonitor().getMetrics()
};
