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
    
    -- Super Admin: Toutes les permissions sur tous les menus
    FOR permission_id IN SELECT id FROM permissions LOOP
        FOR menu_id IN SELECT id FROM menus LOOP
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (super_admin_role_id, permission_id, menu_id, NOW(), NOW());
            authorization_count := authorization_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '🔗 Création des autorisations pour le rôle admin...';
    
    -- Admin: Permissions utilisateurs, rôles, permissions, menus sur les menus correspondants
    FOR permission_id IN SELECT id FROM permissions WHERE "group" IN ('users', 'roles', 'permissions', 'menus') LOOP
        FOR menu_id IN SELECT id FROM menus WHERE route IN ('/users', '/rbac') OR parent_id IN (
            SELECT id FROM menus WHERE route IN ('/users', '/rbac')
        ) LOOP
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (admin_role_id, permission_id, menu_id, NOW(), NOW());
            authorization_count := authorization_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '🔗 Création des autorisations pour le rôle manager...';
    
    -- Manager: Permissions limitées sur événements et utilisateurs
    FOR permission_id IN SELECT id FROM permissions WHERE "group" IN ('users', 'events') AND 
                         code NOT LIKE '%delete%' LOOP
        FOR menu_id IN SELECT id FROM menus WHERE route IN ('/users', '/events') OR parent_id IN (
            SELECT id FROM menus WHERE route IN ('/users', '/events')
        ) LOOP
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (manager_role_id, permission_id, menu_id, NOW(), NOW());
            authorization_count := authorization_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '🔗 Création des autorisations pour le rôle user...';
    
    -- User: Permissions de lecture sur son profil et les événements
    FOR permission_id IN SELECT id FROM permissions WHERE "group" IN ('users', 'events') AND 
                         code LIKE '%read%' OR code LIKE '%list%' LOOP
        FOR menu_id IN SELECT id FROM menus WHERE route IN ('/profile', '/events') OR parent_id IN (
            SELECT id FROM menus WHERE route IN ('/profile', '/events')
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
