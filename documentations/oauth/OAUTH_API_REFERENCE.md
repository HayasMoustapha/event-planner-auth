# OAuth API Reference

## Overview

This document provides detailed API reference for OAuth endpoints in the Event Planner Auth Service.

## Base URL

```
Development: http://localhost:3000/api/auth/oauth
Production: https://your-domain.com/api/auth/oauth
```

## Authentication

Most OAuth endpoints are public (no authentication required) except for identity management endpoints which require a valid JWT token.

```http
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Google Sign-In

#### POST /google

Authenticates or creates a user using Google Sign-In.

**Request:**
```http
POST /api/auth/oauth/google
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6I..."
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| idToken | string | Yes | Google ID token from client |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connexion Google réussie",
  "data": {
    "user": {
      "id": 12345,
      "username": "user123456",
      "email": "user@gmail.com",
      "first_name": "John",
      "last_name": "Doe",
      "status": "active",
      "email_verified_at": "2026-01-22T08:00:00.000Z",
      "created_at": "2026-01-22T08:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "provider": "google",
    "isNewUser": false,
    "identity": {
      "id": 678,
      "provider": "google",
      "provider_user_id": "123456789",
      "email": "user@gmail.com",
      "last_used_at": "2026-01-22T08:00:00.000Z"
    }
  },
  "timestamp": "2026-01-22T08:00:00.000Z"
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "success": false,
  "message": "Token Google requis",
  "code": "GOOGLE_TOKEN_REQUIRED"
}
```

401 Unauthorized:
```json
{
  "success": false,
  "message": "Token Google invalide ou expiré",
  "code": "GOOGLE_TOKEN_INVALID"
}
```

409 Conflict:
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé. Connectez-vous et liez votre compte.",
  "code": "EMAIL_ALREADY_USED",
  "requiresLinking": true
}
```

---

### 2. Apple Sign-In

#### POST /apple

Authenticates or creates a user using Apple Sign-In.

**Request:**
```http
POST /api/auth/oauth/apple
Content-Type: application/json

{
  "identityToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIs...",
  "user": "apple.user.id.12345"
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| identityToken | string | Yes | Apple identity token |
| user | string | No | Apple user ID (optional) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Compte créé avec Apple",
  "data": {
    "user": {
      "id": 12346,
      "username": "user123457",
      "email": "user@privaterelay.appleid.com",
      "first_name": "Utilisateur",
      "last_name": "Apple",
      "status": "active",
      "email_verified_at": "2026-01-22T08:00:00.000Z",
      "created_at": "2026-01-22T08:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "provider": "apple",
    "isNewUser": true,
    "identity": {
      "id": 679,
      "provider": "apple",
      "provider_user_id": "1234567890123456",
      "email": "user@privaterelay.appleid.com",
      "last_used_at": "2026-01-22T08:00:00.000Z"
    }
  },
  "timestamp": "2026-01-22T08:00:00.000Z"
}
```

---

### 3. Link Google Account

#### POST /link/google

Links a Google account to an existing authenticated user.

**Authentication:** Required

**Request:**
```http
POST /api/auth/oauth/link/google
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6I..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Compte Google lié avec succès",
  "data": {
    "identity": {
      "id": 680,
      "provider": "google",
      "provider_user_id": "987654321",
      "email": "existing.user@gmail.com"
    },
    "provider": "google"
  }
}
```

---

### 4. Link Apple Account

#### POST /link/apple

Links an Apple account to an existing authenticated user.

**Authentication:** Required

**Request:**
```http
POST /api/auth/oauth/link/apple
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "identityToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIs...",
  "user": "apple.user.id.67890"
}
```

---

### 5. Get User Identities

#### GET /identities

Retrieves all OAuth identities linked to the authenticated user.

**Authentication:** Required

**Request:**
```http
GET /api/auth/oauth/identities
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Identités OAuth récupérées",
  "data": {
    "identities": [
      {
        "id": 678,
        "provider": "google",
        "provider_user_id": "123456789",
        "email": "user@gmail.com",
        "last_used_at": "2026-01-22T08:00:00.000Z",
        "created_at": "2026-01-22T07:30:00.000Z"
      },
      {
        "id": 679,
        "provider": "apple",
        "provider_user_id": "1234567890123456",
        "email": "user@privaterelay.appleid.com",
        "last_used_at": "2026-01-22T08:00:00.000Z",
        "created_at": "2026-01-22T07:45:00.000Z"
      }
    ],
    "count": 2
  }
}
```

---

### 6. Unlink Identity

#### DELETE /:provider

Unlinks an OAuth identity from the authenticated user.

**Authentication:** Required

**Request:**
```http
DELETE /api/auth/oauth/google
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Identité google détachée avec succès"
}
```

---

### 7. Check Configuration

#### GET /config

Checks OAuth configuration status.

**Request:**
```http
GET /api/auth/oauth/config
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Configuration OAuth récupérée",
  "data": {
    "configuration": {
      "google": {
        "clientId": true,
        "clientSecret": true,
        "configured": true
      },
      "apple": {
        "clientId": true,
        "teamId": true,
        "keyId": true,
        "privateKey": true,
        "configured": true
      }
    },
    "timestamp": "2026-01-22T08:00:00.000Z"
  }
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `GOOGLE_TOKEN_REQUIRED` | Google ID token is required | 400 |
| `GOOGLE_TOKEN_INVALID` | Google token is invalid or expired | 401 |
| `APPLE_IDENTITY_TOKEN_REQUIRED` | Apple identity token is required | 400 |
| `APPLE_TOKEN_INVALID` | Apple token is invalid or expired | 401 |
| `EMAIL_ALREADY_USED` | Email already used by existing account | 409 |
| `IDENTITY_ALREADY_LINKED` | OAuth identity already linked to account | 409 |
| `ACCOUNT_LOCKED` | User account is locked | 403 |
| `ACCOUNT_INACTIVE` | User account is inactive | 403 |
| `UNSUPPORTED_PROVIDER` | OAuth provider not supported | 400 |
| `INVALID_USER_AGENT` | Missing or invalid User-Agent header | 400 |
| `INVALID_ORIGIN` | Unauthorized CORS origin | 403 |
| `INVALID_TOKEN_SIZE` | Token size is invalid | 400 |
| `INVALID_JWT_FORMAT` | Token is not valid JWT format | 400 |
| `OAUTH_RATE_LIMIT_EXCEEDED` | Too many OAuth attempts | 429 |
| `OAUTH_CONFIG_ERROR` | OAuth configuration error | 500 |
| `OAUTH_SERVICE_UNAVAILABLE` | OAuth service temporarily unavailable | 503 |

---

## Rate Limiting

OAuth endpoints are rate-limited to prevent abuse:

- **Window**: 15 minutes
- **Max Requests**: 10 per window
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Security Headers

All OAuth responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

---

## CORS Configuration

OAuth endpoints support CORS with the following:

- **Allowed Methods**: POST, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Supported
- **Max Age**: 86400 seconds (24 hours)

Configure allowed origins via `CORS_ORIGIN` environment variable.

---

## Examples

### JavaScript/TypeScript Client

```typescript
// Google Sign-In
async function signInWithGoogle(idToken: string) {
  try {
    const response = await fetch('/api/auth/oauth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
}

// Apple Sign-In
async function signInWithApple(identityToken: string, user?: string) {
  try {
    const response = await fetch('/api/auth/oauth/apple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identityToken, user })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Apple Sign-In error:', error);
    throw error;
  }
}
```

### cURL Examples

```bash
# Google Sign-In
curl -X POST http://localhost:3000/api/auth/oauth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"eyJhbGciOiJSUzI1NiIsImtpZCI6I..."}'

# Apple Sign-In
curl -X POST http://localhost:3000/api/auth/oauth/apple \
  -H "Content-Type: application/json" \
  -d '{"identityToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIs..."}'

# Check Configuration
curl http://localhost:3000/api/auth/oauth/config
```

---

## Testing

### Postman Collection

Import the provided Postman collection `Event-Planner-Auth-API.postman_collection.json` which includes:

1. Google Sign-In test cases
2. Apple Sign-In test cases
3. Identity management tests
4. Error scenario tests

### Environment Variables

Set these in Postman:

```json
{
  "baseUrl": "http://localhost:3000",
  "googleIdToken": "your_test_google_token",
  "appleIdentityToken": "your_test_apple_token"
}
```

---

*Last updated: January 22, 2026*
