-- ========================================
-- SEED DES MENUS SYSTEME RBAC (POSTGRESQL)
-- ========================================
-- Creation des menus pour le systeme RBAC
-- Compatible avec le schema PostgreSQL actuel

-- Insertion des menus principaux et sous-menus
INSERT INTO menus (parent_id, label, icon, route, component, menu_group, sort_order, created_at, updated_at) VALUES

-- Menu principal: Tableau de bord
(NULL, '{"fr": "Tableau de bord", "en": "Dashboard"}', 'dashboard', '/dashboard', 'Dashboard', 1, 1, NOW(), NOW()),

-- Menu principal: Utilisateurs
(NULL, '{"fr": "Utilisateurs", "en": "Users"}', 'users', '/users', 'Users', 1, 2, NOW(), NOW()),
-- Sous-menus Utilisateurs
((SELECT id FROM menus WHERE route = '/users'), '{"fr": "Liste des utilisateurs", "en": "Users List"}', 'list', '/users/list', 'UsersList', 1, 1, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/users'), '{"fr": "Creer un utilisateur", "en": "Create User"}', 'add', '/users/create', 'UserCreate', 1, 2, NOW(), NOW()),

-- Menu principal: Roles et Permissions
(NULL, '{"fr": "Roles et Permissions", "en": "Roles & Permissions"}', 'security', '/rbac', 'Rbac', 1, 3, NOW(), NOW()),

-- Sous-menus RBAC
((SELECT id FROM menus WHERE route = '/rbac'), '{"fr": "Roles", "en": "Roles"}', 'roles', '/rbac/roles', 'Roles', 1, 1, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/rbac'), '{"fr": "Permissions", "en": "Permissions"}', 'permissions', '/rbac/permissions', 'Permissions', 1, 2, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/rbac'), '{"fr": "Assignations", "en": "Assignments"}', 'assignment', '/rbac/assignments', 'Assignments', 1, 3, NOW(), NOW()),

-- Menu principal: Evenements
(NULL, '{"fr": "Evenements", "en": "Events"}', 'event', '/events', 'Events', 1, 4, NOW(), NOW()),

-- Sous-menus Evenements
((SELECT id FROM menus WHERE route = '/events'), '{"fr": "Liste des evenements", "en": "Events List"}', 'list', '/events/list', 'EventsList', 1, 1, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/events'), '{"fr": "Creer un evenement", "en": "Create Event"}', 'add', '/events/create', 'EventCreate', 1, 2, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/events'), '{"fr": "Calendrier", "en": "Calendar"}', 'calendar', '/events/calendar', 'Calendar', 1, 3, NOW(), NOW()),

-- Menu principal: Systeme
(NULL, '{"fr": "Systeme", "en": "System"}', 'settings', '/system', 'System', 1, 5, NOW(), NOW()),

-- Sous-menus Systeme
((SELECT id FROM menus WHERE route = '/system'), '{"fr": "Parametres", "en": "Settings"}', 'settings', '/system/settings', 'Settings', 1, 1, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/system'), '{"fr": "Logs", "en": "Logs"}', 'logs', '/system/logs', 'Logs', 1, 2, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/system'), '{"fr": "Monitoring", "en": "Monitoring"}', 'monitoring', '/system/monitoring', 'Monitoring', 1, 3, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/system'), '{"fr": "Sauvegardes", "en": "Backups"}', 'backup', '/system/backups', 'Backups', 1, 4, NOW(), NOW()),

-- Menu principal: Profil
(NULL, '{"fr": "Profil", "en": "Profile"}', 'profile', '/profile', 'Profile', 1, 6, NOW(), NOW()),

-- Sous-menus Profil
((SELECT id FROM menus WHERE route = '/profile'), '{"fr": "Mon profil", "en": "My Profile"}', 'user', '/profile/me', 'ProfileMe', 1, 1, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/profile'), '{"fr": "Securite", "en": "Security"}', 'security', '/profile/security', 'ProfileSecurity', 1, 2, NOW(), NOW()),
((SELECT id FROM menus WHERE route = '/profile'), '{"fr": "Preferences", "en": "Preferences"}', 'preferences', '/profile/preferences', 'ProfilePreferences', 1, 3, NOW(), NOW());

-- Afficher confirmation
DO $$
BEGIN
    RAISE NOTICE 'Menus crees avec succes: % menus inseres', 
        (SELECT COUNT(*) FROM menus);
END $$;
