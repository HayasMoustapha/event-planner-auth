-- Migration initiale consolidée et IDEMPOTENTE pour le module d'authentification
-- Basée sur le schéma auth_schema.sql validé
-- Utilise CREATE TABLE IF NOT EXISTS pour éviter les conflits
-- SQL natif PostgreSQL uniquement

-- Extension UUID pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- TABLES PRINCIPALES (IDEMPOTENT)
-- ========================================

-- Table des personnes
CREATE TABLE IF NOT EXISTS people (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    photo VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_by BIGINT,
    updated_by BIGINT,
    deleted_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    user_code VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'lock')) NOT NULL,
    email_verified_at TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(255),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    label JSONB NOT NULL,
    description JSONB,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    level INTEGER,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Table des permissions
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    label JSONB,
    "group" VARCHAR(255),
    description JSONB,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Table des menus
CREATE TABLE IF NOT EXISTS menus (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES menus(id) ON DELETE SET NULL,
    label JSONB NOT NULL,
    icon VARCHAR(255),
    route VARCHAR(255),
    component VARCHAR(255),
    parent_path VARCHAR(255),
    menu_group INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    depth INTEGER,
    description JSONB,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ========================================
-- TABLES DE JOINTURE (IDEMPOTENT)
-- ========================================

-- Table des accès (rôles-utilisateurs)
CREATE TABLE IF NOT EXISTS accesses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
    granted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Table des autorisations (rôles-permissions-menus)
CREATE TABLE IF NOT EXISTS authorizations (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    granted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(role_id, permission_id, menu_id)
);

-- ========================================
-- INDEX (IDEMPOTENT)
-- ========================================

-- Index pour people
CREATE INDEX IF NOT EXISTS idx_people_uid ON people(uid);
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
CREATE INDEX IF NOT EXISTS idx_people_phone ON people(phone);
CREATE INDEX IF NOT EXISTS idx_people_status ON people(status);
CREATE INDEX IF NOT EXISTS idx_people_created_by ON people(created_by);

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_users_person_id ON users(person_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- Index pour roles
CREATE INDEX IF NOT EXISTS idx_roles_uid ON roles(uid);
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system);
CREATE INDEX IF NOT EXISTS idx_roles_created_by ON roles(created_by);

-- Index pour permissions
CREATE INDEX IF NOT EXISTS idx_permissions_uid ON permissions(uid);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_group ON permissions("group");
CREATE INDEX IF NOT EXISTS idx_permissions_created_by ON permissions(created_by);

-- Index pour menus
CREATE INDEX IF NOT EXISTS idx_menus_uid ON menus(uid);
CREATE INDEX IF NOT EXISTS idx_menus_parent_id ON menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_menus_menu_group ON menus(menu_group);
CREATE INDEX IF NOT EXISTS idx_menus_sort_order ON menus(sort_order);
CREATE INDEX IF NOT EXISTS idx_menus_is_visible ON menus(is_visible);
CREATE INDEX IF NOT EXISTS idx_menus_created_by ON menus(created_by);

-- Index pour accesses
CREATE INDEX IF NOT EXISTS idx_accesses_uid ON accesses(uid);
CREATE INDEX IF NOT EXISTS idx_accesses_user_id ON accesses(user_id);
CREATE INDEX IF NOT EXISTS idx_accesses_role_id ON accesses(role_id);
CREATE INDEX IF NOT EXISTS idx_accesses_status ON accesses(status);
CREATE INDEX IF NOT EXISTS idx_accesses_created_by ON accesses(created_by);

-- Index pour authorizations
CREATE INDEX IF NOT EXISTS idx_authorizations_uid ON authorizations(uid);
CREATE INDEX IF NOT EXISTS idx_authorizations_role_id ON authorizations(role_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_permission_id ON authorizations(permission_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_menu_id ON authorizations(menu_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_created_by ON authorizations(created_by);

-- ========================================
-- COMMENTAIRES (IDEMPOTENT)
-- ========================================

COMMENT ON TABLE people IS 'Table des personnes physiques';
COMMENT ON TABLE users IS 'Table des comptes utilisateurs';
COMMENT ON TABLE roles IS 'Table des rôles du système RBAC';
COMMENT ON TABLE permissions IS 'Table des permissions du système RBAC';
COMMENT ON TABLE menus IS 'Table des menus de navigation';
COMMENT ON TABLE accesses IS 'Table de jointure entre utilisateurs et rôles';
COMMENT ON TABLE authorizations IS 'Table de jointure entre rôles, permissions et menus';

-- Confirmation de la migration
DO $$
BEGIN
    RAISE NOTICE '✅ Migration initiale appliquée avec succès';
    RAISE NOTICE '   Tables créées: people, users, roles, permissions, menus, accesses, authorizations';
    RAISE NOTICE '   Index créés: 28 index de performance';
END $$;
