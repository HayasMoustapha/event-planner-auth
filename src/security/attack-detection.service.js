const logger = require('../utils/logger');
const cacheService = require('../services/cache.service');
const metricsService = require('../metrics/metrics.service');

/**
 * Service de détection d'attaques et sécurité avancée
 * Analyse les tentatives d'authentification et détecte les comportements suspects
 */
class AttackDetectionService {
  constructor() {
    this.attackPatterns = {
      // Patterns d'injection SQL (plus précis pour éviter les faux positifs)
      sqlInjection: [
        new RegExp('(\\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\\b.*\\b(FROM|INTO|WHERE|SET|VALUES)\\b)', 'gi'),
        new RegExp('(\\b(OR|AND)\\s+\\d+\\s*=\\s*\\d+|\\b(OR|AND)\\s+\'[^\']*\'\\s*=\\s*\'[^\']*\'|\\b(OR|AND)\\s+\"[^\"]*\"\\s*=\\s*\"[^\"]*\")', 'gi'),
        new RegExp('(\\b(UNION|UNION\\s+ALL|UNION\\s+DISTINCT)\\s+SELECT)', 'gi'),
        new RegExp('(\\b(EXEC|EXECUTE)\\s*\\(|\\b(SP_EXECUTESQL)\\b)', 'gi')
      ],
      
      // Patterns XSS
      xss: [
        new RegExp('<script[^>]*>.*?<\\/script>', 'gi'),
        new RegExp('javascript:', 'gi'),
        new RegExp('on\\w+\\s*=', 'gi'),
        new RegExp('<iframe[^>]*>', 'gi'),
        new RegExp('<object[^>]*>', 'gi'),
        new RegExp('<embed[^>]*>', 'gi')
      ],
      
      // Patterns de command injection (plus précis)
      commandInjection: [
        new RegExp('[;&|`]\s*(rm|del|format|shutdown|reboot|cat|ls|dir|whoami|id|pwd)', 'gi'),
        new RegExp('\\$\\([^)]*\\)', 'g'),
        new RegExp('\\${[^}]*}', 'g'),
        new RegExp('\\|\\|', 'g')
      ],
      
      // Patterns de path traversal
      pathTraversal: [
        new RegExp('(\\.\\.[\\/\\\\]){2,}', 'g'),
        new RegExp('(\\.\\.[\\/\\\\])', 'g'),
        new RegExp('(\\/[a-zA-Z]:[\\/\\\\])', 'g'),
        new RegExp('(%2e%2f%2e%5c|%c0%af)', 'gi')
      ]
    };
    
    this.suspiciousPatterns = {
      // Tentatives de brute force
      bruteForce: {
        threshold: 5,        // Nombre de tentatives
        windowMs: 900000,   // 15 minutes
        lockoutMs: 1800000  // 30 minutes
      },
      
      // Tentatives depuis IPs suspectes
      suspiciousIPs: {
        threshold: 3,         // Nombre de tentatives
        windowMs: 300000     // 5 minutes
      },
      
      // Utilisation de proxies/VPNs
      proxyDetection: {
        headers: ['x-forwarded-for', 'x-real-ip', 'via', 'forwarded'],
        knownProxies: ['cloudflare', 'fastly', 'incapsula']
      }
    };
  }

  /**
   * Analyse une requête pour détecter des attaques potentielles
   * @param {Object} req - Requête Express
   * @param {Object} data - Données à analyser (body, query, params)
   * @returns {Object} Résultat de l'analyse
   */
  async analyzeRequest(req, data = {}) {
    const analysis = {
      isAttack: false,
      attackTypes: [],
      riskLevel: 'low',
      details: {},
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    try {
      // Analyser les différents composants de la requête
      const components = {
        body: data.body || req.body || {},
        query: data.query || req.query || {},
        params: data.params || req.params || {},
        headers: req.headers || {}
      };

      // Analyser chaque composant pour les patterns d'attaque
      for (const [component, value] of Object.entries(components)) {
        const componentAnalysis = this.analyzeComponent(component, value);
        if (componentAnalysis.isAttack) {
          analysis.isAttack = true;
          analysis.attackTypes.push(...componentAnalysis.attackTypes);
          analysis.details[component] = componentAnalysis.details;
          
          // Mettre à jour le niveau de risque
          analysis.riskLevel = this.calculateRiskLevel(analysis.attackTypes);
        }
      }

      // Analyser les headers pour détection de proxies
      const proxyAnalysis = this.analyzeHeaders(components.headers);
      if (proxyAnalysis.isProxy) {
        analysis.attackTypes.push('proxy_usage');
        analysis.details.proxy = proxyAnalysis;
        analysis.riskLevel = this.calculateRiskLevel(analysis.attackTypes);
      }

      // Enregistrer les métriques
      if (analysis.isAttack) {
        await this.recordAttack(analysis);
      }

      logger.security('Request analyzed', {
        ip: analysis.ip,
        isAttack: analysis.isAttack,
        attackTypes: analysis.attackTypes,
        riskLevel: analysis.riskLevel,
        userAgent: analysis.userAgent
      });

      return analysis;
    } catch (error) {
      logger.error('Attack detection analysis error', {
        ip: this.getClientIP(req),
        error: error.message
      });
      
      return {
        isAttack: false,
        attackTypes: ['analysis_error'],
        riskLevel: 'low',
        details: { error: error.message }
      };
    }
  }

  /**
   * Analyse un composant spécifique de la requête
   * @param {string} component - Nom du composant (body, query, params, headers)
   * @param {*} value - Valeur du composant
   * @returns {Object} Résultat de l'analyse
   */
  analyzeComponent(component, value) {
    const analysis = {
      isAttack: false,
      attackTypes: [],
      details: {}
    };

    try {
      // Convertir en string pour l'analyse
      const stringValue = this.componentToString(value);
      
      // Analyser pour chaque type d'attaque
      for (const [attackType, patterns] of Object.entries(this.attackPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(stringValue)) {
            analysis.isAttack = true;
            analysis.attackTypes.push(attackType);
            analysis.details[attackType] = {
              pattern: pattern.toString(),
              matched: stringValue.match(pattern)
            };
          }
        }
      }

      // Validation spécifique selon le composant
      if (component === 'body') {
        const bodyAnalysis = this.analyzeRequestBody(value);
        if (bodyAnalysis.isAttack) {
          analysis.isAttack = true;
          analysis.attackTypes.push(...bodyAnalysis.attackTypes);
          analysis.details.bodySpecific = bodyAnalysis.details;
        }
      }

    } catch (error) {
      logger.error('Component analysis error', {
        component,
        error: error.message
      });
    }

    return analysis;
  }

  /**
   * Analyse spécifiquement le corps de la requête
   * @param {*} body - Corps de la requête
   * @returns {Object} Résultat de l'analyse
   */
  analyzeRequestBody(body) {
    const analysis = {
      isAttack: false,
      attackTypes: [],
      details: {}
    };

    try {
      // Vérifier la taille du corps (attaques par overflow)
      const bodySize = JSON.stringify(body).length;
      if (bodySize > 1048576) { // 1MB
        analysis.isAttack = true;
        analysis.attackTypes.push('oversized_payload');
        analysis.details.oversized_payload = {
          size: bodySize,
          maxSize: 1048576
        };
      }

      // Vérifier les champs suspects (exclure les champs légitimes)
      if (typeof body === 'object' && body !== null) {
        const suspiciousFields = ['admin', 'sudo', 'root', 'secret', 'api_key', 'private_key'];
        const legitimateFields = ['password', 'token', 'email', 'username', 'first_name', 'last_name', 'phone', 'user_code'];
        
        const foundFields = Object.keys(body).filter(key => 
          suspiciousFields.some(field => key.toLowerCase().includes(field)) &&
          !legitimateFields.some(legit => key.toLowerCase().includes(legit))
        );

        if (foundFields.length > 0) {
          analysis.isAttack = true;
          analysis.attackTypes.push('suspicious_fields');
          analysis.details.suspicious_fields = foundFields;
        }
      }

    } catch (error) {
      logger.error('Request body analysis error', { error: error.message });
    }

    return analysis;
  }

  /**
   * Analyse les headers pour détecter l'utilisation de proxies
   * @param {Object} headers - Headers HTTP
   * @returns {Object} Résultat de l'analyse
   */
  analyzeHeaders(headers) {
    const analysis = {
      isProxy: false,
      details: {}
    };

    try {
      const proxyHeaders = this.suspiciousPatterns.proxyDetection.headers;
      const foundHeaders = proxyHeaders.filter(header => headers[header]);

      if (foundHeaders.length > 0) {
        analysis.isProxy = true;
        analysis.details.found_headers = foundHeaders;
        analysis.details.header_values = foundHeaders.reduce((acc, header) => {
          acc[header] = headers[header];
          return acc;
        }, {});
      }

      // Vérifier les valeurs des headers pour des proxies connus
      for (const [header, value] of Object.entries(headers)) {
        if (typeof value === 'string') {
          const knownProxy = this.suspiciousPatterns.proxyDetection.knownProxies.find(proxy => 
            value.toLowerCase().includes(proxy)
          );

          if (knownProxy) {
            analysis.isProxy = true;
            analysis.details.known_proxy = {
              header,
              proxy: knownProxy,
              value
            };
          }
        }
      }

    } catch (error) {
      logger.error('Header analysis error', { error: error.message });
    }

    return analysis;
  }

  /**
   * Vérifie si une IP est dans une liste noire
   * @param {string} ip - Adresse IP à vérifier
   * @returns {Promise<boolean>} True si l'IP est blacklistée
   */
  async isIPBlacklisted(ip) {
    try {
      // Vérifier dans le cache d'abord
      const cached = await cacheService.getLoginAttempts(`blacklist:${ip}`);
      if (cached) {
        return cached.blacklisted;
      }

      // Liste noire basique (à remplacer par une vraie solution)
      const blacklistedRanges = [
        '0.0.0.0/8',      // Reserved for documentation
        '10.0.0.0/8',      // Private network
        '100.64.0.0/10',    // Carrier-grade NAT
        '127.0.0.0/8',      // Loopback
        '169.254.0.0/16',   // Link-local
        '172.16.0.0/12',     // Private network
        '192.0.2.0/24',      // TEST-NET-2
        '192.88.99.0/24',    // IPv6 to IPv4 relay
        '192.168.0.0/16',    // Private network
        '198.18.0.0/15',     // Private network
        '198.51.100.0/24',    // TEST-NET-3
        '203.0.113.0/24',    // TEST-NET-4
        '224.0.0.0/4',       // Multicast
        '240.0.0.0/4',       // Reserved for future use
        '255.255.255.255/32'  // Broadcast
      ];

      const isBlacklisted = blacklistedRanges.some(range => {
        // Simple vérification (à améliorer avec ip-range-check)
        return this.isIPInRange(ip, range);
      });

      // Mettre en cache pour 24h
      await cacheService.setLoginAttempt(`blacklist:${ip}`, {
        blacklisted: isBlacklisted,
        checkedAt: new Date().toISOString()
      }, 86400);

      return isBlacklisted;
    } catch (error) {
      logger.error('IP blacklist check error', { ip, error: error.message });
      return false;
    }
  }

  /**
   * Vérifie si une IP est dans une plage donnée
   * @param {string} ip - Adresse IP
   * @param {string} range - Plage IP (CIDR notation)
   * @returns {boolean} True si l'IP est dans la plage
   */
  isIPInRange(ip, range) {
    // Implémentation simple (à remplacer par ip-range-check ou ip6addr)
    try {
      const [network, prefixLength] = range.split('/');
      const ipNum = this.ipToNumber(ip);
      const networkNum = this.ipToNumber(network.split('/')[0]);
      const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;
      
      return (ipNum & mask) === (networkNum & mask);
    } catch (error) {
      return false;
    }
  }

  /**
   * Convertit une IP en nombre
   * @param {string} ip - Adresse IP
   * @returns {number} Représentation numérique
   */
  ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  /**
   * Détecte les tentatives de brute force
   * @param {string} identifier - Identifiant (email, IP, etc.)
   * @param {Object} attemptData - Données de la tentative
   * @returns {Promise<Object>} Résultat de l'analyse
   */
  async detectBruteForce(identifier, attemptData) {
    try {
      // Récupérer les tentatives précédentes
      const previousAttempts = await cacheService.getLoginAttempts(identifier);
      
      if (!previousAttempts) {
        // Première tentative, enregistrer
        await cacheService.setLoginAttempt(identifier, {
          attempts: 1,
          firstAttempt: new Date().toISOString(),
          lastAttempt: new Date().toISOString(),
          ...attemptData
        }, this.suspiciousPatterns.bruteForce.windowMs / 1000);
        
        return {
          isBruteForce: false,
          attempts: 1,
          remainingAttempts: this.suspiciousPatterns.bruteForce.threshold - 1
        };
      }

      const attempts = previousAttempts.attempts + 1;
      const now = new Date();
      const firstAttempt = new Date(previousAttempts.firstAttempt);
      const timeWindow = now - firstAttempt;

      // Vérifier si on dépasse le seuil de brute force
      const isBruteForce = attempts >= this.suspiciousPatterns.bruteForce.threshold &&
                           timeWindow < this.suspiciousPatterns.bruteForce.windowMs;

      if (isBruteForce) {
        // Enregistrer l'attaque
        await this.recordBruteForceAttack(identifier, attempts, timeWindow);
        
        // Bloquer temporairement
        await this.blockIdentifier(identifier, this.suspiciousPatterns.bruteForce.lockoutMs);
      }

      // Mettre à jour les tentatives
      await cacheService.setLoginAttempt(identifier, {
        attempts,
        firstAttempt: previousAttempts.firstAttempt,
        lastAttempt: new Date().toISOString(),
        ...attemptData
      }, this.suspiciousPatterns.bruteForce.windowMs / 1000);

      return {
        isBruteForce,
        attempts,
        timeWindow,
        remainingAttempts: Math.max(0, this.suspiciousPatterns.bruteForce.threshold - attempts),
        blocked: isBruteForce
      };
    } catch (error) {
      logger.error('Brute force detection error', {
        identifier,
        error: error.message
      });
      
      return {
        isBruteForce: false,
        error: error.message
      };
    }
  }

  /**
   * Bloque temporairement un identifiant
   * @param {string} identifier - Identifiant à bloquer
   * @param {number} durationMs - Durée du blocage en millisecondes
   */
  async blockIdentifier(identifier, durationMs) {
    try {
      await cacheService.setLoginAttempt(`blocked:${identifier}`, {
        blocked: true,
        blockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + durationMs).toISOString(),
        duration: durationMs
      }, Math.ceil(durationMs / 1000));

      logger.security('Identifier blocked', {
        identifier,
        duration: durationMs,
        expiresAt: new Date(Date.now() + durationMs).toISOString()
      });
    } catch (error) {
      logger.error('Identifier block error', {
        identifier,
        error: error.message
      });
    }
  }

  /**
   * Vérifie si un identifiant est bloqué
   * @param {string} identifier - Identifiant à vérifier
   * @returns {Promise<boolean>} True si bloqué
   */
  async isIdentifierBlocked(identifier) {
    try {
      const blocked = await cacheService.getLoginAttempt(`blocked:${identifier}`);
      return blocked && blocked.blocked && new Date(blocked.expiresAt) > new Date();
    } catch (error) {
      logger.error('Block check error', {
        identifier,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Enregistre une attaque détectée
   * @param {Object} analysis - Résultat de l'analyse
   */
  async recordAttack(analysis) {
    try {
      // Enregistrer dans les métriques
      metricsService.recordSecurityEvent(
        'attack_detected',
        analysis.riskLevel,
        analysis.ip
      );

      // Enregistrer dans le cache pour suivi
      await cacheService.setLoginAttempt(`attack:${analysis.ip}`, {
        ...analysis,
        recordedAt: new Date().toISOString()
      }, 86400); // 24h

      logger.warn('Attack detected and recorded', {
        ip: analysis.ip,
        attackTypes: analysis.attackTypes,
        riskLevel: analysis.riskLevel
      });
    } catch (error) {
      logger.error('Attack recording error', {
        ip: analysis.ip,
        error: error.message
      });
    }
  }

  /**
   * Enregistre une attaque de brute force
   * @param {string} identifier - Identifiant ciblé
   * @param {number} attempts - Nombre de tentatives
   * @param {number} timeWindow - Fenêtre de temps
   */
  async recordBruteForceAttack(identifier, attempts, timeWindow) {
    try {
      metricsService.recordSecurityEvent(
        'brute_force_attack',
        'high',
        identifier
      );

      logger.security('Brute force attack detected', {
        identifier,
        attempts,
        timeWindow,
        severity: 'high'
      });
    } catch (error) {
      logger.error('Brute force recording error', {
        identifier,
        error: error.message
      });
    }
  }

  /**
   * Calcule le niveau de risque basé sur les types d'attaques
   * @param {Array<string>} attackTypes - Types d'attaques détectés
   * @returns {string} Niveau de risque (low, medium, high, critical)
   */
  calculateRiskLevel(attackTypes) {
    const riskScores = {
      sql_injection: 10,
      xss: 8,
      command_injection: 9,
      path_traversal: 7,
      brute_force: 6,
      proxy_usage: 3,
      suspicious_fields: 4,
      oversized_payload: 5
    };

    const totalScore = attackTypes.reduce((sum, attackType) => {
      return sum + (riskScores[attackType] || 1);
    }, 0);

    if (totalScore >= 15) return 'critical';
    if (totalScore >= 10) return 'high';
    if (totalScore >= 6) return 'medium';
    return 'low';
  }

  /**
   * Extrait l'IP réelle du client
   * @param {Object} req - Requête Express
   * @returns {string} Adresse IP du client
   */
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           'unknown';
  }

  /**
   * Convertit un composant en string pour l'analyse
   * @param {*} value - Valeur à convertir
   * @returns {string} Représentation string
   */
  componentToString(value) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (Array.isArray(value)) return value.join(',');
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return '';
  }

  /**
   * Nettoie les anciennes données d'attaques
   * @returns {Promise<number>} Nombre d'entrées nettoyées
   */
  async cleanup() {
    try {
      // Nettoyer les anciennes détections (plus de 7 jours)
      const cleanedKeys = await cacheService.cleanup('attack:*');
      
      logger.info('Attack detection cleanup completed', {
        cleanedKeys
      });
      
      return cleanedKeys;
    } catch (error) {
      logger.error('Attack detection cleanup error', { error: error.message });
      return 0;
    }
  }
}

// Exporter une instance singleton
module.exports = new AttackDetectionService();
