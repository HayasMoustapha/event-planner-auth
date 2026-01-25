-- ========================================
-- SEED DES PERMISSIONS SYSTÈME RBAC (POSTGRESQL)
-- ========================================
-- Création des permissions pour le système RBAC
-- Compatible avec le schéma PostgreSQL actuel

-- Insertion des permissions par catégories (IDEMPOTENT)
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
-- Permissions Utilisateurs
('users.create', '{"fr": "Créer utilisateur", "en": "Create user"}', 'users', '{"fr": "Créer de nouveaux utilisateurs", "en": "Create new users"}', NOW(), NOW()),
('users.read', '{"fr": "Voir utilisateur", "en": "Read user"}', 'users', '{"fr": "Voir les détails des utilisateurs", "en": "Read user details"}', NOW(), NOW()),
('users.update', '{"fr": "Modifier utilisateur", "en": "Update user"}', 'users', '{"fr": "Modifier les informations utilisateur", "en": "Update user information"}', NOW(), NOW()),
('users.delete', '{"fr": "Supprimer utilisateur", "en": "Delete user"}', 'users', '{"fr": "Supprimer des utilisateurs", "en": "Delete users"}', NOW(), NOW()),
('users.list', '{"fr": "Lister utilisateurs", "en": "List users"}', 'users', '{"fr": "Lister tous les utilisateurs", "en": "List all users"}', NOW(), NOW()),

-- Permissions Rôles
('roles.create', '{"fr": "Créer rôle", "en": "Create role"}', 'roles', '{"fr": "Créer de nouveaux rôles", "en": "Create new roles"}', NOW(), NOW()),
('roles.read', '{"fr": "Voir rôle", "en": "Read role"}', 'roles', '{"fr": "Voir les détails des rôles", "en": "Read role details"}', NOW(), NOW()),
('roles.update', '{"fr": "Modifier rôle", "en": "Update role"}', 'roles', '{"fr": "Modifier les informations des rôles", "en": "Update role information"}', NOW(), NOW()),
('roles.delete', '{"fr": "Supprimer rôle", "en": "Delete role"}', 'roles', '{"fr": "Supprimer des rôles", "en": "Delete roles"}', NOW(), NOW()),
('roles.list', '{"fr": "Lister rôles", "en": "List roles"}', 'roles', '{"fr": "Lister tous les rôles", "en": "List all roles"}', NOW(), NOW()),
('roles.assign', '{"fr": "Assigner rôle", "en": "Assign role"}', 'roles', '{"fr": "Assigner des rôles aux utilisateurs", "en": "Assign roles to users"}', NOW(), NOW()),

-- Permissions Permissions
('permissions.create', '{"fr": "Créer permission", "en": "Create permission"}', 'permissions', '{"fr": "Créer de nouvelles permissions", "en": "Create new permissions"}', NOW(), NOW()),
('permissions.read', '{"fr": "Voir permission", "en": "Read permission"}', 'permissions', '{"fr": "Voir les détails des permissions", "en": "Read permission details"}', NOW(), NOW()),
('permissions.update', '{"fr": "Modifier permission", "en": "Update permission"}', 'permissions', '{"fr": "Modifier les informations des permissions", "en": "Update permission information"}', NOW(), NOW()),
('permissions.delete', '{"fr": "Supprimer permission", "en": "Delete permission"}', 'permissions', '{"fr": "Supprimer des permissions", "en": "Delete permissions"}', NOW(), NOW()),
('permissions.list', '{"fr": "Lister permissions", "en": "List permissions"}', 'permissions', '{"fr": "Lister toutes les permissions", "en": "List all permissions"}', NOW(), NOW()),

-- Permissions Menus
('menus.create', '{"fr": "Créer menu", "en": "Create menu"}', 'menus', '{"fr": "Créer de nouveaux menus", "en": "Create new menus"}', NOW(), NOW()),
('menus.read', '{"fr": "Voir menu", "en": "Read menu"}', 'menus', '{"fr": "Voir les détails des menus", "en": "Read menu details"}', NOW(), NOW()),
('menus.update', '{"fr": "Modifier menu", "en": "Update menu"}', 'menus', '{"fr": "Modifier les informations des menus", "en": "Update menu information"}', NOW(), NOW()),
('menus.delete', '{"fr": "Supprimer menu", "en": "Delete menu"}', 'menus', '{"fr": "Supprimer des menus", "en": "Delete menus"}', NOW(), NOW()),
('menus.list', '{"fr": "Lister menus", "en": "List menus"}', 'menus', '{"fr": "Lister tous les menus", "en": "List all menus"}', NOW(), NOW()),

-- Permissions Événements
('events.create', '{"fr": "Créer événement", "en": "Create event"}', 'events', '{"fr": "Créer de nouveaux événements", "en": "Create new events"}', NOW(), NOW()),
('events.read', '{"fr": "Voir événement", "en": "Read event"}', 'events', '{"fr": "Voir les détails des événements", "en": "Read event details"}', NOW(), NOW()),
('events.update', '{"fr": "Modifier événement", "en": "Update event"}', 'events', '{"fr": "Modifier les informations des événements", "en": "Update event information"}', NOW(), NOW()),
('events.delete', '{"fr": "Supprimer événement", "en": "Delete event"}', 'events', '{"fr": "Supprimer des événements", "en": "Delete events"}', NOW(), NOW()),
('events.list', '{"fr": "Lister événements", "en": "List events"}', 'events', '{"fr": "Lister tous les événements", "en": "List all events"}', NOW(), NOW()),
('events.manage', '{"fr": "Gérer événements", "en": "Manage events"}', 'events', '{"fr": "Gérer tous les aspects des événements", "en": "Manage all event aspects"}', NOW(), NOW()),

-- Permissions Système
('system.dashboard', '{"fr": "Tableau de bord", "en": "Dashboard"}', 'system', '{"fr": "Accéder au tableau de bord", "en": "Access dashboard"}', NOW(), NOW()),
('system.logs', '{"fr": "Voir logs", "en": "View logs"}', 'system', '{"fr": "Voir les logs système", "en": "View system logs"}', NOW(), NOW()),
('system.settings', '{"fr": "Paramètres système", "en": "System settings"}', 'system', '{"fr": "Configurer les paramètres système", "en": "Configure system settings"}', NOW(), NOW()),
('system.monitoring', '{"fr": "Monitoring", "en": "Monitoring"}', 'system', '{"fr": "Accéder au monitoring système", "en": "Access system monitoring"}', NOW(), NOW()),

-- Permissions OTP
('otp.read', '{"fr": "Voir OTP", "en": "Read OTP"}', 'otp', '{"fr": "Voir les détails des OTP", "en": "Read OTP details"}', NOW(), NOW()),
('otp.manage', '{"fr": "Gérer OTP", "en": "Manage OTP"}', 'otp', '{"fr": "Gérer les OTP (créer, modifier, supprimer)", "en": "Manage OTP (create, update, delete)"}', NOW(), NOW()),
('otp.stats', '{"fr": "Statistiques OTP", "en": "OTP Statistics"}', 'otp', '{"fr": "Voir les statistiques des OTP", "en": "View OTP statistics"}', NOW(), NOW()),

-- Permissions People
('people.create', '{"fr": "Créer personne", "en": "Create person"}', 'people', '{"fr": "Créer de nouvelles personnes", "en": "Create new people"}', NOW(), NOW()),
('people.read', '{"fr": "Voir personne", "en": "Read person"}', 'people', '{"fr": "Voir les détails des personnes", "en": "Read person details"}', NOW(), NOW()),
('people.update', '{"fr": "Modifier personne", "en": "Update person"}', 'people', '{"fr": "Modifier les informations des personnes", "en": "Update person information"}', NOW(), NOW()),
('people.delete', '{"fr": "Supprimer personne", "en": "Delete person"}', 'people', '{"fr": "Supprimer des personnes", "en": "Delete people"}', NOW(), NOW()),
('people.list', '{"fr": "Lister personnes", "en": "List people"}', 'people', '{"fr": "Lister toutes les personnes", "en": "List all people"}', NOW(), NOW()),
('people.stats', '{"fr": "Statistiques personnes", "en": "People Statistics"}', 'people', '{"fr": "Voir les statistiques des personnes", "en": "View people statistics"}', NOW(), NOW()),

-- Permissions Sessions
('sessions.read', '{"fr": "Voir sessions", "en": "Read sessions"}', 'sessions', '{"fr": "Voir les détails des sessions", "en": "Read session details"}', NOW(), NOW()),
('sessions.revoke', '{"fr": "Révoquer sessions", "en": "Revoke sessions"}', 'sessions', '{"fr": "Révoquer des sessions utilisateur", "en": "Revoke user sessions"}', NOW(), NOW()),
('sessions.cleanup', '{"fr": "Nettoyer sessions", "en": "Cleanup sessions"}', 'sessions', '{"fr": "Nettoyer les sessions expirées", "en": "Cleanup expired sessions"}', NOW(), NOW()),
('sessions.monitor', '{"fr": "Monitorer sessions", "en": "Monitor sessions"}', 'sessions', '{"fr": "Surveiller les sessions actives", "en": "Monitor active sessions"}', NOW(), NOW()),

-- Permissions Statistiques avancées
('users.stats', '{"fr": "Statistiques utilisateurs", "en": "Users Statistics"}', 'users', '{"fr": "Voir les statistiques des utilisateurs", "en": "View users statistics"}', NOW(), NOW()),
('roles.view_stats', '{"fr": "Statistiques rôles", "en": "Roles Statistics"}', 'roles', '{"fr": "Voir les statistiques des rôles", "en": "View roles statistics"}', NOW(), NOW()),
('permissions.view_stats', '{"fr": "Statistiques permissions", "en": "Permissions Statistics"}', 'permissions', '{"fr": "Voir les statistiques des permissions", "en": "View permissions statistics"}', NOW(), NOW()),
('menus.view_stats', '{"fr": "Statistiques menus", "en": "Menus Statistics"}', 'menus', '{"fr": "Voir les statistiques des menus", "en": "View menus statistics"}', NOW(), NOW()),

-- Permissions Assignation avancée
('roles.assign_permissions', '{"fr": "Assigner permissions rôle", "en": "Assign role permissions"}', 'roles', '{"fr": "Assigner des permissions aux rôles", "en": "Assign permissions to roles"}', NOW(), NOW()),
('menus.assign_permissions', '{"fr": "Assigner permissions menu", "en": "Assign menu permissions"}', 'menus', '{"fr": "Assigner des permissions aux menus", "en": "Assign permissions to menus"}', NOW(), NOW()),

-- Permissions Système avancées
('system.admin', '{"fr": "Administration système", "en": "System Administration"}', 'system', '{"fr": "Accès complet à l''administration du système", "en": "Full system administration access"}', NOW(), NOW()),
('system.config', '{"fr": "Configuration système", "en": "System Configuration"}', 'system', '{"fr": "Configurer les paramètres système avancés", "en": "Configure advanced system settings"}', NOW(), NOW()),
('system.monitor', '{"fr": "Monitoring système", "en": "System Monitoring"}', 'system', '{"fr": "Accéder au monitoring système avancé", "en": "Access advanced system monitoring"}', NOW(), NOW()),

-- Permissions Administration
('admin.dashboard.read', '{"fr": "Dashboard admin", "en": "Dashboard admin"}', 'admin', '{"fr": "Voir le tableau de bord administrateur", "en": "View administrator dashboard"}', NOW(), NOW()),
('admin.health.read', '{"fr": "Health admin", "en": "Health admin"}', 'admin', '{"fr": "Voir les health checks administrateur", "en": "View administrator health checks"}', NOW(), NOW()),
('admin.metrics.read', '{"fr": "Metrics admin", "en": "Metrics admin"}', 'admin', '{"fr": "Voir les métriques administrateur", "en": "View administrator metrics"}', NOW(), NOW()),
('admin.metrics.reset', '{"fr": "Reset metrics admin", "en": "Reset metrics admin"}', 'admin', '{"fr": "Réinitialiser les métriques administrateur", "en": "Reset administrator metrics"}', NOW(), NOW()),
('admin.security.read', '{"fr": "Security admin", "en": "Security admin"}', 'admin', '{"fr": "Voir les informations de sécurité administrateur", "en": "View administrator security information"}', NOW(), NOW()),

-- Permissions Développeur
('developer.docs.read', '{"fr": "Documentation développeur", "en": "Developer documentation"}', 'developer', '{"fr": "Accéder à la documentation développeur", "en": "Access developer documentation"}', NOW(), NOW()),

-- Permissions ACCESSES (User-Role Management)
('accesses.read', '{"fr": "Lire les accès", "en": "Read accesses"}', 'accesses', '{"fr": "Permet de lire les associations utilisateur-rôle", "en": "Allows reading user-role associations"}', NOW(), NOW()),
('accesses.create', '{"fr": "Créer des accès", "en": "Create accesses"}', 'accesses', '{"fr": "Permet de créer de nouvelles associations utilisateur-rôle", "en": "Allows creating new user-role associations"}', NOW(), NOW()),
('accesses.update', '{"fr": "Mettre à jour les accès", "en": "Update accesses"}', 'accesses', '{"fr": "Permet de modifier les associations utilisateur-rôle existantes", "en": "Allows modifying existing user-role associations"}', NOW(), NOW()),
('accesses.delete', '{"fr": "Supprimer les accès", "en": "Delete accesses"}', 'accesses', '{"fr": "Permet de supprimer (soft delete) les associations utilisateur-rôle", "en": "Allows soft deleting user-role associations"}', NOW(), NOW()),
('accesses.hard_delete', '{"fr": "Supprimer définitivement les accès", "en": "Hard delete accesses"}', 'accesses', '{"fr": "Permet de supprimer définitivement les associations utilisateur-rôle", "en": "Allows hard deleting user-role associations"}', NOW(), NOW()),
('accesses.assign', '{"fr": "Assigner des rôles", "en": "Assign roles"}', 'accesses', '{"fr": "Permet d''assigner plusieurs rôles à un utilisateur", "en": "Allows assigning multiple roles to a user"}', NOW(), NOW()),
('accesses.remove', '{"fr": "Retirer des rôles", "en": "Remove roles"}', 'accesses', '{"fr": "Permet de retirer plusieurs rôles d''un utilisateur", "en": "Allows removing multiple roles from a user"}', NOW(), NOW()),

-- Permissions AUTHORIZATIONS (Role-Permission-Menu Management)
('authorizations.read', '{"fr": "Lire les autorisations", "en": "Read authorizations"}', 'authorizations', '{"fr": "Permet de lire les associations rôle-permission-menu", "en": "Allows reading role-permission-menu associations"}', NOW(), NOW()),
('authorizations.create', '{"fr": "Créer des autorisations", "en": "Create authorizations"}', 'authorizations', '{"fr": "Permet de créer de nouvelles associations rôle-permission-menu", "en": "Allows creating new role-permission-menu associations"}', NOW(), NOW()),
('authorizations.update', '{"fr": "Mettre à jour les autorisations", "en": "Update authorizations"}', 'authorizations', '{"fr": "Permet de modifier les associations rôle-permission-menu existantes", "en": "Allows modifying existing role-permission-menu associations"}', NOW(), NOW()),
('authorizations.delete', '{"fr": "Supprimer les autorisations", "en": "Delete authorizations"}', 'authorizations', '{"fr": "Permet de supprimer (soft delete) les associations rôle-permission-menu", "en": "Allows soft deleting role-permission-menu associations"}', NOW(), NOW()),
('authorizations.hard_delete', '{"fr": "Supprimer définitivement les autorisations", "en": "Hard delete authorizations"}', 'authorizations', '{"fr": "Permet de supprimer définitivement les associations rôle-permission-menu", "en": "Allows hard deleting role-permission-menu associations"}', NOW(), NOW()),
('authorizations.check', '{"fr": "Vérifier les autorisations", "en": "Check authorizations"}', 'authorizations', '{"fr": "Permet de vérifier les permissions d''un utilisateur", "en": "Allows checking user permissions"}', NOW(), NOW()),
('authorizations.cache', '{"fr": "Gérer le cache d''autorisations", "en": "Manage authorization cache"}', 'authorizations', '{"fr": "Permet de gérer le cache des autorisations utilisateur", "en": "Allows managing user authorization cache"}', NOW(), NOW()),

-- Permissions Système avancées (complément)
('system.monitoring', '{"fr": "Monitoring système", "en": "System monitoring"}', 'system', '{"fr": "Permet d''accéder aux outils de monitoring", "en": "Allows accessing monitoring tools"}', NOW(), NOW()),
('system.audit', '{"fr": "Audit système", "en": "System audit"}', 'system', '{"fr": "Permet d''accéder aux logs et rapports d''audit", "en": "Allows accessing audit logs and reports"}', NOW(), NOW()),

-- Permissions Events (Core Service)
('events.publish', '{"fr": "Publier événement", "en": "Publish event"}', 'events', '{"fr": "Publier un événement", "en": "Publish an event"}', NOW(), NOW()),
('events.unpublish', '{"fr": "Dépublier événement", "en": "Unpublish event"}', 'events', '{"fr": "Dépublier un événement", "en": "Unpublish an event"}', NOW(), NOW()),
('events.archive', '{"fr": "Archiver événement", "en": "Archive event"}', 'events', '{"fr": "Archiver un événement", "en": "Archive an event"}', NOW(), NOW()),
('events.restore', '{"fr": "Restaurer événement", "en": "Restore event"}', 'events', '{"fr": "Restaurer un événement", "en": "Restore an event"}', NOW(), NOW()),
('events.stats.read', '{"fr": "Statistiques événements", "en": "Event statistics"}', 'events', '{"fr": "Voir les statistiques des événements", "en": "View event statistics"}', NOW(), NOW()),

-- Permissions Tickets (Core Service)
('tickets.validate', '{"fr": "Valider ticket", "en": "Validate ticket"}', 'tickets', '{"fr": "Valider un ticket", "en": "Validate a ticket"}', NOW(), NOW()),
('tickets.process', '{"fr": "Traiter ticket", "en": "Process ticket"}', 'tickets', '{"fr": "Traiter un ticket", "en": "Process a ticket"}', NOW(), NOW()),
('tickets.generate', '{"fr": "Générer ticket", "en": "Generate ticket"}', 'tickets', '{"fr": "Générer un ticket", "en": "Generate a ticket"}', NOW(), NOW()),
('tickets.stats.read', '{"fr": "Statistiques tickets", "en": "Ticket statistics"}', 'tickets', '{"fr": "Voir les statistiques des tickets", "en": "View ticket statistics"}', NOW(), NOW()),

-- Permissions Guests (Core Service)
('guests.create', '{"fr": "Créer invité", "en": "Create guest"}', 'guests', '{"fr": "Créer un nouvel invité", "en": "Create a new guest"}', NOW(), NOW()),
('guests.read', '{"fr": "Voir invité", "en": "Read guest"}', 'guests', '{"fr": "Voir les détails des invités", "en": "Read guest details"}', NOW(), NOW()),
('guests.update', '{"fr": "Modifier invité", "en": "Update guest"}', 'guests', '{"fr": "Modifier les informations d''un invité", "en": "Update guest information"}', NOW(), NOW()),
('guests.delete', '{"fr": "Supprimer invité", "en": "Delete guest"}', 'guests', '{"fr": "Supprimer un invité", "en": "Delete a guest"}', NOW(), NOW()),
('guests.import', '{"fr": "Importer invités", "en": "Import guests"}', 'guests', '{"fr": "Importer des invités", "en": "Import guests"}', NOW(), NOW()),
('guests.export', '{"fr": "Exporter invités", "en": "Export guests"}', 'guests', '{"fr": "Exporter des invités", "en": "Export guests"}', NOW(), NOW()),

-- Permissions Marketplace (Core Service)
('marketplace.read', '{"fr": "Lire marketplace", "en": "Read marketplace"}', 'marketplace', '{"fr": "Lire le contenu du marketplace", "en": "Read marketplace content"}', NOW(), NOW()),
('marketplace.purchase', '{"fr": "Acheter marketplace", "en": "Purchase marketplace"}', 'marketplace', '{"fr": "Acheter sur le marketplace", "en": "Purchase on marketplace"}', NOW(), NOW()),
('marketplace.moderate', '{"fr": "Modérer marketplace", "en": "Moderate marketplace"}', 'marketplace', '{"fr": "Modérer les templates et designers", "en": "Moderate templates and designers"}', NOW(), NOW()),

-- Permissions Notifications (Notification Service)
('notifications.email.send', '{"fr": "Envoyer email", "en": "Send email"}', 'notifications', '{"fr": "Envoyer des emails", "en": "Send emails"}', NOW(), NOW()),
('notifications.sms.send', '{"fr": "Envoyer SMS", "en": "Send SMS"}', 'notifications', '{"fr": "Envoyer des SMS", "en": "Send SMS"}', NOW(), NOW()),
('notifications.email.queue', '{"fr": "Mettre email en file", "en": "Queue email"}', 'notifications', '{"fr": "Mettre des emails en file d''attente", "en": "Queue emails"}', NOW(), NOW()),
('notifications.sms.queue', '{"fr": "Mettre SMS en file", "en": "Queue SMS"}', 'notifications', '{"fr": "Mettre des SMS en file d''attente", "en": "Queue SMS"}', NOW(), NOW()),
('notifications.email.bulk', '{"fr": "Emails en lot", "en": "Bulk emails"}', 'notifications', '{"fr": "Envoyer des emails en lot", "en": "Send bulk emails"}', NOW(), NOW()),
('notifications.sms.bulk', '{"fr": "SMS en lot", "en": "Bulk SMS"}', 'notifications', '{"fr": "Envoyer des SMS en lot", "en": "Send bulk SMS"}', NOW(), NOW()),
('notifications.bulk.mixed', '{"fr": "Notifications mixtes", "en": "Mixed notifications"}', 'notifications', '{"fr": "Envoyer des notifications mixtes en lot", "en": "Send mixed bulk notifications"}', NOW(), NOW()),
('notifications.jobs.read', '{"fr": "Lire jobs notifications", "en": "Read notification jobs"}', 'notifications', '{"fr": "Voir les jobs de notifications", "en": "View notification jobs"}', NOW(), NOW()),
('notifications.jobs.cancel', '{"fr": "Annuler job notification", "en": "Cancel notification job"}', 'notifications', '{"fr": "Annuler un job de notification", "en": "Cancel a notification job"}', NOW(), NOW()),
('notifications.stats.read', '{"fr": "Statistiques notifications", "en": "Notification statistics"}', 'notifications', '{"fr": "Voir les statistiques des notifications", "en": "View notification statistics"}', NOW(), NOW()),
('notifications.admin', '{"fr": "Admin notifications", "en": "Notifications admin"}', 'notifications', '{"fr": "Administration du service de notifications", "en": "Notifications service administration"}', NOW(), NOW()),
('notifications.welcome.send', '{"fr": "Envoyer bienvenue", "en": "Send welcome"}', 'notifications', '{"fr": "Envoyer des messages de bienvenue", "en": "Send welcome messages"}', NOW(), NOW()),
('notifications.password-reset.send', '{"fr": "Envoyer réinitialisation mot de passe", "en": "Send password reset"}', 'notifications', '{"fr": "Envoyer des emails/SMS de réinitialisation de mot de passe", "en": "Send password reset emails/SMS"}', NOW(), NOW()),
('notifications.event-confirmation.send', '{"fr": "Envoyer confirmation événement", "en": "Send event confirmation"}', 'notifications', '{"fr": "Envoyer des confirmations d''événement", "en": "Send event confirmations"}', NOW(), NOW()),
('notifications.otp.send', '{"fr": "Envoyer OTP", "en": "Send OTP"}', 'notifications', '{"fr": "Envoyer des codes OTP", "en": "Send OTP codes"}', NOW(), NOW()),

-- Permissions Payments (Payment Service)
('payments.stripe.create', '{"fr": "Créer paiement Stripe", "en": "Create Stripe payment"}', 'payments', '{"fr": "Créer des paiements Stripe", "en": "Create Stripe payments"}', NOW(), NOW()),
('payments.customers.read', '{"fr": "Lire clients", "en": "Read customers"}', 'payments', '{"fr": "Voir les informations des clients", "en": "Read customer information"}', NOW(), NOW()),
('payments.customers.create', '{"fr": "Créer client", "en": "Create customer"}', 'payments', '{"fr": "Créer de nouveaux clients", "en": "Create new customers"}', NOW(), NOW()),
('payments.payment-methods.create', '{"fr": "Créer méthode paiement", "en": "Create payment method"}', 'payments', '{"fr": "Créer des méthodes de paiement", "en": "Create payment methods"}', NOW(), NOW()),
('payments.payment-methods.read', '{"fr": "Lire méthodes paiement", "en": "Read payment methods"}', 'payments', '{"fr": "Voir les méthodes de paiement", "en": "Read payment methods"}', NOW(), NOW()),
('payments.paypal.create', '{"fr": "Créer paiement PayPal", "en": "Create PayPal payment"}', 'payments', '{"fr": "Créer des paiements PayPal", "en": "Create PayPal payments"}', NOW(), NOW()),
('payments.paypal.capture', '{"fr": "Capturer paiement PayPal", "en": "Capture PayPal payment"}', 'payments', '{"fr": "Capturer des paiements PayPal", "en": "Capture PayPal payments"}', NOW(), NOW()),
('payments.read', '{"fr": "Lire paiements", "en": "Read payments"}', 'payments', '{"fr": "Voir les détails des paiements", "en": "Read payment details"}', NOW(), NOW()),
('payments.cancel', '{"fr": "Annuler paiement", "en": "Cancel payment"}', 'payments', '{"fr": "Annuler des paiements", "en": "Cancel payments"}', NOW(), NOW()),
('payments.refunds.create', '{"fr": "Créer remboursement", "en": "Create refund"}', 'payments', '{"fr": "Créer des remboursements", "en": "Create refunds"}', NOW(), NOW()),
('payments.refunds.read', '{"fr": "Lire remboursements", "en": "Read refunds"}', 'payments', '{"fr": "Voir les détails des remboursements", "en": "Read refund details"}', NOW(), NOW()),
('payments.invoices.create', '{"fr": "Créer facture", "en": "Create invoice"}', 'payments', '{"fr": "Générer des factures", "en": "Generate invoices"}', NOW(), NOW()),
('payments.invoices.read', '{"fr": "Lire factures", "en": "Read invoices"}', 'payments', '{"fr": "Voir les factures", "en": "Read invoices"}', NOW(), NOW()),
('payments.stats.read', '{"fr": "Statistiques paiements", "en": "Payment statistics"}', 'payments', '{"fr": "Voir les statistiques des paiements", "en": "View payment statistics"}', NOW(), NOW()),

-- Permissions Scans (Scan Validation Service)
('scans.validate', '{"fr": "Valider scan", "en": "Validate scan"}', 'scans', '{"fr": "Valider des scans de tickets", "en": "Validate ticket scans"}', NOW(), NOW()),
('scans.validate.offline', '{"fr": "Valider scan offline", "en": "Validate offline scan"}', 'scans', '{"fr": "Valider des scans en mode offline", "en": "Validate scans in offline mode"}', NOW(), NOW()),
('scans.qr.generate', '{"fr": "Générer QR code", "en": "Generate QR code"}', 'scans', '{"fr": "Générer des QR codes", "en": "Generate QR codes"}', NOW(), NOW()),
('scans.qr.batch', '{"fr": "QR codes en lot", "en": "Batch QR codes"}', 'scans', '{"fr": "Générer des QR codes en lot", "en": "Generate batch QR codes"}', NOW(), NOW()),
('scans.qr.test', '{"fr": "Tester QR code", "en": "Test QR code"}', 'scans', '{"fr": "Générer des QR codes de test", "en": "Generate test QR codes"}', NOW(), NOW()),
('scans.qr.decode', '{"fr": "Décoder QR code", "en": "Decode QR code"}', 'scans', '{"fr": "Décoder et valider des QR codes", "en": "Decode and validate QR codes"}', NOW(), NOW()),
('scans.history.read', '{"fr": "Lire historique scans", "en": "Read scan history"}', 'scans', '{"fr": "Voir l''historique des scans", "en": "View scan history"}', NOW(), NOW()),
('scans.stats.read', '{"fr": "Statistiques scans", "en": "Scan statistics"}', 'scans', '{"fr": "Voir les statistiques des scans", "en": "View scan statistics"}', NOW(), NOW()),
('scans.reports.generate', '{"fr": "Générer rapport scans", "en": "Generate scan reports"}', 'scans', '{"fr": "Générer des rapports de validation", "en": "Generate validation reports"}', NOW(), NOW()),
('scans.offline.sync', '{"fr": "Synchroniser offline", "en": "Sync offline"}', 'scans', '{"fr": "Synchroniser les données offline", "en": "Sync offline data"}', NOW(), NOW()),
('scans.offline.read', '{"fr": "Lire données offline", "en": "Read offline data"}', 'scans', '{"fr": "Voir les données offline", "en": "Read offline data"}', NOW(), NOW()),
('scans.offline.cleanup', '{"fr": "Nettoyer offline", "en": "Cleanup offline"}', 'scans', '{"fr": "Nettoyer les données offline expirées", "en": "Cleanup expired offline data"}', NOW(), NOW()),

-- Permissions Ticket Generator (Generator Service)
('tickets.batch.create', '{"fr": "Créer tickets en lot", "en": "Create batch tickets"}', 'tickets', '{"fr": "Générer des tickets en lot", "en": "Generate batch tickets"}', NOW(), NOW()),
('tickets.pdf.create', '{"fr": "Créer PDF ticket", "en": "Create ticket PDF"}', 'tickets', '{"fr": "Générer des PDF pour les tickets", "en": "Generate PDFs for tickets"}', NOW(), NOW()),
('tickets.pdf.batch', '{"fr": "PDF tickets en lot", "en": "Batch ticket PDFs"}', 'tickets', '{"fr": "Générer des PDFs en lot", "en": "Generate batch PDFs"}', NOW(), NOW()),
('tickets.full.batch', '{"fr": "Batch complet tickets", "en": "Full batch tickets"}', 'tickets', '{"fr": "Générer un traitement batch complet", "en": "Generate full batch processing"}', NOW(), NOW()),
('tickets.jobs.read', '{"fr": "Lire jobs tickets", "en": "Read ticket jobs"}', 'tickets', '{"fr": "Voir les jobs de génération de tickets", "en": "Read ticket generation jobs"}', NOW(), NOW()),
('tickets.jobs.cancel', '{"fr": "Annuler job ticket", "en": "Cancel ticket job"}', 'tickets', '{"fr": "Annuler un job de génération de tickets", "en": "Cancel a ticket generation job"}', NOW(), NOW()),
('tickets.stats.read', '{"fr": "Statistiques génération tickets", "en": "Ticket generation statistics"}', 'tickets', '{"fr": "Voir les statistiques de génération de tickets", "en": "View ticket generation statistics"}', NOW(), NOW()),
('tickets.admin', '{"fr": "Admin tickets", "en": "Tickets admin"}', 'tickets', '{"fr": "Administration du service de génération de tickets", "en": "Ticket generation service administration"}', NOW(), NOW()),

-- Permissions Payments manquantes
('payments.create', '{"fr": "Créer paiement", "en": "Create payment"}', 'payments', '{"fr": "Créer des paiements", "en": "Create payments"}', NOW(), NOW()),
('payments.read', '{"fr": "Lire paiement", "en": "Read payment"}', 'payments', '{"fr": "Voir les détails des paiements", "en": "Read payment details"}', NOW(), NOW()),
('payments.update', '{"fr": "Modifier paiement", "en": "Update payment"}', 'payments', '{"fr": "Modifier les informations des paiements", "en": "Update payment information"}', NOW(), NOW()),

-- Permissions Payment Methods (format standardisé)
('payment-methods.create', '{"fr": "Créer méthode paiement", "en": "Create payment method"}', 'payments', '{"fr": "Créer des méthodes de paiement", "en": "Create payment methods"}', NOW(), NOW()),
('payment-methods.read', '{"fr": "Lire méthodes paiement", "en": "Read payment methods"}', 'payments', '{"fr": "Voir les méthodes de paiement", "en": "Read payment methods"}', NOW(), NOW()),
('payment-methods.update', '{"fr": "Modifier méthode paiement", "en": "Update payment method"}', 'payments', '{"fr": "Modifier les méthodes de paiement", "en": "Update payment methods"}', NOW(), NOW()),
('payment-methods.delete', '{"fr": "Supprimer méthode paiement", "en": "Delete payment method"}', 'payments', '{"fr": "Supprimer des méthodes de paiement", "en": "Delete payment methods"}', NOW(), NOW()),

-- Permissions Refunds
('refunds.create', '{"fr": "Créer remboursement", "en": "Create refund"}', 'payments', '{"fr": "Créer des remboursements", "en": "Create refunds"}', NOW(), NOW()),
('refunds.read', '{"fr": "Lire remboursement", "en": "Read refund"}', 'payments', '{"fr": "Voir les détails des remboursements", "en": "Read refund details"}', NOW(), NOW()),

-- Permissions Invoices
('invoices.create', '{"fr": "Créer facture", "en": "Create invoice"}', 'payments', '{"fr": "Générer des factures", "en": "Generate invoices"}', NOW(), NOW()),
('invoices.read', '{"fr": "Lire facture", "en": "Read invoice"}', 'payments', '{"fr": "Voir les factures", "en": "Read invoices"}', NOW(), NOW()),

-- Permissions Wallets
('wallets.read', '{"fr": "Lire portefeuille", "en": "Read wallet"}', 'payments', '{"fr": "Voir les informations des portefeuilles", "en": "Read wallet information"}', NOW(), NOW()),
('wallets.withdraw', '{"fr": "Retirer portefeuille", "en": "Withdraw wallet"}', 'payments', '{"fr": "Effectuer des retraits des portefeuilles", "en": "Withdraw from wallets"}', NOW(), NOW()),

-- Permissions Commissions
('commissions.read', '{"fr": "Lire commissions", "en": "Read commissions"}', 'payments', '{"fr": "Voir les détails des commissions", "en": "Read commission details"}', NOW(), NOW()),

-- Permissions Admin avancées
('admin.wallet.transfer', '{"fr": "Transférer portefeuille admin", "en": "Admin wallet transfer"}', 'admin', '{"fr": "Effectuer des transferts administratifs de portefeuille", "en": "Perform administrative wallet transfers"}', NOW(), NOW()),

-- Permissions Scan Validation Service manquantes
-- Permissions Sessions
('scans.sessions.create', '{"fr": "Créer session scan", "en": "Create scan session"}', 'scans', '{"fr": "Créer des sessions de scan", "en": "Create scan sessions"}', NOW(), NOW()),
('scans.sessions.update', '{"fr": "Modifier session scan", "en": "Update scan session"}', 'scans', '{"fr": "Modifier des sessions de scan", "en": "Update scan sessions"}', NOW(), NOW()),
('scans.sessions.read', '{"fr": "Lire session scan", "en": "Read scan session"}', 'scans', '{"fr": "Voir les détails des sessions de scan", "en": "Read scan session details"}', NOW(), NOW()),

-- Permissions Operators
('scans.operators.create', '{"fr": "Créer opérateur scan", "en": "Create scan operator"}', 'scans', '{"fr": "Créer des opérateurs de scan", "en": "Create scan operators"}', NOW(), NOW()),
('scans.operators.read', '{"fr": "Lire opérateur scan", "en": "Read scan operator"}', 'scans', '{"fr": "Voir les détails des opérateurs de scan", "en": "Read scan operator details"}', NOW(), NOW()),

-- Permissions Devices
('scans.devices.create', '{"fr": "Créer appareil scan", "en": "Create scan device"}', 'scans', '{"fr": "Créer des appareils de scan", "en": "Create scan devices"}', NOW(), NOW()),
('scans.devices.read', '{"fr": "Lire appareil scan", "en": "Read scan device"}', 'scans', '{"fr": "Voir les détails des appareils de scan", "en": "Read scan device details"}', NOW(), NOW()),

-- Permissions Fraud
('scans.fraud.analyze', '{"fr": "Analyser fraude scan", "en": "Analyze scan fraud"}', 'scans', '{"fr": "Analyser les activités frauduleuses de scan", "en": "Analyze fraudulent scan activities"}', NOW(), NOW()),
('scans.fraud.read', '{"fr": "Lire fraude scan", "en": "Read scan fraud"}', 'scans', '{"fr": "Voir les rapports de fraude de scan", "en": "Read scan fraud reports"}', NOW(), NOW()),

-- Permissions Ticket Generator Service manquantes
-- Permissions Jobs (complémentaires)
('tickets.jobs.create', '{"fr": "Créer job ticket", "en": "Create ticket job"}', 'tickets', '{"fr": "Créer des jobs de génération de tickets", "en": "Create ticket generation jobs"}', NOW(), NOW()),
('tickets.jobs.process', '{"fr": "Traiter job ticket", "en": "Process ticket job"}', 'tickets', '{"fr": "Traiter des jobs de génération de tickets", "en": "Process ticket generation jobs"}', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Afficher confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Permissions créées avec succès: % permissions insérées', 
        (SELECT COUNT(*) FROM permissions);
END $$;
