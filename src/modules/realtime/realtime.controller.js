/**
 * CONTROLLER POUR LES ENDPOINTS TEMPS RÉEL
 * Gestion du rafraîchissement des permissions et menus en temps réel
 */

const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const realtimePermissionsService = require('../../services/realtime-permissions.service');
const menuService = require('../../services/menu.service');

class RealtimeController {
  /**
   * Endpoint pour obtenir le menu d'un utilisateur
   */
  async getUserMenu(req, res, next) {
    try {
      const userId = req.user.id;
      const language = req.query.language || req.headers['accept-language'] || 'en';
      
      const menu = await menuService.generateUserMenu(userId, language);
      
      res.status(200).json(createResponse(
        true,
        'User menu retrieved successfully',
        {
          userId,
          language,
          menu,
          itemCount: Object.keys(menu).length
        }
      ));
    } catch (error) {
      logger.error('❌ Failed to get user menu:', error);
      next(error);
    }
  }

  /**
   * Force le rafraîchissement des permissions pour un utilisateur
   */
  async refreshUserPermissions(req, res, next) {
    try {
      const { userId } = req.params;
      const { permissions = true, menu = false } = req.body;
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid user ID',
          { code: 'INVALID_USER_ID' }
        ));
      }
      
      await realtimePermissionsService.forceRefreshUser(parseInt(userId), { permissions, menu });
      
      res.status(200).json(createResponse(
        true,
        'User permissions refreshed successfully',
        {
          userId: parseInt(userId),
          refreshedAt: new Date().toISOString(),
          options: { permissions, menu }
        }
      ));
    } catch (error) {
      logger.error(`❌ Failed to refresh permissions for user ${req.params.userId}:`, error);
      next(error);
    }
  }

  /**
   * Envoie une notification broadcast à tous les utilisateurs connectés
   */
  async broadcastNotification(req, res, next) {
    try {
      const { title, message, type = 'info', data = {} } = req.body;
      
      if (!title || !message) {
        return res.status(400).json(createResponse(
          false,
          'Title and message are required',
          { code: 'MISSING_REQUIRED_FIELDS' }
        ));
      }
      
      await realtimePermissionsService.broadcastNotification({
        title,
        message,
        type,
        data,
        sentBy: req.user.id
      });
      
      res.status(200).json(createResponse(
        true,
        'Notification broadcasted successfully',
        {
          title,
          message,
          type,
          sentAt: new Date().toISOString()
        }
      ));
    } catch (error) {
      logger.error('❌ Failed to broadcast notification:', error);
      next(error);
    }
  }

  /**
   * Retourne les statistiques du service temps réel
   */
  async getRealtimeStats(req, res, next) {
    try {
      const stats = realtimePermissionsService.getStats();
      
      res.status(200).json(createResponse(
        true,
        'Realtime service statistics retrieved successfully',
        stats
      ));
    } catch (error) {
      logger.error('❌ Failed to get realtime stats:', error);
      next(error);
    }
  }

  /**
   * Endpoint SSE pour le rafraîchissement des permissions
   */
  async permissionsSSE(req, res) {
    try {
      const userId = req.user.id;
      
      // Configuration des headers SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      
      logger.info(`📡 User ${userId} connected to permissions SSE`);
      
      // Envoyer les permissions initiales
      const permissionsService = require('../../services/permissions.service');
      const menuService = require('../../services/menu.service');
      
      const [permissions, roles, menu] = await Promise.all([
        permissionsService.getUserPermissions(userId),
        permissionsService.getUserRoles(userId),
        menuService.generateUserMenu(userId)
      ]);
      
      const initialData = {
        type: 'initial_data',
        userId,
        data: { permissions, roles, menu },
        timestamp: Date.now()
      };
      
      res.write(`data: ${JSON.stringify(initialData)}\n\n`);
      
      // Envoyer un ping toutes les 30 secondes pour maintenir la connexion
      const pingInterval = setInterval(() => {
        res.write(`data: ${JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        })}\n\n`);
      }, 30000);
      
      // Nettoyer à la déconnexion
      req.on('close', () => {
        clearInterval(pingInterval);
        logger.info(`🔌 User ${userId} disconnected from permissions SSE`);
      });
      
    } catch (error) {
      logger.error('❌ Error in permissions SSE:', error);
      if (!res.headersSent) {
        res.status(500).json(createResponse(
          false,
          'Internal server error',
          { code: 'SSE_ERROR' }
        ));
      }
    }
  }

  /**
   * Crée un menu personnalisé
   */
  async createCustomMenu(req, res, next) {
    try {
      const menuData = req.body;
      
      // Validation de base
      if (!menuData.code || !menuData.label) {
        return res.status(400).json(createResponse(
          false,
          'Menu code and label are required',
          { code: 'MISSING_REQUIRED_FIELDS' }
        ));
      }
      
      const menu = await menuService.createCustomMenu(menuData);
      
      res.status(201).json(createResponse(
        true,
        'Custom menu created successfully',
        menu
      ));
    } catch (error) {
      logger.error('❌ Failed to create custom menu:', error);
      next(error);
    }
  }

  /**
   * Assigne un menu personnalisé à un utilisateur
   */
  async assignCustomMenu(req, res, next) {
    try {
      const { userId } = req.params;
      const { menuId } = req.body;
      
      if (!userId || isNaN(userId) || !menuId || isNaN(menuId)) {
        return res.status(400).json(createResponse(
          false,
          'Invalid user ID or menu ID',
          { code: 'INVALID_IDS' }
        ));
      }
      
      await menuService.assignMenuToUser(parseInt(userId), parseInt(menuId));
      
      // Rafraîchir le menu de l'utilisateur
      await realtimePermissionsService.forceRefreshUser(parseInt(userId), { menu: true });
      
      res.status(200).json(createResponse(
        true,
        'Custom menu assigned successfully',
        {
          userId: parseInt(userId),
          menuId: parseInt(menuId),
          assignedAt: new Date().toISOString()
        }
      ));
    } catch (error) {
      logger.error(`❌ Failed to assign custom menu to user ${req.params.userId}:`, error);
      next(error);
    }
  }

  /**
   * Test du système temps réel
   */
  async testRealtime(req, res, next) {
    try {
      const { message = 'Test message', userId } = req.body;
      
      if (userId) {
        // Test pour un utilisateur spécifique
        await realtimePermissionsService.forceRefreshUser(parseInt(userId), { 
          permissions: true, 
          menu: true 
        });
      } else {
        // Test broadcast
        await realtimePermissionsService.broadcastNotification({
          title: 'Test Notification',
          message,
          type: 'test'
        });
      }
      
      res.status(200).json(createResponse(
        true,
        'Realtime test completed successfully',
        {
          message,
          userId: userId || 'broadcast',
          testedAt: new Date().toISOString()
        }
      ));
    } catch (error) {
      logger.error('❌ Failed realtime test:', error);
      next(error);
    }
  }
}

module.exports = new RealtimeController();
module.exports.RealtimeController = RealtimeController;
