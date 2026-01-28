/**
 * SERVICE DE PERMISSIONS EN TEMPS RÉEL
 * Gestion du rafraîchissement automatique des permissions via WebSocket/Server-Sent Events
 */

const logger = require('../utils/logger');
const permissionsService = require('./permissions.service');
const menuService = require('./menu.service');

class RealtimePermissionsService {
  constructor() {
    this.connectedClients = new Map(); // userId -> Set of connections
    this.refreshInterval = null;
    this.refreshRate = 30 * 1000; // 30 secondes par défaut
  }

  /**
   * Initialise le service de permissions en temps réel
   * @param {Object} server - Serveur HTTP pour WebSocket
   * @param {Object} options - Options de configuration
   */
  initialize(server, options = {}) {
    this.refreshRate = options.refreshRate || this.refreshRate;
    
    // Initialiser WebSocket si disponible
    if (server && typeof server.on === 'function') {
      this.setupWebSocket(server);
    }
    
    // Démarrer le rafraîchissement automatique
    this.startAutoRefresh();
    
    logger.info('🔄 Realtime permissions service initialized', {
      refreshRate: this.refreshRate,
      websocketEnabled: !!server
    });
  }

  /**
   * Configure WebSocket pour le rafraîchissement en temps réel
   * @param {Object} server - Serveur HTTP
   */
  setupWebSocket(server) {
    try {
      // Importer ws dynamiquement pour éviter les erreurs si non disponible
      const WebSocket = require('ws');
      
      const wss = new WebSocket.Server({ 
        server,
        path: '/ws/permissions'
      });
      
      wss.on('connection', (ws, request) => {
        this.handleWebSocketConnection(ws, request);
      });
      
      logger.info('🌐 WebSocket server initialized for permissions');
    } catch (error) {
      logger.warn('⚠️ WebSocket not available, using SSE fallback:', error.message);
      this.setupServerSentEvents(server);
    }
  }

  /**
   * Configure Server-Sent Events comme fallback
   * @param {Object} server - Serveur HTTP
   */
  setupServerSentEvents(server) {
    if (!server) return;
    
    // Middleware pour les endpoints SSE
    server.on('request', (req, res) => {
      if (req.url === '/sse/permissions' && req.method === 'GET') {
        this.handleSSEConnection(req, res);
      }
    });
    
    logger.info('📡 SSE fallback initialized for permissions');
  }

  /**
   * Gère une nouvelle connexion WebSocket
   * @param {Object} ws - Connexion WebSocket
   * @param {Object} request - Requête HTTP
   */
  async handleWebSocketConnection(ws, request) {
    let userId = null;
    
    try {
      // Extraire l'userId depuis l'URL ou les headers
      const url = new URL(request.url, `http://${request.headers.host}`);
      userId = url.searchParams.get('userId') || request.headers['x-user-id'];
      
      if (!userId) {
        ws.close(1008, 'User ID required');
        return;
      }
      
      userId = parseInt(userId);
      
      // Ajouter le client à la liste des connexions
      if (!this.connectedClients.has(userId)) {
        this.connectedClients.set(userId, new Set());
      }
      this.connectedClients.get(userId).add(ws);
      
      logger.info(`🔗 User ${userId} connected to permissions WebSocket`);
      
      // Envoyer les permissions initiales
      await this.sendPermissionsUpdate(userId, ws);
      
      // Gérer les messages du client
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleClientMessage(userId, data, ws);
        } catch (error) {
          logger.error(`Error handling message from user ${userId}:`, error);
        }
      });
      
      // Gérer la déconnexion
      ws.on('close', () => {
        this.handleClientDisconnection(userId, ws);
      });
      
      // Gérer les erreurs
      ws.on('error', (error) => {
        logger.error(`WebSocket error for user ${userId}:`, error);
        this.handleClientDisconnection(userId, ws);
      });
      
    } catch (error) {
      logger.error('Error in WebSocket connection:', error);
      if (ws.readyState === ws.OPEN) {
        ws.close(1011, 'Internal server error');
      }
    }
  }

  /**
   * Gère une connexion Server-Sent Events
   * @param {Object} req - Requête HTTP
   * @param {Object} res - Réponse HTTP
   */
  async handleSSEConnection(req, res) {
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      
      const userIdInt = parseInt(userId);
      
      // Configurer les headers SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      
      logger.info(`📡 User ${userIdInt} connected to permissions SSE`);
      
      // Ajouter le client SSE
      if (!this.connectedClients.has(userIdInt)) {
        this.connectedClients.set(userIdInt, new Set());
      }
      this.connectedClients.get(userIdInt).add(res);
      
      // Envoyer les permissions initiales
      await this.sendPermissionsUpdate(userIdInt, res);
      
      // Gérer la déconnexion du client
      req.on('close', () => {
        this.handleClientDisconnection(userIdInt, res);
      });
      
    } catch (error) {
      logger.error('Error in SSE connection:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Gère les messages reçus des clients
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} data - Données du message
   * @param {Object} connection - Connexion (WebSocket ou Response)
   */
  async handleClientMessage(userId, data, connection) {
    switch (data.type) {
      case 'refresh_permissions':
        await this.sendPermissionsUpdate(userId, connection);
        break;
        
      case 'refresh_menu':
        await this.sendMenuUpdate(userId, connection);
        break;
        
      case 'ping':
        this.sendMessage(connection, { type: 'pong', timestamp: Date.now() });
        break;
        
      default:
        logger.warn(`Unknown message type from user ${userId}:`, data.type);
    }
  }

  /**
   * Gère la déconnexion d'un client
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} connection - Connexion à supprimer
   */
  handleClientDisconnection(userId, connection) {
    if (this.connectedClients.has(userId)) {
      this.connectedClients.get(userId).delete(connection);
      
      // Supprimer l'entrée si plus de connexions
      if (this.connectedClients.get(userId).size === 0) {
        this.connectedClients.delete(userId);
      }
    }
    
    logger.info(`🔌 User ${userId} disconnected from permissions service`);
  }

  /**
   * Envoie une mise à jour des permissions à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} connection - Connexion spécifique (optionnel)
   */
  async sendPermissionsUpdate(userId, connection = null) {
    try {
      const permissions = await permissionsService.getUserPermissions(userId);
      const roles = await permissionsService.getUserRoles(userId);
      
      const update = {
        type: 'permissions_update',
        userId,
        data: {
          permissions,
          roles,
          timestamp: Date.now()
        }
      };
      
      if (connection) {
        // Envoyer à une connexion spécifique
        this.sendMessage(connection, update);
      } else {
        // Envoyer à toutes les connexions de l'utilisateur
        await this.sendToUser(userId, update);
      }
      
    } catch (error) {
      logger.error(`Error sending permissions update to user ${userId}:`, error);
    }
  }

  /**
   * Envoie une mise à jour du menu à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} connection - Connexion spécifique (optionnel)
   */
  async sendMenuUpdate(userId, connection = null) {
    try {
      const menu = await menuService.generateUserMenu(userId);
      
      const update = {
        type: 'menu_update',
        userId,
        data: {
          menu,
          timestamp: Date.now()
        }
      };
      
      if (connection) {
        // Envoyer à une connexion spécifique
        this.sendMessage(connection, update);
      } else {
        // Envoyer à toutes les connexions de l'utilisateur
        await this.sendToUser(userId, update);
      }
      
    } catch (error) {
      logger.error(`Error sending menu update to user ${userId}:`, error);
    }
  }

  /**
   * Notifie tous les clients connectés d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} message - Message à envoyer
   */
  async sendToUser(userId, message) {
    if (!this.connectedClients.has(userId)) {
      return;
    }
    
    const connections = this.connectedClients.get(userId);
    const promises = [];
    
    for (const connection of connections) {
      promises.push(this.sendMessage(connection, message));
    }
    
    await Promise.allSettled(promises);
  }

  /**
   * Envoie un message à une connexion
   * @param {Object} connection - Connexion (WebSocket ou Response)
   * @param {Object} message - Message à envoyer
   */
  sendMessage(connection, message) {
    return new Promise((resolve, reject) => {
      try {
        const messageStr = JSON.stringify(message);
        
        // WebSocket
        if (connection.send && typeof connection.send === 'function') {
          if (connection.readyState === connection.OPEN) {
            connection.send(messageStr);
            resolve();
          } else {
            reject(new Error('WebSocket not ready'));
          }
        }
        // Server-Sent Events
        else if (connection.write && typeof connection.write === 'function') {
          connection.write(`data: ${messageStr}\n\n`);
          resolve();
        }
        else {
          reject(new Error('Unknown connection type'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Démarre le rafraîchissement automatique des permissions
   */
  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(async () => {
      await this.refreshAllConnectedUsers();
    }, this.refreshRate);
    
    logger.info(`⏰ Auto-refresh started with ${this.refreshRate}ms interval`);
  }

  /**
   * Arrête le rafraîchissement automatique
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      logger.info('⏹️ Auto-refresh stopped');
    }
  }

  /**
   * Rafraîchit les permissions de tous les utilisateurs connectés
   */
  async refreshAllConnectedUsers() {
    const userIds = Array.from(this.connectedClients.keys());
    
    if (userIds.length === 0) {
      return;
    }
    
    logger.debug(`🔄 Refreshing permissions for ${userIds.length} connected users`);
    
    const promises = userIds.map(userId => 
      this.sendPermissionsUpdate(userId)
        .catch(error => 
          logger.error(`Error refreshing permissions for user ${userId}:`, error)
        )
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Force le rafraîchissement pour un utilisateur spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de rafraîchissement
   */
  async forceRefreshUser(userId, options = {}) {
    const { permissions = true, menu = false } = options;
    
    logger.info(`🔄 Force refreshing user ${userId}`, options);
    
    // Vider les caches
    permissionsService.clearCache('user', userId);
    menuService.clearCache();
    
    // Envoyer les mises à jour
    if (permissions) {
      await this.sendPermissionsUpdate(userId);
    }
    
    if (menu) {
      await this.sendMenuUpdate(userId);
    }
  }

  /**
   * Envoie une notification à tous les utilisateurs connectés
   * @param {Object} notification - Notification à envoyer
   */
  async broadcastNotification(notification) {
    const message = {
      type: 'notification',
      data: {
        ...notification,
        timestamp: Date.now()
      }
    };
    
    const userIds = Array.from(this.connectedClients.keys());
    const promises = userIds.map(userId => this.sendToUser(userId, message));
    
    await Promise.allSettled(promises);
    
    logger.info(`📢 Broadcast notification sent to ${userIds.length} users`);
  }

  /**
   * Retourne les statistiques du service
   */
  getStats() {
    const userIds = Array.from(this.connectedClients.keys());
    const totalConnections = userIds.reduce((total, userId) => 
      total + this.connectedClients.get(userId).size, 0
    );
    
    return {
      connectedUsers: userIds.length,
      totalConnections,
      refreshRate: this.refreshRate,
      autoRefreshEnabled: !!this.refreshInterval
    };
  }

  /**
   * Arrête proprement le service
   */
  shutdown() {
    this.stopAutoRefresh();
    
    // Fermer toutes les connexions
    for (const [userId, connections] of this.connectedClients.entries()) {
      for (const connection of connections) {
        try {
          if (connection.close) {
            connection.close(1001, 'Server shutdown');
          } else if (connection.end) {
            connection.end();
          }
        } catch (error) {
          // Ignorer les erreurs de fermeture
        }
      }
    }
    
    this.connectedClients.clear();
    logger.info('🛑 Realtime permissions service shutdown complete');
  }
}

module.exports = new RealtimePermissionsService();
module.exports.RealtimePermissionsService = RealtimePermissionsService;
