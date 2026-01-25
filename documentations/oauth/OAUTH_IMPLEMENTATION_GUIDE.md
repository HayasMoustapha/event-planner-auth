# Guide d'Implémentation OAuth - Google Sign-In & Apple Sign-In

## 🎯 Objectif

Ce guide documente l'implémentation complète de Google Sign-In et Apple Sign-In dans le service d'authentification Event Planner.

## 📋 Table des Matières

1. [Architecture](#architecture)
2. [Configuration](#configuration)
3. [API Endpoints](#api-endpoints)
4. [Flux d'Authentification](#flux-dauthentification)
5. [Sécurité](#sécurité)
6. [Tests](#tests)
7. [Dépannage](#dépannage)

---

## 🏗️ Architecture

### Schéma de Base de Données

La table `user_identities` stocke les identités OAuth externes :

```sql
CREATE TABLE user_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'apple')),
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    provider_data JSONB,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid()
);
```

### Structure des Modules

```
src/modules/
├── oauth/
│   ├── oauth.service.js      # Logique métier OAuth
│   ├── oauth.controller.js   # Contrôleur HTTP
│   ├── oauth.routes.js       # Routes API
│   ├── oauth.validation.js   # Validation des entrées
│   └── oauth.errorHandler.js # Gestion des erreurs
├── identities/
│   ├── identities.service.js # Service des identités
│   └── identities.repository.js # Repository base de données
└── middlewares/
    └── oauth.middleware.js   # Middleware de sécurité OAuth
```

---

## ⚙️ Configuration

### Variables d'Environnement

Ajoutez ces variables à votre fichier `.env` :

```bash
# Google Sign-In
GOOGLE_CLIENT_ID=votre_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_google_client_secret

# Apple Sign-In
APPLE_CLIENT_ID=com.votreapp.service
APPLE_TEAM_ID=votre_apple_team_id
APPLE_KEY_ID=votre_apple_key_id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
votre_clé_privée_apple
-----END PRIVATE KEY-----"

# Sécurité OAuth
OAUTH_TOKEN_EXPIRES_IN=10m
OAUTH_STATE_EXPIRES_IN=5m
OAUTH_NONCE_EXPIRES_IN=5m
```

### Configuration Google

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Sign-In
4. Créez des identifiants OAuth 2.0 Client ID
5. Ajoutez vos domaines autorisés :
   - `http://localhost:3000` (développement)
   - `https://votredomaine.com` (production)

### Configuration Apple

1. Allez sur [Apple Developer](https://developer.apple.com/)
2. Créez un nouvel App ID avec Sign In capability
3. Générez une clé privée pour Sign In
4. Configurez les domaines autorisés dans votre App ID

---

## 🚀 API Endpoints

### Routes Principales

#### Google Sign-In
```http
POST /api/auth/oauth/google
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6I..."
}
```

#### Apple Sign-In
```http
POST /api/auth/oauth/apple
Content-Type: application/json

{
  "identityToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIs...",
  "user": "apple_user_id_optionnel"
}
```

### Routes de Gestion

#### Lier un compte OAuth
```http
POST /api/auth/oauth/link/google
Authorization: Bearer <token>
Content-Type: application/json

{
  "idToken": "google_id_token"
}
```

#### Récupérer les identités
```http
GET /api/auth/oauth/identities
Authorization: Bearer <token>
```

#### Détacher une identité
```http
DELETE /api/auth/oauth/google
Authorization: Bearer <token>
```

#### Vérifier la configuration
```http
GET /api/auth/oauth/config
```

---

## 🔄 Flux d'Authentification

### Nouvel Utilisateur

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Service
    participant G as Google/Apple
    participant DB as Database

    C->>G: Connexion OAuth
    G->>C: Retourne id_token
    C->>A: POST /api/auth/oauth/{provider}
    A->>G: Vérifie id_token
    G->>A: Token valide + infos utilisateur
    A->>DB: Crée person
    A->>DB: Crée user
    A->>DB: Crée user_identity
    A->>DB: Crée session
    A->>C: Retourne JWT + user data
```

### Utilisateur Existant

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Service
    participant G as Google/Apple
    participant DB as Database

    C->>G: Connexion OAuth
    G->>C: Retourne id_token
    C->>A: POST /api/auth/oauth/{provider}
    A->>G: Vérifie id_token
    G->>A: Token valide + infos utilisateur
    A->>DB: Cherche user_identity
    A->>DB: Vérifie statut utilisateur
    A->>DB: Met à jour last_used
    A->>DB: Crée session
    A->>C: Retourne JWT + user data
```

---

## 🔒 Sécurité

### Protections Implémentées

1. **Rate Limiting** : 10 tentatives par 15 minutes
2. **Validation des Tokens** : Format JWT et taille vérifiés
3. **CORS** : Origines autorisées uniquement
4. **Headers Security** : User-Agent obligatoire
5. **Configuration Validation** : Vérification des clés API

### En-têtes de Sécurité

```javascript
// Headers automatiquement ajoutés
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### Logging

Toutes les tentatives OAuth sont journalisées avec :
- IP et User-Agent
- Provider utilisé
- Succès/échec
- Durée de la requête
- Erreurs détaillées

---

## 🧪 Tests

### Tests d'Intégration

```bash
# Lancer les tests OAuth
npm test tests/integration/oauth.test.js

# Tests end-to-end
npm test tests/e2e/oauth-flows.test.js
```

### Cas de Test Couverts

1. **Nouvel utilisateur Google**
2. **Nouvel utilisateur Apple**
3. **Utilisateur existant**
4. **Conflit d'email**
5. **Compte verrouillé/désactivé**
6. **Token invalide**
7. **Rate limiting**
8. **CORS protection**

### Tests Manuels Postman

Importez la collection `Event-Planner-Auth-API.postman_collection.json` et utilisez :

1. **Google Sign-In Test**
   - Utilisez un vrai token Google
   - Vérifiez la création utilisateur

2. **Apple Sign-In Test**
   - Utilisez un vrai token Apple
   - Vérifiez la création utilisateur

---

## 🐛 Dépannage

### Erreurs Communes

#### `GOOGLE_TOKEN_INVALID`
- **Cause** : Token expiré ou invalide
- **Solution** : Demandez un nouveau token à Google

#### `APPLE_TOKEN_INVALID`
- **Cause** : Token expiré ou signature invalide
- **Solution** : Vérifiez la clé privée Apple

#### `EMAIL_ALREADY_USED`
- **Cause** : Email déjà utilisé par un compte classique
- **Solution** : L'utilisateur doit se connecter et lier son compte

#### `OAUTH_CONFIG_ERROR`
- **Cause** : Variables d'environnement manquantes
- **Solution** : Vérifiez la configuration OAuth

#### `OAUTH_RATE_LIMIT_EXCEEDED`
- **Cause** : Trop de tentatives
- **Solution** : Attendez 15 minutes

### Debug Mode

Activez le debug OAuth :

```bash
LOG_LEVEL=debug
npm run dev
```

### Vérification de Configuration

```bash
curl http://localhost:3000/api/auth/oauth/config
```

---

## 📊 Monitoring

### Métriques Disponibles

- Nombre de connexions OAuth par provider
- Taux d'échec par type d'erreur
- Durée moyenne des authentifications
- Tentatives de rate limiting

### Logs Structurés

```json
{
  "level": "auth",
  "message": "OAuth authentication successful",
  "provider": "google",
  "userId": 12345,
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-01-22T08:00:00.000Z"
}
```

---

## 🚀 Déploiement

### Production Checklist

- [ ] Variables d'environnement configurées
- [ ] Domaines autorisés dans Google/Apple
- [ ] HTTPS activé
- [ ] Rate limiting configuré
- [ ] Logs activés
- [ ] Monitoring en place
- [ ] Tests de charge effectués

### Migration

La migration `003_create_user_identities_table.sql` doit être appliquée :

```bash
# Appliquer la migration
npm run migrate

# Ou manuellement
psql -d votre_db -f database/migrations/003_create_user_identities_table.sql
```

---

## 📚 Références

- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Apple Sign-In Documentation](https://developer.apple.com/documentation/signinwithapplerestapi)
- [JWT Specification](https://tools.ietf.org/html/rfc7519)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)

---

## 🤝 Support

Pour toute question ou problème :

1. Vérifiez les logs d'erreur
2. Consultez ce guide de dépannage
3. Exécutez les tests de diagnostic
4. Contactez l'équipe de développement

---

*Dernière mise à jour : 22 janvier 2026*
