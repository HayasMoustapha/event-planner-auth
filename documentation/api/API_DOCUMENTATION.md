# Event Planner Auth API Documentation

## Overview

L'API d'authentification Event Planner fournit des services complets pour la gestion des utilisateurs, des rôles, des permissions et des OTP (One-Time Passwords).

## Base URL

```
Development: http://localhost:3000
Production: https://api.eventplanner.com
```

## Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-01-17T06:00:00.000Z"
}
```

### Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+33612345678",
  "password": "Password123!",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inscription réussie. Un code de vérification a été envoyé à votre email.",
  "data": {
    "person": {
      "id": 8,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "user": {
      "id": 8,
      "username": "johndoe",
      "email": "john.doe@example.com",
      "status": "inactive",
      "userCode": "johndoe_mkgp8pxy"
    },
    "otp": {
      "purpose": "email"
    }
  }
}
```

### Email Verification

```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "otpCode": "123456"
}
```

## OTP Management

### Generate Email OTP

```http
POST /api/auth/otp/email/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "user@example.com",
  "expiresInMinutes": 15
}
```

### Verify Email OTP

```http
POST /api/auth/otp/email/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

### Get User OTPs

```http
GET /api/auth/otp/person/{personId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "OTP récupérés avec succès",
  "data": [
    {
      "id": 1,
      "person_id": 8,
      "otp_code": "123456",
      "expires_at": "2026-01-17T10:15:00.000Z",
      "is_used": false,
      "purpose": "email",
      "created_at": "2026-01-17T10:00:00.000Z"
    }
  ]
}
```

### Invalidate User OTPs

```http
POST /api/auth/otp/person/{personId}/invalidate
Authorization: Bearer <token>
```

## User Management

### Get Users

```http
GET /api/users?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Utilisateurs récupérés avec succès",
  "data": {
    "data": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "status": "active",
        "first_name": "Super",
        "last_name": "Administrateur"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Get User Profile

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "field": "email",
      "message": "Format d'email invalide"
    }
  ],
  "timestamp": "2026-01-17T06:00:00.000Z"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Token d'accès requis",
  "data": {
    "code": "TOKEN_REQUIRED"
  },
  "timestamp": "2026-01-17T06:00:00.000Z"
}
```

### Permission Error (403)
```json
{
  "success": false,
  "message": "Permission refusée",
  "data": {
    "code": "PERMISSION_DENIED",
    "requiredPermission": "users.read",
    "userId": 1
  },
  "timestamp": "2026-01-17T06:00:00.000Z"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Personne non trouvée pour cet email",
  "timestamp": "2026-01-17T06:00:00.000Z"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Erreur interne du serveur",
  "data": {
    "code": "INTERNAL_ERROR"
  },
  "timestamp": "2026-01-17T06:00:00.000Z"
}
```

## Rate Limiting

- **General**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **OTP Generation**: 3 OTP per person per purpose

## Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Hardening Validation (Rule 3)

### Protection contre les champs non autorisés
- **Validation stricte** : Seuls les champs attendus sont acceptés
- **Détection automatique** : Les champs supplémentaires sont rejetés
- **Audit complet** : Journalisation des tentatives d'injection

### Types d'attaques détectées
- **SQL Injection** : Blocage des requêtes malveillantes
- **XSS** : Échappement automatique du HTML
- **Path Traversal** : Validation des chemins système
- **Command Injection** : Filtrage des commandes système

## Database Schema

### Key Tables

#### People
```sql
CREATE TABLE people (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    photo VARCHAR(255),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_by BIGINT REFERENCES users(id),
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

#### Users
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_code VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'inactive',
    email_verified_at TIMESTAMP,
    remember_token VARCHAR(255),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    deleted_by BIGINT REFERENCES users(id),
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

#### OTPs
```sql
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
```

## Postman Collection

Une collection Postman complète est disponible dans `/postman/collections/Event-Planner-Auth-API.postman_collection.json` avec :

- **216 routes** réparties en **15 modules**
- Variables d'environnement préconfigurées
- Tests automatisés pour tous les flux
- Gestion des tokens JWT
- Validation des réponses
- **Modules récents** :
  - 🔐 Gestion Accesses (User-Role) - 12 endpoints
  - 🔑 Gestion Authorizations CRUD - 9 endpoints

## Testing

### Unit Tests
```bash
npm test -- --testPathPatterns=tests/unit/
```

### Integration Tests
```bash
npm test -- --testPathPatterns=tests/integration/
```

### E2E Tests
```bash
npm run test:e2e
```

## Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env`
4. Setup database: `npm run db:setup`
5. Start server: `npm start`

## Production Deployment

### Environment Variables
- `NODE_ENV=production`
- `JWT_SECRET` - Strong 256-bit secret
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

### Modules Disponibles
- **Auth** : 28 routes (authentification, OTP, gestion tokens)
- **Users** : 15 routes (CRUD utilisateurs)
- **People** : 11 routes (CRUD personnes)
- **Roles** : 14 routes (CRUD rôles, assignation permissions)
- **Permissions** : 14 routes (CRUD permissions)
- **Menus** : 14 routes (CRUD menus, assignation permissions)
- **Accesses** : 12 routes (CRUD accès utilisateur-rôle)
- **Authorizations** : 23 routes (vérifications + CRUD autorisations)
- **Sessions** : 12 routes (gestion sessions)
- **Session Monitoring** : 8 routes (monitoring sessions)
- **Health** : 6 routes (health checks)
- **Metrics** : 3 routes (métriques système)
- **Dashboard** : 4 routes (tableau de bord admin)
- **Docs** : 5 routes (documentation API)

### Security Considerations
- Use HTTPS in production
- Configure CORS properly
- Enable rate limiting
- Monitor logs for suspicious activity
