-- ========================================
-- SEED DES AUTORISATIONS RBAC (POSTGRESQL)
-- ========================================
-- Création des associations rôle-permission-menu
-- Compatible avec le schéma PostgreSQL actuel

-- Récupérer les IDs des rôles, permissions et menus
DO $$
DECLARE
    super_admin_role_id BIGINT;
    admin_role_id BIGINT;
    manager_role_id BIGINT;
    user_role_id BIGINT;
    guest_role_id BIGINT;
    
    permission_id BIGINT;
    menu_id BIGINT;
    authorization_count INTEGER := 0;
BEGIN
    -- Récupérer les IDs des rôles
    SELECT id INTO super_admin_role_id FROM roles WHERE code = 'super_admin';
    SELECT id INTO admin_role_id FROM roles WHERE code = 'admin';
    SELECT id INTO manager_role_id FROM roles WHERE code = 'manager';
    SELECT id INTO user_role_id FROM roles WHERE code = 'user';
    SELECT id INTO guest_role_id FROM roles WHERE code = 'guest';
    
    RAISE NOTICE '🔗 Création des autorisations pour le rôle super_admin...';
    
    -- Super Admin: TOUTES LES PERMISSIONS sur TOUS LES MENUS - LE ROI ABSOLU
    FOR permission_id IN SELECT id FROM permissions LOOP
        FOR menu_id IN SELECT id FROM menus LOOP
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (super_admin_role_id, permission_id, menu_id, NOW(), NOW());
            authorization_count := authorization_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '👑 SUPER ADMIN: Le ROI a maintenant TOUTES les permissions sur TOUS les menus (%)', 
        (SELECT COUNT(*) FROM permissions);
    
    RAISE NOTICE '🔗 Création des autorisations pour le rôle admin...';
    
    -- Admin: Permissions utilisateurs, rôles, permissions, menus + permissions de gestion sur les services
    FOR permission_id IN SELECT id FROM permissions WHERE "group" IN ('users', 'roles', 'permissions', 'menus', 'admin', 'system') OR 
                         ("group" IN ('events', 'tickets', 'guests', 'marketplace', 'notifications', 'payments', 'scans') AND 
                          (code LIKE '%read%' OR code LIKE '%stats%' OR code LIKE '%moderate%')) LOOP
        FOR menu_id IN SELECT id FROM menus WHERE route IN ('/users', '/rbac', '/admin', '/dashboard') OR parent_id IN (
            SELECT id FROM menus WHERE route IN ('/users', '/rbac', '/admin', '/dashboard')
        ) LOOP
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (admin_role_id, permission_id, menu_id, NOW(), NOW());
            authorization_count := authorization_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '🔗 Création des autorisations pour le rôle manager...';
    
    -- Manager: Permissions limitées sur événements, tickets, invités et notifications (sauf suppression)
    FOR permission_id IN SELECT id FROM permissions WHERE "group" IN ('users', 'events', 'tickets', 'guests', 'marketplace', 'notifications') AND 
                         code NOT LIKE '%delete%' AND 
                         (code LIKE '%read%' OR code LIKE '%create%' OR code LIKE '%update%' OR code LIKE '%send%' OR code LIKE '%queue%' OR code LIKE '%moderate%') LOOP
        FOR menu_id IN SELECT id FROM menus WHERE route IN ('/users', '/events', '/tickets', '/guests', '/marketplace', '/notifications') OR parent_id IN (
            SELECT id FROM menus WHERE route IN ('/users', '/events', '/tickets', '/guests', '/marketplace', '/notifications')
        ) LOOP
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (manager_role_id, permission_id, menu_id, NOW(), NOW());
            authorization_count := authorization_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '🔗 Création des autorisations pour le rôle user...';
    
    -- User: Permissions de lecture sur son profil, les événements et tickets
    FOR permission_id IN SELECT id FROM permissions WHERE "group" IN ('users', 'events', 'tickets') AND 
                         (code LIKE '%read%' OR code LIKE '%list%') LOOP
        FOR menu_id IN SELECT id FROM menus WHERE route IN ('/profile', '/events', '/tickets') OR parent_id IN (
            SELECT id FROM menus WHERE route IN ('/profile', '/events', '/tickets')
        ) LOOP
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (user_role_id, permission_id, menu_id, NOW(), NOW());
            authorization_count := authorization_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '🔗 Création des autorisations pour le rôle guest...';
    
    -- Guest: Permissions de lecture seule sur les événements publics
    FOR permission_id IN SELECT id FROM permissions WHERE "group" = 'events' AND 
                         code = 'events.read' LOOP
        FOR menu_id IN SELECT id FROM menus WHERE route = '/events' OR parent_id IN (
            SELECT id FROM menus WHERE route = '/events'
        ) LOOP
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (guest_role_id, permission_id, menu_id, NOW(), NOW());
            authorization_count := authorization_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Autorisations créées avec succès: % autorisations insérées', authorization_count;
END $$;

-- Afficher confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Table des autorizations mise à jour';
    RAISE NOTICE '   Total des autorisations: %', (SELECT COUNT(*) FROM authorizations);
END $$;
