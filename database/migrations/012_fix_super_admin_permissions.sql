-- ========================================
-- MIGRATION 012: FIX COMPLET SUPER ADMIN PERMISSIONS
-- ========================================
-- Correction complète des permissions pour le super-admin
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
    '{"en": "System administration menu", "fr": "Menu d administration système"}'::jsonb,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE deleted_at IS NULL LIMIT 1);

-- 2. S'assurer que le rôle super_admin existe et n'est pas supprimé
UPDATE roles 
SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP 
WHERE code = 'super_admin';

-- 3. Créer le rôle super_admin s'il n'existe pas (IDEMPOTENT)
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

-- 4. Assigner TOUTES les permissions existantes au super_admin (IDEMPOTENT)
-- Utiliser le premier menu disponible ou créer une autorisation par permission
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

-- 5. Vérification et log des permissions assignées
DO $$
DECLARE
    role_id_val BIGINT;
    permission_count INTEGER;
    menu_count INTEGER;
BEGIN
    -- Récupérer l'ID du rôle super_admin
    SELECT id INTO role_id_val FROM roles WHERE code = 'super_admin' AND deleted_at IS NULL;
    
    IF role_id_val IS NOT NULL THEN
        -- Compter les permissions assignées
        SELECT COUNT(*) INTO permission_count 
        FROM authorizations 
        WHERE role_id = role_id_val AND deleted_at IS NULL;
        
        -- Compter les menus disponibles
        SELECT COUNT(*) INTO menu_count 
        FROM menus 
        WHERE deleted_at IS NULL;
        
        RAISE NOTICE '✅ Migration 012 appliquée avec succès';
        RAISE NOTICE '   Super-admin role ID: %', role_id_val;
        RAISE NOTICE '   Permissions assigned: %', permission_count;
        RAISE NOTICE '   Available menus: %', menu_count;
    ELSE
        RAISE EXCEPTION '❌ Super-admin role not found after migration!';
    END IF;
END $$;
