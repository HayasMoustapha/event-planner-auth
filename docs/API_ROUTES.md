# Event Planner Auth - API Routes Documentation

## Overview

Le Event Planner Auth est le service d'authentification principal de la plateforme Event Planner, gérant les utilisateurs, rôles, permissions, OAuth, et OTP.

## Base URL
```
http://localhost:3000/api
```

## Authentication

Les routes publiques ne nécessitent pas d'authentification, les routes protégées nécessitent un JWT:
```
Authorization: Bearer <token>
```

## Permissions

Les permissions requises pour chaque route sont spécifiées ci-dessous.

---

## 🏠 **Health Routes**

### Health Check
```
GET /health
```
- **Description**: Vérification de santé du service
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-25T15:30:00.000Z",
  "service": "event-planner-auth",
  "version": "1.0.0",
  "uptime": "2.5 hours",
  "environment": "development"
}
```

### API Info
```
GET /api/info
```
- **Description**: Informations sur le service et endpoints disponibles
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Response**:
```json
{
  "name": "Event Planner Auth API",
  "version": "1.0.0",
  "description": "API d'authentification et de gestion des utilisateurs",
  "environment": "development",
  "uptime": "2.5 hours",
  "timestamp": "2024-01-25T15:30:00.000Z",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "roles": "/api/roles",
    "permissions": "/api/permissions",
    "oauth": "/api/auth/oauth"
  }
}
```

---

## 🔐 **Authentication Routes**

### Login
```
POST /api/auth/login
```
- **Description**: Connexion classique avec email et mot de passe
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "remember_me": false
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "usr_123456789",
      "email": "user@example.com",
      "username": "johndoe",
      "first_name": "John",
      "last_name": "Doe",
      "status": "active"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  }
}
```

### Login with Remember Token
```
POST /api/auth/login-remember
```
- **Description**: Connexion avec remember token
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "remember_token": "remember_token_123456"
}
```

### Login with OTP
```
POST /api/auth/login-otp
```
- **Description**: Connexion avec OTP
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Refresh Token
```
POST /api/auth/refresh-token
POST /api/auth/refresh
```
- **Description**: Rafraîchissement de token
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Validate Token
```
POST /api/auth/validate-token
```
- **Description**: Validation de token
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 📧 **OTP Routes**

### Generate Email OTP
```
POST /api/auth/otp/email/generate
```
- **Description**: Générer OTP pour email
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "purpose": "email_verification"
}
```

### Generate Phone OTP
```
POST /api/auth/otp/phone/generate
```
- **Description**: Générer OTP pour téléphone
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "phone": "+33612345678",
  "purpose": "phone_verification"
}
```

### Verify Email OTP
```
POST /api/auth/otp/email/verify
```
- **Description**: Vérifier OTP pour email
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "email_verification"
}
```

### Verify Phone OTP
```
POST /api/auth/otp/phone/verify
```
- **Description**: Vérifier OTP pour téléphone
- **Authentification**: Non requise
- **Permissions**: Aucune

### Generate Password Reset OTP
```
POST /api/auth/otp/password-reset/generate
POST /api/auth/forgot-password
```
- **Description**: Générer OTP pour réinitialisation de mot de passe
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```

### Reset Password with OTP
```
POST /api/auth/otp/password-reset/verify
POST /api/auth/reset-password
```
- **Description**: Réinitialiser le mot de passe avec OTP
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "newpassword123"
}
```

### Show Reset Password Form
```
GET /api/auth/reset-password
```
- **Description**: Afficher le formulaire de réinitialisation de mot de passe
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Query Parameters**:
- `token`: Token de réinitialisation
- `email`: Email de l'utilisateur (optionnel)

---

## 📝 **Registration Routes**

### Register
```
POST /api/auth/register
```
- **Description**: Inscription d'un nouvel utilisateur
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+33612345678"
}
```

### Verify Email
```
POST /api/auth/verify-email
```
- **Description**: Vérification d'email avec OTP
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Resend OTP
```
POST /api/auth/resend-otp
```
- **Description**: Renvoi d'OTP
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "purpose": "email_verification"
}
```

### Login After Verification
```
POST /api/auth/login-after-verification
```
- **Description**: Connexion après vérification
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Check Email Availability
```
GET /api/auth/check-email/:email
```
- **Description**: Vérification disponibilité email
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Response**:
```json
{
  "success": true,
  "message": "Email availability checked",
  "data": {
    "email": "user@example.com",
    "available": true
  }
}
```

### Check Username Availability
```
GET /api/auth/check-username/:username
```
- **Description**: Vérification disponibilité username
- **Authentification**: Non requise
- **Permissions**: Aucune

---

## 👤 **Protected Authentication Routes**

### Get Change Password Form
```
GET /api/auth/change-password
```
- **Description**: Formulaire de changement de mot de passe
- **Authentification**: Requise
- **Permissions**: Aucune

### Logout
```
POST /api/auth/logout
```
- **Description**: Déconnexion
- **Authentification**: Requise
- **Permissions**: Aucune
- **Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Get Profile
```
GET /api/auth/profile
GET /api/auth/me
```
- **Description**: Récupérer le profil utilisateur
- **Authentification**: Requise
- **Permissions**: Aucune
- **Response**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "usr_123456789",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+33612345678",
    "status": "active",
    "created_at": "2024-01-25T15:30:00.000Z",
    "last_login": "2024-01-25T15:30:00.000Z"
  }
}
```

### Change Password
```
POST /api/auth/change-password
PUT /api/auth/change-password
```
- **Description**: Changer le mot de passe
- **Authentification**: Requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

---

## 🔧 **Admin OTP Routes**

### Get User OTPs
```
GET /api/auth/otp/person/:personId
```
- **Description**: Récupérer les OTPs d'une personne
- **Authentification**: Requise
- **Permissions**: `otp.read`

### Invalidate User OTPs
```
POST /api/auth/otp/person/:personId/invalidate
```
- **Description**: Invalider les OTPs d'une personne
- **Authentification**: Requise
- **Permissions**: `otp.manage`

### Check Active OTP
```
GET /api/auth/otp/person/:personId/active
```
- **Description**: Vérifier si une personne a des OTPs actifs
- **Authentification**: Requise
- **Permissions**: `otp.read`

### Cleanup Expired OTPs
```
POST /api/auth/otp/cleanup
```
- **Description**: Nettoyer les OTPs expirés
- **Authentification**: Requise
- **Permissions**: `otp.manage`

### Get OTP Statistics
```
GET /api/auth/otp/stats
```
- **Description**: Statistiques sur les OTPs
- **Authentification**: Requise
- **Permissions**: `otp.stats`

---

## 🔗 **OAuth Routes**

### Login with Google
```
POST /api/auth/oauth/google
```
- **Description**: Connexion avec Google Sign-In
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "access_token": "ya29.a0AfH6SMC..."
}
```

### Login with Apple
```
POST /api/auth/oauth/apple
```
- **Description**: Connexion avec Apple Sign-In
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "identity_token": "eyJraWQiOiI...",
  "authorization_code": "a1b2c3d4e5f6"
}
```

### Link Google Account
```
POST /api/auth/oauth/link/google
```
- **Description**: Lier un compte Google à un utilisateur existant
- **Authentification**: Requise
- **Permissions**: Aucune
- **Request Body**:
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

### Link Apple Account
```
POST /api/auth/oauth/link/apple
```
- **Description**: Lier un compte Apple à un utilisateur existant
- **Authentification**: Requise
- **Permissions**: Aucune

### Unlink OAuth Identity
```
DELETE /api/auth/oauth/:provider
```
- **Description**: Détacher une identité OAuth
- **Authentification**: Requise
- **Permissions**: Aucune
- **Parameters**:
- `provider`: google ou apple

### Get User OAuth Identities
```
GET /api/auth/oauth/identities
```
- **Description**: Récupérer les identités OAuth de l'utilisateur
- **Authentification**: Requise
- **Permissions**: Aucune

### Check OAuth Configuration
```
GET /api/auth/oauth/config
```
- **Description**: Vérifier la configuration OAuth
- **Authentification**: Non requise
- **Permissions**: Aucune
- **Notes de readiness**:
  - `status=missing_live_provider_credentials`: le provider n'a pas encore toutes ses variables réelles
  - `status=mock_only`: le provider ne peut fonctionner qu'en mock dans l'environnement courant
  - `status=configured_not_live_proved`: les secrets semblent présents, mais aucun succès live n'est prouvé par cette route
- **Champs utiles par provider**: `configured`, `liveProved`, `blockedByMissingLiveCredentials`, `presentFields`, `missingFields`, `placeholderFields`, `mockEnabled`

---

## 👥 **Users Routes**

### Check Username Availability
```
GET /api/users/check/username/:username
```
- **Description**: Vérifier disponibilité username
- **Authentification**: Non requise
- **Permissions**: Aucune

### Check Email Availability
```
GET /api/users/check/email/:email
```
- **Description**: Vérifier disponibilité email
- **Authentification**: Non requise
- **Permissions**: Aucune

### Authenticate User
```
POST /api/users/authenticate
```
- **Description**: Authentifier un utilisateur
- **Authentification**: Non requise
- **Permissions**: Aucune

### Get All Users
```
GET /api/users
```
- **Description**: Lister tous les utilisateurs
- **Authentification**: Requise
- **Permissions**: `users.list`

### Get User Statistics
```
GET /api/users/stats
```
- **Description**: Statistiques des utilisateurs
- **Authentification**: Requise
- **Permissions**: `users.stats`

### Get User by ID
```
GET /api/users/:id
```
- **Description**: Récupérer un utilisateur par ID
- **Authentification**: Requise
- **Permissions**: `users.read`

### Get User by Email
```
GET /api/users/email/:email
```
- **Description**: Récupérer un utilisateur par email
- **Authentification**: Requise
- **Permissions**: `users.read`

### Get User by Username
```
GET /api/users/username/:username
```
- **Description**: Récupérer un utilisateur par username
- **Authentification**: Requise
- **Permissions**: `users.read`

### Create User
```
POST /api/users
```
- **Description**: Créer un utilisateur
- **Authentification**: Requise
- **Permissions**: `users.create`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role_ids": ["role_123456"]
}
```

### Update User
```
PUT /api/users/:id
PATCH /api/users/:id
```
- **Description**: Mettre à jour un utilisateur
- **Authentification**: Requise
- **Permissions**: `users.update`

### Update User Password
```
PATCH /api/users/:id/password
```
- **Description**: Mettre à jour le mot de passe d'un utilisateur
- **Authentification**: Requise
- **Permissions**: `users.update`

### Update User Status
```
PATCH /api/users/:id/status
```
- **Description**: Mettre à jour le statut d'un utilisateur
- **Authentification**: Requise
- **Permissions**: `users.update`

### Delete User
```
DELETE /api/users/:id
```
- **Description**: Supprimer un utilisateur (soft delete)
- **Authentification**: Requise
- **Permissions**: `users.delete`

### Check User Exists
```
GET /api/users/:id/exists
```
- **Description**: Vérifier si un utilisateur existe
- **Authentification**: Requise
- **Permissions**: `users.read`

### Reset User Password
```
POST /api/users/reset-password
```
- **Description**: Réinitialiser le mot de passe d'un utilisateur
- **Authentification**: Requise
- **Permissions**: `users.update`

### Search Users
```
GET /api/users/search
```
- **Description**: Rechercher des utilisateurs
- **Authentification**: Requise
- **Permissions**: `users.list`
- **Query Parameters**:
- `q`: Terme de recherche
- `page`: Numéro de page
- `limit`: Nombre par page

---

## 🎭 **Roles Routes**

### Get Role Statistics
```
GET /api/roles/stats
```
- **Description**: Statistiques des rôles
- **Authentification**: Requise
- **Permissions**: `roles.view_stats`

### Get Roles by Level
```
GET /api/roles/level/:level
```
- **Description**: Récupérer les rôles par niveau
- **Authentification**: Requise
- **Permissions**: `roles.read`

### Get Non-System Roles
```
GET /api/roles/non-system
```
- **Description**: Récupérer les rôles non-système
- **Authentification**: Requise
- **Permissions**: `roles.read`

### Get System Roles
```
GET /api/roles/system
```
- **Description**: Récupérer les rôles système
- **Authentification**: Requise
- **Permissions**: `roles.read`

### Get User Roles
```
GET /api/roles/user/:userId
```
- **Description**: Récupérer les rôles d'un utilisateur
- **Authentification**: Requise
- **Permissions**: `roles.read`

### Check User Role
```
GET /api/roles/user/:userId/check/:role
```
- **Description**: Vérifier si un utilisateur a un rôle spécifique
- **Authentification**: Requise
- **Permissions**: `roles.verify`

### Get User Highest Role
```
GET /api/roles/user/:userId/highest
```
- **Description**: Récupérer le rôle le plus élevé d'un utilisateur
- **Authentification**: Requise
- **Permissions**: `roles.read`

### Get All Roles
```
GET /api/roles
```
- **Description**: Lister tous les rôles
- **Authentification**: Requise
- **Permissions**: `roles.read`

### Get Role by ID
```
GET /api/roles/:id
```
- **Description**: Récupérer un rôle par ID
- **Authentification**: Requise
- **Permissions**: `roles.read`

### Create Role
```
POST /api/roles
```
- **Description**: Créer un rôle
- **Authentification**: Requise
- **Permissions**: `roles.create`

### Update Role
```
PUT /api/roles/:id
```
- **Description**: Mettre à jour un rôle
- **Authentification**: Requise
- **Permissions**: `roles.update`

### Delete Role
```
DELETE /api/roles/:id
```
- **Description**: Supprimer un rôle
- **Authentification**: Requise
- **Permissions**: `roles.delete`

### Assign Role to User
```
POST /api/roles/:id/assign
```
- **Description**: Assigner un rôle à un utilisateur
- **Authentification**: Requise
- **Permissions**: `roles.assign`

### Remove Role from User
```
DELETE /api/roles/:id/remove
```
- **Description**: Retirer un rôle d'un utilisateur
- **Authentification**: Requise
- **Permissions**: `roles.remove`

---

## 🔐 **Permissions Routes**

### Get Permission Statistics
```
GET /api/permissions/stats
```
- **Description**: Statistiques des permissions
- **Authentification**: Requise
- **Permissions**: `permissions.view_stats`

### Get Permissions by Group
```
GET /api/permissions/group/:groupName
```
- **Description**: Récupérer les permissions par groupe
- **Authentification**: Requise
- **Permissions**: `permissions.read`

### Get Resources
```
GET /api/permissions/resources
```
- **Description**: Récupérer les ressources disponibles
- **Authentification**: Requise
- **Permissions**: `permissions.read`

### Get Resource Actions
```
GET /api/permissions/resources/:resource/actions
```
- **Description**: Récupérer les actions pour une ressource
- **Authentification**: Requise
- **Permissions**: `permissions.read`

### Get Role Permissions
```
GET /api/permissions/role/:roleId
```
- **Description**: Récupérer les permissions d'un rôle
- **Authentification**: Requise
- **Permissions**: `permissions.read`

### Get System Permissions
```
GET /api/permissions/system
```
- **Description**: Récupérer les permissions système
- **Authentification**: Requise
- **Permissions**: `permissions.read`

### Get User Permissions
```
GET /api/permissions/user/:userId
```
- **Description**: Récupérer les permissions d'un utilisateur
- **Authentification**: Requise
- **Permissions**: `permissions.read`

### Check User Permission
```
GET /api/permissions/user/:userId/check/:permission
```
- **Description**: Vérifier si un utilisateur a une permission spécifique
- **Authentification**: Requise
- **Permissions**: `permissions.verify`

### Get All Permissions
```
GET /api/permissions
```
- **Description**: Lister toutes les permissions
- **Authentification**: Requise
- **Permissions**: `permissions.read`

### Get Permission by ID
```
GET /api/permissions/:id
```
- **Description**: Récupérer une permission par ID
- **Authentification**: Requise
- **Permissions**: `permissions.read`

### Create Permission
```
POST /api/permissions
```
- **Description**: Créer une permission
- **Authentification**: Requise
- **Permissions**: `permissions.create`

### Update Permission
```
PUT /api/permissions/:id
```
- **Description**: Mettre à jour une permission
- **Authentification**: Requise
- **Permissions**: `permissions.update`

### Delete Permission
```
DELETE /api/permissions/:id
```
- **Description**: Supprimer une permission
- **Authentification**: Requise
- **Permissions**: `permissions.delete`

### Assign Permission to Role
```
POST /api/permissions/:id/assign
```
- **Description**: Assigner une permission à un rôle
- **Authentification**: Requise
- **Permissions**: `permissions.assign`

### Remove Permission from Role
```
DELETE /api/permissions/:id/remove
```
- **Description**: Retirer une permission d'un rôle
- **Authentification**: Requise
- **Permissions**: `permissions.remove`

---

## 📊 **Error Responses**

Toutes les erreurs suivent ce format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Codes d'erreur communs:
- `VALIDATION_ERROR`: Erreur de validation des données
- `INVALID_CREDENTIALS`: Identifiants invalides
- `USER_NOT_FOUND`: Utilisateur non trouvé
- `EMAIL_ALREADY_EXISTS`: Email déjà utilisé
- `USERNAME_ALREADY_EXISTS`: Username déjà utilisé
- `INVALID_OTP`: OTP invalide
- `OTP_EXPIRED`: OTP expiré
- `TOKEN_EXPIRED`: Token expiré
- `INSUFFICIENT_PERMISSIONS`: Permissions insuffisantes
- `ACCOUNT_LOCKED`: Compte verrouillé
- `ACCOUNT_INACTIVE`: Compte inactif

---

## 🚀 **Rate Limiting**

- **Limite générale**: 100 requêtes par 15 minutes par IP
- **Limite login**: 5 tentatives par 15 minutes par IP
- **Limite OTP**: 10 générations par heure par email/téléphone
- **Limite registration**: 3 inscriptions par heure par IP

---

## 📝 **Notes**

- Tous les timestamps sont en format ISO 8601
- Les IDs sont sensibles à la casse
- Les tokens JWT expirent après 1 heure par défaut
- Les OTPs expirent après 10 minutes par défaut
- Les mots de passe sont hashés avec bcrypt
- L'authentification OAuth utilise les tokens officiels des fournisseurs

---

## 🔗 **Liens Utiles**

- [Documentation Auth](../modules/auth/)
- [Documentation OAuth](../modules/oauth/)
- [Documentation Users](../modules/users/)
- [Documentation Roles](../modules/roles/)
- [Documentation Permissions](../modules/permissions/)
- [Postman Collection](../postman/collections/Event-Planner-Auth-API.postman_collection.json)
