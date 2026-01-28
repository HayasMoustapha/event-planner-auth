/**
 * SEEDER RBAC - PEUPLEMENT AUTOMATIQUE DES ROLES ET PERMISSIONS
 * Initialise la base de données avec les rôles et permissions par défaut
 */

const { connection } = require('../../config/database');
const logger = require('../../utils/logger');

class RbacSeeder {
  constructor() {
    this.defaultRoles = [
      {
        code: 'super_admin',
        label: { en: 'Super Administrator', fr: 'Super Administrateur' },
        description: { en: 'Full system access', fr: 'Accès complet au système' },
        group: 'administration'
      },
      {
        code: 'admin',
        label: { en: 'Administrator', fr: 'Administrateur' },
        description: { en: 'System administration', fr: 'Administration du système' },
        group: 'administration'
      },
      {
        code: 'organizer',
        label: { en: 'Event Organizer', fr: 'Organisateur d\'événements' },
        description: { en: 'Event management and organization', fr: 'Gestion et organisation des événements' },
        group: 'events'
      },
      {
        code: 'event_manager',
        label: { en: 'Event Manager', fr: 'Gestionnaire d\'événements' },
        description: { en: 'Event coordination and management', fr: 'Coordination et gestion des événements' },
        group: 'events'
      },
      {
        code: 'ticket_manager',
        label: { en: 'Ticket Manager', fr: 'Gestionnaire de billets' },
        description: { en: 'Ticket generation and validation', fr: 'Génération et validation des billets' },
        group: 'tickets'
      },
      {
        code: 'designer',
        label: { en: 'Designer', fr: 'Designer' },
        description: { en: 'Marketplace and design management', fr: 'Gestion du marketplace et design' },
        group: 'marketplace'
      },
      {
        code: 'guest',
        label: { en: 'Guest', fr: 'Invité' },
        description: { en: 'Basic guest access', fr: 'Accès invité de base' },
        group: 'users'
      }
    ];

    this.defaultPermissions = [
      // Administration permissions
      { code: 'admin.access', group: 'administration', label: { en: 'Admin Access', fr: 'Accès Admin' } },
      { code: 'users.create', group: 'administration', label: { en: 'Create Users', fr: 'Créer Utilisateurs' } },
      { code: 'users.read', group: 'administration', label: { en: 'Read Users', fr: 'Lire Utilisateurs' } },
      { code: 'users.update', group: 'administration', label: { en: 'Update Users', fr: 'Mettre à Jour Utilisateurs' } },
      { code: 'users.delete', group: 'administration', label: { en: 'Delete Users', fr: 'Supprimer Utilisateurs' } },
      { code: 'roles.manage', group: 'administration', label: { en: 'Manage Roles', fr: 'Gérer les Rôles' } },
      { code: 'permissions.manage', group: 'administration', label: { en: 'Manage Permissions', fr: 'Gérer les Permissions' } },

      // Events permissions
      { code: 'events.create', group: 'events', label: { en: 'Create Events', fr: 'Créer Événements' } },
      { code: 'events.read', group: 'events', label: { en: 'Read Events', fr: 'Lire Événements' } },
      { code: 'events.update', group: 'events', label: { en: 'Update Events', fr: 'Mettre à Jour Événements' } },
      { code: 'events.delete', group: 'events', label: { en: 'Delete Events', fr: 'Supprimer Événements' } },
      { code: 'events.publish', group: 'events', label: { en: 'Publish Events', fr: 'Publier Événements' } },
      { code: 'events.analytics', group: 'events', label: { en: 'Event Analytics', fr: 'Analytiques Événements' } },

      // Tickets permissions
      { code: 'tickets.generate', group: 'tickets', label: { en: 'Generate Tickets', fr: 'Générer Billets' } },
      { code: 'tickets.validate', group: 'tickets', label: { en: 'Validate Tickets', fr: 'Valider Billets' } },
      { code: 'tickets.read', group: 'tickets', label: { en: 'Read Tickets', fr: 'Lire Billets' } },
      { code: 'tickets.cancel', group: 'tickets', label: { en: 'Cancel Tickets', fr: 'Annuler Billets' } },
      { code: 'tickets.refund', group: 'tickets', label: { en: 'Refund Tickets', fr: 'Rembourser Billets' } },

      // Guests permissions
      { code: 'guests.manage', group: 'users', label: { en: 'Manage Guests', fr: 'Gérer les Invités' } },
      { code: 'guests.read', group: 'users', label: { en: 'Read Guests', fr: 'Lire les Invités' } },
      { code: 'guests.checkin', group: 'users', label: { en: 'Guest Check-in', fr: 'Check-in Invités' } },

      // Notifications permissions
      { code: 'notifications.email.send', group: 'notifications', label: { en: 'Send Email Notifications', fr: 'Envoyer Notifications Email' } },
      { code: 'notifications.sms.send', group: 'notifications', label: { en: 'Send SMS Notifications', fr: 'Envoyer Notifications SMS' } },
      { code: 'notifications.manage', group: 'notifications', label: { en: 'Manage Notifications', fr: 'Gérer les Notifications' } },

      // Payments permissions
      { code: 'payments.process', group: 'payments', label: { en: 'Process Payments', fr: 'Traiter Paiements' } },
      { code: 'payments.read', group: 'payments', label: { en: 'Read Payments', fr: 'Lire Paiements' } },
      { code: 'payments.refund', group: 'payments', label: { en: 'Refund Payments', fr: 'Rembourser Paiements' } },

      // Marketplace permissions
      { code: 'marketplace.create', group: 'marketplace', label: { en: 'Create Marketplace Items', fr: 'Créer Items Marketplace' } },
      { code: 'marketplace.read', group: 'marketplace', label: { en: 'Read Marketplace', fr: 'Lire Marketplace' } },
      { code: 'marketplace.update', group: 'marketplace', label: { en: 'Update Marketplace', fr: 'Mettre à Jour Marketplace' } },
      { code: 'marketplace.delete', group: 'marketplace', label: { en: 'Delete Marketplace', fr: 'Supprimer Marketplace' } },

      // System permissions
      { code: 'system.health', group: 'system', label: { en: 'System Health', fr: 'Santé Système' } },
      { code: 'system.logs', group: 'system', label: { en: 'System Logs', fr: 'Journaux Système' } },
      { code: 'system.backup', group: 'system', label: { en: 'System Backup', fr: 'Sauvegarde Système' } }
    ];

    this.rolePermissions = {
      'super_admin': this.defaultPermissions.map(p => p.code), // All permissions
      'admin': [
        'admin.access', 'users.create', 'users.read', 'users.update', 'users.delete',
        'roles.manage', 'permissions.manage', 'events.create', 'events.read', 'events.update', 'events.delete',
        'tickets.generate', 'tickets.validate', 'tickets.read', 'notifications.email.send', 'notifications.sms.send',
        'payments.process', 'payments.read', 'guests.manage', 'guests.read', 'marketplace.read',
        'system.health', 'system.logs'
      ],
      'organizer': [
        'events.create', 'events.read', 'events.update', 'events.delete', 'events.publish', 'events.analytics',
        'tickets.generate', 'tickets.validate', 'tickets.read', 'guests.manage', 'guests.read', 'guests.checkin',
        'notifications.email.send', 'notifications.sms.send', 'payments.read'
      ],
      'event_manager': [
        'events.create', 'events.read', 'events.update', 'events.publish', 'events.analytics',
        'tickets.generate', 'tickets.validate', 'tickets.read', 'guests.manage', 'guests.read',
        'notifications.email.send', 'notifications.sms.send'
      ],
      'ticket_manager': [
        'tickets.generate', 'tickets.validate', 'tickets.read', 'tickets.cancel', 'tickets.refund',
        'guests.read', 'guests.checkin'
      ],
      'designer': [
        'marketplace.create', 'marketplace.read', 'marketplace.update', 'marketplace.delete'
      ],
      'guest': [
        'events.read', 'tickets.read', 'guests.read'
      ]
    };
  }

  /**
   * Exécute tout le peuplement RBAC
   */
  async seed() {
    try {
      logger.info('🌱 Starting RBAC seeding...');
      
      await this.seedRoles();
      await this.seedPermissions();
      await this.seedAuthorizations();
      
      logger.info('✅ RBAC seeding completed successfully');
      return { success: true, message: 'RBAC seeding completed' };
    } catch (error) {
      logger.error('❌ RBAC seeding failed:', error);
      throw error;
    }
  }

  /**
   * Peuple les rôles par défaut
   */
  async seedRoles() {
    logger.info('📋 Seeding roles...');
    
    for (const role of this.defaultRoles) {
      const query = `
        INSERT INTO roles (code, label, "group", description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (code) DO UPDATE SET
          label = EXCLUDED.label,
          "group" = EXCLUDED."group",
          description = EXCLUDED.description,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, code
      `;
      
      await connection.query(query, [
        role.code,
        JSON.stringify(role.label),
        role.group,
        JSON.stringify(role.description)
      ]);
    }
    
    logger.info(`✅ ${this.defaultRoles.length} roles seeded`);
  }

  /**
   * Peuple les permissions par défaut
   */
  async seedPermissions() {
    logger.info('🔐 Seeding permissions...');
    
    for (const permission of this.defaultPermissions) {
      const query = `
        INSERT INTO permissions (code, label, "group", description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (code) DO UPDATE SET
          label = EXCLUDED.label,
          "group" = EXCLUDED."group",
          description = EXCLUDED.description,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, code
      `;
      
      await connection.query(query, [
        permission.code,
        JSON.stringify(permission.label),
        permission.group,
        JSON.stringify(permission.description || {})
      ]);
    }
    
    logger.info(`✅ ${this.defaultPermissions.length} permissions seeded`);
  }

  /**
   * Peuple les autorisations (rôle-permission)
   */
  async seedAuthorizations() {
    logger.info('🔗 Seeding authorizations...');
    
    for (const [roleCode, permissionCodes] of Object.entries(this.rolePermissions)) {
      // Récupérer l'ID du rôle
      const roleResult = await connection.query(
        'SELECT id FROM roles WHERE code = $1',
        [roleCode]
      );
      
      if (roleResult.rows.length === 0) {
        logger.warn(`⚠️ Role ${roleCode} not found, skipping authorizations`);
        continue;
      }
      
      const roleId = roleResult.rows[0].id;
      
      // Pour chaque permission, créer l'autorisation
      for (const permissionCode of permissionCodes) {
        const permissionResult = await connection.query(
          'SELECT id FROM permissions WHERE code = $1',
          [permissionCode]
        );
        
        if (permissionResult.rows.length === 0) {
          logger.warn(`⚠️ Permission ${permissionCode} not found, skipping authorization`);
          continue;
        }
        
        const permissionId = permissionResult.rows[0].id;
        
        // Insérer l'autorisation
        await connection.query(`
          INSERT INTO authorizations (role_id, permission_id, created_at, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [roleId, permissionId]);
      }
    }
    
    logger.info('✅ Authorizations seeded');
  }

  /**
   * Assigne le rôle super_admin à un utilisateur
   */
  async assignSuperAdmin(userId) {
    try {
      const roleResult = await connection.query(
        'SELECT id FROM roles WHERE code = $1',
        ['super_admin']
      );
      
      if (roleResult.rows.length === 0) {
        throw new Error('Super admin role not found');
      }
      
      const roleId = roleResult.rows[0].id;
      
      await connection.query(`
        INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, [userId, roleId]);
      
      logger.info(`✅ Super admin role assigned to user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error(`❌ Failed to assign super admin role to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie si le peuplement a déjà été fait
   */
  async isSeeded() {
    const rolesCount = await connection.query('SELECT COUNT(*) as count FROM roles');
    const permissionsCount = await connection.query('SELECT COUNT(*) as count FROM permissions');
    
    return {
      roles: parseInt(rolesCount.rows[0].count) >= this.defaultRoles.length,
      permissions: parseInt(permissionsCount.rows[0].count) >= this.defaultPermissions.length
    };
  }
}

module.exports = new RbacSeeder();
module.exports.RbacSeeder = RbacSeeder;
