# Modèle Conceptuel de Données (MCD) - Module d'Authentification

## Entités Principales

### PERSONNE
- **id_personne** (PK)
- nom
- prénom
- email
- téléphone
- date_naissance
- adresse
- ville
- pays
- code_postal
- date_creation
- date_modification

### UTILISATEUR
- **id_utilisateur** (PK)
- **id_personne** (FK)
- nom_utilisateur
- mot_de_passe_hash
- email
- est_actif
- est_verifie
- derniere_connexion
- date_creation
- date_modification

### RÔLE
- **id_role** (PK)
- nom_role
- description
- date_creation
- date_modification

### PERMISSION
- **id_permission** (PK)
- nom_permission
- description
- ressource
- action
- date_creation
- date_modification

### MENU
- **id_menu** (PK)
- nom
- libelle
- icone
- chemin
- **id_menu_parent** (FK)
- ordre
- est_actif
- date_creation
- date_modification

### SESSION
- **id_session** (PK)
- **id_utilisateur** (FK)
- refresh_token
- date_expiration
- date_creation
- dernier_acces
- adresse_ip
- user_agent
- est_active

## Associations

### UTILISATEUR - RÔLE (Many-to-Many)
- **UTILISATEUR_ROLE**
  - **id_utilisateur** (FK)
  - **id_role** (FK)
  - date_assignation
  - **assigne_par** (FK)

### RÔLE - PERMISSION (Many-to-Many)
- **ROLE_PERMISSION**
  - **id_role** (FK)
  - **id_permission** (FK)

### RÔLE - MENU (Many-to-Many)
- **ROLE_MENU**
  - **id_role** (FK)
  - **id_menu** (FK)

## Entités de Sécurité

### TENTATIVE_CONNEXION
- **id_tentative** (PK)
- email
- adresse_ip
- user_agent
- succes
- raison_echec
- date_tentative

### TOKEN_REINITIALISATION
- **id_token** (PK)
- **id_utilisateur** (FK)
- token
- date_expiration
- utilise
- date_creation

### VERIFICATION_EMAIL
- **id_verification** (PK)
- **id_utilisateur** (FK)
- token
- date_expiration
- verifie
- date_creation

# Modèle Logique de Données (MLD)

## Tables MySQL/PostgreSQL

```sql
-- Table des personnes
CREATE TABLE people (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    person_id INT NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);

-- Table des rôles
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des permissions
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des menus
CREATE TABLE menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    path VARCHAR(255),
    parent_id INT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
);

-- Tables de liaison
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE role_menus (
    role_id INT NOT NULL,
    menu_id INT NOT NULL,
    PRIMARY KEY (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);
```

## Contraintes et Index

### Index de performance
```sql
-- Index pour les recherches fréquentes
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
```

### Contraintes d'intégrité
- **UNIQUE** sur les emails (people.email, users.email)
- **UNIQUE** sur les noms d'utilisateur (users.username)
- **UNIQUE** sur les noms de rôles (roles.name)
- **UNIQUE** sur les noms de permissions (permissions.name)
- **FOREIGN KEY** avec CASCADE pour maintenir l'intégrité référentielle

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
