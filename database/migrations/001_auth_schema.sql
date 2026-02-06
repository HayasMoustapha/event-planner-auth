-- ========================================
-- Migration unique: Auth schema (roles stricts)
-- ========================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- PEOPLE
-- ========================================
CREATE TABLE IF NOT EXISTS people (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(30),
  status VARCHAR(20) DEFAULT 'active',
  created_by BIGINT,
  updated_by BIGINT,
  deleted_by BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  uid UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_email_unique ON people(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_people_uid ON people(uid);

-- ========================================
-- USERS
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  person_id BIGINT REFERENCES people(id) ON DELETE SET NULL,
  user_code VARCHAR(50),
  username VARCHAR(100),
  phone VARCHAR(30),
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'inactive',
  email_verified_at TIMESTAMP WITHOUT TIME ZONE,
  password VARCHAR(255) NOT NULL,
  remember_token VARCHAR(255),
  created_by BIGINT,
  updated_by BIGINT,
  deleted_by BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  uid UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_person_id ON users(person_id);
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);

-- ========================================
-- ROLES (strict 4)
-- ========================================
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  label JSONB NOT NULL,
  description JSONB,
  is_system BOOLEAN DEFAULT FALSE,
  level INT DEFAULT 0,
  created_by BIGINT,
  updated_by BIGINT,
  deleted_by BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  uid UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_code_unique ON roles(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_uid ON roles(uid);

-- ========================================
-- PERMISSIONS
-- ========================================
CREATE TABLE IF NOT EXISTS permissions (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL,
  label JSONB NOT NULL,
  "group" VARCHAR(100),
  description JSONB,
  created_by BIGINT,
  updated_by BIGINT,
  deleted_by BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  uid UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code_unique ON permissions(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_uid ON permissions(uid);

-- ========================================
-- MENUS
-- ========================================
CREATE TABLE IF NOT EXISTS menus (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT REFERENCES menus(id) ON DELETE SET NULL,
  label JSONB NOT NULL,
  icon VARCHAR(100),
  route VARCHAR(255),
  component VARCHAR(255),
  parent_path VARCHAR(255),
  menu_group INT DEFAULT 1,
  sort_order INT DEFAULT 1,
  depth INT DEFAULT 0,
  description JSONB,
  is_visible BOOLEAN DEFAULT TRUE,
  created_by BIGINT,
  updated_by BIGINT,
  deleted_by BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  uid UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE INDEX IF NOT EXISTS idx_menus_uid ON menus(uid);
CREATE INDEX IF NOT EXISTS idx_menus_route ON menus(route);

-- ========================================
-- ACCESSES (user-role)
-- ========================================
CREATE TABLE IF NOT EXISTS accesses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',
  granted_at TIMESTAMP WITHOUT TIME ZONE,
  created_by BIGINT,
  updated_by BIGINT,
  deleted_by BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  uid UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accesses_unique ON accesses(user_id, role_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_accesses_uid ON accesses(uid);
CREATE INDEX IF NOT EXISTS idx_accesses_user_id ON accesses(user_id);
CREATE INDEX IF NOT EXISTS idx_accesses_role_id ON accesses(role_id);

-- ========================================
-- AUTHORIZATIONS (role-permission-menu)
-- ========================================
CREATE TABLE IF NOT EXISTS authorizations (
  id BIGSERIAL PRIMARY KEY,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  menu_id BIGINT REFERENCES menus(id) ON DELETE SET NULL,
  granted_by BIGINT,
  granted_at TIMESTAMP WITHOUT TIME ZONE,
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  created_by BIGINT,
  updated_by BIGINT,
  deleted_by BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  uid UUID NOT NULL DEFAULT gen_random_uuid()
);

ALTER TABLE authorizations
  DROP CONSTRAINT IF EXISTS authorizations_unique_role_permission_menu;
ALTER TABLE authorizations
  ADD CONSTRAINT authorizations_unique_role_permission_menu
  UNIQUE (role_id, permission_id, menu_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_uid ON authorizations(uid);
CREATE INDEX IF NOT EXISTS idx_authorizations_role_id ON authorizations(role_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_permission_id ON authorizations(permission_id);

-- ========================================
-- SESSIONS
-- ========================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  payload JSONB,
  last_activity INT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- PERSONAL ACCESS TOKENS
-- ========================================
CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  token VARCHAR(255) NOT NULL,
  abilities TEXT,
  last_used_at TIMESTAMP WITHOUT TIME ZONE,
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- OTPs
-- ========================================
CREATE TABLE IF NOT EXISTS otps (
  id BIGSERIAL PRIMARY KEY,
  person_id BIGINT REFERENCES people(id) ON DELETE CASCADE,
  purpose VARCHAR(50) NOT NULL,
  otp_code VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);

-- ========================================
-- PASSWORD RESET TOKENS
-- ========================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  email VARCHAR(255) PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- USER IDENTITIES (OAuth)
-- ========================================
CREATE TABLE IF NOT EXISTS user_identities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_identities_unique ON user_identities(provider, provider_user_id);

-- ========================================
-- SCHEMA MIGRATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- COMMENTS
-- ========================================
COMMENT ON TABLE roles IS 'Table des rôles du système RBAC';
COMMENT ON TABLE authorizations IS 'Associations rôle-permission-menu';
COMMENT ON TABLE accesses IS 'Attributions de rôles aux utilisateurs';
