# OAuth Postman Examples

This document provides Postman examples for testing Google Sign-In and Apple Sign-In endpoints.

## Prerequisites

1. Import the main Postman collection: `Event-Planner-Auth-API.postman_collection.json`
2. Set up environment variables
3. Configure OAuth providers

## Environment Variables

Create these variables in your Postman environment:

```json
{
  "baseUrl": "http://localhost:3000",
  "googleIdToken": "your_google_id_token_here",
  "appleIdentityToken": "your_apple_identity_token_here",
  "authToken": "your_jwt_token_after_login",
  "userEmail": "user@example.com",
  "otpCode": "123456",
  "personId": "1"
}
```

## Test Cases

### 1. Google Sign-In - New User

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/google
Content-Type: application/json

{
  "idToken": "{{googleIdToken}}"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Compte créé avec Google",
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
    "isNewUser": true,
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

### 2. Google Sign-In - Existing User

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/google
Content-Type: application/json

{
  "idToken": "{{googleIdToken}}"
}
```

**Expected Response (200 OK):**
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
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "provider": "google",
    "isNewUser": false,
    "identity": {
      "id": 678,
      "provider": "google",
      "provider_user_id": "123456789",
      "email": "user@gmail.com"
    }
  }
}
```

### 3. Apple Sign-In - New User

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/apple
Content-Type: application/json

{
  "identityToken": "{{appleIdentityToken}}",
  "user": "apple.user.id.12345"
}
```

**Expected Response (200 OK):**
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
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "provider": "apple",
    "isNewUser": true,
    "identity": {
      "id": 679,
      "provider": "apple",
      "provider_user_id": "1234567890123456",
      "email": "user@privaterelay.appleid.com"
    }
  }
}
```

### 4. Link Google Account

**Prerequisites:** User must be authenticated (authToken set)

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/link/google
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "idToken": "{{googleIdToken}}"
}
```

**Expected Response (200 OK):**
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

### 5. Get User Identities

**Prerequisites:** User must be authenticated

**Request:**
```http
GET {{baseUrl}}/api/auth/oauth/identities
Authorization: Bearer {{authToken}}
```

**Expected Response (200 OK):**
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

### 6. Unlink Google Account

**Prerequisites:** User must be authenticated

**Request:**
```http
DELETE {{baseUrl}}/api/auth/oauth/google
Authorization: Bearer {{authToken}}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Identité google détachée avec succès"
}
```

### 7. Check OAuth Configuration

**Request:**
```http
GET {{baseUrl}}/api/auth/oauth/config
```

**Expected Response (200 OK):**
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

## Error Scenarios

### 1. Invalid Google Token

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/google
Content-Type: application/json

{
  "idToken": "invalid_token"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token Google invalide ou expiré",
  "code": "GOOGLE_TOKEN_INVALID"
}
```

### 2. Missing Token

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/google
Content-Type: application/json

{}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Token Google requis",
  "code": "GOOGLE_TOKEN_REQUIRED"
}
```

### 3. Email Already Used

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/google
Content-Type: application/json

{
  "idToken": "valid_token_for_existing_email"
}
```

**Expected Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé. Connectez-vous et liez votre compte.",
  "code": "EMAIL_ALREADY_USED",
  "requiresLinking": true
}
```

### 4. Rate Limiting

Send multiple requests quickly to trigger rate limiting.

**Expected Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Trop de tentatives d'authentification OAuth. Veuillez réessayer plus tard.",
  "code": "OAUTH_RATE_LIMIT_EXCEEDED"
}
```

## Test Scripts

### Pre-request Script for Google Sign-In

```javascript
// Set current timestamp for testing
pm.environment.set("testTimestamp", Date.now());

// Log test start
console.log("Starting Google Sign-In test at:", new Date().toISOString());
```

### Tests Script for Google Sign-In

```javascript
// Test response status
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

// Test user data
pm.test("Response contains user data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('user');
    pm.expect(jsonData.data.user).to.have.property('email');
    pm.expect(jsonData.data.user).to.have.property('id');
});

// Test token
pm.test("Response contains JWT token", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('token');
    pm.expect(jsonData.data.token).to.be.a('string');
    
    // Save token for future requests
    if (jsonData.data.token) {
        pm.environment.set("authToken", jsonData.data.token);
    }
});

// Test provider
pm.test("Response contains correct provider", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('provider');
    pm.expect(jsonData.data.provider).to.eql('google');
});

// Log test completion
console.log("Google Sign-In test completed at:", new Date().toISOString());
```

## Getting Real Tokens

### Google ID Token

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Select "Google OAuth2 API v2"
3. Authorize with your Google credentials
4. Exchange authorization code for tokens
5. Copy the `id_token`

### Apple Identity Token

1. Set up Apple Sign-In on your app
2. Use Apple's testing tools or a real device
3. Complete the sign-in flow
4. Extract the `identityToken` from the response

## Collection Structure

```
OAuth Tests/
├── 1. Configuration
│   └── Check OAuth Configuration
├── 2. Google Sign-In
│   ├── New User
│   ├── Existing User
│   └── Error Scenarios
├── 3. Apple Sign-In
│   ├── New User
│   ├── Existing User
│   └── Error Scenarios
├── 4. Identity Management
│   ├── Link Google Account
│   ├── Link Apple Account
│   ├── Get User Identities
│   └── Unlink Identity
├── 5. Security Tests
│   ├── Rate Limiting
│   ├── Invalid Tokens
│   └── CORS Tests
```

## Tips

1. **Use environment variables** for tokens and URLs
2. **Clear environment** between test runs
3. **Check server logs** for detailed error information
4. **Use real tokens** for accurate testing
5. **Test both success and failure scenarios**
6. **Verify database state** after tests
7. **Monitor rate limiting** headers

---

*Last updated: January 22, 2026*
      "email_verified_at": "2026-01-22T08:00:00.000Z",
      "created_at": "2026-01-22T08:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "provider": "google",
    "isNewUser": true,
    "identity": {
      "id": 678,
      "provider": "google",
      "provider_user_id": "123456789",
      "email": "user@gmail.com",
      "last_used_at": "2026-01-22T08:00:00.000Z"
    }
  }
}
```

### 2. Google Sign-In - Existing User

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/google
Content-Type: application/json

{
  "idToken": "{{googleIdToken}}"
}
```

**Expected Response (200 OK):**
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
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "provider": "google",
    "isNewUser": false,
    "identity": {
      "id": 678,
      "provider": "google",
      "provider_user_id": "123456789",
      "email": "user@gmail.com"
    }
  }
}
```

### 3. Apple Sign-In - New User

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/apple
Content-Type: application/json

{
  "identityToken": "{{appleIdentityToken}}",
  "user": "apple.user.id.12345"
}
```

**Expected Response (200 OK):**
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
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "provider": "apple",
    "isNewUser": true,
    "identity": {
      "id": 679,
      "provider": "apple",
      "provider_user_id": "1234567890123456",
      "email": "user@privaterelay.appleid.com"
    }
  }
}
```

### 4. Link Google Account

**Prerequisites:** User must be authenticated (authToken set)

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/link/google
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "idToken": "{{googleIdToken}}"
}
```

**Expected Response (200 OK):**
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

### 5. Get User Identities

**Prerequisites:** User must be authenticated

**Request:**
```http
GET {{baseUrl}}/api/auth/oauth/identities
Authorization: Bearer {{authToken}}
```

**Expected Response (200 OK):**
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

### 6. Unlink Google Account

**Prerequisites:** User must be authenticated

**Request:**
```http
DELETE {{baseUrl}}/api/auth/oauth/google
Authorization: Bearer {{authToken}}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Identité google détachée avec succès"
}
```

### 7. Check OAuth Configuration

**Request:**
```http
GET {{baseUrl}}/api/auth/oauth/config
```

**Expected Response (200 OK):**
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

## Error Scenarios

### 1. Invalid Google Token

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/google
Content-Type: application/json

{
  "idToken": "invalid_token"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token Google invalide ou expiré",
  "code": "GOOGLE_TOKEN_INVALID"
}
```

### 2. Missing Token

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/google
Content-Type: application/json

{}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Token Google requis",
  "code": "GOOGLE_TOKEN_REQUIRED"
}
```

### 3. Email Already Used

**Request:**
```http
POST {{baseUrl}}/api/auth/oauth/google
Content-Type: application/json

{
  "idToken": "valid_token_for_existing_email"
}
```

**Expected Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé. Connectez-vous et liez votre compte.",
  "code": "EMAIL_ALREADY_USED",
  "requiresLinking": true
}
```

### 4. Rate Limiting

Send multiple requests quickly to trigger rate limiting.

**Expected Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Trop de tentatives d'authentification OAuth. Veuillez réessayer plus tard.",
  "code": "OAUTH_RATE_LIMIT_EXCEEDED"
}
```

## Test Scripts

### Pre-request Script for Google Sign-In

```javascript
// Set current timestamp for testing
pm.environment.set("testTimestamp", Date.now());

// Log test start
console.log("Starting Google Sign-In test at:", new Date().toISOString());
```

### Tests Script for Google Sign-In

```javascript
// Test response status
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

// Test user data
pm.test("Response contains user data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('user');
    pm.expect(jsonData.data.user).to.have.property('email');
    pm.expect(jsonData.data.user).to.have.property('id');
});

// Test token
pm.test("Response contains JWT token", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('token');
    pm.expect(jsonData.data.token).to.be.a('string');
    
    // Save token for future requests
    if (jsonData.data.token) {
        pm.environment.set("authToken", jsonData.data.token);
    }
});

// Test provider
pm.test("Response contains correct provider", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('provider');
    pm.expect(jsonData.data.provider).to.eql('google');
});

// Log test completion
console.log("Google Sign-In test completed at:", new Date().toISOString());
```

## Getting Real Tokens

### Google ID Token

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Select "Google OAuth2 API v2"
3. Authorize with your Google credentials
4. Exchange authorization code for tokens
5. Copy the `id_token`

### Apple Identity Token

1. Set up Apple Sign-In on your app
2. Use Apple's testing tools or a real device
3. Complete the sign-in flow
4. Extract the `identityToken` from the response

## Collection Structure

```
OAuth Tests/
├── 1. Configuration
│   └── Check OAuth Configuration
├── 2. Google Sign-In
│   ├── New User
│   ├── Existing User
│   └── Error Scenarios
├── 3. Apple Sign-In
│   ├── New User
│   ├── Existing User
│   └── Error Scenarios
├── 4. Identity Management
│   ├── Link Google Account
│   ├── Link Apple Account
│   ├── Get User Identities
│   └── Unlink Identity
└── 5. Security Tests
    ├── Rate Limiting
    ├── Invalid Tokens
    └── CORS Tests
```

## Tips

1. **Use environment variables** for tokens and URLs
2. **Clear environment** between test runs
3. **Check server logs** for detailed error information
4. **Use real tokens** for accurate testing
5. **Test both success and failure scenarios**
6. **Verify database state** after tests
7. **Monitor rate limiting** headers

---

*Last updated: January 22, 2026*
