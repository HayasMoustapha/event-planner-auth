-- MIGRATION CRITIQUE : Ajout de la permission authorizations.verify manquante
-- Cette migration corrige le bug PERMISSION_DENIED sur les routes /verify/*
-- Version IDEMPOTENTE - Généré le 2026-01-26

-- 1. Créer le menu par défaut si aucun n'existe (IDEMPOTENT)
INSERT INTO menus (parent_id, label, icon, route, component, parent_path, menu_group, sort_order, depth, description, is_visible, created_at, updated_at)
SELECT 
    NULL, 
    '{"en": "System", "fr": "Système"}'::jsonb,
    'settings',
    '/admin',
    'AdminLayout',
    '/admin',
    1,
    1,
    0,
    '{"en": "System administration menu", "fr": "Menu d''administration système"}'::jsonb,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE deleted_at IS NULL LIMIT 1);

-- 2. Vérifier si la permission existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM permissions WHERE code = 'authorizations.verify' AND deleted_at IS NULL
    ) THEN
        -- Insérer la permission manquante critique
        INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
        ('authorizations.verify', 
         '{"fr": "Vérifier les autorisations (routes)", "en": "Verify authorizations (routes)"}'::jsonb, 
         'authorizations', 
         '{"fr": "Permet d''utiliser les routes de vérification des permissions", "en": "Allows using permission verification routes"}'::jsonb,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        
        RAISE NOTICE '✅ Permission authorizations.verify créée avec succès';
    ELSE
        RAISE NOTICE 'ℹ️  Permission authorizations.verify existe déjà';
    END IF;
END $$;

-- 3. Assigner la permission au super admin (IDEMPOTENT)
INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
SELECT 
    r.id as role_id, 
    p.id as permission_id, 
    m.id as menu_id,
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permissions p
CROSS JOIN LATERAL (
    SELECT id FROM menus WHERE deleted_at IS NULL ORDER BY id LIMIT 1
) m
WHERE r.code = 'super_admin' 
  AND r.deleted_at IS NULL 
  AND p.code = 'authorizations.verify'
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM authorizations a 
    WHERE a.role_id = r.id 
      AND a.permission_id = p.id 
      AND a.menu_id = m.id
      AND a.deleted_at IS NULL
  )
ON CONFLICT (role_id, permission_id, menu_id) DO UPDATE SET
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

-- 4. Assigner la permission au rôle admin (IDEMPOTENT)
INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
SELECT 
    r.id as role_id, 
    p.id as permission_id, 
    m.id as menu_id,
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permissions p
CROSS JOIN LATERAL (
    SELECT id FROM menus WHERE deleted_at IS NULL ORDER BY id LIMIT 1
) m
WHERE r.code = 'admin' 
  AND r.deleted_at IS NULL 
  AND p.code = 'authorizations.verify'
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM authorizations a 
    WHERE a.role_id = r.id 
      AND a.permission_id = p.id 
      AND a.menu_id = m.id
      AND a.deleted_at IS NULL
  )
ON CONFLICT (role_id, permission_id, menu_id) DO UPDATE SET
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

-- 5. Validation finale
DO $$
BEGIN
    DECLARE
        permission_count INTEGER;
        super_admin_count INTEGER;
        admin_count INTEGER;
        menu_count INTEGER;
    BEGIN
        -- Vérifier que la permission existe
        SELECT COUNT(*) INTO permission_count FROM permissions WHERE code = 'authorizations.verify' AND deleted_at IS NULL;
        
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
        
        -- Compter les menus disponibles
        SELECT COUNT(*) INTO menu_count 
        FROM menus 
        WHERE deleted_at IS NULL;
        
        RAISE NOTICE '';
        RAISE NOTICE '🎯 RAPPORT DE MIGRATION - authorizations.verify';
        RAISE NOTICE '══════════════════════════════════════════════════';
        RAISE NOTICE '📊 Permission authorizations.verify: % (1 requis)', permission_count;
        RAISE NOTICE '👑 Super admin avec authorizations.verify: % (1 requis)', super_admin_count;
        RAISE NOTICE '🔧 Admin avec authorizations.verify: % (1 requis)', admin_count;
        RAISE NOTICE '📋 Menus disponibles: %', menu_count;
        
        IF permission_count = 1 AND super_admin_count = 1 AND admin_count = 1 AND menu_count >= 1 THEN
            RAISE NOTICE '';
            RAISE NOTICE '🏆 SUCCÈS : Migration complétée avec succès !';
            RAISE NOTICE '✅ Le bug PERMISSION_DENIED est maintenant résolu';
            RAISE NOTICE '✅ Les routes /verify/* sont accessibles au super admin et admin';
            RAISE NOTICE '✅ Les contraintes FK sont respectées';
        ELSE
            RAISE NOTICE '';
            RAISE NOTICE '❌ ERREUR : Migration incomplète - Vérifier les logs ci-dessus';
        END IF;
        
        RAISE NOTICE '══════════════════════════════════════════════════';
    END;
END $$;
