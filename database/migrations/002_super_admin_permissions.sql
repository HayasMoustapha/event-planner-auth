-- ========================================
-- MIGRATION 002: PERMISSIONS SUPER ADMIN
-- ========================================
-- Attribution de toutes les permissions au super-admin

-- Donner au super-admin toutes les permissions existantes (IDEMPOTENT)
INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
SELECT r.id as role_id, p.id as permission_id, 1 as menu_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin' AND (r.deleted_at IS NULL OR r.deleted_at IS NULL)
ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
