-- Schéma PostgreSQL pour le module d'authentification
-- Converti depuis MySQL dump
-- Fichier de référence documentaire uniquement

-- Table des personnes
DROP TABLE IF EXISTS people CASCADE;
CREATE TABLE people (
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


-- Créer les index
CREATE UNIQUE INDEX people_uid_unique ON people(uid);
CREATE INDEX people_created_by_foreign ON people(created_by);
CREATE INDEX people_updated_by_foreign ON people(updated_by);
CREATE INDEX people_deleted_by_foreign ON people(deleted_by);

-- Table des utilisateurs
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT REFERENCES people(id) ON DELETE CASCADE,
    user_code VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    user_access INTEGER,
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

-- Créer les index
CREATE UNIQUE INDEX users_user_code_unique ON users(user_code);
CREATE UNIQUE INDEX users_email_unique ON users(email);
CREATE UNIQUE INDEX users_uid_unique ON users(uid);
CREATE UNIQUE INDEX users_username_unique ON users(username);
CREATE UNIQUE INDEX users_phone_unique ON users(phone);
CREATE INDEX users_created_by_foreign ON users(created_by);
CREATE INDEX users_updated_by_foreign ON users(updated_by);
CREATE INDEX users_deleted_by_foreign ON users(deleted_by);

-- Table des rôles
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
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
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Créer les index
CREATE UNIQUE INDEX roles_code_unique ON roles(code);
CREATE UNIQUE INDEX roles_uid_unique ON roles(uid);
CREATE INDEX roles_created_by_foreign ON roles(created_by);
CREATE INDEX roles_updated_by_foreign ON roles(updated_by);
CREATE INDEX roles_deleted_by_foreign ON roles(deleted_by);

-- Table des permissions
DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
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

-- Créer les index
CREATE UNIQUE INDEX permissions_code_unique ON permissions(code);
CREATE UNIQUE INDEX permissions_uid_unique ON permissions(uid);
CREATE INDEX permissions_created_by_foreign ON permissions(created_by);
CREATE INDEX permissions_updated_by_foreign ON permissions(updated_by);
CREATE INDEX permissions_deleted_by_foreign ON permissions(deleted_by);
CREATE UNIQUE INDEX permissions_code_group_unique ON permissions(code, "group");

-- Table des menus
DROP TABLE IF EXISTS menus CASCADE;
CREATE TABLE menus (
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
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Créer les index
CREATE UNIQUE INDEX menus_uid_unique ON menus(uid);
CREATE INDEX menus_parent_id_foreign ON menus(parent_id);
CREATE INDEX menus_created_by_foreign ON menus(created_by);
CREATE INDEX menus_updated_by_foreign ON menus(updated_by);
CREATE INDEX menus_deleted_by_foreign ON menus(deleted_by);

-- Table des sessions
DROP TABLE IF EXISTS sessions CASCADE;
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity BIGINT NOT NULL
);

-- Créer les index
CREATE INDEX sessions_user_id_index ON sessions(user_id);
CREATE INDEX sessions_last_activity_index ON sessions(last_activity);

-- Table des tokens d'accès personnels
DROP TABLE IF EXISTS personal_access_tokens CASCADE;
CREATE TABLE personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    token VARCHAR(64) NOT NULL,
    abilities TEXT,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Créer les index
CREATE UNIQUE INDEX personal_access_tokens_token_unique ON personal_access_tokens(token);
CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON personal_access_tokens(tokenable_type, tokenable_id);
CREATE INDEX personal_access_tokens_expires_at_index ON personal_access_tokens(expires_at);

-- Table des tokens de reset mot de passe
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
CREATE TABLE password_reset_tokens (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    PRIMARY KEY (email)
);

-- Table des historiques de mots de passe
DROP TABLE IF EXISTS password_histories CASCADE;
CREATE TABLE password_histories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index
CREATE INDEX password_histories_user_id_created_at_index ON password_histories(user_id, created_at);
-- Table des autorisations (rôles-permissions)
DROP TABLE IF EXISTS authorizations CASCADE;
CREATE TABLE authorizations (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (role_id, permission_id, menu_id)
);

-- Créer les index
CREATE UNIQUE INDEX authorizations_uid_unique ON authorizations(uid);
CREATE INDEX authorizations_created_by_foreign ON authorizations(created_by);
CREATE INDEX authorizations_updated_by_foreign ON authorizations(updated_by);
CREATE INDEX authorizations_deleted_by_foreign ON authorizations(deleted_by);

-- Table des accès (user ↔ role)
DROP TABLE IF EXISTS accesses CASCADE;
CREATE TABLE accesses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('active','inactive','lock')) DEFAULT 'active',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (user_id, role_id)
);

-- Créer les index
CREATE UNIQUE INDEX accesses_uid_unique ON accesses(uid);
CREATE INDEX accesses_user_id_foreign ON accesses(user_id);
CREATE INDEX accesses_created_by_foreign ON accesses(created_by);
CREATE INDEX accesses_updated_by_foreign ON accesses(updated_by);
CREATE INDEX accesses_deleted_by_foreign ON accesses(deleted_by);

-- Table des tokens d'accès personnels
DROP TABLE IF EXISTS personal_access_tokens CASCADE;
CREATE TABLE personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    token VARCHAR(64) NOT NULL,
    abilities TEXT,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Créer les index
CREATE UNIQUE INDEX personal_access_tokens_token_unique ON personal_access_tokens(token);
CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON personal_access_tokens(tokenable_type, tokenable_id);
CREATE INDEX personal_access_tokens_expires_at_index ON personal_access_tokens(expires_at);

-- Table des tokens de réinitialisation de mot de passe
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
CREATE TABLE password_reset_tokens (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    PRIMARY KEY (email)
);

-- Table des historiques de mots de passe
DROP TABLE IF EXISTS password_histories CASCADE;
CREATE TABLE password_histories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index
CREATE INDEX password_histories_user_id_created_at_index ON password_histories(user_id, created_at);

-- Table des OTP
DROP TABLE IF EXISTS otps CASCADE;
CREATE TABLE otps (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    otp_code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    purpose VARCHAR(255),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Créer les index
CREATE UNIQUE INDEX otps_uid_unique ON otps(uid);
CREATE INDEX otps_person_id_foreign ON otps(person_id);
CREATE INDEX otps_created_by_foreign ON otps(created_by);
CREATE INDEX otps_updated_by_foreign ON otps(updated_by);
CREATE INDEX otps_deleted_by_foreign ON otps(deleted_by);

