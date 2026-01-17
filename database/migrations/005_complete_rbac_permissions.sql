-- Migration RBAC Phase 3: Création des permissions manquantes et assignation complète à super_admin
-- Généré le 2026-01-17

-- Créer les permissions manquantes pour PEOPLE
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('people.list', '{"en": "List People", "fr": "Lister les personnes"}', 'people', '{"en": "List all people in the system", "fr": "Lister toutes les personnes du système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.read', '{"en": "Read Person", "fr": "Lire une personne"}', 'people', '{"en": "Read person details", "fr": "Lire les détails d''une personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.create', '{"en": "Create Person", "fr": "Créer une personne"}', 'people', '{"en": "Create a new person", "fr": "Créer une nouvelle personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.update', '{"en": "Update Person", "fr": "Mettre à jour une personne"}', 'people', '{"en": "Update person information", "fr": "Mettre à jour les informations d''une personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.delete', '{"en": "Delete Person", "fr": "Supprimer une personne"}', 'people', '{"en": "Delete a person", "fr": "Supprimer une personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.stats', '{"en": "People Statistics", "fr": "Statistiques des personnes"}', 'people', '{"en": "View people statistics", "fr": "Voir les statistiques des personnes"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Créer les permissions manquantes pour USERS
('users.stats', '{"en": "Users Statistics", "fr": "Statistiques des utilisateurs"}', 'users', '{"en": "View users statistics", "fr": "Voir les statistiques des utilisateurs"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Créer les permissions manquantes pour ROLES
('roles.view_stats', '{"en": "Roles Statistics", "fr": "Statistiques des rôles"}', 'roles', '{"en": "View roles statistics", "fr": "Voir les statistiques des rôles"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Créer les permissions manquantes pour PERMISSIONS
('permissions.view_stats', '{"en": "Permissions Statistics", "fr": "Statistiques des permissions"}', 'permissions', '{"en": "View permissions statistics", "fr": "Voir les statistiques des permissions"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Créer les permissions manquantes pour MENUS
('menus.assign_permissions', '{"en": "Assign Menu Permissions", "fr": "Assigner permissions menu"}', 'menus', '{"en": "Assign permissions to menu", "fr": "Assigner des permissions à un menu"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('menus.view_stats', '{"en": "Menus Statistics", "fr": "Statistiques des menus"}', 'menus', '{"en": "View menus statistics", "fr": "Voir les statistiques des menus"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Créer les permissions manquantes pour SESSIONS
('sessions.create', '{"en": "Create Session", "fr": "Créer une session"}', 'sessions', '{"en": "Create a new session", "fr": "Créer une nouvelle session"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sessions.read', '{"en": "Read Session", "fr": "Lire une session"}', 'sessions', '{"en": "Read session details", "fr": "Lire les détails d''une session"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sessions.update', '{"en": "Update Session", "fr": "Mettre à jour une session"}', 'sessions', '{"en": "Update session information", "fr": "Mettre à jour les informations d''une session"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sessions.delete', '{"en": "Delete Session", "fr": "Supprimer une session"}', 'sessions', '{"en": "Delete a session", "fr": "Supprimer une session"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sessions.list', '{"en": "List Sessions", "fr": "Lister les sessions"}', 'sessions', '{"en": "List all sessions", "fr": "Lister toutes les sessions"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sessions.stats', '{"en": "Sessions Statistics", "fr": "Statistiques des sessions"}', 'sessions', '{"en": "View sessions statistics", "fr": "Voir les statistiques des sessions"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Créer les permissions manquantes pour AUTHORIZATIONS
('authorizations.create', '{"en": "Create Authorization", "fr": "Créer une autorisation"}', 'authorizations', '{"en": "Create a new authorization", "fr": "Créer une nouvelle autorisation"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('authorizations.update', '{"en": "Update Authorization", "fr": "Mettre à jour une autorisation"}', 'authorizations', '{"en": "Update authorization", "fr": "Mettre à jour une autorisation"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('authorizations.delete', '{"en": "Delete Authorization", "fr": "Supprimer une autorisation"}', 'authorizations', '{"en": "Delete an authorization", "fr": "Supprimer une autorisation"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('authorizations.view_stats', '{"en": "Authorizations Statistics", "fr": "Statistiques des autorisations"}', 'authorizations', '{"en": "View authorizations statistics", "fr": "Voir les statistiques des autorisations"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Créer les permissions manquantes pour AUTH
('auth.login', '{"en": "Login", "fr": "Connexion"}', 'auth', '{"en": "User login", "fr": "Connexion utilisateur"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('auth.register', '{"en": "Register", "fr": "Inscription"}', 'auth', '{"en": "User registration", "fr": "Inscription utilisateur"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('auth.verify_email', '{"en": "Verify Email", "fr": "Vérifier email"}', 'auth', '{"en": "Email verification", "fr": "Vérification email"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('auth.reset_password', '{"en": "Reset Password", "fr": "Réinitialiser mot de passe"}', 'auth', '{"en": "Password reset", "fr": "Réinitialisation mot de passe"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('auth.manage_tokens', '{"en": "Manage Tokens", "fr": "Gérer les tokens"}', 'auth', '{"en": "Manage authentication tokens", "fr": "Gérer les tokens d''authentification"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Créer les permissions manquantes pour SYSTEM
('system.health', '{"en": "System Health", "fr": "Santé du système"}', 'system', '{"en": "Check system health", "fr": "Vérifier la santé du système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('system.metrics', '{"en": "System Metrics", "fr": "Métriques système"}', 'system', '{"en": "View system metrics", "fr": "Voir les métriques système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('system.logs', '{"en": "System Logs", "fr": "Logs système"}', 'system', '{"en": "View system logs", "fr": "Voir les logs système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('system.backup', '{"en": "System Backup", "fr": "Sauvegarde système"}', 'system', '{"en": "Create system backup", "fr": "Créer une sauvegarde système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('system.restore', '{"en": "System Restore", "fr": "Restauration système"}', 'system', '{"en": "Restore system", "fr": "Restaurer le système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Créer les menus pour les nouveaux groupes de permissions
INSERT INTO menus (label, icon, route, component, parent_path, menu_group, sort_order, depth, description, created_at, updated_at) VALUES
('People Management', 'people', '/people', 'people', '/people', 1, 1, 0, '{"en": "People management section", "fr": "Section gestion des personnes"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Users Management', 'users', '/users', 'users', '/users', 1, 2, 0, '{"en": "Users management section", "fr": "Section gestion des utilisateurs"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Roles Management', 'shield', '/roles', 'roles', '/roles', 1, 3, 0, '{"en": "Roles management section", "fr": "Section gestion des rôles"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Permissions Management', 'key', '/permissions', 'permissions', '/permissions', 1, 4, 0, '{"en": "Permissions management section", "fr": "Section gestion des permissions"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Menus Management', 'menu', '/menus', 'menus', '/menus', 1, 5, 0, '{"en": "Menus management section", "fr": "Section gestion des menus"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Sessions Management', 'session', '/sessions', 'sessions', '/sessions', 1, 6, 0, '{"en": "Sessions management section", "fr": "Section gestion des sessions"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Authorizations Management', 'lock', '/authorizations', 'authorizations', '/authorizations', 1, 7, 0, '{"en": "Authorizations management section", "fr": "Section gestion des autorisations"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Auth Management', 'auth', '/auth', 'auth', '/auth', 1, 8, 0, '{"en": "Authentication management section", "fr": "Section gestion authentification"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('System Management', 'settings', '/system', 'system', '/system', 1, 9, 0, '{"en": "System management section", "fr": "Section gestion système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assigner toutes les permissions au rôle super_admin
-- Récupérer l'ID du rôle super_admin
DO $$
DECLARE
    super_admin_id BIGINT;
    permission_id BIGINT;
    menu_id BIGINT;
BEGIN
    SELECT id INTO super_admin_id FROM roles WHERE code = 'super_admin';
    
    IF super_admin_id IS NOT NULL THEN
        -- Supprimer toutes les autorisations existantes pour super_admin
        DELETE FROM authorizations WHERE role_id = super_admin_id;
        
        -- Assigner toutes les permissions à super_admin
        FOR permission_id IN 
            (SELECT id FROM permissions)
        LOOP
            -- Assigner au premier menu disponible pour chaque permission
            SELECT id INTO menu_id FROM menus ORDER BY id LIMIT 1;
            
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (super_admin_id, permission_id, menu_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        END LOOP;
        
        RAISE NOTICE 'Super admin role has been assigned all permissions (%)', (SELECT COUNT(*) FROM permissions);
    ELSE
        RAISE NOTICE 'Super admin role not found';
    END IF;
END $$;
