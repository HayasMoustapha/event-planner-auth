-- ========================================
-- SEED DES MENUS SYSTÈME RBAC (POSTGRESQL)
-- ========================================
-- Création des menus pour le système RBAC
-- Compatible avec le schéma PostgreSQL actuel

-- Insertion des menus principaux
INSERT INTO menus (parent_id, label, icon, route, component, menu_group, sort_order, depth, description, created_at, updated_at) VALUES
-- Menu principal: Tableau de bord
(NULL, '{"fr": "Tableau de bord", "en": "Dashboard"}', 'dashboard', '/dashboard', 'Dashboard', 1, 1, 0, '{"fr": "Vue d''ensemble du système", "en": "System overview"}', NOW(), NOW()),

-- Menu principal: Utilisateurs
(NULL, '{"fr": "Utilisateurs", "en": "Users"}', 'users', '/users', 'Users', 1, 2, 0, '{"fr": "Gestion des utilisateurs", "en": "User management"}', NOW(), NOW()),

-- Menu principal: Rôles et Permissions
(NULL, '{"fr": "Rôles et Permissions", "en": "Roles & Permissions"}', 'security', '/rbac', 'Rbac', 1, 3, 0, '{"fr": "Gestion des rôles et permissions", "en": "Roles and permissions management"}', NOW(), NOW()),

-- Menu principal: Événements
(NULL, '{"fr": "Événements", "en": "Events"}', 'event', '/events', 'Events', 1, 4, 0, '{"fr": "Gestion des événements", "en": "Event management"}', NOW(), NOW()),

-- Menu principal: Système
(NULL, '{"fr": "Système", "en": "System"}', 'settings', '/system', 'System', 1, 5, 0, '{"fr": "Administration système", "en": "System administration"}', NOW(), NOW()),

-- Menu principal: Profil
(NULL, '{"fr": "Profil", "en": "Profile"}', 'profile', '/profile', 'Profile', 1, 6, 0, '{"fr": "Profil utilisateur", "en": "User profile"}', NOW(), NOW());
