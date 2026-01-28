/**
 * SERVICE DE MENUS DYNAMIQUE
 * Génère les menus basés sur les rôles et permissions de l'utilisateur
 */

const { connection } = require('../config/database');
const logger = require('../utils/logger');
const permissionsService = require('./permissions.service');

class MenuService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    
    // Structure des menus par défaut
    this.defaultMenuStructure = {
      dashboard: {
        id: 'dashboard',
        label: { en: 'Dashboard', fr: 'Tableau de bord' },
        icon: 'dashboard',
        route: '/dashboard',
        order: 1,
        permissions: ['admin.access', 'events.read', 'tickets.read']
      },
      
      // Administration
      users: {
        id: 'users',
        label: { en: 'Users', fr: 'Utilisateurs' },
        icon: 'users',
        route: '/admin/users',
        order: 10,
        permissions: ['users.read'],
        children: {
          list: {
            id: 'users-list',
            label: { en: 'All Users', fr: 'Tous les utilisateurs' },
            route: '/admin/users',
            permissions: ['users.read']
          },
          create: {
            id: 'users-create',
            label: { en: 'Create User', fr: 'Créer un utilisateur' },
            route: '/admin/users/create',
            permissions: ['users.create']
          },
          roles: {
            id: 'users-roles',
            label: { en: 'Roles & Permissions', fr: 'Rôles & Permissions' },
            route: '/admin/roles',
            permissions: ['roles.manage', 'permissions.manage']
          }
        }
      },
      
      // Events
      events: {
        id: 'events',
        label: { en: 'Events', fr: 'Événements' },
        icon: 'events',
        route: '/events',
        order: 20,
        permissions: ['events.read'],
        children: {
          list: {
            id: 'events-list',
            label: { en: 'My Events', fr: 'Mes événements' },
            route: '/events',
            permissions: ['events.read']
          },
          create: {
            id: 'events-create',
            label: { en: 'Create Event', fr: 'Créer un événement' },
            route: '/events/create',
            permissions: ['events.create']
          },
          calendar: {
            id: 'events-calendar',
            label: { en: 'Calendar', fr: 'Calendrier' },
            route: '/events/calendar',
            permissions: ['events.read']
          },
          analytics: {
            id: 'events-analytics',
            label: { en: 'Analytics', fr: 'Analytiques' },
            route: '/events/analytics',
            permissions: ['events.analytics']
          }
        }
      },
      
      // Tickets
      tickets: {
        id: 'tickets',
        label: { en: 'Tickets', fr: 'Billets' },
        icon: 'tickets',
        route: '/tickets',
        order: 30,
        permissions: ['tickets.read'],
        children: {
          generate: {
            id: 'tickets-generate',
            label: { en: 'Generate Tickets', fr: 'Générer des billets' },
            route: '/tickets/generate',
            permissions: ['tickets.generate']
          },
          validate: {
            id: 'tickets-validate',
            label: { en: 'Validate Tickets', fr: 'Valider des billets' },
            route: '/tickets/validate',
            permissions: ['tickets.validate']
          },
          history: {
            id: 'tickets-history',
            label: { en: 'Ticket History', fr: 'Historique des billets' },
            route: '/tickets/history',
            permissions: ['tickets.read']
          }
        }
      },
      
      // Guests
      guests: {
        id: 'guests',
        label: { en: 'Guests', fr: 'Invités' },
        icon: 'guests',
        route: '/guests',
        order: 40,
        permissions: ['guests.read'],
        children: {
          list: {
            id: 'guests-list',
            label: { en: 'Guest List', fr: 'Liste des invités' },
            route: '/guests',
            permissions: ['guests.read']
          },
          checkin: {
            id: 'guests-checkin',
            label: { en: 'Check-in', fr: 'Check-in' },
            route: '/guests/checkin',
            permissions: ['guests.checkin']
          },
          manage: {
            id: 'guests-manage',
            label: { en: 'Manage Guests', fr: 'Gérer les invités' },
            route: '/guests/manage',
            permissions: ['guests.manage']
          }
        }
      },
      
      // Notifications
      notifications: {
        id: 'notifications',
        label: { en: 'Notifications', fr: 'Notifications' },
        icon: 'notifications',
        route: '/notifications',
        order: 50,
        permissions: ['notifications.email.send', 'notifications.sms.send'],
        children: {
          email: {
            id: 'notifications-email',
            label: { en: 'Email Notifications', fr: 'Notifications Email' },
            route: '/notifications/email',
            permissions: ['notifications.email.send']
          },
          sms: {
            id: 'notifications-sms',
            label: { en: 'SMS Notifications', fr: 'Notifications SMS' },
            route: '/notifications/sms',
            permissions: ['notifications.sms.send']
          },
          history: {
            id: 'notifications-history',
            label: { en: 'Notification History', fr: 'Historique des notifications' },
            route: '/notifications/history',
            permissions: ['notifications.manage']
          }
        }
      },
      
      // Payments
      payments: {
        id: 'payments',
        label: { en: 'Payments', fr: 'Paiements' },
        icon: 'payments',
        route: '/payments',
        order: 60,
        permissions: ['payments.read'],
        children: {
          transactions: {
            id: 'payments-transactions',
            label: { en: 'Transactions', fr: 'Transactions' },
            route: '/payments/transactions',
            permissions: ['payments.read']
          },
          refunds: {
            id: 'payments-refunds',
            label: { en: 'Refunds', fr: 'Remboursements' },
            route: '/payments/refunds',
            permissions: ['payments.refund']
          },
          analytics: {
            id: 'payments-analytics',
            label: { en: 'Payment Analytics', fr: 'Analytiques de paiement' },
            route: '/payments/analytics',
            permissions: ['payments.read']
          }
        }
      },
      
      // Marketplace
      marketplace: {
        id: 'marketplace',
        label: { en: 'Marketplace', fr: 'Marketplace' },
        icon: 'marketplace',
        route: '/marketplace',
        order: 70,
        permissions: ['marketplace.read'],
        children: {
          browse: {
            id: 'marketplace-browse',
            label: { en: 'Browse', fr: 'Parcourir' },
            route: '/marketplace',
            permissions: ['marketplace.read']
          },
          create: {
            id: 'marketplace-create',
            label: { en: 'Create Item', fr: 'Créer un article' },
            route: '/marketplace/create',
            permissions: ['marketplace.create']
          },
          manage: {
            id: 'marketplace-manage',
            label: { en: 'My Items', fr: 'Mes articles' },
            route: '/marketplace/manage',
            permissions: ['marketplace.update']
          }
        }
      },
      
      // System
      system: {
        id: 'system',
        label: { en: 'System', fr: 'Système' },
        icon: 'system',
        route: '/system',
        order: 100,
        permissions: ['admin.access'],
        children: {
          health: {
            id: 'system-health',
            label: { en: 'System Health', fr: 'Santé du système' },
            route: '/system/health',
            permissions: ['system.health']
          },
          logs: {
            id: 'system-logs',
            label: { en: 'System Logs', fr: 'Journaux système' },
            route: '/system/logs',
            permissions: ['system.logs']
          },
          backup: {
            id: 'system-backup',
            label: { en: 'Backup & Restore', fr: 'Sauvegarde & Restauration' },
            route: '/system/backup',
            permissions: ['system.backup']
          }
        }
      }
    };
  }

  /**
   * Génère le menu pour un utilisateur basé sur ses permissions
   * @param {number} userId - ID de l'utilisateur
   * @param {string} language - Langue préférée ('en' ou 'fr')
   * @returns {Promise<Object>} Menu structuré pour l'utilisateur
   */
  async generateUserMenu(userId, language = 'en') {
    const cacheKey = `user_menu_${userId}_${language}`;
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.menu;
      }
    }

    try {
      // Récupérer les permissions de l'utilisateur
      const permissions = await permissionsService.getUserPermissions(userId);
      
      // Générer le menu basé sur les permissions
      const menu = this.buildMenuFromPermissions(permissions, language);
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        menu,
        timestamp: Date.now()
      });

      if (process.env.NODE_ENV === 'development') {
        logger.info(`🍽️ Menu generated for user ${userId}:`, {
          itemCount: Object.keys(menu).length,
          permissions: permissions.length
        });
      }

      return menu;
    } catch (error) {
      logger.error(`Error generating menu for user ${userId}:`, error);
      // Retourner un menu minimal en cas d'erreur
      return this.getMinimalMenu(language);
    }
  }

  /**
   * Construit le menu à partir des permissions
   * @param {Array} permissions - Liste des permissions de l'utilisateur
   * @param {string} language - Langue préférée
   * @returns {Object} Menu structuré
   */
  buildMenuFromPermissions(permissions, language) {
    const menu = {};
    
    // Parcourir la structure de menu par défaut
    for (const [key, item] of Object.entries(this.defaultMenuStructure)) {
      if (this.hasAnyPermission(permissions, item.permissions)) {
        const menuItem = {
          id: item.id,
          label: item.label[language] || item.label.en,
          icon: item.icon,
          route: item.route,
          order: item.order
        };

        // Ajouter les enfants si disponibles
        if (item.children) {
          const children = {};
          
          for (const [childKey, child] of Object.entries(item.children)) {
            if (this.hasAnyPermission(permissions, child.permissions)) {
              children[childKey] = {
                id: child.id,
                label: child.label[language] || child.label.en,
                route: child.route,
                order: child.order || 999
              };
            }
          }

          if (Object.keys(children).length > 0) {
            menuItem.children = children;
          }
        }

        menu[key] = menuItem;
      }
    }

    // Trier par ordre
    const sortedMenu = {};
    Object.keys(menu)
      .sort((a, b) => menu[a].order - menu[b].order)
      .forEach(key => {
        sortedMenu[key] = menu[key];
        
        // Trier aussi les enfants
        if (sortedMenu[key].children) {
          const sortedChildren = {};
          Object.keys(sortedMenu[key].children)
            .sort((a, b) => sortedMenu[key].children[a].order - sortedMenu[key].children[b].order)
            .forEach(childKey => {
              sortedChildren[childKey] = sortedMenu[key].children[childKey];
            });
          sortedMenu[key].children = sortedChildren;
        }
      });

    return sortedMenu;
  }

  /**
   * Vérifie si l'utilisateur a au moins une des permissions requises
   * @param {Array} userPermissions - Permissions de l'utilisateur
   * @param {Array} requiredPermissions - Permissions requises
   * @returns {boolean} True si l'utilisateur a accès
   */
  hasAnyPermission(userPermissions, requiredPermissions) {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  }

  /**
   * Retourne un menu minimal en cas d'erreur
   * @param {string} language - Langue préférée
   * @returns {Object} Menu minimal
   */
  getMinimalMenu(language) {
    return {
      dashboard: {
        id: 'dashboard',
        label: language === 'fr' ? 'Tableau de bord' : 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard',
        order: 1
      }
    };
  }

  /**
   * Récupère les menus personnalisés depuis la base de données
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des menus personnalisés
   */
  async getCustomMenus(userId) {
    try {
      const query = `
        SELECT m.id, m.code, m.label, m.icon, m.route, m."order", m.parent_id,
               m.permissions, m.is_active, m.created_at, m.updated_at
        FROM menus m
        INNER JOIN user_menus um ON m.id = um.menu_id
        WHERE um.user_id = $1 
          AND m.is_active = true 
          AND m.deleted_at IS NULL
          AND um.deleted_at IS NULL
        ORDER BY m."order" ASC
      `;

      const result = await connection.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error(`Error loading custom menus for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Crée un menu personnalisé
   * @param {Object} menuData - Données du menu
   * @returns {Promise<Object>} Menu créé
   */
  async createCustomMenu(menuData) {
    try {
      const { code, label, icon, route, order = 999, parentId, permissions = [], isActive = true } = menuData;
      
      const query = `
        INSERT INTO menus (code, label, icon, route, "order", parent_id, permissions, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const values = [
        code.trim(),
        JSON.stringify(label),
        icon,
        route,
        order,
        parentId || null,
        JSON.stringify(permissions),
        isActive
      ];

      const result = await connection.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating custom menu:', error);
      throw error;
    }
  }

  /**
   * Assigne un menu personnalisé à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} menuId - ID du menu
   * @returns {Promise<void>}
   */
  async assignMenuToUser(userId, menuId) {
    try {
      await connection.query(`
        INSERT INTO user_menus (user_id, menu_id, created_at, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, menu_id) DO NOTHING
      `, [userId, menuId]);
      
      // Vider le cache
      this.cache.clear();
    } catch (error) {
      logger.error(`Error assigning menu ${menuId} to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Vide le cache des menus
   */
  clearCache() {
    this.cache.clear();
    
    if (process.env.NODE_ENV === 'development') {
      logger.info('🗑️ Menu cache cleared');
    }
  }
}

module.exports = new MenuService();
module.exports.MenuService = MenuService;
