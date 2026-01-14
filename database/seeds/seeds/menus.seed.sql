-- ========================================
-- SEED DES MENUS SYSTÈME RBAC
-- ========================================
-- Création des menus hiérarchiques pour le système RBAC
-- Compatible PostgreSQL avec syntaxe standard

-- Désactiver les contraintes temporairement
SET session_replication_role = replica;

-- Nettoyage des données existantes (développement uniquement)
-- DELETE FROM role_menus WHERE 1=1;
-- DELETE FROM menu_permissions WHERE 1=1;
-- DELETE FROM menus WHERE 1=1;

-- Réinitialiser les séquences
-- ALTER SEQUENCE menus_id_seq RESTART WITH 1;

-- Insertion des menus avec structure hiérarchique
INSERT INTO menus (name, label, icon, path, parent_id, order_index, is_visible, is_active, created_at, updated_at) VALUES

-- ========================================
-- 🏠 MENU PRINCIPAL
-- ========================================
-- Tableau de bord
('dashboard', 'Tableau de bord', 'Dashboard', '/dashboard', NULL, 1, true, true, NOW(), NOW()),

-- ========================================
-- 👥 GESTION DES UTILISATEURS
-- ========================================
-- Menu parent - Gestion utilisateurs
('users_management', 'Gestion des utilisateurs', 'Users', NULL, NULL, 2, true, true, NOW(), NOW()),
-- Sous-menus
('users_list', 'Liste des utilisateurs', 'UserList', '/users', 2, 1, true, true, NOW(), NOW()),
('users_create', 'Créer un utilisateur', 'UserPlus', '/users/create', 2, 2, true, true, NOW(), NOW()),
('users_import', 'Importer des utilisateurs', 'Upload', '/users/import', 2, 3, true, true, NOW(), NOW()),
('users_export', 'Exporter des utilisateurs', 'Download', '/users/export', 2, 4, true, true, NOW(), NOW()),

-- ========================================
-- 🛡️ GESTION DES RÔLES
-- ========================================
-- Menu parent - Gestion rôles
('roles_management', 'Gestion des rôles', 'Shield', NULL, NULL, 3, true, true, NOW(), NOW()),
-- Sous-menus
('roles_list', 'Liste des rôles', 'List', '/roles', 3, 1, true, true, NOW(), NOW()),
('roles_create', 'Créer un rôle', 'Plus', '/roles/create', 3, 2, true, true, NOW(), NOW()),
('roles_hierarchy', 'Hiérarchie des rôles', 'GitBranch', '/roles/hierarchy', 3, 3, true, true, NOW(), NOW()),
('roles_permissions', 'Permissions par rôle', 'Key', '/roles/permissions', 3, 4, true, true, NOW(), NOW()),

-- ========================================
-- 🔑 GESTION DES PERMISSIONS
-- ========================================
-- Menu parent - Gestion permissions
('permissions_management', 'Gestion des permissions', 'Key', NULL, NULL, 4, true, true, NOW(), NOW()),
-- Sous-menus
('permissions_list', 'Liste des permissions', 'List', '/permissions', 4, 1, true, true, NOW(), NOW()),
('permissions_create', 'Créer une permission', 'Plus', '/permissions/create', 4, 2, true, true, NOW(), NOW()),
('permissions_categories', 'Catégories de permissions', 'Tags', '/permissions/categories', 4, 3, true, true, NOW(), NOW()),
('permissions_matrix', 'Matrice de permissions', 'Grid', '/permissions/matrix', 4, 4, true, true, NOW(), NOW()),

-- ========================================
-- 📋 GESTION DES MENUS
-- ========================================
-- Menu parent - Gestion menus
('menus_management', 'Gestion des menus', 'Menu', NULL, NULL, 5, true, true, NOW(), NOW()),
-- Sous-menus
('menus_list', 'Liste des menus', 'List', '/menus', 5, 1, true, true, NOW(), NOW()),
('menus_create', 'Créer un menu', 'Plus', '/menus/create', 5, 2, true, true, NOW(), NOW()),
('menus_organize', 'Organiser les menus', 'Move', '/menus/organize', 5, 3, true, true, NOW(), NOW()),
('menus_permissions', 'Permissions des menus', 'Lock', '/menus/permissions', 5, 4, true, true, NOW(), NOW()),

-- ========================================
-- 👥 GESTION DES PERSONNES
-- ========================================
-- Menu parent - Gestion personnes
('people_management', 'Gestion des personnes', 'People', NULL, NULL, 6, true, true, NOW(), NOW()),
-- Sous-menus
('people_list', 'Liste des personnes', 'List', '/people', 6, 1, true, true, NOW(), NOW()),
('people_create', 'Créer une personne', 'Plus', '/people/create', 6, 2, true, true, NOW(), NOW()),
('people_search', 'Rechercher des personnes', 'Search', '/people/search', 6, 3, true, true, NOW(), NOW()),
('people_import', 'Importer des personnes', 'Upload', '/people/import', 6, 4, true, true, NOW(), NOW()),

-- ========================================
-- 🔐 SESSIONS ACTIVES
-- ========================================
-- Menu parent - Sessions
('sessions_management', 'Sessions actives', 'Activity', NULL, NULL, 7, true, true, NOW(), NOW()),
-- Sous-menus
('sessions_list', 'Liste des sessions', 'List', '/sessions', 7, 1, true, true, NOW(), NOW()),
('sessions_monitor', 'Monitoring des sessions', 'Monitor', '/sessions/monitor', 7, 2, true, true, NOW(), NOW()),
('sessions_blacklist', 'Tokens blacklistés', 'Ban', '/sessions/blacklist', 7, 3, true, true, NOW(), NOW()),

-- ========================================
-- ⚙️ PARAMÈTRES
-- ========================================
-- Menu parent - Paramètres
('settings', 'Paramètres', 'Settings', NULL, NULL, 8, true, true, NOW(), NOW()),
-- Sous-menus
('profile', 'Mon profil', 'User', '/profile', 8, 1, true, true, NOW(), NOW()),
('security', 'Sécurité', 'Lock', '/security', 8, 2, true, true, NOW(), NOW()),
('preferences', 'Préférences', 'Settings', '/preferences', 8, 3, true, true, NOW(), NOW()),
('notifications', 'Notifications', 'Bell', '/notifications', 8, 4, true, true, NOW(), NOW()),

-- ========================================
-- 📊 RAPPORTS
-- ========================================
-- Menu parent - Rapports
('reports_management', 'Rapports', 'BarChart', NULL, NULL, 9, true, true, NOW(), NOW()),
-- Sous-menus
('reports_users', 'Rapport utilisateurs', 'Users', '/reports/users', 9, 1, true, true, NOW(), NOW()),
('reports_activities', 'Rapport activités', 'Activity', '/reports/activities', 9, 2, true, true, NOW(), NOW()),
('reports_security', 'Rapport sécurité', 'Shield', '/reports/security', 9, 3, true, true, NOW(), NOW()),
('reports_custom', 'Rapports personnalisés', 'FileText', '/reports/custom', 9, 4, true, true, NOW(), NOW()),

-- ========================================
-- 🎯 ÉVÉNEMENTS
-- ========================================
-- Menu parent - Événements
('events_management', 'Événements', 'Calendar', NULL, NULL, 10, true, true, NOW(), NOW()),
-- Sous-menus
('events_list', 'Liste des événements', 'List', '/events', 10, 1, true, true, NOW(), NOW()),
('events_create', 'Créer un événement', 'Plus', '/events/create', 10, 2, true, true, NOW(), NOW()),
('events_calendar', 'Calendrier', 'Calendar', '/events/calendar', 10, 3, true, true, NOW(), NOW()),
('events_analytics', 'Analytiques événements', 'TrendingUp', '/events/analytics', 10, 4, true, true, NOW(), NOW()),

-- ========================================
-- 📝 CONTENU
-- ========================================
-- Menu parent - Contenu
('content_management', 'Contenu', 'FileText', NULL, NULL, 11, true, true, NOW(), NOW()),
-- Sous-menus
('content_pages', 'Pages', 'File', '/content/pages', 11, 1, true, true, NOW(), NOW()),
('content_articles', 'Articles', 'FileText', '/content/articles', 11, 2, true, true, NOW(), NOW()),
('content_media', 'Médias', 'Image', '/content/media', 11, 3, true, true, NOW(), NOW()),
('content_categories', 'Catégories', 'Tags', '/content/categories', 11, 4, true, true, NOW(), NOW()),

-- ========================================
-- 💬 SUPPORT
-- ========================================
-- Menu parent - Support
('support_management', 'Support', 'HelpCircle', NULL, NULL, 12, true, true, NOW(), NOW()),
-- Sous-menus
('support_tickets', 'Tickets de support', 'MessageSquare', '/support/tickets', 12, 1, true, true, NOW(), NOW()),
('support_faq', 'FAQ', 'HelpCircle', '/support/faq', 12, 2, true, true, NOW(), NOW()),
('support_knowledge', 'Base de connaissances', 'BookOpen', '/support/knowledge', 12, 3, true, true, NOW(), NOW()),

-- ========================================
-- 🔔 NOTIFICATIONS
-- ========================================
-- Menu parent - Notifications
('notifications_management', 'Notifications', 'Bell', NULL, NULL, 13, true, true, NOW(), NOW()),
-- Sous-menus
('notifications_list', 'Liste des notifications', 'List', '/notifications', 13, 1, true, true, NOW(), NOW()),
('notifications_templates', 'Modèles de notification', 'FileText', '/notifications/templates', 13, 2, true, true, NOW(), NOW()),
('notifications_settings', 'Paramètres de notification', 'Settings', '/notifications/settings', 13, 3, true, true, NOW(), NOW()),

-- ========================================
-- 🛠️ ADMINISTRATION SYSTÈME
-- ========================================
-- Menu parent - Administration système (visible seulement pour les admins)
('system_management', 'Administration système', 'Terminal', NULL, NULL, 14, true, true, NOW(), NOW()),
-- Sous-menus
('system_monitoring', 'Monitoring système', 'Monitor', '/system/monitoring', 14, 1, true, true, NOW(), NOW()),
('system_logs', 'Logs système', 'FileText', '/system/logs', 14, 2, true, true, NOW(), NOW()),
('system_backup', 'Sauvegardes', 'Database', '/system/backup', 14, 3, true, true, NOW(), NOW()),
('system_config', 'Configuration système', 'Settings', '/system/config', 14, 4, true, true, NOW(), NOW()),

-- ========================================
-- 🔧 UTILITAIRES
-- ========================================
-- Menu parent - Utilitaires
('utilities', 'Utilitaires', 'Tool', NULL, NULL, 15, true, true, NOW(), NOW()),
-- Sous-menus
('utilities_audit', 'Journal d''audit', 'FileText', '/utilities/audit', 15, 1, true, true, NOW(), NOW()),
('utilities_cache', 'Gestion du cache', 'Database', '/utilities/cache', 15, 2, true, true, NOW(), NOW()),
('utilities_health', 'Santé du système', 'Activity', '/utilities/health', 15, 3, true, true, NOW(), NOW());

-- Récupérer les IDs des menus pour les associations de permissions
DO $$
DECLARE
    menu_record RECORD;
    permission_record RECORD;
BEGIN
    -- Associer les permissions de lecture à tous les menus visibles
    FOR menu_record IN 
        SELECT id, name FROM menus WHERE is_visible = true AND is_active = true
    LOOP
        -- Trouver la permission de lecture correspondante
        SELECT id INTO permission_record.id FROM permissions 
        WHERE name = REPLACE(menu_record.name, '_management', '.read') 
           OR name = menu_record.name || '.read'
        LIMIT 1;
        
        IF permission_record.id IS NOT NULL THEN
            -- Associer la permission au menu
            INSERT INTO menu_permissions (menu_id, permission_id, created_at, updated_at) VALUES
            (menu_record.id, permission_record.id, NOW(), NOW())
            ON CONFLICT (menu_id, permission_id) DO NOTHING;
        END IF;
        
        -- Réinitialiser la variable
        permission_record.id := NULL;
    END LOOP;
END $$;

-- Journaliser la création des menus
DO $$
DECLARE
    menu_record RECORD;
BEGIN
    FOR menu_record IN 
        SELECT id, name, label FROM menus 
        WHERE created_at > NOW() - INTERVAL '1 minute'
    LOOP
        INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id, created_at) VALUES
        ('CREATE', 'menus', menu_record.id, NULL, 
         json_build_object('name', menu_record.name, 'label', menu_record.label), 1, NOW());
    END LOOP;
END $$;

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

-- Afficher la structure des menus créés
WITH RECURSIVE menu_tree AS (
    SELECT 
        id,
        name,
        label,
        icon,
        path,
        parent_id,
        order_index,
        is_visible,
        is_active,
        0 as level,
        ARRAY[name] as path_array
    FROM menus 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT 
        m.id,
        m.name,
        m.label,
        m.icon,
        m.path,
        m.parent_id,
        m.order_index,
        m.is_visible,
        m.is_active,
        mt.level + 1,
        mt.path_array || m.name
    FROM menus m
    INNER JOIN menu_tree mt ON m.parent_id = mt.id
)
SELECT 
    REPEAT('  ', level) || '├─ ' || label as menu_structure,
    name,
    path,
    CASE WHEN is_visible THEN '✅' ELSE '❌' END as visible,
    CASE WHEN is_active THEN '🟢' ELSE '🔴' END as active,
    order_index
FROM menu_tree
ORDER BY path_array, order_index;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Seed des menus système RBAC terminé avec succès';
    RAISE NOTICE '📋 Menus créés: 15 menus principaux avec sous-menus hiérarchiques';
    RAISE NOTICE '🔐 Permissions associées automatiquement aux menus';
    RAISE NOTICE '📊 Structure hiérarchique complète avec 3-4 niveaux';
END $$;
