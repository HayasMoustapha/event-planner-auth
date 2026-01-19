-- ========================================
-- MIGRATION 002: PERMISSIONS SUPER ADMIN
-- ========================================
-- Attribution de toutes les permissions au super-admin

-- Mettre à jour l'ID du super-admin dans la table users
UPDATE users SET is_super_admin = true WHERE username = 'superadmin';

-- Donner au super-admin toutes les permissions existantes
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT u.id as user_id, p.id as permission_id
FROM users u
CROSS JOIN permissions p ON 1=1
WHERE u.username = 'superadmin' AND u.deleted_at IS NULL;

-- Ajouter les permissions spécifiques pour le module accesses
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT u.id as user_id, p.id as permission_id
FROM users u
CROSS JOIN permissions p ON 1=1
WHERE u.username = 'superadmin' AND u.deleted_at IS NULL
AND p.code IN (
  'accesses.read',
  'accesses.create', 
  'accesses.update', 
  'accesses.delete', 
  'accesses.hard_delete',
  'accesses.assign', 
  'accesses.remove'
);

-- Ajouter les permissions spécifiques pour le module authorizations
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT u.id as user_id, p.id as permission_id
FROM users u
CROSS JOIN permissions p ON 1=1
WHERE u.username = 'superadmin' AND u.deleted_at IS NULL
AND p.code IN (
  'authorizations.read',
  'authorizations.create',
  'authorizations.update',
  'authorizations.delete',
  'authorizations.hard_delete',
  'authorizations.check',
  'authorizations.cache'
);

-- Ajouter les permissions système
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT u.id as user_id, p.id as permission_id
FROM users u
CROSS JOIN permissions p ON 1=1
WHERE u.username = 'superadmin' AND u.deleted_at IS NULL
AND p.code IN (
  'system.admin',
  'system.monitoring',
  'system.audit'
);

-- Mettre à jour la séquence
SELECT setval('permissions_id_seq', (SELECT MAX(id) FROM permissions) + 1);

-- Afficher confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Permissions super-admin configurées avec succès';
    RAISE NOTICE '📊 Total permissions: ' || (SELECT COUNT(*) FROM user_permissions WHERE user_id = (SELECT id FROM users WHERE username = 'superadmin')) || 0;
END $$;

-- Afficher les permissions ajoutées
DO $$
BEGIN
  SELECT '📋 Permissions super-admin pour superadmin: ' || (SELECT COUNT(*) FROM user_permissions WHERE user_id = (SELECT id FROM users WHERE username = 'superadmin')) || 0;
END $$;
