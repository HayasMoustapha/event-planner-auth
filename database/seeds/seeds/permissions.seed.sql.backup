-- ========================================
-- SEED DES PERMISSIONS SYSTÈME RBAC (POSTGRESQL)
-- ========================================
-- Création des permissions pour le système RBAC
-- Compatible avec le schéma PostgreSQL actuel

-- Insertion des permissions par catégories
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
('system.admin', '{"fr": "Administration système", "en": "System Administration"}', 'system', '{"fr": "Accès complet à l'administration système", "en": "Full system administration access"}', NOW(), NOW()),
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

-- Permissions Système avancées
('system.admin', '{"fr": "Administration système", "en": "System administration"}', 'system', '{"fr": "Accès complet à l''administration du système", "en": "Full system administration access"}', NOW(), NOW()),
('system.monitoring', '{"fr": "Monitoring système", "en": "System monitoring"}', 'system', '{"fr": "Permet d''accéder aux outils de monitoring", "en": "Allows accessing monitoring tools"}', NOW(), NOW()),
('system.audit', '{"fr": "Audit système", "en": "System audit"}', 'system', '{"fr": "Permet d''accéder aux logs et rapports d''audit", "en": "Allows accessing audit logs and reports"}', NOW(), NOW());

-- Afficher confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Permissions créées avec succès: % permissions insérées', 
        (SELECT COUNT(*) FROM permissions);
END $$;
