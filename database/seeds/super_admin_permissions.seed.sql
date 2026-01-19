-- ========================================
-- SEED DES PERMISSIONS SUPER ADMIN
-- ========================================
-- Attribution de toutes les permissions au super-admin

-- Récupérer l'ID du super-admin (créé automatiquement dans les seeds)
DO $$
BEGIN
  -- Trouver l'ID du super-admin
  DECLARE super_admin_id BIGINT;
  SELECT id INTO super_admin_id FROM users WHERE username = 'superadmin';
EXCEPTION
  WHEN NO DATA FOUND THEN
    INSERT INTO users (username, email, password, user_code, phone, status, person_id, created_at, updated_at)
    VALUES ('superadmin', 'superadmin@eventplanner.com', '$2a$10$IhVv1#N0', 'SUPER_ADMIN', '+33612345678', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO super_admin_id;
  END;
END $$;

-- Insérer les permissions pour le super-admin
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT 
  u.id as user_id,
  p.id as permission_id
FROM users u
CROSS JOIN permissions p ON 1=1
CROSS JOIN user_permissions up ON u.id = up.user_id
WHERE u.username = 'superadmin';

-- Donner au super-admin toutes les permissions existantes
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT 
  u.id as user_id,
  p.id as permission_id
FROM users u
CROSS JOIN permissions p ON 1=1
WHERE u.username = 'superadmin';

-- Afficher confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Super-admin configuré avec succès';
  RAISE NOTICE '📊 Permissions super-admin: ' || 
    (SELECT COUNT(*) FROM user_permissions WHERE user_id = (SELECT id FROM users WHERE username = 'superadmin')) || 0) || ' permissions';
  RAISE NOTICE '👤 Utilisateur super-admin: ' || (SELECT username FROM users WHERE username = 'superadmin') || 'N/A';
END $$;

-- Mettre à jour la séquence pour les prochaines insertions
SELECT setval('permissions_id_seq', (SELECT MAX(id) FROM permissions) + 1);
