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
('system.monitoring', '{"fr": "Monitoring", "en": "Monitoring"}', 'system', '{"fr": "Accéder au monitoring système", "en": "Access system monitoring"}', NOW(), NOW());
