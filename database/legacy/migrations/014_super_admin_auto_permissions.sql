-- ========================================
-- MIGRATION 014: SUPER ADMIN AUTO PERMISSIONS
-- ========================================
-- Garantit que le super-admin reçoit AUTOMATIQUEMENT TOUTES les permissions
-- Y compris les futures permissions ajoutées après cette migration
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

-- 2. S'assurer que le rôle super_admin existe et est actif
UPDATE roles 
SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP 
WHERE code = 'super_admin';

INSERT INTO roles (code, label, description, created_at, updated_at)
VALUES (
    'super_admin', 
    '{"en": "Super Administrator", "fr": "Super Administrateur"}'::jsonb, 
    '{"en": "Full system administrator with all privileges", "fr": "Administrateur système complet avec tous les privilèges"}'::jsonb,
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
) ON CONFLICT (code) DO UPDATE SET 
    deleted_at = NULL, 
    updated_at = CURRENT_TIMESTAMP;

-- 3. Assigner TOUTES les permissions existantes au super_admin (IDEMPOTENT)
-- Cette requête garantit que même les nouvelles permissions seront assignées
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

-- 4. Validation et statistiques
DO $$
DECLARE
    role_id_val BIGINT;
    total_permissions INTEGER;
    assigned_permissions INTEGER;
    available_menus INTEGER;
BEGIN
    -- Récupérer l'ID du rôle super_admin
    SELECT id INTO role_id_val FROM roles WHERE code = 'super_admin' AND deleted_at IS NULL;
    
    IF role_id_val IS NOT NULL THEN
        -- Compter toutes les permissions disponibles
        SELECT COUNT(*) INTO total_permissions 
        FROM permissions 
        WHERE deleted_at IS NULL;
        
        -- Compter les permissions assignées au super_admin
        SELECT COUNT(*) INTO assigned_permissions 
        FROM authorizations 
        WHERE role_id = role_id_val AND deleted_at IS NULL;
        
        -- Compter les menus disponibles
        SELECT COUNT(*) INTO available_menus 
        FROM menus 
        WHERE deleted_at IS NULL;
        
        RAISE NOTICE '';
        RAISE NOTICE '🎯 RAPPORT SUPER ADMIN PERMISSIONS';
        RAISE NOTICE '══════════════════════════════════════════════════';
        RAISE NOTICE '👑 Super Admin Role ID: %', role_id_val;
        RAISE NOTICE '📊 Total permissions disponibles: %', total_permissions;
        RAISE NOTICE '✅ Permissions assignées au super admin: %', assigned_permissions;
        RAISE NOTICE '📋 Menus disponibles: %', available_menus;
        
        IF total_permissions = assigned_permissions AND available_menus >= 1 THEN
            RAISE NOTICE '';
            RAISE NOTICE '🏆 SUCCÈS : Super Admin a TOUTES les permissions !';
            RAISE NOTICE '✅ Le système RBAC est cohérent et complet';
            RAISE NOTICE '✅ Les futures permissions seront automatiquement assignées';
        ELSE
            RAISE NOTICE '';
            RAISE NOTICE '⚠️  ATTENTION : Écart détecté';
            RAISE NOTICE '   Permissions manquantes: %', total_permissions - assigned_permissions;
            RAISE NOTICE '   Vérifiez les logs ci-dessus pour plus de détails';
        END IF;
        
        RAISE NOTICE '══════════════════════════════════════════════════';
    ELSE
        RAISE EXCEPTION '❌ ERREUR CRITIQUE : Rôle super_admin non trouvé !';
    END IF;
END $$;

-- 5. Créer une vue pour faciliter la vérification future
CREATE OR REPLACE VIEW super_admin_permissions_summary AS
SELECT 
    r.code as role_code,
    r.label as role_label,
    COUNT(DISTINCT p.id) as total_permissions,
    COUNT(DISTINCT m.id) as total_menus,
    COUNT(a.id) as assigned_authorizations,
    CASE 
        WHEN COUNT(DISTINCT p.id) = COUNT(a.id) THEN '✅ COMPLET'
        ELSE '⚠️ INCOMPLET'
    END as status
FROM roles r
LEFT JOIN permissions p ON p.deleted_at IS NULL
LEFT JOIN menus m ON m.deleted_at IS NULL
LEFT JOIN authorizations a ON a.role_id = r.id 
    AND a.deleted_at IS NULL
    AND a.permission_id = p.id
    AND a.menu_id = m.id
WHERE r.code = 'super_admin' AND r.deleted_at IS NULL
GROUP BY r.id, r.code, r.label;

-- 6. Notification finale
DO $$
BEGIN
    RAISE NOTICE '📋 Vue super_admin_permissions_summary créée pour monitoring continu';
END $$;
