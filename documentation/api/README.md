# 🌐 Documentation API

Ce dossier contient toute la documentation des API REST du projet Event Planner Auth.

---

## 📋 **Documents API Disponibles**

### 📖 **Documentation Complète**
- **`API_DOCUMENTATION.md`** - Documentation exhaustive de toutes les API
  - Routes complètes avec méthodes HTTP
  - Corps de requête et réponse
  - Codes d'erreur et gestion
  - Exemples d'utilisation

### 🔐 **Authentification**
- **`AUTH_FLOWS.md`** - Documentation des flux d'authentification
  - Inscription et validation email
  - Login et gestion des tokens
  - Refresh token et logout
  - Gestion des OTP

### 🔒 **Contrôle d'Accès**
- **`RBAC.md`** - Documentation du système de contrôle d'accès
  - Rôles et hiérarchie
  - Permissions et autorisations
  - Middleware de sécurité
  - Matrice des accès

### 📊 **Inventaire des Routes**
- **`API_ROUTES_INVENTORY.md`** - Inventaire complet de toutes les routes
  - Liste exhaustive des endpoints
  - Méthodes et paramètres
  - Statut de validation
  - Mapping avec les collections Postman

### ✅ **Checklist API**
- **`API_ROUTES_CHECKLIST.md`** - Checklist de validation des routes
  - Points de vérification
  - Tests à effectuer
  - Critères de validation
  - Suivi des corrections

---

## 🎯 **Modules API Documentés**

### 🔐 **Module Authentification**
```
POST /api/auth/register          - Inscription nouvel utilisateur
POST /api/auth/login             - Connexion utilisateur
POST /api/auth/verify-email      - Validation email avec OTP
POST /api/auth/forgot-password    - Mot de passe oublié
POST /api/auth/reset-password     - Réinitialisation mot de passe
POST /api/auth/refresh-token     - Rafraîchissement token
POST /api/auth/logout            - Déconnexion
GET  /api/auth/me               - Profil utilisateur connecté
```

### 👤 **Module Users**
```
GET    /api/users              - Liste paginée des utilisateurs
GET    /api/users/:id          - Détails utilisateur
PUT    /api/users/:id          - Mise à jour utilisateur
DELETE /api/users/:id          - Soft delete utilisateur
PATCH  /api/users/:id/status    - Activation/Désactivation
```

### 👥 **Module People**
```
GET    /api/people              - Liste paginée des personnes
GET    /api/people/:id          - Détails personne
POST   /api/people              - Création personne
PUT    /api/people/:id          - Mise à jour personne
DELETE /api/people/:id          - Soft delete personne
```

### 👑 **Module Roles**
```
GET    /api/roles              - Liste paginée des rôles
GET    /api/roles/:id          - Détails rôle
POST   /api/roles              - Création rôle
PUT    /api/roles/:id          - Mise à jour rôle
DELETE /api/roles/:id          - Soft delete rôle
POST   /api/roles/:id/duplicate - Duplication rôle
```

### 📋 **Module Menus**
```
GET    /api/menus              - Liste paginée des menus
GET    /api/menus/:id          - Détails menu
POST   /api/menus              - Création menu
PUT    /api/menus/:id          - Mise à jour menu
DELETE /api/menus/:id          - Soft delete menu
```

### 🔑 **Module Permissions**
```
GET    /api/permissions         - Liste paginée des permissions
GET    /api/permissions/:id     - Détails permission
POST   /api/permissions         - Création permission
PUT    /api/permissions/:id     - Mise à jour permission
DELETE /api/permissions/:id     - Soft delete permission
```

### 🔐 **Module Sessions**
```
GET    /api/sessions            - Sessions actives utilisateur
GET    /api/sessions/:id        - Détails session
DELETE /api/sessions/:id        - Révocation session
```

---

## 📊 **Spécifications Techniques**

### 🌐 **Format des Réponses**
```json
{
  "success": true|false,
  "message": "Message descriptif",
  "timestamp": "2026-01-18T10:00:00.000Z",
  "data": { ... } | null,
  "errors": [ ... ] | null
}
```

### 🔒 **Authentification**
- **JWT Access Token** : 15 minutes d'expiration
- **JWT Refresh Token** : 7 jours d'expiration
- **OTP** : 6 chiffres, 10 minutes de validité
- **Rate Limiting** : Protection contre les attaques

### 📄 **Pagination**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 🔍 **Filtres de Recherche**
- **search** : Recherche textuelle sur plusieurs champs
- **page** : Numéro de page (défaut: 1)
- **limit** : Nombre d'éléments par page (défaut: 10, max: 100)
- **sortBy** : Champ de tri
- **sortOrder** : Ordre ASC | DESC

---

## 🎯 **Codes d'Erreur**

### 🔐 **Authentification (401)**
- `INVALID_CREDENTIALS` - Identifiants incorrects
- `TOKEN_EXPIRED` - Token expiré
- `TOKEN_INVALID` - Token invalide
- `OTP_INVALID` - Code OTP incorrect
- `OTP_EXPIRED` - Code OTP expiré

### 🚫 **Validation (400)**
- `VALIDATION_ERROR` - Erreur de validation des entrées
- `MISSING_FIELDS` - Champs obligatoires manquants
- `INVALID_FORMAT` - Format de données invalide

### 🔒 **Autorisation (403)**
- `INSUFFICIENT_PERMISSIONS` - Permissions insuffisantes
- `ACCESS_DENIED` - Accès refusé

### 📛 **Ressource (404)**
- `RESOURCE_NOT_FOUND` - Ressource non trouvée
- `USER_NOT_FOUND` - Utilisateur non trouvé
- `ROLE_NOT_FOUND` - Rôle non trouvé

### ⚠️ **Serveur (500)**
- `INTERNAL_ERROR` - Erreur interne du serveur
- `DATABASE_ERROR` - Erreur de base de données

---

## 🧪 **Testing des API**

### 📮 **Avec Postman**
- Utiliser les collections dans `../postman/collections/`
- Configurer l'environnement `../postman/environments/`
- Exécuter les tests avec `../postman/run-tests.sh`

### 🔧 **Avec curl**
```bash
# Exemple de login
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Password123"}'

# Exemple avec token
curl -X GET "http://localhost:3000/api/users" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

### 🧪 **Tests Automatisés**
```bash
# Exécuter tous les tests
npm test

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e
```

---

## 🎯 **Bonnes Pratiques API**

### 🔒 **Sécurité**
- **Toujours** utiliser HTTPS en production
- **Valider** tous les tokens JWT
- **Implémenter** le rate limiting
- **Logger** toutes les tentatives d'accès

### 📊 **Performance**
- **Utiliser** la pagination pour les grandes listes
- **Limiter** les champs retournés si nécessaire
- **Mettre en cache** les données statiques
- **Optimiser** les requêtes SQL

### 🔧 **Développement**
- **Utiliser** les validators express-validator
- **Gérer** toutes les erreurs proprement
- **Documenter** les nouveaux endpoints
- **Tester** toutes les nouvelles fonctionnalités

---

## 📝 **Conclusion**

**L'API Event Planner Auth est complètement documentée et prête à l'emploi.**

- ✅ **100%** des routes documentées
- ✅ **Exemples** fonctionnels pour chaque endpoint
- ✅ **Codes d'erreur** exhaustifs
- ✅ **Spécifications** techniques complètes

**Les développeurs peuvent intégrer cette API facilement.** 🚀

---

*Dernière mise à jour : $(date)*
