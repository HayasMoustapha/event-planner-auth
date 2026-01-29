# 🔐 AUTH SERVICE - DOCUMENTATION

## 🎯 Présentation

Le **Auth Service** est le service d'authentification et d'autorisation centralisé de la plateforme Event Planner SaaS.

### Rôle principal
- 🔐 **Authentification** : Login, register, gestion des sessions
- 👥 **Gestion utilisateurs** : Profils, préférences
- 🛡️ **Autorisation** : RBAC (Role-Based Access Control)
- 🔑 **Tokens** : JWT avec refresh tokens

### Caractéristiques techniques
```
🚀 Port : 3000
🔐 Auth : JWT + Refresh tokens
👥 RBAC : Rôles et permissions granulaires
🛡️ Sécurité : Rate limiting, password hashing
📊 Monitoring : Tentatives de connexion, logs
```

## 🏗️ Architecture

### Stack Technique
```
┌─────────────────────────────────────────┐
│            AUTH SERVICE                  │
├─────────────────────────────────────────┤
│ 📦 Node.js + Express.js                  │
│ 🗄️ PostgreSQL (utilisateurs)             │
│ 🔑 JWT + bcrypt                          │
│ 🛡️ Rate limiting                        │
│ 📊 Winston (logs)                        │
└─────────────────────────────────────────┘
```

## ⚡ Fonctionnalités

### 🔐 Authentification

#### Inscription
```javascript
POST /api/auth/register
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

#### Connexion
```javascript
POST /api/auth/login
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

#### Réponse authentification
```javascript
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 86400
    }
  }
}
```

### 🛡️ RBAC (Role-Based Access Control)

#### Rôles disponibles
```javascript
const ROLES = {
  SUPER_ADMIN: 'super_admin',    // Accès total
  ADMIN: 'admin',                 // Administration événements
  ORGANIZER: 'organizer',         // Création événements
  USER: 'user',                   // Utilisateur standard
  GUEST: 'guest'                  // Invité (lecture seule)
};

const PERMISSIONS = {
  // Événements
  'events:create': ['admin', 'organizer'],
  'events:read': ['admin', 'organizer', 'user', 'guest'],
  'events:update': ['admin', 'organizer'],
  'events:delete': ['admin'],
  
  // Utilisateurs
  'users:create': ['admin'],
  'users:read': ['admin', 'user'],
  'users:update': ['admin', 'user'],
  'users:delete': ['admin'],
  
  // Tickets
  'tickets:validate': ['admin', 'organizer'],
  'tickets:generate': ['admin', 'organizer']
};
```

### 🔑 Gestion des tokens

#### Refresh token
```javascript
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Déconnexion
```javascript
POST /api/auth/logout
Authorization: Bearer <access_token>
```

## 📚 API Reference

### Endpoints principaux

#### POST /api/auth/register
```javascript
// Validation
{
  "email": "required|email|unique",
  "password": "required|min:8|strong",
  "firstName": "required|min:2|max:50",
  "lastName": "required|min:2|max:50"
}
```

#### POST /api/auth/login
```javascript
// Rate limiting : 5 tentatives / 15 minutes
// Response avec tokens JWT
```

#### GET /api/auth/me
```javascript
// Profil utilisateur
{
  "success": true,
  "data": {
    "id": 123,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "permissions": ["events:read", "tickets:read"],
    "createdAt": "2024-01-01T10:00:00Z",
    "lastLoginAt": "2024-01-01T12:00:00Z"
  }
}
```

## 🚀 Guide de déploiement

### Configuration
```bash
# .env
NODE_ENV=production
PORT=3000

# Base de données
DB_HOST=localhost
DB_NAME=event_planner_auth
DB_USER=auth_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-256-bits
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Sécurité
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

**Version** : 1.0.0  
**Port** : 3000
