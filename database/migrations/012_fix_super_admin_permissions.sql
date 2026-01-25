-- ========================================
-- MIGRATION 012: FIX COMPLET SUPER ADMIN PERMISSIONS
-- ========================================
-- Correction complète des permissions pour le super-admin
-- Généré le 2026-01-25 - FIX CRITIQUE

-- 1. S'assurer que le rôle super_admin existe et n'est pas supprimé
UPDATE roles 
SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP 
WHERE code = 'super_admin';

-- 2. Créer le rôle super_admin s'il n'existe pas
INSERT INTO roles (code, label, description, created_at, updated_at)
VALUES (
    'super_admin', 
    '{"en": "Super Administrator", "fr": "Super Administrateur"}', 
    '{"en": "Full system administrator with all privileges", "fr": "Administrateur système complet avec tous les privilèges"}',
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
) ON CONFLICT (code) DO UPDATE SET 
    deleted_at = NULL, 
    updated_at = CURRENT_TIMESTAMP;

-- 3. Assigner TOUTES les permissions existantes au super_admin
INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
SELECT r.id as role_id, p.id as permission_id, 1 as menu_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin' AND r.deleted_at IS NULL
ON CONFLICT (role_id, permission_id, menu_id) DO UPDATE SET
    updated_at = CURRENT_TIMESTAMP;

-- 4. Vérification et log des permissions assignées
DO $$
DECLARE
    role_id_val UUID;
    permission_count INTEGER;
BEGIN
    -- Récupérer l'ID du rôle super_admin
    SELECT id INTO role_id_val FROM roles WHERE code = 'super_admin' AND deleted_at IS NULL;
    
    IF role_id_val IS NOT NULL THEN
        -- Compter les permissions assignées
        SELECT COUNT(*) INTO permission_count 
        FROM authorizations 
        WHERE role_id = role_id_val;
        
        RAISE NOTICE 'Super-admin role ID: %, Permissions assigned: %', role_id_val, permission_count;
    ELSE
        RAISE EXCEPTION 'Super-admin role not found!';
    END IF;
END $$;
