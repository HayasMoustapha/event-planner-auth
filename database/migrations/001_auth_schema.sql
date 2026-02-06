-- ========================================
-- Migration unique: Auth schema (alignée legacy)
-- ========================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- PEOPLE
-- ========================================
CREATE TABLE IF NOT EXISTS people (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  phone VARCHAR(255),
  email VARCHAR(255),
  photo VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  uid UUID NOT NULL DEFAULT gen_random_uuid(),
  created_by BIGINT,
  updated_by BIGINT,
  deleted_by BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

ALTER TABLE people
  DROP CONSTRAINT IF EXISTS people_status_check;
ALTER TABLE people
  ADD CONSTRAINT people_status_check CHECK (status IN ('active', 'inactive', 'lock'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_email_unique ON people(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_phone_unique ON people(phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_people_uid ON people(uid);
CREATE INDEX IF NOT EXISTS idx_people_status ON people(status);
CREATE INDEX IF NOT EXISTS idx_people_created_by ON people(created_by);

-- ========================================
-- USERS
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_code VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  phone VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMP WITHOUT TIME ZONE,
  password VARCHAR(255) NOT NULL,
  remember_token VARCHAR(255),
  user_access INT DEFAULT NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uid UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users
  ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'lock'));

CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_users_person_id ON users(person_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_user_access ON users(user_access);

-- ========================================
-- ROLES (strict 4)
-- ========================================
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL,
  label JSONB NOT NULL,
  description JSONB,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  level INTEGER,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uid UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_code_unique ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_uid ON roles(uid);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system);
CREATE INDEX IF NOT EXISTS idx_roles_created_by ON roles(created_by);

-- ========================================
-- PERMISSIONS
-- ========================================
CREATE TABLE IF NOT EXISTS permissions (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL,
  label JSONB,
  "group" VARCHAR(255),
  description JSONB,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uid UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code_unique ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_uid ON permissions(uid);
CREATE INDEX IF NOT EXISTS idx_permissions_group ON permissions("group");
CREATE INDEX IF NOT EXISTS idx_permissions_created_by ON permissions(created_by);

-- ========================================
-- MENUS
-- ========================================
CREATE TABLE IF NOT EXISTS menus (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT REFERENCES menus(id) ON DELETE SET NULL,
  label JSONB NOT NULL,
  icon VARCHAR(255),
  route VARCHAR(255),
  component VARCHAR(255),
  parent_path VARCHAR(255),
  menu_group INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 1,
  depth INTEGER DEFAULT 0,
  description JSONB,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uid UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_menus_uid ON menus(uid);
CREATE INDEX IF NOT EXISTS idx_menus_parent_id ON menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_menus_menu_group ON menus(menu_group);
CREATE INDEX IF NOT EXISTS idx_menus_sort_order ON menus(sort_order);
CREATE INDEX IF NOT EXISTS idx_menus_is_visible ON menus(is_visible);
CREATE INDEX IF NOT EXISTS idx_menus_created_by ON menus(created_by);

-- ========================================
-- ACCESSES (user-role)
-- ========================================
CREATE TABLE IF NOT EXISTS accesses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  granted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITHOUT TIME ZONE,
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uid UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_accesses_uid ON accesses(uid);
CREATE INDEX IF NOT EXISTS idx_accesses_user_id ON accesses(user_id);
CREATE INDEX IF NOT EXISTS idx_accesses_role_id ON accesses(role_id);
CREATE INDEX IF NOT EXISTS idx_accesses_status ON accesses(status);
CREATE INDEX IF NOT EXISTS idx_accesses_created_by ON accesses(created_by);

-- ========================================
-- AUTHORIZATIONS (role-permission-menu)
-- ========================================
CREATE TABLE IF NOT EXISTS authorizations (
  id BIGSERIAL PRIMARY KEY,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  menu_id BIGINT REFERENCES menus(id) ON DELETE SET NULL,
  granted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITHOUT TIME ZONE,
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uid UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  granted BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE authorizations
  DROP CONSTRAINT IF EXISTS authorizations_unique_role_permission_menu;
ALTER TABLE authorizations
  ADD CONSTRAINT authorizations_unique_role_permission_menu
  UNIQUE (role_id, permission_id, menu_id);

CREATE INDEX IF NOT EXISTS idx_authorizations_uid ON authorizations(uid);
CREATE INDEX IF NOT EXISTS idx_authorizations_role_id ON authorizations(role_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_permission_id ON authorizations(permission_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_menu_id ON authorizations(menu_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_created_by ON authorizations(created_by);
CREATE INDEX IF NOT EXISTS idx_authorizations_granted ON authorizations(granted);

-- ========================================
-- SESSIONS
-- ========================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(1000) PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  payload TEXT NOT NULL,
  last_activity BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

-- ========================================
-- PERSONAL ACCESS TOKENS (blacklist)
-- ========================================
CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_type VARCHAR(50) NOT NULL DEFAULT 'access',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB,
  reason VARCHAR(255),
  revoked_by BIGINT,
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_token ON personal_access_tokens(token, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_user_id ON personal_access_tokens(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_expires_at ON personal_access_tokens(expires_at, is_active);
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_token_type ON personal_access_tokens(token_type, is_active);
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_revoked_at ON personal_access_tokens(revoked_at);

-- ========================================
-- OTPs
-- ========================================
CREATE TABLE IF NOT EXISTS otps (
  id BIGSERIAL PRIMARY KEY,
  person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  purpose VARCHAR(255) DEFAULT NULL,
  otp_code VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uid UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_otps_person_id_code ON otps(person_id, purpose, is_used, expires_at);
CREATE INDEX IF NOT EXISTS idx_otps_person_id ON otps(person_id, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at, is_used);
CREATE INDEX IF NOT EXISTS idx_otps_is_used ON otps(is_used, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS otps_uid_unique ON otps(uid);

-- ========================================
-- PASSWORD RESET TOKENS
-- ========================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uid UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,
  PRIMARY KEY (email)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_created_at ON password_reset_tokens(created_at);

-- ========================================
-- PASSWORD HISTORIES
-- ========================================
CREATE TABLE IF NOT EXISTS password_histories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_histories_user_id_created_at ON password_histories(user_id, created_at);

-- ========================================
-- USER IDENTITIES (OAuth)
-- ========================================
CREATE TABLE IF NOT EXISTS user_identities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  provider_data JSONB,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  uid UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_identities_provider_unique ON user_identities(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS user_identities_user_id_foreign ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS user_identities_email_index ON user_identities(email);
CREATE UNIQUE INDEX IF NOT EXISTS user_identities_uid_unique ON user_identities(uid);
CREATE INDEX IF NOT EXISTS user_identities_created_by_foreign ON user_identities(created_by);
CREATE INDEX IF NOT EXISTS user_identities_updated_by_foreign ON user_identities(updated_by);

-- ========================================
-- USER OAUTH IDENTITIES / LOGS
-- ========================================
CREATE TABLE IF NOT EXISTS user_oauth_identities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  provider_name VARCHAR(255),
  provider_avatar VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS user_oauth_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identity_id BIGINT REFERENCES user_oauth_identities(id) ON DELETE SET NULL,
  operator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('link', 'unlink', 'login', 'register')),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_oauth_identities_user_id ON user_oauth_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_identities_provider ON user_oauth_identities(provider);
CREATE INDEX IF NOT EXISTS idx_user_oauth_identities_active ON user_oauth_identities(is_active);
CREATE INDEX IF NOT EXISTS idx_user_oauth_logs_user_id ON user_oauth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_logs_action ON user_oauth_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_oauth_logs_created_at ON user_oauth_logs(created_at);

-- ========================================
-- COMMENTS
-- ========================================
COMMENT ON TABLE people IS 'Table des personnes physiques';
COMMENT ON TABLE users IS 'Table des comptes utilisateurs';
COMMENT ON TABLE roles IS 'Table des rôles du système RBAC';
COMMENT ON TABLE permissions IS 'Table des permissions du système RBAC';
COMMENT ON TABLE menus IS 'Table des menus de navigation';
COMMENT ON TABLE accesses IS 'Table de jointure entre utilisateurs et rôles';
COMMENT ON TABLE authorizations IS 'Table de jointure entre rôles, permissions et menus';
COMMENT ON TABLE user_identities IS 'Table des identités OAuth externes (Google, Apple)';
COMMENT ON TABLE user_oauth_identities IS 'Table des identités OAuth des utilisateurs';
COMMENT ON TABLE user_oauth_logs IS 'Table des logs OAuth pour audit';
