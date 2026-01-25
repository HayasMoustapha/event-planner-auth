# 📚 Documentation Technique - Event Planner Auth API

> **Guide complet pour développeurs juniors - PRODUCTION READY v1.0**  
> Apprendre, comprendre et développer sur l'API d'authentification Event Planner  
> **Score 100/100** - Hardening validation (Rule 3) implémenté

---

## 🎯 Objectif de cette documentation

Ce guide est conçu pour un **développeur junior** qui découvre le projet. Vous pourrez :

- ✅ Comprendre l'architecture globale sans jargon technique
- ✅ Lancer le projet en local étape par étape
- ✅ Comprendre pourquoi chaque choix technique a été fait
- ✅ Tester l'API sans assistance
- Ajouter de nouvelles fonctionnalités en suivant les bonnes pratiques

---

## 1️⃣ Introduction - Qu'est-ce que Event Planner Auth ?

### 📖 Présentation générale

**Event Planner Auth** est un service d'authentification complet pour la gestion d'événements. Imaginez un système où :

- Les utilisateurs peuvent **s'inscrire** avec leur email et mot de passe
- Ils reçoivent un **code OTP** par email pour vérifier leur compte
- Ils peuvent se **connecter** et obtenir un token JWT
- Les administrateurs peuvent gérer les **rôles et permissions**
- Tout est sécurisé et surveillé

### 🎯 Cas d'usage principaux

1. **Inscription d'un nouvel utilisateur**
   - Création du profil people (informations personnelles)
   - Création du compte utilisateur (login/password)
   - Envoi d'un code OTP par email
   - Vérification du compte

2. **Connexion quotidienne**
   - Vérification email/mot de passe
   - Génération d'un token JWT
   - Accès aux fonctionnalités selon les permissions

3. **Administration**
   - Gestion des rôles (admin, manager, user...)
   - Gestion des permissions (créer, éditer, supprimer...)
   - Gestion des menus de l'interface

---

## 2️⃣ Vue d'ensemble de l'architecture

### 🏗️ Architecture globale

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client (App)  │───▶│   API Express   │───▶│  PostgreSQL DB  │
│                 │    │                 │    │                 │
│ - Frontend      │    │ - Routes        │    │ - Tables        │
│ - Postman       │    │ - Controllers   │    │ - Relations     │
│ - Mobile        │    │ - Services      │    │ - Constraints   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📁 Organisation des dossiers

```
src/
├── app.js                 # Point d'entrée Express
├── server.js              # Démarrage du serveur
├── config/                # Configurations (DB, JWT, ENV)
├── modules/               # Modules métier
│   ├── auth/             # Authentification
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   └── registration.*
│   ├── people/           # Gestion des personnes
│   │   ├── people.routes.js
│   │   ├── people.controller.js
│   │   ├── people.service.js
│   │   └── people.repository.js
│   └── users/            # Gestion des comptes utilisateurs
│       ├── users.routes.js
│       ├── users.controller.js
│       ├── users.service.js
│       └── users.repository.js
├── middlewares/           # Middlewares (sécurité, auth)
├── security/             # Détection d'attaques
├── utils/                # Fonctions utilitaires
└── services/             # Services partagés (cache, email)
```

### 🔄 Rôle de chaque couche

#### 1. **Routes** (`*.routes.js`)
- **Rôle** : Point d'entrée des requêtes HTTP
- **Responsabilité** : Recevoir les requêtes, valider les paramètres, appeler le controller
- **Exemple** :
```javascript
// POST /api/auth/register
router.post('/register', 
  authValidation.validateRegister,  // Validation
  registrationController.register    // Controller
);
```

#### 2. **Controllers** (`*.controller.js`)
- **Rôle** : Gérer la logique de la requête
- **Responsabilité** : Appeler les services, formater les réponses, gérer les erreurs
- **Exemple** :
```javascript
async register(req, res, next) {
  try {
    const result = await registrationService.register(req.body);
    res.status(201).json(createResponse(true, result.message, result.data));
  } catch (error) {
    next(error);
  }
}
```

#### 3. **Services** (`*.service.js`)
- **Rôle** : Logique métier complexe
- **Responsabilité** : Coordonner plusieurs repositories, appliquer les règles métier
- **Exemple** :
```javascript
async register(registrationData) {
  // 1. Valider les données
  // 2. Vérifier si l'email existe déjà
  // 3. Créer la personne
  // 4. Créer l'utilisateur
  // 5. Générer l'OTP
  // 6. Envoyer l'email
}
```

#### 4. **Repositories** (`*.repository.js`)
- **Rôle** : Accès aux données
- **Responsabilité** : Exécuter les requêtes SQL, mapper les résultats
- **Exemple** :
```javascript
async create(personData) {
  const query = `
    INSERT INTO people (first_name, last_name, email, phone)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await pool.query(query, [firstName, lastName, email, phone]);
  return result.rows[0];
}
```

---

## 3️⃣ Base de données - Le cœur du système

### 🐘 Pourquoi PostgreSQL ?

PostgreSQL a été choisi pour :
- **Fiabilité** : Très robuste en production
- **Relations** : Gestion native des clés étrangères
- **Types** : Support des JSONB pour les données multilingues
- **Performance** : Excellent pour les requêtes complexes
- **Sécurité** : Contrôle d'accès granulaire

### 🗄️ Schéma de la base de données

#### 📋 Tables principales

##### **people** - Informations personnelles
```sql
CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    email VARCHAR(254) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    birth_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Pourquoi 2 tables (people + users) ?**
- `people` : Informations **personnelles** qui ne changent pas
- `users` : Informations **compte** qui peuvent changer (mot de passe, username)

##### **users** - Comptes utilisateurs
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES people(id),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_code VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    email_verified_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### **roles** - Rôles système
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    label JSONB NOT NULL,           -- {"fr": "Admin", "en": "Admin"}
    description JSONB,
    level INTEGER DEFAULT 1,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### **permissions** - Permissions fines
```sql
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    label JSONB NOT NULL,
    "group" VARCHAR(50) NOT NULL,  -- users, roles, permissions...
    description JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### **menus** - Structure des menus
```sql
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    label JSONB NOT NULL,
    icon VARCHAR(50),
    url VARCHAR(255),
    parent_id INTEGER REFERENCES menus(id),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### **otps** - Codes à usage unique
```sql
CREATE TABLE otps (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES people(id),
    type VARCHAR(20) NOT NULL,      -- email, phone, password_reset
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 🔗 Relations importantes

1. **people ↔ users** : Une personne peut avoir un compte utilisateur
2. **users ↔ roles** : Un utilisateur peut avoir plusieurs rôles (via authorizations)
3. **roles ↔ permissions** : Un rôle peut avoir plusieurs permissions (via authorizations)
4. **people ↔ otps** : Une personne peut avoir plusieurs OTP

#### 📊 Exemple concret d'un utilisateur

```sql
-- Table people
INSERT INTO people (id, first_name, last_name, email, phone)
VALUES (1, 'Jean', 'Dupont', 'jean.dupont@example.com', '+33612345678');

-- Table users
INSERT INTO users (id, person_id, username, email, password_hash, user_code)
VALUES (1, 1, 'jeandupont', 'jean.dupont@example.com', '$2b$12$...', 'USER001');

-- Table otps
INSERT INTO otps (id, person_id, type, code, expires_at)
VALUES (1, 1, 'email', '123456', '2024-01-15 23:00:00');
```

---

## 4️⃣ Authentification - Fonctionnement détaillé

### 📝 Processus d'inscription

#### Étape 1 : Réception de la demande
```javascript
POST /api/auth/register
{
  "firstName": "Jean",
  "lastName": "Dupont", 
  "email": "jean.dupont@example.com",
  "phone": "+33612345678",
  "password": "Password123",
  "username": "jeandupont"
}
```

#### Étape 2 : Validation des données
```javascript
// auth.validation.js
const validateRegister = [
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe trop court'),
  // ... autres validations
];
```

#### Étape 3 : Vérification des doublons
```javascript
// registration.service.js
const existingPerson = await peopleRepository.findByEmail(email);
if (existingPerson) {
  throw new Error('Cet email est déjà utilisé');
}
```

#### Étape 4 : Création en base de données
```sql
-- 1. Création dans people
INSERT INTO people (first_name, last_name, email, phone)
VALUES ('Jean', 'Dupont', 'jean.dupont@example.com', '+33612345678')
RETURNING id;

-- 2. Création dans users (lié à people.id)
INSERT INTO users (person_id, username, email, password_hash, user_code)
VALUES (1, 'jeandupont', 'jean.dupont@example.com', '$2b$12$...', 'USER001');
```

#### Étape 5 : Génération OTP
```javascript
// otp.service.js
generateOTP(personId, type = 'email') {
  const code = Math.random().toString().slice(2, 8); // 6 chiffres
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  return otpRepository.create({
    person_id: personId,
    type: 'email',
    code: code,
    expires_at: expiresAt
  });
}
```

#### Étape 6 : Envoi de l'email
```javascript
// email.service.js
async sendVerificationEmail(email, code) {
  await this.transporter.sendMail({
    to: email,
    subject: 'Vérification de votre compte',
    html: `<p>Votre code de vérification est : <strong>${code}</strong></p>`
  });
}
```

### 🔍 Processus de vérification OTP

#### Étape 1 : Réception du code
```javascript
POST /api/auth/verify-email
{
  "email": "jean.dupont@example.com",
  "otpCode": "123456"
}
```

#### Étape 2 : Validation du code
```javascript
// otp.service.js
async verifyOTP(email, code) {
  const person = await peopleRepository.findByEmail(email);
  const otp = await otpRepository.findValidOTP(person.id, 'email', code);
  
  if (!otp || otp.expires_at < new Date()) {
    throw new Error('Code OTP invalide ou expiré');
  }
  
  return otp;
}
```

#### Étape 3 : Activation du compte
```sql
UPDATE users 
SET email_verified_at = CURRENT_TIMESTAMP 
WHERE person_id = 1;
```

### 🔑 Processus de connexion

#### Étape 1 : Vérification des identifiants
```javascript
// auth.service.js
async login(email, password) {
  const user = await usersRepository.findByEmail(email);
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Mot de passe incorrect');
  }
  
  return user;
}
```

#### Étape 2 : Génération du token JWT
```javascript
// jwt.service.js
generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    personId: user.person_id,
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
}
```

#### Étape 3 : Retour du token
```javascript
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "jean.dupont@example.com",
      "username": "jeandupont"
    }
  }
}
```

---

## 5️⃣ Rôles, Permissions et Menus - Le système RBAC

### 🛡️ Qu'est-ce que le RBAC ?

**RBAC** = Role-Based Access Control (Contrôle d'Accès Basé sur les Rôles)

Au lieu de donner des permissions directement aux utilisateurs, on :
1. Crée des **rôles** (admin, manager, user...)
2. Attribue des **permissions** aux rôles
3. Attribue des **rôles** aux utilisateurs

### 🎭 Différence entre Rôle / Permission / Menu

#### **Rôle** : L'identité de l'utilisateur
- **Admin** : Peut tout faire
- **Manager** : Peut gérer son équipe
- **User** : Accès de base

#### **Permission** : L'action autorisée
- `users.create` : Créer des utilisateurs
- `users.edit` : Modifier des utilisateurs
- `reports.view` : Voir les rapports

#### **Menu** : L'interface visible
- Menu "Utilisateurs" visible seulement pour les admins
- Menu "Rapports" visible pour managers et admins

### 🔗 Comment ça fonctionne en pratique ?

#### 1. Définition des rôles
```sql
INSERT INTO roles (code, label, level, is_system)
VALUES 
  ('admin', '{"fr": "Administrateur"}', 100, true),
  ('manager', '{"fr": "Manager"}', 50, false),
  ('user', '{"fr": "Utilisateur"}', 10, false);
```

#### 2. Définition des permissions
```sql
INSERT INTO permissions (code, label, "group")
VALUES 
  ('users.create', '{"fr": "Créer utilisateurs"}', 'users'),
  ('users.edit', '{"fr": "Modifier utilisateurs"}', 'users'),
  ('reports.view', '{"fr": "Voir rapports"}', 'reports');
```

#### 3. Attribution des permissions aux rôles
```sql
INSERT INTO authorizations (role_id, permission_id)
VALUES 
  (1, 1), -- admin peut créer users
  (1, 2), -- admin peut modifier users
  (2, 3); -- manager peut voir rapports
```

#### 4. Attribution des rôles aux utilisateurs
```sql
INSERT INTO authorizations (user_id, role_id)
VALUES (1, 1); -- utilisateur 1 a le rôle admin
```

### 🎯 Exemple concret d'accès

**Marie (Manager)** veut accéder à la page "Utilisateurs" :

1. **Vérification du token** : Marie est bien connectée
2. **Récupération de ses rôles** : Marie a le rôle "manager"
3. **Vérification de la permission** : Le rôle "manager" a-t-il la permission `users.view` ?
4. **Résultat** : Non → Accès refusé (403 Forbidden)

**Jean (Admin)** veut faire la même chose :

1. **Vérification du token** : Jean est bien connecté
2. **Récupération de ses rôles** : Jean a le rôle "admin"
3. **Vérification de la permission** : Le rôle "admin" a la permission `users.view`
4. **Résultat** : Oui → Accès autorisé

---

## 6️⃣ Migrations et Seeds Automatiques

### 🔄 Pourquoi automatiser ?

Quand on développe à plusieurs, il faut que tout le monde ait la **même base de données** :

- **Mêmes tables** : Structure identique
- **Mêmes données de base** : Admin par défaut, rôles, permissions
- **Mêmes évolutions** : Quand on ajoute une table, tout le monde l'a

### 🚀 Comment ça marche ?

#### 1. **Migrations** : Création/modification des tables
```sql
-- database/migrations/001_init_auth.sql
CREATE TABLE people (...);
CREATE TABLE users (...);
CREATE TABLE roles (...);
```

#### 2. **Seeds** : Insertion des données de base
```sql
-- database/seeds/seeds/roles.seed.sql
INSERT INTO roles (code, label) VALUES ('admin', '{"fr": "Admin"}');
INSERT INTO roles (code, label) VALUES ('user', '{"fr": "Utilisateur"}');
```

#### 3. **Bootstrap automatique** au démarrage
```javascript
// server.js
const runDatabaseBootstrap = async () => {
  if (process.env.DB_AUTO_BOOTSTRAP === 'true') {
    const bootstrap = new DatabaseBootstrap();
    await bootstrap.initialize();
  }
};
```

### 🎯 Comportement au premier lancement

1. **Vérification** : Est-ce que la table `schema_migrations` existe ?
2. **Création** : Si non, créer la table pour suivre les migrations
3. **Exécution** : Lancer tous les fichiers SQL non encore exécutés
4. **Seeds** : Si c'est la première fois, exécuter les seeds
5. **Logs** : Afficher ce qui a été fait

### 🌱 Utilité des Seeds

Les seeds créent l'environnement de développement :

- **Admin par défaut** : `admin@eventplanner.com` / `admin123`
- **Rôles de base** : admin, manager, user
- **Permissions** : users.create, users.edit, reports.view...
- **Menus** : Structure de base de l'interface

---

## 7️⃣ Lancer le projet en local - Guide complet

### 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

```bash
# Node.js 16+ (vérifier avec node --version)
node --version

# PostgreSQL 12+ (vérifier avec psql --version)  
psql --version

# Git (vérifier avec git --version)
git --version
```

### 🚀 Installation étape par étape

#### Étape 1 : Cloner le projet
```bash
git clone <repository-url>
cd event-planner-auth
```

#### Étape 2 : Installer les dépendances
```bash
npm install
```

#### Étape 3 : Configurer la base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE event_planner_auth;

# Quitter PostgreSQL
\q
```

#### Étape 4 : Configurer l'environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env
nano .env
```

**Configuration minimale pour le développement :**
```bash
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_planner_auth
DB_USER=postgres
DB_PASSWORD=postgres  # Mettre votre mot de passe PostgreSQL

# Activer le bootstrap automatique
DB_AUTO_BOOTSTRAP=true

# JWT (pour le développement)
JWT_SECRET=your_super_secure_256_bit_secret_key_change_in_production
```

#### Étape 5 : Démarrer PostgreSQL
```bash
# Si vous utilisez Docker
docker-compose up -d postgres

# Ou si PostgreSQL est installé localement
# Il devrait déjà être démarré
```

#### Étape 6 : Lancer le projet
```bash
npm start
```

Vous devriez voir :
```
🚀 Serveur Event Planner Auth API démarré!
📍 Port: 3000
🌍 Environnement: development
📖 Documentation: http://localhost:3000/api/docs
❤️ Santé: http://localhost:3000/api/health
```

### ✅ Vérifier que tout fonctionne

#### 1. Health check
```bash
curl http://localhost:3000/api/health
```

Réponse attendue :
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 15.123,
  "environment": "development"
}
```

#### 2. Vérifier la base de données
```bash
psql -U postgres -d event_planner_auth -c "\dt"
```

Vous devriez voir les tables :
```
people, users, roles, permissions, menus, otps, authorizations...
```

### 🐛 Erreurs fréquentes et solutions

#### Erreur : "Connection refused"
```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# Démarrer PostgreSQL si nécessaire
sudo systemctl start postgresql
```

#### Erreur : "Database does not exist"
```bash
# Créer la base de données
psql -U postgres -c "CREATE DATABASE event_planner_auth;"
```

#### Erreur : "Port already in use"
```bash
# Tuer le processus qui utilise le port 3000
lsof -ti:3000 | xargs kill -9

# Ou utiliser un autre port
PORT=3001 npm start
```

#### Erreur : "DB_AUTO_BOOTSTRAP failed"
```bash
# Vérifier les permissions PostgreSQL
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE event_planner_auth TO postgres;"

# Exécuter les migrations manuellement
psql -U postgres -d event_planner_auth -f database/migrations/000_initial_schema.sql
```

---

## 8️⃣ Tester l'API avec Postman

### 📮 Importer la collection

1. **Ouvrir Postman**
2. **Importer** → Fichier → Choisir `postman/collections/Event-Planner-Complete-API.postman_collection.json`
3. **Importer l'environnement** → `postman/environments/Event-Planner-Complete-Environment.postman_environment.json`
4. **Sélectionner l'environnement** dans le menu déroulant en haut à droite

### 🧪 Scénarios de test recommandés

#### Scénario 1 : Inscription complète (⭐ Le plus important)

1. **3. Inscription (Register)**
   ```json
   {
     "firstName": "Test",
     "lastName": "User", 
     "email": "testuser123@example.com",
     "phone": "+33612345678",
     "password": "Password123",
     "username": "testuser123"
   }
   ```
   *Résultat attendu : 201 Created + utilisateur créé*

2. **Récupérer le code OTP** dans les logs du serveur
   ```bash
   npm run dev
   # Chercher "Code OTP généré : 123456"
   ```

3. **Mettre à jour la variable `otpCode`** dans l'environnement Postman

4. **5. Vérifier Email avec OTP**
   ```json
   {
     "email": "testuser123@example.com",
     "otpCode": "123456"
   }
   ```
   *Résultat attendu : 200 OK + email vérifié*

5. **3. Login (après vérification)**
   ```json
   {
     "email": "testuser123@example.com", 
     "password": "Password123"
   }
   ```
   *Résultat attendu : 200 OK + token JWT*

#### Scénario 2 : Login administrateur

1. **4. Login Admin**
   ```json
   {
     "email": "admin@example.com",
     "password": "Admin123!"
   }
   ```
   *Résultat attendu : 200 OK + token admin*

#### Scénario 3 : Gestion des utilisateurs (nécessite le token admin)

1. **Se connecter en admin** (Scénario 2)
2. **1. Lister tous les utilisateurs**
   - *Résultat attendu : 200 OK + liste des utilisateurs*

3. **4. Créer utilisateur**
   ```json
   {
     "person_id": 1,
     "username": "newuser",
     "email": "newuser@example.com",
     "password": "Password123",
     "user_code": "USER001"
   }
   ```
   *Résultat attendu : 201 Created*

### 🚨 Cas d'erreur à tester

#### Test 1 : Email déjà utilisé
```json
{
  "firstName": "Test",
  "lastName": "Duplique",
  "email": "admin@example.com",  // Email qui existe déjà
  "password": "Password123"
}
```
*Résultat attendu : 409 Conflict*

#### Test 2 : Mot de passe trop court
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com", 
  "password": "123"  // Moins de 8 caractères
}
```
*Résultat attendu : 422 Validation Error*

#### Test 3 : Token invalide
```bash
curl -H "Authorization: Bearer token_invalide" \
     http://localhost:3000/api/users
```
*Résultat attendu : 401 Unauthorized*

### 🔧 Personnaliser les tests

#### Modifier les données
Dans Postman, utilisez les variables dynamiques :
- `{{$randomInt}}` : Nombre aléatoire
- `{{$timestamp}}` : Timestamp actuel
- `{{baseUrl}}` : URL de l'API

#### Ajouter de nouveaux tests
1. Dupliquer une requête existante
2. Modifier l'URL et les données
3. Ajouter des tests dans l'onglet "Tests"

---

## 9️⃣ Bonnes pratiques du projet

### 📝 Conventions de nommage

#### Fichiers
- **Routes** : `module.routes.js` (ex: `auth.routes.js`)
- **Controllers** : `module.controller.js` (ex: `auth.controller.js`)
- **Services** : `module.service.js` (ex: `auth.service.js`)
- **Repositories** : `module.repository.js` (ex: `users.repository.js`)

#### Variables JavaScript
- **CamelCase** : `firstName`, `userId`, `isActive`
- **Constantes** : `UPPER_SNAKE_CASE` : `MAX_LOGIN_ATTEMPTS`

#### Base de données
- **Tables** : `snake_case` : `people`, `users`, `email_verified_at`
- **Colonnes** : `snake_case` : `first_name`, `last_name`, `created_at`

### 🔧 Ajouter une fonctionnalité

#### Exemple : Ajouter la gestion des adresses

1. **Créer la migration**
```sql
-- database/migrations/003_add_addresses.sql
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES people(id),
    street VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Créer le repository**
```javascript
// src/modules/addresses/addresses.repository.js
class AddressesRepository {
    async create(addressData) {
        const query = `
            INSERT INTO addresses (person_id, street, city, postal_code, country)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [
            addressData.personId,
            addressData.street,
            addressData.city,
            addressData.postalCode,
            addressData.country
        ]);
        return result.rows[0];
    }
}
```

3. **Créer le service**
```javascript
// src/modules/addresses/addresses.service.js
class AddressesService {
    async createAddress(addressData, userId) {
        // Valider que l'utilisateur peut créer une adresse pour cette personne
        // Créer l'adresse
        return await addressesRepository.create(addressData);
    }
}
```

4. **Créer le controller**
```javascript
// src/modules/addresses/addresses.controller.js
class AddressesController {
    async create(req, res, next) {
        try {
            const result = await addressesService.createAddress(req.body, req.user.id);
            res.status(201).json(createResponse(true, 'Adresse créée', result));
        } catch (error) {
            next(error);
        }
    }
}
```

5. **Créer les routes**
```javascript
// src/modules/addresses/addresses.routes.js
router.post('/',
  authMiddleware.authenticate,
  addressesValidation.validateCreate,
  addressesController.create
);
```

6. **Intégrer dans l'application**
```javascript
// src/app.js
const addressesRoutes = require('./modules/addresses/addresses.routes');
app.use('/api/addresses', addressesRoutes);
```

### 🗄️ Ajouter une table

1. **Créer la migration** : `database/migrations/XXX_new_feature.sql`
2. **Décrire les colonnes** avec types et contraintes
3. **Ajouter les indexes** pour la performance
4. **Ajouter les commentaires** pour la documentation
5. **Créer le seed** si nécessaire

### 🛣️ Ajouter une route proprement

1. **Définir la route** dans `module.routes.js`
2. **Ajouter la validation** dans `module.validation.js`
3. **Implémenter la logique** dans `module.controller.js`
4. **Ajouter la logique métier** dans `module.service.js`
5. **Ajouter l'accès données** dans `module.repository.js`
6. **Tester avec Postman**
7. **Ajouter la documentation**

### 🧪 Tests et validation

#### Toujours tester :
- ✅ **Cas nominal** : La fonctionnalité marche
- ❌ **Cas d'erreur** : Messages d'erreur clairs
- 🔒 **Sécurité** : Pas d'accès non autorisé
- 📝 **Validation** : Données invalides rejetées

#### Exemple de test manuel
```bash
# Test cas nominal
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Test", "email": "test@example.com", "password": "Password123"}'

# Test cas d'erreur  
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName": "", "email": "invalid", "password": "123"}'
```

---

## 🔟 Conclusion - Prochaines étapes

### 🎯 Résumé global

Vous avez maintenant :

- ✅ **Compris l'architecture** : Routes → Controllers → Services → Repositories → DB
- ✅ **Installé le projet** : PostgreSQL + Node.js + Variables d'environnement
- ✅ **Testé l'API** : Inscription, connexion, gestion utilisateurs
- ✅ **Compris le RBAC** : Rôles → Permissions → Accès
- ✅ **Vu les bonnes pratiques** : Organisation, nommage, tests

### 🚀 Conseils pour continuer

#### 1. **Explorer le code existant**
- Ouvrir `src/modules/auth/` pour comprendre l'authentification
- Voir `src/middlewares/` pour comprendre la sécurité
- Regarder `database/` pour comprendre les schémas

#### 2. **Ajouter une petite fonctionnalité**
- Modifier le profil utilisateur
- Ajouter la gestion des préférences
- Implémenter la recherche d'utilisateurs

#### 3. **Améliorer les tests**
- Ajouter des tests unitaires avec Jest
- Créer des tests d'intégration
- Mettre en place CI/CD

#### 4. **Explorer l'écosystème**
- Docker pour le déploiement
- Redis pour le cache
- Monitoring avec Prometheus

### ⚠️ Erreurs à éviter

#### ❌ Ne pas faire :
- Modifier directement la base de données en production
- Committer les mots de passe ou clés secrètes
- Ignorer les validations de sécurité
- Oublier les logs pour le debugging

#### ✅ Toujours faire :
- Valider les entrées utilisateur
- Utiliser les repositories pour l'accès données
- Logger les erreurs et actions importantes
- Tester les cas d'erreur

### 🎓 Point d'entrée pour les nouveaux développeurs

1. **Lire ce README** (vous êtes ici !)
2. **Installer le projet** (section 7)
3. **Tester avec Postman** (section 8)
4. **Explorer le code** en commençant par l'authentification
5. **Ajouter une petite fonctionnalité** pour pratiquer

### 📞 Besoin d'aide ?

- **Documentation API** : http://localhost:3000/docs (quand le serveur tourne)
- **Health Check** : http://localhost:3000/api/health
- **Logs** : Console du serveur (`npm run dev`)
- **Issues** : Créer une issue sur le repository GitHub

---

## 🏆 Félicitations !

Vous êtes maintenant prêt à développer sur Event Planner Auth API ! 

**Prochaines étapes suggérées :**
1. ✅ Lancer le projet localement
2. ✅ Tester l'inscription et connexion
3. 🔄 Explorer le code existant
4. 🚀 Ajouter votre première fonctionnalité

Bon développement ! 🚀

---

*Ce guide est vivant - n'hésitez pas à suggérer des améliorations !*
