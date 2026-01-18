# 🗄️ Documentation Base de Données

Ce dossier contient toute la documentation de la base de données PostgreSQL du projet Event Planner Auth.

---

## 📋 **Documents Base de Données Disponibles**

### 🚀 **Configuration**
- **`DATABASE_BOOTSTRAP.md`** - Guide complet de bootstrap de la base de données
  - Installation et configuration PostgreSQL
  - Création de la base et des utilisateurs
  - Exécution des migrations
  - Peuplement initial (seeds)

### 📊 **Modélisation**
- **`MCD_MLD_AUTH.md`** - Modèle Conceptuel et Logique des Données
  - MCD (Modèle Conceptuel de Données)
  - MLD (Modèle Logique de Données)  
  - Relations et cardinalités
  - Contraintes et index

### 🌱 **Seeds**
- **`README.md`** - Documentation du module de peuplement
  - Structure des données de test
  - Scripts de peuplement
  - Données par défaut
  - Utilisation pour développement

---

## 🏗️ **Architecture de la Base de Données**

### 🗄️ **Système de Gestion**
- **PostgreSQL 14+** comme SGBD principal
- **SQL Natif** (pas d'ORM) pour les requêtes
- **Migrations** versionnées avec historique
- **Soft Delete** avec `deleted_at` systématique

### 🔒 **Sécurité des Données**
- **Hashage bcrypt** des mots de passe
- **Tokens JWT** stockés temporairement
- **Chiffrement** des données sensibles
- **Audit trail** avec timestamps

### 📊 **Types de Données**

#### 🔤 **Types JSONB**
```sql
-- Labels multilingues
label JSONB NOT NULL DEFAULT '{}'::jsonb
-- Exemple: {"en": "Administrator", "fr": "Administrateur"}

-- Descriptions multilingues  
description JSONB DEFAULT NULL
-- Exemple: {"en": "Full access", "fr": "Accès complet"}
```

#### 📅 **Timestamps**
```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
deleted_at TIMESTAMP NULL  -- Soft delete
last_activity TIMESTAMP NULL  -- Tracking activité
```

#### 🔐 **Sécurité**
```sql
-- Hashage mot de passe
password_hash VARCHAR(255) NOT NULL

-- Tokens temporaires
access_token VARCHAR(500) NULL
refresh_token VARCHAR(500) NULL
otp_code VARCHAR(10) NULL
```

---

## 📋 **Tables Principales**

### 👤 **Utilisateurs et Authentification**
```sql
users          -- Profil utilisateur principal
people          -- Informations personnelles  
sessions        -- Sessions utilisateur actives
personal_access_tokens -- Tokens d'accès personnels
otp_codes       -- Codes à usage unique
```

### 👑 **Gestion des Accès**
```sql
roles           -- Rôles du système
permissions     -- Permissions granulaires
authorizations   -- Association rôles-permissions
accesses        -- Association utilisateurs-rôles
```

### 📋 **Interface Utilisateur**
```sql
menus           -- Structure des menus
menu_permissions -- Permissions sur les menus
```

### 📊 **Audit et Logs**
```sql
schema_migrations -- Historique des migrations
audit_logs      -- Logs d'audit (optionnel)
```

---

## 🔍 **Relations et Contraintes**

### 📊 **Relations Principales**
```sql
-- Utilisateur ↔ Personne (1:1)
users.id = people.user_id

-- Utilisateur ↔ Rôles (N:N)  
users.id ↔ accesses.user_id ↔ accesses.role_id ↔ roles.id

-- Rôle ↔ Permissions (N:N)
roles.id ↔ authorizations.role_id ↔ authorizations.permission_id ↔ permissions.id

-- Menu ↔ Permissions (N:N)
menus.id ↔ menu_permissions.menu_id ↔ menu_permissions.permission_id ↔ permissions.id
```

### 🔒 **Contraintes d'Intégrité**
```sql
-- Clés primaires
PRIMARY KEY (id)

-- Clés étrangères
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE

-- Contraintes d'unicité
UNIQUE (email) ON users
UNIQUE (code) ON roles  
UNIQUE (code) ON permissions
```

---

## 🚀 **Déploiement et Maintenance**

### 📦 **Installation**
```bash
# 1. Configuration PostgreSQL
sudo -u postgres psql
CREATE DATABASE event_planner_auth;
CREATE USER event_planner_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE event_planner_auth TO event_planner_user;

# 2. Exécution des migrations
cd database/migrations
psql -U event_planner_user -d event_planner_auth -f 000_initial_schema.sql
psql -U event_planner_user -d event_planner_auth -f 001_init_auth.sql

# 3. Peuplement des données
cd database/seeds  
node execute-seeds.js
```

### 🔄 **Migrations**
```bash
# Créer nouvelle migration
cd database/migrations
touch 003_new_feature.sql

# Appliquer migrations non appliquées
cd database/bootstrap
node 001_create_schema_migrations.js
```

### 📊 **Monitoring**
```sql
-- Statistiques des tables
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables;

-- Taille de la base
SELECT pg_size_pretty(pg_database_size('event_planner_auth'));
```

---

## 🔧 **Optimisations**

### 📈 **Indexation**
```sql
-- Index de recherche
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_permissions_code ON permissions(code);

-- Index composites
CREATE INDEX idx_accesses_user_role ON accesses(user_id, role_id);
CREATE INDEX idx_authorizations_role_permission ON authorizations(role_id, permission_id);
```

### 🔍 **Requêtes Optimisées**
```sql
-- Recherche efficace avec JSONB
SELECT * FROM roles 
WHERE label::text ILIKE '%admin%' 
AND deleted_at IS NULL;

-- Pagination performante
SELECT * FROM users 
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10 OFFSET 20;
```

---

## 🛡️ **Sécurité Avancée**

### 🔒 **Contrôle d'Accès**
```sql
-- Vérification des permissions
SELECT COUNT(*) as has_permission
FROM users u
JOIN accesses a ON u.id = a.user_id
JOIN roles r ON a.role_id = r.id  
JOIN authorizations auth ON r.id = auth.role_id
JOIN permissions p ON auth.permission_id = p.id
WHERE u.id = $1 
  AND p.code = $2
  AND a.deleted_at IS NULL
  AND r.deleted_at IS NULL;
```

### 📊 **Audit Trail**
```sql
-- Tracking des modifications
CREATE TRIGGER audit_users_update
AFTER UPDATE ON users
FOR EACH ROW
INSERT INTO audit_logs (table_name, operation, user_id, old_data, new_data)
VALUES ('users', 'UPDATE', NEW.updated_by, row_to_json(OLD), row_to_json(NEW));
```

---

## 🎯 **Bonnes Pratiques**

### 🔧 **Développement**
- **Toujours** utiliser les requêtes paramétrées
- **Valider** les entrées avant les requêtes SQL
- **Gérer** les erreurs de base de données
- **Utiliser** les transactions pour les opérations multiples

### 📊 **Performance**
- **Limiter** les résultats avec LIMIT
- **Utiliser** les index appropriés
- **Éviter** les N+1 requêtes
- **Mettre en cache** les données fréquemment accédées

### 🔒 **Sécurité**
- **Ne jamais** exposer les mots de passe en clair
- **Utiliser** les prepared statements
- **Limiter** les permissions par défaut
- **Logger** les accès sensibles

---

## 📝 **Conclusion**

**La base de données Event Planner Auth est optimisée et sécurisée.**

- ✅ **Schéma normalisé** et performant
- ✅ **Sécurité** intégrée à tous les niveaux
- ✅ **Documentation** complète et à jour
- ✅ **Scripts** d'installation et maintenance

**Prête pour la production et la montée en charge.** 🚀

---

*Dernière mise à jour : $(date)*
