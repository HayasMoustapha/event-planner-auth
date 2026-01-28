# 🔐 Event Planner - Service d'Authentification

## 📋 Description

Le service d'authentification est le cœur de sécurité de notre plateforme Event Planner. Il gère toutes les opérations d'authentification, d'autorisation et de gestion des utilisateurs.

## 🏗️ Architecture Technique

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTH SERVICE (Port 3000)                 │
├─────────────────────────────────────────────────────────────┤
│  📦 Modules Principaux:                                      │
│  ├── auth/           (Login, Register, JWT)                  │
│  ├── users/          (Gestion utilisateurs)                  │
│  ├── roles/          (Rôles et permissions)                 │
│  └── permissions/    (RBAC - Contrôle d'accès)               │
│                                                             │
│  🔧 Technologies:                                            │
│  ├── Node.js + Express                                      │
│  ├── PostgreSQL (Base de données)                           │
│  ├── JWT (Tokens d'authentification)                        │
│  ├── bcrypt (Hashage mots de passe)                         │
│  └── Rate Limiting (Protection contre attaques)             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Docker (optionnel)

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd event-planner-backend/event-planner-auth

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Démarrer la base de données
npm run db:up

# Lancer les migrations
npm run db:migrate

# Démarrer le service
npm run dev
```

### Vérification
```bash
# Health check
curl http://localhost:3000/health

# Doit retourner:
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0"
}
```

## 📡 API Endpoints

### 🔓 Authentification
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 👥 Utilisateurs
```http
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### 🎭 Rôles & Permissions
```http
GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id

GET    /api/permissions
POST   /api/permissions
```

## 🔐 Flux d'Authentification

### 1. Inscription
```mermaid
sequenceDiagram
    participant Client
    participant AuthAPI
    participant Database
    participant EmailService

    Client->>AuthAPI: POST /api/auth/register
    AuthAPI->>Database: Vérifier email existe
    Database-->>AuthAPI: Email non trouvé
    AuthAPI->>Database: Créer utilisateur
    Database-->>AuthAPI: Utilisateur créé
    AuthAPI->>EmailService: Envoyer email vérification
    AuthAPI-->>Client: 201 - Utilisateur créé
```

### 2. Connexion
```mermaid
sequenceDiagram
    participant Client
    participant AuthAPI
    participant Database
    participant JWT

    Client->>AuthAPI: POST /api/auth/login
    AuthAPI->>Database: Vérifier identifiants
    Database-->>AuthAPI: Utilisateur validé
    AuthAPI->>JWT: Générer tokens
    JWT-->>AuthAPI: Access + Refresh tokens
    AuthAPI-->>Client: 200 - Tokens + infos utilisateur
```

## 🛡️ Sécurité

### 🔑 JWT Tokens
- **Access Token** : 15 minutes (accès aux ressources)
- **Refresh Token** : 7 jours (renouvellement session)
- **Algorithm** : HS256 avec secret partagé

### 🔒 Protection des Routes
Toutes les routes protégées utilisent le middleware `RobustAuthMiddleware.authenticate()` qui vérifie:
- Validité du JWT token
- Permissions requises (RBAC)
- Rate limiting par IP
- Headers de sécurité

### 🚨 Rate Limiting
- **Login** : 5 tentatives par 15 minutes
- **Register** : 3 tentatives par heure
- **API générales** : 100 requêtes par minute

## 📊 Base de Données

### Tables Principales
```sql
users          -- Informations utilisateurs
roles          -- Rôles système
permissions    -- Permissions granulaires
user_roles     -- Association utilisateurs/rôles
role_permissions -- Association rôles/permissions
refresh_tokens -- Tokens de rafraîchissement
```

### Schéma Simplifié
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Configuration

### Variables d'Environnement Essentielles
```bash
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/event_planner_auth

# JWT
JWT_SECRET=votre-secret-super-securise
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Serveur
PORT=3000
NODE_ENV=development

# Email (vérification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe
```

## 🧪 Tests

### Lancer les tests
```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests avec couverture
npm run test:coverage
```

### Tests API Importants
```bash
# Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Password123!", "username": "testuser"}'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Password123!"}'
```

## 🚨 Erreurs Communes

### 1. "Invalid credentials"
- Vérifier email/mot de passe
- Confirmer que l'utilisateur est `active`

### 2. "Token expired"
- Utiliser le refresh token
- Ou se reconnecter

### 3. "Email already exists"
- Utiliser la récupération de mot de passe
- Ou choisir un autre email

## 📈 Monitoring

### Logs Importants
```bash
# Tentatives de connexion échouées
grep "login.*failed" logs/auth.log

# Nouvelles inscriptions
grep "register.*success" logs/auth.log

# Erreurs de validation JWT
grep "jwt.*error" logs/auth.log
```

### Métriques à Surveiller
- Taux de succès/échec des connexions
- Temps de réponse des endpoints critiques
- Nombre de tokens actifs
- Rate limiting triggers

## 🤝 Intégration avec Autres Services

### Communication Inter-Services
Les autres services communiquent avec l'auth service via:
- **JWT Tokens** : Pour authentifier les utilisateurs
- **Service Token** : Pour les communications inter-services
- **API REST** : Pour vérifier les permissions

### Exemple: Vérification Permission
```javascript
// Dans un autre service
const authResponse = await fetch('http://localhost:3000/api/auth/verify', {
  headers: {
    'Authorization': 'Bearer ' + userToken,
    'X-Service-Token': serviceToken
  }
});
```

## 📚 Documentation Complémentaire

- [Guide de Déploiement](./docs/DEPLOYMENT.md)
- [Référence API Complète](./docs/API_ROUTES.md)
- [Sécurité Avancée](./docs/SECURITY.md)
- [Dépannage](./docs/TROUBLESHOOTING.md)

## 🆘 Support

En cas de problème:
1. Vérifier les logs: `tail -f logs/auth.log`
2. Consulter la documentation de dépannage
3. Créer une issue avec les détails de l'erreur

---

**🎯 Ce service est la fondation de sécurité de toute la plateforme Event Planner !**
