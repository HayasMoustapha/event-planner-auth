-- ========================================
-- RUN ALL SEEDS (clean set)
-- ========================================
\i database/seeds/seeds/roles.seed.sql
\i database/seeds/seeds/permissions.seed.sql
\i database/seeds/seeds/menus.seed.sql
\i database/seeds/seeds/authorizations.seed.sql
\i database/seeds/seeds/admin.seed.sql

DO $$
DECLARE
  total_roles INT;
  total_permissions INT;
  total_authorizations INT;
  total_users INT;
BEGIN
  SELECT COUNT(*) INTO total_roles FROM roles WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO total_permissions FROM permissions WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO total_authorizations FROM authorizations WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO total_users FROM users WHERE deleted_at IS NULL;

  RAISE NOTICE 'Rôles: %', total_roles;
  RAISE NOTICE 'Permissions: %', total_permissions;
  RAISE NOTICE 'Autorisations: %', total_authorizations;
  RAISE NOTICE 'Utilisateurs: %', total_users;
END $$;
