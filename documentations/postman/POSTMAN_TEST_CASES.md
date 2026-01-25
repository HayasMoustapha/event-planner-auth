# Cas de Test Postman - Event Planner Auth API

*Généré le: 2026-01-19T16:38:55.593Z*

## Authentication

### Inscription valide

- **Endpoint**: `POST /api/auth/register`
- **Description**: Créer un nouveau compte utilisateur avec validation OTP
- **Statut attendu**: 201
- **Données de test**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+33612345678",
  "password": "Password123",
  "username": "johndoe"
}
```

### Connexion valide

- **Endpoint**: `POST /api/auth/login`
- **Description**: Authentifier un utilisateur avec email et mot de passe
- **Statut attendu**: 200
- **Données de test**:
```json
{
  "email": "admin@eventplanner.com",
  "password": "admin123"
}
```

## Users

### Création utilisateur

- **Endpoint**: `POST /api/users`
- **Description**: Créer un nouvel utilisateur avec permissions
- **Statut attendu**: 201
- **Données de test**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "Password123",
  "user_code": "USER001",
  "phone": "+33612345678",
  "status": "active",
  "person_id": 1
}
```

## Roles

### Assignation permissions

- **Endpoint**: `POST /api/roles/{id}/permissions`
- **Description**: Assigner des permissions à un rôle
- **Statut attendu**: 200
- **Données de test**:
```json
{
  "permissionIds": [
    1,
    2,
    3
  ]
}
```

