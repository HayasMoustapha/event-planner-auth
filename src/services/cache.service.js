const redis = require('redis');
const logger = require('../utils/logger');
const configValidation = require('../config/validation');

/**
 * Service de cache Redis pour l'application
 * Gère le cache des authorizations, sessions et autres données temporaires
 */
class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.initialize();
  }

  /**
   * Initialise la connexion Redis
   */
  async initialize() {
    try {
      // Vérifier si Redis est configuré
      if (!configValidation.isServiceConfigured('redis')) {
        logger.warn('Redis service not configured - cache disabled');
        this.isConnected = false;
        return;
      }

      const config = configValidation.getConfig();
      
      // Créer le client Redis avec configuration optimisée
      this.client = redis.createClient({
        socket: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 50, 1000);
          }
        },
        password: config.REDIS_PASSWORD || undefined,
        database: config.REDIS_DB,
        // Configuration de performance
        connectTimeout: 10000,
        lazyConnect: true
      });

      // Écouter les événements
      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error', { error: error.message });
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.info('Redis connection ended');
      });

      // Connexion
      this.connectionPromise = this.client.connect();
      await this.connectionPromise;

    } catch (error) {
      logger.error('Failed to initialize Redis cache', { error: error.message });
      this.isConnected = false;
    }
  }

  /**
   * Vérifie si Redis est connecté
   * @returns {boolean} True si connecté
   */
  isReady() {
    return this.isConnected && this.client;
  }

  /**
   * Méthodes Redis de base
   */
  async get(key) {
    try {
      if (!this.isReady()) {
        return null;
      }
      return await this.client.get(key);
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value) {
    try {
      if (!this.isReady()) {
        return false;
      }
      await this.client.set(key, value);
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  async setEx(key, ttl, value) {
    try {
      if (!this.isReady()) {
        return false;
      }
      await this.client.setEx(key, ttl, value);
      return true;
    } catch (error) {
      logger.error('Cache setEx error', { key, ttl, error: error.message });
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isReady()) {
        return false;
      }
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache del error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Met en cache les authorizations d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Array} authorizations - Liste des authorizations
   * @param {number} ttl - Temps de vie en secondes
   * @returns {Promise<boolean>} True si réussi
   */
  async setUserAuthorizations(userId, authorizations, ttl = 3600) {
    try {
      if (!this.isReady()) {
        logger.debug('Redis not ready - skipping cache set');
        return false;
      }

      const key = `auth:user:${userId}:permissions`;
      const value = JSON.stringify({
        data: authorizations,
        cachedAt: new Date().toISOString(),
        ttl
      });

      await this.client.setEx(key, ttl, value);
      
      logger.debug('Authorizations cached', {
        userId,
        count: authorizations.length,
        ttl
      });
      
      return true;
    } catch (error) {
      logger.error('Cache set error for authorizations', {
        userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Récupère les authorizations d'un utilisateur depuis le cache
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object|null>} Données cachées ou null
   */
  async getUserAuthorizations(userId) {
    try {
      if (!this.isReady()) {
        logger.debug('Redis not ready - skipping cache get');
        return null;
      }

      const key = `auth:user:${userId}:permissions`;
      const cached = await this.client.get(key);
      
      if (!cached) {
        logger.debug('No cached authorizations found', { userId });
        return null;
      }

      const parsed = JSON.parse(cached);
      
      logger.debug('Authorizations retrieved from cache', {
        userId,
        cachedAt: parsed.cachedAt,
        age: Date.now() - new Date(parsed.cachedAt).getTime()
      });
      
      return parsed.data;
    } catch (error) {
      logger.error('Cache get error for authorizations', {
        userId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Invalide les authorizations d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} True si réussi
   */
  async invalidateUserAuthorizations(userId) {
    try {
      if (!this.isReady()) {
        logger.debug('Redis not ready - skipping cache invalidation');
        return false;
      }

      const key = `auth:user:${userId}:permissions`;
      await this.client.del(key);
      
      logger.info('Authorizations cache invalidated', { userId });
      return true;
    } catch (error) {
      logger.error('Cache invalidation error for authorizations', {
        userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Met en cache les informations de session
   * @param {string} sessionId - ID de la session
   * @param {Object} sessionData - Données de session
   * @param {number} ttl - Temps de vie en secondes
   * @returns {Promise<boolean>} True si réussi
   */
  async setSession(sessionId, sessionData, ttl = 86400) {
    try {
      if (!this.isReady()) {
        return false;
      }

      const key = `session:${sessionId}`;
      const value = JSON.stringify({
        ...sessionData,
        cachedAt: new Date().toISOString()
      });

      await this.client.setEx(key, ttl, value);
      
      logger.debug('Session cached', { sessionId, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error for session', {
        sessionId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Récupère les informations de session depuis le cache
   * @param {string} sessionId - ID de la session
   * @returns {Promise<Object|null>} Données de session ou null
   */
  async getSession(sessionId) {
    try {
      if (!this.isReady()) {
        return null;
      }

      const key = `session:${sessionId}`;
      const cached = await this.client.get(key);
      
      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      logger.error('Cache get error for session', {
        sessionId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Supprime une session du cache
   * @param {string} sessionId - ID de la session
   * @returns {Promise<boolean>} True si réussi
   */
  async deleteSession(sessionId) {
    try {
      if (!this.isReady()) {
        return false;
      }

      const key = `session:${sessionId}`;
      await this.client.del(key);
      
      logger.debug('Session deleted from cache', { sessionId });
      return true;
    } catch (error) {
      logger.error('Cache delete error for session', {
        sessionId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Met en cache les tentatives de connexion pour rate limiting
   * @param {string} identifier - Identifiant (IP, email, etc.)
   * @param {Object} attemptData - Données de la tentative
   * @param {number} ttl - Temps de vie en secondes
   * @returns {Promise<boolean>} True si réussi
   */
  async setLoginAttempt(identifier, attemptData, ttl = 900) {
    try {
      if (!this.isReady()) {
        return false;
      }

      const key = `rate_limit:login:${identifier}`;
      const value = JSON.stringify({
        ...attemptData,
        timestamp: new Date().toISOString()
      });

      await this.client.setEx(key, ttl, value);
      return true;
    } catch (error) {
      logger.error('Cache set error for login attempt', {
        identifier,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Récupère les tentatives de connexion pour rate limiting
   * @param {string} identifier - Identifiant (IP, email, etc.)
   * @returns {Promise<Object|null>} Données de tentative ou null
   */
  async getLoginAttempts(identifier) {
    try {
      if (!this.isReady()) {
        return null;
      }

      const key = `rate_limit:login:${identifier}`;
      const cached = await this.client.get(key);
      
      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      logger.error('Cache get error for login attempts', {
        identifier,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Récupère une tentative de connexion (alias pour compatibilité)
   * @param {string} identifier - Identifiant (IP, email, etc.)
   * @returns {Promise<Object|null>} Données de tentative ou null
   */
  async getLoginAttempt(identifier) {
    return await this.getLoginAttempts(identifier);
  }

  /**
   * Incrémente le compteur de tentatives de connexion
   * @param {string} identifier - Identifiant (IP, email, etc.)
   * @param {Object} attemptData - Données de la tentative
   * @returns {Promise<boolean>} True si enregistré avec succès
   */
  async incrementLoginAttempt(identifier, attemptData = {}) {
    try {
      if (!this.isReady()) {
        return false;
      }

      const key = `rate_limit:login:${identifier}`;
      const ttl = 900; // 15 minutes
      
      // Récupérer les tentatives existantes
      const existing = await this.getLoginAttempts(identifier);
      const attempts = existing ? existing.attempts + 1 : 1;
      
      const data = {
        attempts,
        firstAttempt: existing ? existing.firstAttempt : new Date().toISOString(),
        lastAttempt: new Date().toISOString(),
        ...attemptData
      };

      await this.client.setEx(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Cache increment error for login attempt', {
        identifier,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Réinitialise les tentatives de connexion pour un identifiant
   * @param {string} identifier - Identifiant (IP, email, etc.)
   * @returns {Promise<boolean>} True si réinitialisé avec succès
   */
  async resetLoginAttempt(identifier) {
    try {
      if (!this.isReady()) {
        return false;
      }

      const key = `rate_limit:login:${identifier}`;
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache reset error for login attempt', {
        identifier,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Nettoie les clés expirées ou correspondant à un pattern
   * @param {string} pattern - Pattern des clés à supprimer
   * @returns {Promise<number>} Nombre de clés supprimées
   */
  async cleanup(pattern = 'auth:user:*:permissions') {
    try {
      if (!this.isReady()) {
        return 0;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(keys);
      
      logger.info('Cache cleanup completed', {
        pattern,
        keysDeleted: keys.length
      });
      
      return keys.length;
    } catch (error) {
      logger.error('Cache cleanup error', {
        pattern,
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Récupère des statistiques sur le cache
   * @returns {Promise<Object>} Statistiques du cache
   */
  async getStats() {
    try {
      if (!this.isReady()) {
        return { connected: false, ready: false };
      }

      const info = await this.client.info();
      const keyspace = info.split('\r\n').find(line => line.startsWith('db'));
      
      return {
        connected: true,
        ready: true,
        keys: keyspace ? parseInt(keyspace.split(':')[1].split(',')[0]) : 0,
        memory: info.split('\r\n').find(line => line.startsWith('used_memory_human')),
        uptime: info.split('\r\n').find(line => line.startsWith('uptime_in_seconds'))
      };
    } catch (error) {
      logger.error('Cache stats error', { error: error.message });
      return { connected: false, ready: false, error: error.message };
    }
  }

  /**
   * Ferme la connexion Redis
   */
  async close() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        logger.info('Redis cache connection closed');
        this.isConnected = false;
      }
    } catch (error) {
      logger.error('Error closing Redis connection', { error: error.message });
    }
  }

  // ===== MÉTHODES OPTIMISÉES POUR SESSIONS & TOKENS =====

  /**
   * Stocke une session utilisateur avec TTL automatique
   * @param {string} sessionId - ID de la session
   * @param {Object} sessionData - Données de session
   * @param {number} ttl - Temps de vie en secondes (défaut: 24h)
   * @returns {Promise<boolean>} True si réussi
   */
  async setSession(sessionId, sessionData, ttl = 86400) {
    const key = `session:${sessionId}`;
    const value = JSON.stringify(sessionData);
    return await this.setEx(key, ttl, value);
  }

  /**
   * Récupère une session utilisateur
   * @param {string} sessionId - ID de la session
   * @returns {Promise<Object|null>} Données de session ou null
   */
  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Supprime une session utilisateur
   * @param {string} sessionId - ID de la session
   * @returns {Promise<boolean>} True si réussi
   */
  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  /**
   * Stocke un token blacklisté (pour logout/révocation)
   * @param {string} tokenId - ID du token (jti)
   * @param {number} ttl - Temps de vie en secondes (défaut: durée du token)
   * @returns {Promise<boolean>} True si réussi
   */
  async blacklistToken(tokenId, ttl = 86400) {
    const key = `blacklist:${tokenId}`;
    return await this.setEx(key, ttl, '1');
  }

  /**
   * Vérifie si un token est blacklisté
   * @param {string} tokenId - ID du token
   * @returns {Promise<boolean>} True si blacklisté
   */
  async isTokenBlacklisted(tokenId) {
    const key = `blacklist:${tokenId}`;
    const value = await this.get(key);
    return value === '1';
  }

  /**
   * Stocke les tentatives de connexion pour rate limiting
   * @param {string} identifier - Email/IP ou identifiant
   * @param {number} ttl - Temps de vie en secondes
   * @returns {Promise<number>} Nombre de tentatives
   */
  async incrementLoginAttempts(identifier, ttl = 900) {
    const key = `attempts:${identifier}`;
    const attempts = await this.client.incr(key);
    
    if (attempts === 1) {
      await this.client.expire(key, ttl);
    }
    
    return attempts;
  }

  /**
   * Réinitialise les tentatives de connexion
   * @param {string} identifier - Email/IP ou identifiant
   * @returns {Promise<boolean>} True si réussi
   */
  async resetLoginAttempts(identifier) {
    const key = `attempts:${identifier}`;
    return await this.del(key);
  }

  /**
   * Stocke un OTP avec TTL court
   * @param {string} identifier - Email ou téléphone
   * @param {string} otpCode - Code OTP
   * @param {string} purpose - But du code (login, reset, etc.)
   * @param {number} ttl - Temps de vie en secondes (défaut: 5min)
   * @returns {Promise<boolean>} True si réussi
   */
  async setOTP(identifier, otpCode, purpose = 'login', ttl = 300) {
    const key = `otp:${purpose}:${identifier}`;
    const value = JSON.stringify({
      code: otpCode,
      attempts: 0,
      createdAt: new Date().toISOString()
    });
    return await this.setEx(key, ttl, value);
  }

  /**
   * Récupère et valide un OTP
   * @param {string} identifier - Email ou téléphone
   * @param {string} purpose - But du code
   * @returns {Promise<Object|null>} Données OTP ou null
   */
  async getOTP(identifier, purpose = 'login') {
    const key = `otp:${purpose}:${identifier}`;
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Incrémente les tentatives OTP et bloque si trop de tentatives
   * @param {string} identifier - Email ou téléphone
   * @param {string} purpose - But du code
   * @param {number} maxAttempts - Nombre max de tentatives
   * @returns {Promise<Object>} {valid: boolean, remaining: number}
   */
  async incrementOTPAttempts(identifier, purpose = 'login', maxAttempts = 3) {
    const key = `otp:${purpose}:${identifier}`;
    const value = await this.get(key);
    
    if (!value) {
      return { valid: false, remaining: 0 };
    }

    const otpData = JSON.parse(value);
    otpData.attempts += 1;
    
    if (otpData.attempts >= maxAttempts) {
      // Supprimer l'OTP après trop de tentatives
      await this.del(key);
      return { valid: false, remaining: 0, blocked: true };
    }

    // Mettre à jour le compteur
    await this.set(key, JSON.stringify(otpData));
    return { 
      valid: true, 
      remaining: maxAttempts - otpData.attempts,
      attempts: otpData.attempts
    };
  }

  /**
   * Supprime un OTP après utilisation
   * @param {string} identifier - Email ou téléphone
   * @param {string} purpose - But du code
   * @returns {Promise<boolean>} True si réussi
   */
  async deleteOTP(identifier, purpose = 'login') {
    const key = `otp:${purpose}:${identifier}`;
    return await this.del(key);
  }

  /**
   * Nettoie les données expirées (maintenance)
   * @returns {Promise<number>} Nombre de clés nettoyées
   */
  async cleanupExpired() {
    try {
      if (!this.isReady()) {
        return 0;
      }

      const patterns = [
        'otp:*',
        'attempts:*',
        'blacklist:*'
      ];

      let totalDeleted = 0;
      
      for (const pattern of patterns) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          const deleted = await this.client.del(keys);
          totalDeleted += deleted;
        }
      }

      if (totalDeleted > 0) {
        logger.info(`Cache cleanup: deleted ${totalDeleted} expired keys`);
      }

      return totalDeleted;
    } catch (error) {
      logger.error('Cache cleanup error', { error: error.message });
      return 0;
    }
  }
}

// Exporter une instance singleton
module.exports = new CacheService();
