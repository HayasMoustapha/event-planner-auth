-- ========================================
-- MIGRATION 002: PERMISSIONS SUPER ADMIN
-- ========================================
-- Attribution de toutes les permissions au super-admin
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
    '{"en": "System administration menu", "fr": "Menu d'administration système"}'::jsonb,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE deleted_at IS NULL LIMIT 1);

-- 2. Donner au super-admin toutes les permissions existantes (IDEMPOTENT)
-- Utiliser le premier menu disponible pour garantir l'existence de la FK
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
