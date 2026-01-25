# Flux d'Authentification - Event Planner

## 1. Inscription (Register)

### Flow
```
Client → POST /api/auth/register → Server
├── Validation des données
├── Vérification email unique
├── Vérification username unique
├── Création personne
├── Création utilisateur
├── Génération token vérification email
├── Envoi email vérification
└── Réponse avec token de vérification
```

### Request
```json
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "username": "johndoe",
  "password": "Password123!"
}
```

### Response
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "isVerified": false,
      "isActive": true,
      "person": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890",
        "email": "john.doe@example.com",
        "status": "active"
      }
    },
    "verificationToken": "abc123..."
  }
}
```

## 2. Connexion (Login)

### Flow
```
Client → POST /api/auth/login → Server
├── Validation email/password
├── Recherche utilisateur
├── Vérification mot de passe (bcrypt)
├── Vérification compte actif
├── Mise à jour dernière connexion
├── Génération tokens JWT
├── Création session
└── Réponse avec tokens
```

### Request
```json
POST /api/auth/login
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

### Response
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "isVerified": true,
      "isActive": true,
      "roles": [
        {
          "id": 2,
          "code": "user",
          "label": "Utilisateur standard"
        }
      ],
      "permissions": [
        "users.read",
        "users.update"
      ]
    }
  }
}
```

## 3. Rafraîchissement de Token (Refresh Token)

### Flow
```
Client → POST /api/auth/refresh → Server
├── Validation refresh token
├── Vérification session active
├── Vérification token non expiré
├── Génération nouveaux tokens
├── Mise à jour session
└── Réponse avec nouveaux tokens
```

### Request
```json
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response
```json
{
  "success": true,
  "message": "Token rafraîchi",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## 4. Déconnexion (Logout)

### Flow
```
Client → POST /api/auth/logout → Server
├── Authentication requise
├── Révocation session
└── Réponse succès
```

### Request
```json
POST /api/auth/logout
Authorization: Bearer <access_token>
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

## 5. Vérification Email

### Flow
```
Client → POST /api/auth/verify-email → Server
├── Validation token
├── Vérification token non expiré
├── Marquage email vérifié
└── Réponse succès
```

### Request
```json
POST /api/auth/verify-email
{
  "token": "abc123..."
}
```

### Response
```json
{
  "success": true,
  "message": "Email vérifié avec succès"
}
```

## 6. Mot de Passe Oublié

### Flow
```
Client → POST /api/auth/forgot-password → Server
├── Validation email
├── Recherche utilisateur
├── Génération token réinitialisation
├── Stockage token avec expiration
├── Envoi email réinitialisation
└── Réponse succès (sans révéler existence)
```

### Request
```json
POST /api/auth/forgot-password
{
  "email": "john.doe@example.com"
}
```

### Response
```json
{
  "success": true,
  "message": "Email de réinitialisation envoyé"
}
```

## 7. Réinitialisation Mot de Passe

### Flow
```
Client → POST /api/auth/reset-password → Server
├── Validation token et nouveau password
├── Vérification token valide et non expiré
├── Hashage nouveau mot de passe
├── Mise à jour mot de passe
├── Marquage token utilisé
├── Révocation toutes sessions
└── Réponse succès
```

### Request
```json
POST /api/auth/reset-password
{
  "token": "abc123...",
  "password": "NewPassword123!"
}
```

### Response
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

## 8. Changement Mot de Passe

### Flow
```
Client → PUT /api/auth/change-password → Server
├── Authentication requise
├── Validation passwords
├── Vérification mot de passe actuel
├── Hashage nouveau mot de passe
├── Mise à jour mot de passe
├── Révocation autres sessions (optionnel)
└── Réponse succès
```

### Request
```json
PUT /api/auth/change-password
Authorization: Bearer <access_token>
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### Response
```json
{
  "success": true,
  "message": "Mot de passe changé avec succès"
}
```

## 9. Accès Profil Utilisateur

### Flow
```
Client → GET /api/auth/me → Server
├── Authentication requise
├── Récupération utilisateur avec personne
├── Récupération rôles et permissions
└── Réponse données complètes
```

### Request
```json
GET /api/auth/me
Authorization: Bearer <access_token>
```

### Response
```json
{
  "success": true,
  "message": "Profil utilisateur",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "isVerified": true,
    "isActive": true,
    "status": "active",
    "person": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "email": "john.doe@example.com",
      "status": "active"
    },
    "roles": [
      {
        "id": 2,
        "code": "user",
        "label": "Utilisateur standard"
      }
    ],
    "permissions": [
      {
        "id": 1,
        "code": "users.read",
        "resource": "users",
        "action": "read"
      }
    ],
    "accesses": [
      {
        "id": 1,
        "userId": 1,
        "roleId": 2,
        "status": "active"
      }
    ]
  }
}
```

## 10. Gestion des Erreurs

### Types d'erreurs
- **400** : Erreur de validation
- **401** : Non authentifié
- **403** : Permission insuffisante
- **404** : Ressource non trouvée
- **409** : Conflit (email/username déjà utilisé)
- **429** : Trop de requêtes (rate limiting)
- **500** : Erreur serveur

### Format d'erreur standard
```json
{
  "success": false,
  "error": "Erreur de validation",
  "message": "L'email fourni est invalide",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "errors": [
    {
      "field": "email",
      "message": "Format d'email invalide"
    }
  ]
}
```

## 11. Sécurité

### Hardening Validation (Rule 3)
- **Protection contre les champs non autorisés** : Validation stricte des entrées
- **Détection d'attaques** : SQL injection, XSS, path traversal, command injection
- **Sanitisation automatique** : Nettoyage des données utilisateur
- **Audit de sécurité** : Journalisation des tentatives d'attaque

### Rate Limiting
- **Auth endpoints** : 5 requêtes/15min/IP
- **API endpoints** : 100 requêtes/15min/IP

### Tokens
- **Access Token** : 24h expiration
- **Refresh Token** : 7 jours expiration
- **Reset Token** : 1 heure expiration
- **Verification Token** : 24 heures expiration

### Password Policy
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial (@$!%*?&)

### Headers de sécurité
- Helmet pour headers HTTP sécurisés
- CORS configuré pour origines spécifiques
- Compression activée
- Rate limiting appliqué
