-- MIGRATION CRITIQUE : Ajout de la permission authorizations.verify manquante
-- Cette migration corrige le bug PERMISSION_DENIED sur les routes /verify/*

-- Vérifier si la permission existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM permissions WHERE code = 'authorizations.verify'
    ) THEN
        -- Insérer la permission manquante critique
        INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
        ('authorizations.verify', 
         '{"fr": "Vérifier les autorisations (routes)", "en": "Verify authorizations (routes)"}', 
         'authorizations', 
         '{"fr": "Permet d''utiliser les routes de vérification des permissions", "en": "Allows using permission verification routes"}',
         NOW(), NOW());
        
        RAISE NOTICE '✅ Permission authorizations.verify créée avec succès';
    ELSE
        RAISE NOTICE 'ℹ️  Permission authorizations.verify existe déjà';
    END IF;
END $$;

-- Assigner la permission au super admin pour corriger immédiatement le blocage
DO $$
BEGIN
    -- Récupérer l'ID du rôle super_admin
    DECLARE
        super_admin_role_id INTEGER;
        verify_permission_id INTEGER;
        existing_auth_id INTEGER;
    BEGIN
        SELECT id INTO super_admin_role_id FROM roles WHERE code = 'super_admin' LIMIT 1;
        SELECT id INTO verify_permission_id FROM permissions WHERE code = 'authorizations.verify' LIMIT 1;
        
        IF super_admin_role_id IS NOT NULL AND verify_permission_id IS NOT NULL THEN
            -- Vérifier si l'autorisation existe déjà
            SELECT id INTO existing_auth_id 
            FROM authorizations 
            WHERE role_id = super_admin_role_id 
            AND permission_id = verify_permission_id 
            AND deleted_at IS NULL 
            LIMIT 1;
            
            IF existing_auth_id IS NULL THEN
                -- Créer l'autorisation pour le super admin
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at) VALUES
                (super_admin_role_id, verify_permission_id, 1, NOW(), NOW());
                
                RAISE NOTICE '✅ Permission authorizations.verify assignée au super_admin';
            ELSE
                RAISE NOTICE 'ℹ️  Super admin a déjà la permission authorizations.verify';
            END IF;
        ELSE
            RAISE WARNING '⚠️  Impossible de trouver le rôle super_admin ou la permission authorizations.verify';
        END IF;
    END;
END $$;

-- Assigner la permission au rôle admin pour éviter les blocages
DO $$
BEGIN
    DECLARE
        admin_role_id INTEGER;
        verify_permission_id INTEGER;
        existing_auth_id INTEGER;
    BEGIN
        SELECT id INTO admin_role_id FROM roles WHERE code = 'admin' LIMIT 1;
        SELECT id INTO verify_permission_id FROM permissions WHERE code = 'authorizations.verify' LIMIT 1;
        
        IF admin_role_id IS NOT NULL AND verify_permission_id IS NOT NULL THEN
            -- Vérifier si l'autorisation existe déjà
            SELECT id INTO existing_auth_id 
            FROM authorizations 
            WHERE role_id = admin_role_id 
            AND permission_id = verify_permission_id 
            AND deleted_at IS NULL 
            LIMIT 1;
            
            IF existing_auth_id IS NULL THEN
                -- Créer l'autorisation pour le admin
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at) VALUES
                (admin_role_id, verify_permission_id, 1, NOW(), NOW());
                
                RAISE NOTICE '✅ Permission authorizations.verify assignée au admin';
            ELSE
                RAISE NOTICE 'ℹ️  Admin a déjà la permission authorizations.verify';
            END IF;
        END IF;
    END;
END $$;

-- Validation finale
DO $$
BEGIN
    DECLARE
        permission_count INTEGER;
        super_admin_count INTEGER;
        admin_count INTEGER;
    BEGIN
        -- Vérifier que la permission existe
        SELECT COUNT(*) INTO permission_count FROM permissions WHERE code = 'authorizations.verify';
        
        -- Vérifier que le super admin a la permission
        SELECT COUNT(*) INTO super_admin_count
        FROM authorizations a
        INNER JOIN roles r ON a.role_id = r.id
        INNER JOIN permissions p ON a.permission_id = p.id
        WHERE r.code = 'super_admin' 
        AND p.code = 'authorizations.verify' 
        AND a.deleted_at IS NULL;
        
        -- Vérifier que l'admin a la permission  
        SELECT COUNT(*) INTO admin_count
        FROM authorizations a
        INNER JOIN roles r ON a.role_id = r.id
        INNER JOIN permissions p ON a.permission_id = p.id
        WHERE r.code = 'admin' 
        AND p.code = 'authorizations.verify' 
        AND a.deleted_at IS NULL;
        
        RAISE NOTICE '';
        RAISE NOTICE '🎯 RAPPORT DE MIGRATION - authorizations.verify';
        RAISE NOTICE '══════════════════════════════════════════════════';
        RAISE NOTICE '📊 Permission authorizations.verify: % (1 requis)', permission_count;
        RAISE NOTICE '👑 Super admin avec authorizations.verify: % (1 requis)', super_admin_count;
        RAISE NOTICE '🔧 Admin avec authorizations.verify: % (1 requis)', admin_count;
        
        IF permission_count = 1 AND super_admin_count = 1 AND admin_count = 1 THEN
            RAISE NOTICE '';
            RAISE NOTICE '🏆 SUCCÈS : Migration complétée avec succès !';
            RAISE NOTICE '✅ Le bug PERMISSION_DENIED est maintenant résolu';
            RAISE NOTICE '✅ Les routes /verify/* sont accessibles au super admin et admin';
        ELSE
            RAISE NOTICE '';
            RAISE NOTICE '❌ ERREUR : Migration incomplète - Vérifier les logs ci-dessus';
        END IF;
        
        RAISE NOTICE '══════════════════════════════════════════════════';
    END;
END $$;
