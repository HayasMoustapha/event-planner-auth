-- ========================================
-- SEED DES MENUS SYSTÈME RBAC (POSTGRESQL)
-- ========================================
-- Création des menus pour le système RBAC
-- Compatible avec le schéma PostgreSQL actuel

-- Insertion des menus principaux et sous-menus
INSERT INTO menus (parent_id, label, icon, route, component, menu_group, sort_order, depth, description, created_at, updated_at) VALUES
-- Menu principal: Tableau de bord
(NULL, '{"fr": "Tableau de bord", "en": "Dashboard"}', 'dashboard', '/dashboard', 'Dashboard', 1, 1, 0, '{"fr": "Vue d''ensemble du système", "en": "System overview"}', NOW(), NOW()),

-- Menu principal: Utilisateurs
(NULL, '{"fr": "Utilisateurs", "en": "Users"}', 'users', '/users', 'Users', 1, 2, 0, '{"fr": "Gestion des utilisateurs", "en": "User management"}', NOW(), NOW()),
-- Sous-menus Utilisateurs
((SELECT id FROM menus WHERE route = '/users'), '{"fr": "Liste des utilisateurs", "en": "Users List"}', 'list', '/users/list', 'UsersList', 1, 1, 1, '{"fr": "Lister tous les utilisateurs", "en": "List all users"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/users'), '{"fr": "Créer un utilisateur", "en": "Create User"}', 'add', '/users/create', 'UserCreate', 1, 2, 1, '{"fr": "Créer un nouvel utilisateur", "en": "Create new user"}', NOW(), NOW()),

-- Menu principal: Rôles et Permissions
(NULL, '{"fr": "Rôles et Permissions", "en": "Roles & Permissions"}', 'security', '/rbac', 'Rbac', 1, 3, 0, '{"fr": "Gestion des rôles et permissions", "en": "Roles and permissions management"}', NOW(), NOW()),
-- Sous-menus RBAC
((SELECT id FROM menus WHERE route = '/rbac'), '{"fr": "Rôles", "en": "Roles"}', 'roles', '/rbac/roles', 'Roles', 1, 1, 1, '{"fr": "Gestion des rôles", "en": "Roles management"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/rbac'), '{"fr": "Permissions", "en": "Permissions"}', 'permissions', '/rbac/permissions', 'Permissions', 1, 2, 1, '{"fr": "Gestion des permissions", "en": "Permissions management"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/rbac'), '{"fr": "Assignations", "en": "Assignments"}', 'assignment', '/rbac/assignments', 'Assignments', 1, 3, 1, '{"fr": "Assigner les rôles et permissions", "en": "Assign roles and permissions"}', NOW(), NOW()),

-- Menu principal: Événements
(NULL, '{"fr": "Événements", "en": "Events"}', 'event', '/events', 'Events', 1, 4, 0, '{"fr": "Gestion des événements", "en": "Event management"}', NOW(), NOW()),
-- Sous-menus Événements
((SELECT id FROM menus WHERE route = '/events'), '{"fr": "Liste des événements", "en": "Events List"}', 'list', '/events/list', 'EventsList', 1, 1, 1, '{"fr": "Lister tous les événements", "en": "List all events"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/events'), '{"fr": "Créer un événement", "en": "Create Event"}', 'add', '/events/create', 'EventCreate', 1, 2, 1, '{"fr": "Créer un nouvel événement", "en": "Create new event"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/events'), '{"fr": "Calendrier", "en": "Calendar"}', 'calendar', '/events/calendar', 'Calendar', 1, 3, 1, '{"fr": "Vue calendrier des événements", "en": "Calendar view of events"}', NOW(), NOW()),

-- Menu principal: Système
(NULL, '{"fr": "Système", "en": "System"}', 'settings', '/system', 'System', 1, 5, 0, '{"fr": "Administration système", "en": "System administration"}', NOW(), NOW()),
-- Sous-menus Système
((SELECT id FROM menus WHERE route = '/system'), '{"fr": "Paramètres", "en": "Settings"}', 'settings', '/system/settings', 'Settings', 1, 1, 1, '{"fr": "Paramètres système", "en": "System settings"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/system'), '{"fr": "Logs", "en": "Logs"}', 'logs', '/system/logs', 'Logs', 1, 2, 1, '{"fr": "Journaux système", "en": "System logs"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/system'), '{"fr": "Monitoring", "en": "Monitoring"}', 'monitoring', '/system/monitoring', 'Monitoring', 1, 3, 1, '{"fr": "Monitoring système", "en": "System monitoring"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/system'), '{"fr": "Sauvegardes", "en": "Backups"}', 'backup', '/system/backups', 'Backups', 1, 4, 1, '{"fr": "Gestion des sauvegardes", "en": "Backup management"}', NOW(), NOW()),

-- Menu principal: Profil
(NULL, '{"fr": "Profil", "en": "Profile"}', 'profile', '/profile', 'Profile', 1, 6, 0, '{"fr": "Profil utilisateur", "en": "User profile"}', NOW(), NOW()),
-- Sous-menus Profil
((SELECT id FROM menus WHERE route = '/profile'), '{"fr": "Mon profil", "en": "My Profile"}', 'user', '/profile/me', 'ProfileMe', 1, 1, 1, '{"fr": "Informations personnelles", "en": "Personal information"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/profile'), '{"fr": "Sécurité", "en": "Security"}', 'security', '/profile/security', 'ProfileSecurity', 1, 2, 1, '{"fr": "Paramètres de sécurité", "en": "Security settings"}', NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/profile'), '{"fr": "Préférences", "en": "Preferences"}', 'preferences', '/profile/preferences', 'ProfilePreferences', 1, 3, 1, '{"fr": "Préférences utilisateur", "en": "User preferences"}', NOW(), NOW());

-- Afficher confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Menus créés avec succès: % menus insérés', 
        (SELECT COUNT(*) FROM menus);
END $$;
