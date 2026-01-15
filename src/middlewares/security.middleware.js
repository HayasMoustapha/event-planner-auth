const attackDetectionService = require('../security/attack-detection.service');
const logger = require('../utils/logger');
const { createResponse } = require('../utils/response');

/**
 * Middleware de sécurité avancée pour la détection d'attaques
 * Analyse toutes les requêtes entrantes pour détecter les menaces
 */
class SecurityMiddleware {
  /**
   * Middleware principal de sécurité
   * @param {Object} options - Options de configuration
   * @returns {Function} Middleware Express
   */
  security(options = {}) {
    const config = {
      enabled: true,
      logLevel: 'warn',
      blockOnHighRisk: true,
      sanitizeInput: true,
      ...options
    };

    return async (req, res, next) => {
      try {
        // Si le middleware est désactivé, passer au suivant
        if (!config.enabled) {
          return next();
        }

        // Analyser la requête pour détecter les attaques
        const analysis = await attackDetectionService.analyzeRequest(req);
        
        // Ajouter les résultats de l'analyse à la requête
        req.securityAnalysis = analysis;
        
        // Si une attaque est détectée
        if (analysis.isAttack) {
          // Logger l'attaque
          logger.security('Security attack detected', {
            ip: analysis.ip,
            userAgent: analysis.userAgent,
            attackTypes: analysis.attackTypes,
            riskLevel: analysis.riskLevel,
            url: req.originalUrl,
            method: req.method
          });

          // Bloquer les attaques à haut risque si configuré
          if (config.blockOnHighRisk && (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical')) {
            return res.status(403).json(createResponse(
              false,
              'Access denied - Security violation detected',
              {
                code: 'SECURITY_VIOLATION',
                attackTypes: analysis.attackTypes,
                riskLevel: analysis.riskLevel,
                timestamp: analysis.timestamp
              }
            ));
          }

          // Ajouter des headers de sécurité pour la réponse
          res.set('X-Security-Analysis', JSON.stringify({
            riskLevel: analysis.riskLevel,
            attackTypes: analysis.attackTypes.length
          }));
        }

        // Sanitiser les entrées si configuré
        if (config.sanitizeInput) {
          req.body = this.sanitizeData(req.body);
          req.query = this.sanitizeData(req.query);
          req.params = this.sanitizeData(req.params);
        }

        next();
      } catch (error) {
        logger.error('Security middleware error', {
          error: error.message,
          ip: req.ip
        });
        
        // En cas d'erreur dans le middleware, continuer mais logger
        next();
      }
    };
  }

  /**
   * Middleware spécifique pour la détection de brute force
   * @param {Object} options - Options de configuration
   * @returns {Function} Middleware Express
   */
  bruteForceProtection(options = {}) {
    const config = {
      identifier: 'email', // 'email', 'ip', 'username'
      maxAttempts: 5,
      windowMs: 900000, // 15 minutes
      lockoutMs: 1800000, // 30 minutes
      ...options
    };

    return async (req, res, next) => {
      try {
        // Extraire l'identifiant selon la configuration
        const identifier = this.extractIdentifier(req, config.identifier);
        
        if (!identifier) {
          return next();
        }

        // Vérifier si l'identifiant est déjà bloqué
        const isBlocked = await attackDetectionService.isIdentifierBlocked(identifier);
        if (isBlocked) {
          logger.security('Blocked identifier access attempt', {
            identifier,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          return res.status(429).json(createResponse(
            false,
            'Too many attempts - Please try again later',
            {
              code: 'RATE_LIMIT_EXCEEDED',
              identifier: config.identifier,
              retryAfter: config.lockoutMs / 1000
            }
          ));
        }

        // Détecter les tentatives de brute force
        const bruteForceAnalysis = await attackDetectionService.detectBruteForce(identifier, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.originalUrl,
          timestamp: new Date().toISOString()
        });

        // Si on détecte du brute force
        if (bruteForceAnalysis.isBruteForce) {
          logger.security('Brute force attack detected', {
            identifier,
            attempts: bruteForceAnalysis.attempts,
            timeWindow: bruteForceAnalysis.timeWindow,
            ip: req.ip
          });

          return res.status(429).json(createResponse(
            false,
            'Too many attempts - Account temporarily locked',
            {
              code: 'BRUTE_FORCE_DETECTED',
              attempts: bruteForceAnalysis.attempts,
              remainingAttempts: bruteForceAnalysis.remainingAttempts,
              lockoutDuration: config.lockoutMs / 1000
            }
          ));
        }

        // Ajouter des headers pour informer le client
        if (bruteForceAnalysis.attempts > 0) {
          res.set('X-RateLimit-Limit', config.maxAttempts);
          res.set('X-RateLimit-Remaining', Math.max(0, bruteForceAnalysis.remainingAttempts));
          res.set('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString());
        }

        next();
      } catch (error) {
        logger.error('Brute force middleware error', {
          error: error.message,
          identifier: this.extractIdentifier(req, config.identifier)
        });
        
        next();
      }
    };
  }

  /**
   * Middleware pour la validation renforcée des entrées
   * @param {Object} options - Options de configuration
   * @returns {Function} Middleware Express
   */
  inputValidation(options = {}) {
    const config = {
      strictMode: true,
      maxLength: 10000,
      allowedTags: [], // Tags HTML autorisés (si vide, aucun tag autorisé)
      ...options
    };

    return (req, res, next) => {
      try {
        // Valider la taille des entrées
        const validation = this.validateInputSize(req, config.maxLength);
        
        if (!validation.isValid) {
          logger.security('Input validation failed', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            violations: validation.violations
          });

          return res.status(400).json(createResponse(
            false,
            'Invalid input data',
            {
              code: 'INPUT_VALIDATION_FAILED',
              violations: validation.violations
            }
          ));
        }

        // Valider le contenu des entrées
        if (config.strictMode) {
          const contentValidation = this.validateInputContent(req, config.allowedTags);
          
          if (!contentValidation.isValid) {
            logger.security('Content validation failed', {
              ip: req.ip,
              url: req.originalUrl,
              method: req.method,
              violations: contentValidation.violations
            });

            return res.status(400).json(createResponse(
              false,
              'Invalid content detected',
              {
                code: 'CONTENT_VALIDATION_FAILED',
                violations: contentValidation.violations
              }
            ));
          }
        }

        next();
      } catch (error) {
        logger.error('Input validation middleware error', {
          error: error.message,
          ip: req.ip
        });
        
        next();
      }
    };
  }

  /**
   * Middleware pour la détection d'IPs blacklistées
   * @returns {Function} Middleware Express
   */
  ipBlacklist() {
    return async (req, res, next) => {
      try {
        const ip = req.ip;
        
        if (!ip || ip === 'unknown') {
          return next();
        }

        const isBlacklisted = await attackDetectionService.isIPBlacklisted(ip);
        
        if (isBlacklisted) {
          logger.security('Blacklisted IP access attempt', {
            ip,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl
          });

          return res.status(403).json(createResponse(
            false,
            'Access denied',
            {
              code: 'IP_BLACKLISTED',
              ip: this.hashIP(ip)
            }
          ));
        }

        next();
      } catch (error) {
        logger.error('IP blacklist middleware error', {
          error: error.message,
          ip: req.ip
        });
        
        next();
      }
    };
  }

  /**
   * Extrait l'identifiant selon la configuration
   * @param {Object} req - Requête Express
   * @param {string} type - Type d'identifiant ('email', 'ip', 'username')
   * @returns {string|null} Identifiant extrait
   */
  extractIdentifier(req, type) {
    switch (type) {
      case 'email':
        return req.body?.email || req.query?.email;
      case 'username':
        return req.body?.username || req.query?.username || req.params?.username;
      case 'ip':
        return req.ip;
      default:
        return req.body?.identifier || req.query?.identifier;
    }
  }

  /**
   * Valide la taille des données d'entrée
   * @param {Object} req - Requête Express
   * @param {number} maxLength - Taille maximale autorisée
   * @returns {Object} Résultat de la validation
   */
  validateInputSize(req, maxLength) {
    const violations = [];
    
    // Valider le corps de la requête
    if (req.body) {
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize > maxLength) {
        violations.push({
          field: 'body',
          violation: 'oversized',
          size: bodySize,
          maxSize: maxLength
        });
      }
    }

    // Valider les paramètres de requête
    if (req.query) {
      const queryString = JSON.stringify(req.query);
      if (queryString.length > maxLength / 2) {
        violations.push({
          field: 'query',
          violation: 'oversized',
          size: queryString.length,
          maxSize: maxLength / 2
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Valide le contenu des données d'entrée
   * @param {Object} req - Requête Express
   * @param {Array<string>} allowedTags - Tags HTML autorisés
   * @returns {Object} Résultat de la validation
   */
  validateInputContent(req, allowedTags) {
    const violations = [];
    const allData = { ...req.body, ...req.query, ...req.params };

    for (const [key, value] of Object.entries(allData)) {
      if (typeof value === 'string') {
        // Vérifier les patterns dangereux
        const dangerousPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /<iframe[^>]*>/gi,
          /<object[^>]*>/gi,
          /<embed[^>]*>/gi
        ];

        for (const pattern of dangerousPatterns) {
          if (pattern.test(value)) {
            violations.push({
              field: key,
              violation: 'dangerous_content',
              pattern: pattern.toString()
            });
          }
        }

        // Vérifier les tags HTML si une liste est fournie
        if (allowedTags.length > 0) {
          const tagPattern = /<(\w+)[^>]*>/gi;
          const matches = value.match(tagPattern);
          
          if (matches) {
            const foundTags = matches.map(match => match[1]);
            const unauthorizedTags = foundTags.filter(tag => !allowedTags.includes(tag));
            
            if (unauthorizedTags.length > 0) {
              violations.push({
                field: key,
                violation: 'unauthorized_html_tags',
                tags: unauthorizedTags,
                allowedTags
              });
            }
          }
        }
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Sanitise les données pour les rendre sûres
   * @param {*} data - Données à sanitiser
   * @returns {*} Données sanitisées
   */
  sanitizeData(data) {
    if (!data) return data;
    
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Sanitise une chaîne de caractères
   * @param {string} str - Chaîne à sanitiser
   * @returns {string} Chaîne sanitisée
   */
  sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
      // Échapper les caractères HTML dangereux
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      // Supprimer les caractères de contrôle
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Normaliser l'espacement
      .trim();
  }

  /**
   * Hash une adresse IP pour la confidentialité
   * @param {string} ip - Adresse IP à hasher
   * @returns {string} IP hashée
   */
  hashIP(ip) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 8);
  }
}

module.exports = new SecurityMiddleware();
