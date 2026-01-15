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
      
      // Créer le client Redis
      this.client = redis.createClient({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD || undefined,
        db: config.REDIS_DB,
        retry_delay_on_failover: 100,
        enable_offline_queue: false,
        lazyConnect: true
      });

      // Gérer les événements de connexion
      this.client.on('connect', () => {
        logger.info('Connected to Redis cache');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis cache ready');
      });

      this.client.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Connexion asynchrone
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
        return { connected: false };
      }

      const info = await this.client.info();
      const keyspace = info.split('\r\n').find(line => line.startsWith('db'));
      
      return {
        connected: true,
        keys: keyspace ? parseInt(keyspace.split(':')[1].split(',')[0]) : 0,
        memory: info.split('\r\n').find(line => line.startsWith('used_memory_human')),
        uptime: info.split('\r\n').find(line => line.startsWith('uptime_in_seconds'))
      };
    } catch (error) {
      logger.error('Cache stats error', { error: error.message });
      return { connected: false, error: error.message };
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
}

// Exporter une instance singleton
module.exports = new CacheService();
