# Modèle Conceptuel de Données (MCD) - Module d'Authentification

## Entités Principales

### PERSONNE
- **id** (PK, BIGSERIAL)
- **first_name** (VARCHAR(255), NOT NULL)
- **last_name** (VARCHAR(255))
- **phone** (VARCHAR(255), UNIQUE)
- **email** (VARCHAR(255), UNIQUE)
- **photo** (VARCHAR(255))
- **status** (VARCHAR(20), CHECK IN ('active', 'inactive'), DEFAULT 'active')
- **uid** (UUID, DEFAULT gen_random_uuid())
- **created_by** (BIGINT, audit)
- **updated_by** (BIGINT, audit)
- **deleted_by** (BIGINT, audit)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **deleted_at** (TIMESTAMP)

### UTILISATEUR
- **id** (PK, BIGSERIAL)
- **person_id** (BIGINT, NOT NULL, FK → people.id ON DELETE CASCADE)
- **user_code** (VARCHAR(255), NOT NULL, UNIQUE)
- **username** (VARCHAR(255), UNIQUE)
- **phone** (VARCHAR(255), UNIQUE)
- **email** (VARCHAR(255), UNIQUE, NOT NULL)
- **status** (VARCHAR(20), CHECK IN ('active', 'inactive', 'lock'), NOT NULL)
- **email_verified_at** (TIMESTAMP)
- **password** (VARCHAR(255), NOT NULL)
- **remember_token** (VARCHAR(255))
- **uid** (UUID, DEFAULT gen_random_uuid())
- **created_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **updated_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **deleted_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **deleted_at** (TIMESTAMP)

### RÔLE
- **id** (PK, BIGSERIAL)
- **code** (VARCHAR(255), NOT NULL, UNIQUE)
- **label** (JSONB, NOT NULL)
- **description** (JSONB)
- **is_system** (BOOLEAN, DEFAULT FALSE)
- **level** (INTEGER)
- **uid** (UUID, DEFAULT gen_random_uuid())
- **created_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **updated_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **deleted_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **deleted_at** (TIMESTAMP)

### PERMISSION
- **id** (PK, BIGSERIAL)
- **code** (VARCHAR(255), NOT NULL, UNIQUE)
- **label** (JSONB)
- **group** (VARCHAR(255))
- **description** (JSONB)
- **uid** (UUID, DEFAULT gen_random_uuid())
- **created_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **updated_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **deleted_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **deleted_at** (TIMESTAMP)

### MENU
- **id** (PK, BIGSERIAL)
- **parent_id** (BIGINT, FK → menus.id ON DELETE SET NULL)
- **label** (JSONB, NOT NULL)
- **icon** (VARCHAR(255))
- **route** (VARCHAR(255))
- **component** (VARCHAR(255))
- **parent_path** (VARCHAR(255))
- **menu_group** (INTEGER, NOT NULL)
- **sort_order** (INTEGER, NOT NULL)
- **depth** (INTEGER)
- **description** (JSONB)
- **uid** (UUID, DEFAULT gen_random_uuid())
- **created_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **updated_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **deleted_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **deleted_at** (TIMESTAMP)

### SESSION
- **id** (VARCHAR(255), PK)
- **user_id** (BIGINT, FK → users.id ON DELETE SET NULL)
- **ip_address** (INET)
- **user_agent** (TEXT)
- **payload** (TEXT, NOT NULL)
- **last_activity** (BIGINT, NOT NULL)

## Associations

### UTILISATEUR - RÔLE (Many-to-Many)
- **ACCESSES**
  - **id** (PK, BIGSERIAL)
  - **user_id** (BIGINT, NOT NULL, FK → users.id ON DELETE CASCADE)
  - **role_id** (BIGINT, NOT NULL, FK → roles.id ON DELETE CASCADE)
  - **status** (VARCHAR(20), CHECK IN ('active','inactive','lock'), DEFAULT 'active')
  - **uid** (UUID, DEFAULT gen_random_uuid())
  - **created_by** (BIGINT, FK → users.id ON DELETE SET NULL)
  - **updated_by** (BIGINT, FK → users.id ON DELETE SET NULL)
  - **deleted_by** (BIGINT, FK → users.id ON DELETE SET NULL)
  - **created_at** (TIMESTAMP)
  - **updated_at** (TIMESTAMP)
  - **deleted_at** (TIMESTAMP)
  - **UNIQUE** (user_id, role_id)

### RÔLE - PERMISSION - MENU (Many-to-Many)
- **AUTHORIZATIONS**
  - **id** (PK, BIGSERIAL)
  - **role_id** (BIGINT, NOT NULL, FK → roles.id ON DELETE CASCADE)
  - **permission_id** (BIGINT, NOT NULL, FK → permissions.id ON DELETE CASCADE)
  - **menu_id** (BIGINT, NOT NULL, FK → menus.id ON DELETE CASCADE)
  - **uid** (UUID, DEFAULT gen_random_uuid())
  - **created_by** (BIGINT, FK → users.id ON DELETE SET NULL)
  - **updated_by** (BIGINT, FK → users.id ON DELETE SET NULL)
  - **deleted_by** (BIGINT, FK → users.id ON DELETE SET NULL)
  - **created_at** (TIMESTAMP)
  - **updated_at** (TIMESTAMP)
  - **deleted_at** (TIMESTAMP)
  - **UNIQUE** (role_id, permission_id, menu_id)

## Entités de Sécurité

### TOKENS D'ACCÈS PERSONNELS
- **id** (PK, BIGSERIAL)
- **tokenable_type** (VARCHAR(255))
- **tokenable_id** (BIGINT, NOT NULL)
- **name** (TEXT, NOT NULL)
- **token** (VARCHAR(64))
- **abilities** (TEXT)
- **last_used_at** (TIMESTAMP)
- **expires_at** (TIMESTAMP)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)

### TOKENS DE RÉINITIALISATION MOT DE PASSE
- **email** (VARCHAR(255), NOT NULL, PK)
- **token** (VARCHAR(255), NOT NULL)
- **created_at** (TIMESTAMP)

### HISTORIQUE MOTS DE PASSE
- **id** (PK, BIGSERIAL)
- **user_id** (BIGINT, NOT NULL, FK → users.id ON DELETE CASCADE)
- **password** (VARCHAR(255), NOT NULL)
- **created_at** (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### OTP (One-Time Password)
- **id** (PK, BIGSERIAL)
- **person_id** (BIGINT, NOT NULL, FK → people.id ON DELETE CASCADE)
- **otp_code** (VARCHAR(255), NOT NULL)
- **expires_at** (TIMESTAMP, NOT NULL)
- **is_used** (BOOLEAN, DEFAULT FALSE)
- **purpose** (VARCHAR(255))
- **uid** (UUID, DEFAULT gen_random_uuid())
- **created_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **updated_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **deleted_by** (BIGINT, FK → users.id ON DELETE SET NULL)
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)
- **deleted_at** (TIMESTAMP)

# Modèle Logique de Données (MLD)

## Tables PostgreSQL

```sql
-- Table des personnes
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

-- Table des utilisateurs
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    user_code VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) UNIQUE,
    phone VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'lock')) NOT NULL,
    email_verified_at TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(255),
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Table des rôles
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    label JSONB NOT NULL,
    description JSONB,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    level INTEGER,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Table des permissions
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    label JSONB,
    "group" VARCHAR(255),
    description JSONB,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Table des menus
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
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Table des sessions
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity BIGINT NOT NULL
);

-- Tables de liaison
CREATE TABLE accesses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('active','inactive','lock')) DEFAULT 'active',
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (user_id, role_id)
);

CREATE TABLE authorizations (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (role_id, permission_id, menu_id)
);

-- Tables de sécurité
CREATE TABLE personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255),
    tokenable_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    token VARCHAR(64),
    abilities TEXT,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE password_reset_tokens (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    PRIMARY KEY (email)
);

CREATE TABLE password_histories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otps (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    otp_code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    purpose VARCHAR(255),
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

## Contraintes et Index

### Index de performance
```sql
-- Index pour les recherches fréquentes
CREATE UNIQUE INDEX people_uid_unique ON people(uid);
CREATE INDEX people_created_by_foreign ON people(created_by);
CREATE INDEX people_updated_by_foreign ON people(updated_by);
CREATE INDEX people_deleted_by_foreign ON people(deleted_by);

CREATE UNIQUE INDEX users_user_code_unique ON users(user_code);
CREATE UNIQUE INDEX users_email_unique ON users(email);
CREATE UNIQUE INDEX users_uid_unique ON users(uid);
CREATE UNIQUE INDEX users_username_unique ON users(username);
CREATE UNIQUE INDEX users_phone_unique ON users(phone);
CREATE INDEX users_created_by_foreign ON users(created_by);
CREATE INDEX users_updated_by_foreign ON users(updated_by);
CREATE INDEX users_deleted_by_foreign ON users(deleted_by);

CREATE UNIQUE INDEX roles_code_unique ON roles(code);
CREATE UNIQUE INDEX roles_uid_unique ON roles(uid);
CREATE INDEX roles_created_by_foreign ON roles(created_by);
CREATE INDEX roles_updated_by_foreign ON roles(updated_by);
CREATE INDEX roles_deleted_by_foreign ON roles(deleted_by);

CREATE UNIQUE INDEX permissions_code_unique ON permissions(code);
CREATE UNIQUE INDEX permissions_uid_unique ON permissions(uid);
CREATE UNIQUE INDEX permissions_code_group_unique ON permissions(code, "group");
CREATE INDEX permissions_created_by_foreign ON permissions(created_by);
CREATE INDEX permissions_updated_by_foreign ON permissions(updated_by);
CREATE INDEX permissions_deleted_by_foreign ON permissions(deleted_by);

CREATE UNIQUE INDEX menus_uid_unique ON menus(uid);
CREATE INDEX menus_parent_id_foreign ON menus(parent_id);
CREATE INDEX menus_created_by_foreign ON menus(created_by);
CREATE INDEX menus_updated_by_foreign ON menus(updated_by);
CREATE INDEX menus_deleted_by_foreign ON menus(deleted_by);

CREATE INDEX sessions_user_id_index ON sessions(user_id);
CREATE INDEX sessions_last_activity_index ON sessions(last_activity);

CREATE UNIQUE INDEX authorizations_uid_unique ON authorizations(uid);
CREATE INDEX authorizations_created_by_foreign ON authorizations(created_by);
CREATE INDEX authorizations_updated_by_foreign ON authorizations(updated_by);
CREATE INDEX authorizations_deleted_by_foreign ON authorizations(deleted_by);

CREATE UNIQUE INDEX accesses_uid_unique ON accesses(uid);
CREATE INDEX accesses_user_id_foreign ON accesses(user_id);
CREATE INDEX accesses_role_id_foreign ON accesses(role_id);
CREATE INDEX accesses_created_by_foreign ON accesses(created_by);
CREATE INDEX accesses_updated_by_foreign ON accesses(updated_by);
CREATE INDEX accesses_deleted_by_foreign ON accesses(deleted_by);

CREATE UNIQUE INDEX personal_access_tokens_token_unique ON personal_access_tokens(token);
CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON personal_access_tokens(tokenable_type, tokenable_id);
CREATE INDEX personal_access_tokens_expires_at_index ON personal_access_tokens(expires_at);

CREATE INDEX password_histories_user_id_created_at_index ON password_histories(user_id, created_at);

CREATE UNIQUE INDEX otps_uid_unique ON otps(uid);
CREATE INDEX otps_person_id_foreign ON otps(person_id);
CREATE INDEX otps_created_by_foreign ON otps(created_by);
CREATE INDEX otps_updated_by_foreign ON otps(updated_by);
CREATE INDEX otps_deleted_by_foreign ON otps(deleted_by);
```

### Contraintes d'intégrité
- **UNIQUE** sur les emails (people.email, users.email)
- **UNIQUE** sur les phones (people.phone, users.phone)
- **UNIQUE** sur les noms d'utilisateur (users.username)
- **UNIQUE** sur les codes de rôles (roles.code)
- **UNIQUE** sur les codes de permissions (permissions.code)
- **UNIQUE** sur les combinaisons (permissions.code, permissions.group)
- **UNIQUE** sur les combinaisons (accesses.user_id, accesses.role_id)
- **UNIQUE** sur les combinaisons (authorizations.role_id, authorizations.permission_id, authorizations.menu_id)
- **FOREIGN KEY** avec CASCADE/SET NULL pour maintenir l'intégrité référentielle
- **CHECK** constraints pour les champs status

## Sécurité

### Hashage des mots de passe
- Utilisation de bcrypt avec un facteur de coût de 12
- Salt généré aléatoirement pour chaque mot de passe

### Tokens
- JWT avec expiration configurable
- Refresh tokens stockés en base avec expiration
- Tokens de réinitialisation et verification à usage unique

### Audit
- Journalisation des tentatives de connexion
- Traçabilité des assignations de rôles
- Horodatage de toutes les modifications
