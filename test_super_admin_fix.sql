-- ========================================
-- SCRIPT DE TEST: VERIFICATION SUPER ADMIN
-- ========================================
-- Test pour vérifier que le super_admin a bien toutes les permissions

-- 1. Vérifier que le rôle super_admin existe
SELECT '=== VERIFICATION ROLE SUPER_ADMIN ===' as info;
SELECT id, code, label, deleted_at 
FROM roles 
WHERE code = 'super_admin';

-- 2. Compter le nombre total de permissions
SELECT '=== NOMBRE TOTAL DE PERMISSIONS ===' as info;
SELECT COUNT(*) as total_permissions FROM permissions;

-- 3. Compter les permissions assignées au super_admin
SELECT '=== PERMISSIONS SUPER_ADMIN ===' as info;
SELECT COUNT(*) as super_admin_permissions 
FROM authorizations a
JOIN roles r ON a.role_id = r.id
WHERE r.code = 'super_admin';

-- 4. Vérifier spécifiquement la permission events.create
SELECT '=== VERIFICATION PERMISSION events.create ===' as info;
SELECT p.code, p.label, a.role_id, r.code as role_code
FROM permissions p
LEFT JOIN authorizations a ON p.id = a.permission_id
LEFT JOIN roles r ON a.role_id = r.id
WHERE p.code = 'events.create';

-- 5. Lister les permissions manquantes pour le super_admin (s'il y en a)
SELECT '=== PERMISSIONS MANQUANTES (si vide = OK) ===' as info;
SELECT p.code, p.label
FROM permissions p
WHERE p.id NOT IN (
    SELECT a.permission_id 
    FROM authorizations a
    JOIN roles r ON a.role_id = r.id
    WHERE r.code = 'super_admin'
)
LIMIT 10;
