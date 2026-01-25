-- ========================================
-- SCRIPT DE TEST POUR MIGRATION 012
-- ========================================
-- Test pour valider la migration avant application

-- 1. Vérifier que les tables existent
SELECT '=== VERIFICATION TABLES ===' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('roles', 'permissions', 'menus', 'authorizations');

-- 2. Vérifier les types des colonnes
SELECT '=== TYPES DES COLONNES ===' as info;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('roles', 'permissions', 'menus', 'authorizations')
AND column_name IN ('id', 'role_id', 'permission_id', 'menu_id')
ORDER BY table_name, column_name;

-- 3. Vérifier le rôle super_admin
SELECT '=== ROLE SUPER_ADMIN ===' as info;
SELECT id, code, label, deleted_at FROM roles WHERE code = 'super_admin';

-- 4. Vérifier les permissions existantes
SELECT '=== NOMBRE DE PERMISSIONS ===' as info;
SELECT COUNT(*) as total_permissions FROM permissions WHERE deleted_at IS NULL;

-- 5. Vérifier les menus existants
SELECT '=== MENUS DISPONIBLES ===' as info;
SELECT id, label FROM menus ORDER BY id LIMIT 5;

-- 6. Vérifier les permissions actuelles du super_admin
SELECT '=== PERMISSIONS ACTUELLES SUPER_ADMIN ===' as info;
SELECT COUNT(*) as current_permissions 
FROM authorizations a
JOIN roles r ON a.role_id = r.id
WHERE r.code = 'super_admin';
