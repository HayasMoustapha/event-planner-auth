-- ========================================
-- SEED DES PERMISSIONS SYSTÈME RBAC
-- ========================================
-- Création des permissions granulaires pour le système RBAC
-- Compatible PostgreSQL avec syntaxe standard

-- Désactiver les contraintes temporairement
SET session_replication_role = replica;

-- Nettoyage des données existantes (développement uniquement)
-- DELETE FROM role_permissions WHERE 1=1;
-- DELETE FROM permissions WHERE 1=1;

-- Réinitialiser les séquences
-- ALTER SEQUENCE permissions_id_seq RESTART WITH 1;

-- Insertion des permissions par catégorie
INSERT INTO permissions (name, description, resource, action, category, is_system, is_active, created_at, updated_at) VALUES

-- ========================================
-- 📋 PERMISSIONS UTILISATEURS
-- ========================================
-- Gestion complète des utilisateurs
('users.create', 'Créer un nouvel utilisateur', 'users', 'create', 'users', true, true, NOW(), NOW()),
('users.read', 'Lire les informations d''un utilisateur', 'users', 'read', 'users', true, true, NOW(), NOW()),
('users.update', 'Mettre à jour un utilisateur', 'users', 'update', 'users', true, true, NOW(), NOW()),
('users.delete', 'Supprimer un utilisateur', 'users', 'delete', 'users', true, true, NOW(), NOW()),
('users.list', 'Lister tous les utilisateurs', 'users', 'list', 'users', true, true, NOW(), NOW()),
('users.search', 'Rechercher des utilisateurs', 'users', 'search', 'users', true, true, NOW(), NOW()),
('users.activate', 'Activer/Désactiver un utilisateur', 'users', 'activate', 'users', true, true, NOW(), NOW()),
('users.export', 'Exporter la liste des utilisateurs', 'users', 'export', 'users', true, true, NOW(), NOW()),

-- ========================================
-- 🛡️ PERMISSIONS RÔLES
-- ========================================
-- Gestion des rôles et permissions
('roles.create', 'Créer un nouveau rôle', 'roles', 'create', 'roles', true, true, NOW(), NOW()),
('roles.read', 'Lire les informations d''un rôle', 'roles', 'read', 'roles', true, true, NOW(), NOW()),
('roles.update', 'Mettre à jour un rôle', 'roles', 'update', 'roles', true, true, NOW(), NOW()),
('roles.delete', 'Supprimer un rôle', 'roles', 'delete', 'roles', true, true, NOW(), NOW()),
('roles.list', 'Lister tous les rôles', 'roles', 'list', 'roles', true, true, NOW(), NOW()),
('roles.assign', 'Assigner des rôles aux utilisateurs', 'roles', 'assign', 'roles', true, true, NOW(), NOW()),
('roles.duplicate', 'Dupliquer un rôle avec ses permissions', 'roles', 'duplicate', 'roles', true, true, NOW(), NOW()),
('roles.hierarchy', 'Gérer la hiérarchie des rôles', 'roles', 'hierarchy', 'roles', true, true, NOW(), NOW()),

-- ========================================
-- 🔑 PERMISSIONS PERMISSIONS
-- ========================================
-- Gestion des permissions système
('permissions.create', 'Créer une nouvelle permission', 'permissions', 'create', 'permissions', true, true, NOW(), NOW()),
('permissions.read', 'Lire les informations d''une permission', 'permissions', 'read', 'permissions', true, true, NOW(), NOW()),
('permissions.update', 'Mettre à jour une permission', 'permissions', 'update', 'permissions', true, true, NOW(), NOW()),
('permissions.delete', 'Supprimer une permission', 'permissions', 'delete', 'permissions', true, true, NOW(), NOW()),
('permissions.list', 'Lister toutes les permissions', 'permissions', 'list', 'permissions', true, true, NOW(), NOW()),
('permissions.assign', 'Assigner des permissions aux rôles', 'permissions', 'assign', 'permissions', true, true, NOW(), NOW()),
('permissions.bulk', 'Gestion groupée des permissions', 'permissions', 'bulk', 'permissions', true, true, NOW(), NOW()),

-- ========================================
-- 📋 PERMISSIONS MENUS
-- ========================================
-- Gestion des menus et navigation
('menus.create', 'Créer un nouveau menu', 'menus', 'create', 'menus', true, true, NOW(), NOW()),
('menus.read', 'Lire les informations d''un menu', 'menus', 'read', 'menus', true, true, NOW(), NOW()),
('menus.update', 'Mettre à jour un menu', 'menus', 'update', 'menus', true, true, NOW(), NOW()),
('menus.delete', 'Supprimer un menu', 'menus', 'delete', 'menus', true, true, NOW(), NOW()),
('menus.list', 'Lister tous les menus', 'menus', 'list', 'menus', true, true, NOW(), NOW()),
('menus.reorder', 'Réorganiser l''ordre des menus', 'menus', 'reorder', 'menus', true, true, NOW(), NOW()),
('menus.duplicate', 'Dupliquer un menu avec ses permissions', 'menus', 'duplicate', 'menus', true, true, NOW(), NOW()),
('menus.visibility', 'Gérer la visibilité des menus', 'menus', 'visibility', 'menus', true, true, NOW(), NOW()),

-- ========================================
-- 👥 PERMISSIONS PERSONNES
-- ========================================
-- Gestion des informations personnelles
('people.create', 'Créer une nouvelle personne', 'people', 'create', 'people', true, true, NOW(), NOW()),
('people.read', 'Lire les informations d''une personne', 'people', 'read', 'people', true, true, NOW(), NOW()),
('people.update', 'Mettre à jour une personne', 'people', 'update', 'people', true, true, NOW(), NOW()),
('people.delete', 'Supprimer une personne', 'people', 'delete', 'people', true, true, NOW(), NOW()),
('people.list', 'Lister toutes les personnes', 'people', 'list', 'people', true, true, NOW(), NOW()),
('people.search', 'Rechercher des personnes', 'people', 'search', 'people', true, true, NOW(), NOW()),
('people.export', 'Exporter la liste des personnes', 'people', 'export', 'people', true, true, NOW(), NOW()),

-- ========================================
-- 🔐 PERMISSIONS SESSIONS
-- ========================================
-- Gestion des sessions et tokens
('sessions.create', 'Créer une nouvelle session', 'sessions', 'create', 'sessions', true, true, NOW(), NOW()),
('sessions.read', 'Lire les informations d''une session', 'sessions', 'read', 'sessions', true, true, NOW(), NOW()),
('sessions.update', 'Mettre à jour une session', 'sessions', 'update', 'sessions', true, true, NOW(), NOW()),
('sessions.delete', 'Supprimer une session', 'sessions', 'delete', 'sessions', true, true, NOW(), NOW()),
('sessions.list', 'Lister toutes les sessions actives', 'sessions', 'list', 'sessions', true, true, NOW(), NOW()),
('sessions.revoke', 'Révoquer une session spécifique', 'sessions', 'revoke', 'sessions', true, true, NOW(), NOW()),
('sessions.revoke_all', 'Révoquer toutes les sessions d''un utilisateur', 'sessions', 'revoke_all', 'sessions', true, true, NOW(), NOW()),
('sessions.monitor', 'Surveiller les sessions actives', 'sessions', 'monitor', 'sessions', true, true, NOW(), NOW()),

-- ========================================
-- 🔑 PERMISSIONS AUTHENTIFICATION
-- ========================================
-- Gestion de l'authentification
('auth.login', 'Se connecter au système', 'auth', 'login', 'auth', true, true, NOW(), NOW()),
('auth.logout', 'Se déconnecter du système', 'auth', 'logout', 'auth', true, true, NOW(), NOW()),
('auth.register', 'S''inscrire au système', 'auth', 'register', 'auth', true, true, NOW(), NOW()),
('auth.reset_password', 'Réinitialiser le mot de passe', 'auth', 'reset_password', 'auth', true, true, NOW(), NOW()),
('auth.verify_email', 'Vérifier l''adresse email', 'auth', 'verify_email', 'auth', true, true, NOW(), NOW()),
('auth.change_password', 'Changer son mot de passe', 'auth', 'change_password', 'auth', true, true, NOW(), NOW()),
('auth.two_factor', 'Gérer l''authentification à deux facteurs', 'auth', 'two_factor', 'auth', true, true, NOW(), NOW()),

-- ========================================
-- 📊 PERMISSIONS SYSTÈME
-- ========================================
-- Administration système
('system.monitor', 'Surveiller l''état du système', 'system', 'monitor', 'system', true, true, NOW(), NOW()),
('system.logs', 'Accéder aux logs système', 'system', 'logs', 'system', true, true, NOW(), NOW()),
('system.backup', 'Gérer les sauvegardes système', 'system', 'backup', 'system', true, true, NOW(), NOW()),
('system.config', 'Configurer les paramètres système', 'system', 'config', 'system', true, true, NOW(), NOW()),
('system.maintenance', 'Effectuer la maintenance système', 'system', 'maintenance', 'system', true, true, NOW(), NOW()),

-- ========================================
-- 📈 PERMISSIONS RAPPORTS
-- ========================================
-- Génération de rapports
('reports.generate', 'Générer des rapports', 'reports', 'generate', 'reports', true, true, NOW(), NOW()),
('reports.read', 'Lire les rapports générés', 'reports', 'read', 'reports', true, true, NOW(), NOW()),
('reports.export', 'Exporter des rapports', 'reports', 'export', 'reports', true, true, NOW(), NOW()),
('reports.schedule', 'Programmer des rapports automatiques', 'reports', 'schedule', 'reports', true, true, NOW(), NOW()),

-- ========================================
-- 🎯 PERMISSIONS ÉVÉNEMENTS
-- ========================================
-- Gestion des événements
('events.create', 'Créer un événement', 'events', 'create', 'events', true, true, NOW(), NOW()),
('events.read', 'Lire les informations d''un événement', 'events', 'read', 'events', true, true, NOW(), NOW()),
('events.update', 'Mettre à jour un événement', 'events', 'update', 'events', true, true, NOW(), NOW()),
('events.delete', 'Supprimer un événement', 'events', 'delete', 'events', true, true, NOW(), NOW()),
('events.list', 'Lister tous les événements', 'events', 'list', 'events', true, true, NOW(), NOW()),
('events.publish', 'Publier un événement', 'events', 'publish', 'events', true, true, NOW(), NOW()),

-- ========================================
-- 📝 PERMISSIONS CONTENU
-- ========================================
-- Gestion du contenu
('content.create', 'Créer du contenu', 'content', 'create', 'content', true, true, NOW(), NOW()),
('content.read', 'Lire du contenu', 'content', 'read', 'content', true, true, NOW(), NOW()),
('content.update', 'Mettre à jour du contenu', 'content', 'update', 'content', true, true, NOW(), NOW()),
('content.delete', 'Supprimer du contenu', 'content', 'delete', 'content', true, true, NOW(), NOW()),
('content.publish', 'Publier du contenu', 'content', 'publish', 'content', true, true, NOW(), NOW()),
('content.moderate', 'Modérer du contenu', 'content', 'moderate', 'content', true, true, NOW(), NOW()),

-- ========================================
-- 💬 PERMISSIONS SUPPORT
-- ========================================
-- Gestion du support client
('support.create', 'Créer un ticket de support', 'support', 'create', 'support', true, true, NOW(), NOW()),
('support.read', 'Lire les tickets de support', 'support', 'read', 'support', true, true, NOW(), NOW()),
('support.update', 'Mettre à jour un ticket de support', 'support', 'update', 'support', true, true, NOW(), NOW()),
('support.assign', 'Assigner un ticket de support', 'support', 'assign', 'support', true, true, NOW(), NOW()),
('support.close', 'Fermer un ticket de support', 'support', 'close', 'support', true, true, NOW(), NOW()),

-- ========================================
-- 🔔 PERMISSIONS NOTIFICATIONS
-- ========================================
-- Gestion des notifications
('notifications.send', 'Envoyer des notifications', 'notifications', 'send', 'notifications', true, true, NOW(), NOW()),
('notifications.read', 'Lire les notifications', 'notifications', 'read', 'notifications', true, true, NOW(), NOW()),
('notifications.manage', 'Gérer les préférences de notification', 'notifications', 'manage', 'notifications', true, true, NOW(), NOW());

-- Journaliser la création des permissions
DO $$
DECLARE
    permission_record RECORD;
BEGIN
    FOR permission_record IN 
        SELECT id, name FROM permissions 
        WHERE created_at > NOW() - INTERVAL '1 minute'
    LOOP
        INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id, created_at) VALUES
        ('CREATE', 'permissions', permission_record.id, NULL, 
         json_build_object('name', permission_record.name, 'is_system', true), 1, NOW());
    END LOOP;
END $$;

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

-- Afficher les permissions créées par catégorie
SELECT 
    category,
    COUNT(*) as permissions_count,
    STRING_AGG(name, ', ' ORDER BY name) as permissions
FROM permissions 
GROUP BY category 
ORDER BY category;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Seed des permissions système RBAC terminé avec succès';
    RAISE NOTICE '📋 Catégories créées: users, roles, permissions, menus, people, sessions, auth, system, reports, events, content, support, notifications';
    RAISE NOTICE '🔐 Les permissions système sont protégées contre la modification';
END $$;
