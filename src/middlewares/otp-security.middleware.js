const logger = require('../utils/logger');
const { getErrorMessage } = require('../utils/error-messages');

/**
 * Middleware de sécurité pour les opérations OTP
 * Protection contre les abus et les attaques sur les OTP
 */
class OtpSecurityMiddleware {
  constructor() {
    this.attempts = new Map(); // Stocke les tentatives par identifiant
    this.maxAttempts = 5; // Maximum 5 tentatives
    this.blockDuration = 15 * 60 * 1000; // 15 minutes de blocage
    this.cleanupInterval = 60 * 60 * 1000; // 1 heure de nettoyage
    this.lastCleanup = Date.now();
  }

  /**
   * Vérifie si un identifiant est bloqué
   */
  isBlocked(identifier) {
    const attempts = this.attempts.get(identifier);
    if (!attempts) return false;
    
    return attempts.blockedUntil && Date.now() < attempts.blockedUntil;
  }

  /**
   * Enregistre une tentative
   */
  recordAttempt(identifier) {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || { count: 0, firstAttempt: now };
    
    attempts.count++;
    attempts.lastAttempt = now;
    
    // Bloquer si le maximum est atteint
    if (attempts.count >= this.maxAttempts) {
      attempts.blockedUntil = now + this.blockDuration;
      logger.warn('OTP attempt limit exceeded', {
        identifier,
        attempts: attempts.count,
        blockedUntil: new Date(attempts.blockedUntil).toISOString()
      });
    }
    
    this.attempts.set(identifier, attempts);
    this.cleanup();
  }

  /**
   * Nettoie les anciennes tentatives
   */
  cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupInterval) {
      this.lastCleanup = now;
      
      for (const [identifier, attempts] of this.attempts.entries()) {
        // Supprimer les entrées de plus de 24h
        if (now - attempts.firstAttempt > 24 * 60 * 60 * 1000) {
          this.attempts.delete(identifier);
        }
        // Supprimer les blocages expirés
        else if (attempts.blockedUntil && now > attempts.blockedUntil) {
          attempts.blockedUntil = null;
          this.attempts.set(identifier, attempts);
        }
      }
    }
  }

  /**
   * Middleware pour la vérification OTP
   */
  verifyOtp() {
    return (req, res, next) => {
      try {
        const { otpCode, email, phone } = req.body;
        const identifier = email || phone;
        
        if (!identifier) {
          return res.status(400).json(getErrorMessage('INVALID_INPUT'));
        }

        // Vérifier si bloqué
        if (this.isBlocked(identifier)) {
          return res.status(429).json(getErrorMessage('RATE_LIMIT_EXCEEDED'));
        }

        // Valider le format du code OTP
        if (!otpCode || !/^\d{6}$/.test(otpCode)) {
          this.recordAttempt(identifier);
          return res.status(400).json({
            success: false,
            message: 'Code OTP invalide',
            code: 'INVALID_OTP_FORMAT',
            details: 'Le code OTP doit contenir exactement 6 chiffres.'
          });
        }

        // Enregistrer la tentative
        this.recordAttempt(identifier);
        
        next();
      } catch (error) {
        logger.error('OTP security middleware error', {
          error: error.message,
          identifier: req.body.email || req.body.phone
        });
        return res.status(500).json(getErrorMessage('VALIDATION_ERROR'));
      }
    };
  }

  /**
   * Middleware pour la génération OTP
   */
  generateOtp() {
    return (req, res, next) => {
      try {
        const { email, phone } = req.body;
        const identifier = email || phone;
        
        if (!identifier) {
          return res.status(400).json(getErrorMessage('INVALID_INPUT'));
        }

        // Vérifier si bloqué
        if (this.isBlocked(identifier)) {
          return res.status(429).json(getErrorMessage('RATE_LIMIT_EXCEEDED'));
        }

        // Limiter la génération d'OTP
        const recentAttempts = this.attempts.get(identifier);
        if (recentAttempts && recentAttempts.count >= 3) {
          return res.status(429).json({
            success: false,
            message: 'Trop de demandes de code OTP',
            code: 'OTP_GENERATION_LIMIT',
            details: 'Veuillez attendre avant de demander un nouveau code.',
            retryAfter: 300 // 5 minutes
          });
        }

        next();
      } catch (error) {
        logger.error('OTP generation middleware error', {
          error: error.message,
          identifier: req.body.email || req.body.phone
        });
        return res.status(500).json(getErrorMessage('VALIDATION_ERROR'));
      }
    };
  }

  /**
   * Obtient les métriques de sécurité OTP
   */
  getMetrics() {
    const now = Date.now();
    const metrics = {
      totalBlocked: 0,
      totalAttempts: 0,
      activeBlocks: 0
    };

    for (const [identifier, attempts] of this.attempts.entries()) {
      metrics.totalAttempts += attempts.count;
      
      if (attempts.blockedUntil && now < attempts.blockedUntil) {
        metrics.totalBlocked++;
        metrics.activeBlocks++;
      }
    }

    return metrics;
  }
}

const otpSecurity = new OtpSecurityMiddleware();

module.exports = {
  verifyOtp: otpSecurity.verifyOtp(),
  generateOtp: otpSecurity.generateOtp(),
  getMetrics: () => otpSecurity.getMetrics()
};
