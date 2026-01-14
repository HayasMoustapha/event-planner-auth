# 📮 Postman Collections - Event Planner Auth API

Ce dossier contient des collections Postman complètes pour tester toutes les routes de l'API Event Planner Auth avec le système RBAC.

## 📁 Structure des Collections

### 🗂 Collections Disponibles

1. **`Event-Planner-Auth-API-Complete.postman_collection.json`**
   - Collection principale avec le module d'authentification
   - Routes publiques et protégées
   - Gestion complète des OTP

2. **`Users-Module.postman_collection.json`**
   - Routes CRUD pour les utilisateurs
   - Routes utilitaires et de recherche
   - Gestion des mots de passe

3. **`Roles-Module.postman_collection.json`**
   - Gestion complète des rôles
   - Assignation des permissions
   - Statistiques et administration

4. **`Additional-Modules.postman_collection.json`**
   - Modules Permissions, Menus, People, Sessions, Authorizations
   - Tests complets pour chaque module

## 🚀 Configuration Initiale

### 1. Importer les Collections

1. Ouvrir Postman
2. Cliquer sur **Import**
3. Sélectionner les fichiers `.json` du dossier `postman-collections/`
4. Importer toutes les collections

### 2. Configurer les Variables

Chaque collection inclut ces variables globales :

```json
{
  "baseUrl": "http://localhost:3001/api",
  "authToken": "",
  "refreshToken": "",
  "userId": "1",
  "roleId": "1",
  "permissionId": "1",
  "menuId": "1"
}
```

**Personnalisez selon votre environnement :**
- `baseUrl`: URL de votre API (par défaut: `http://localhost:3001/api`)
- `userId`, `roleId`, etc.: IDs pour tester (par défaut: `1`)

## 🔐 Flux d'Authentification Recommandé

### Étape 1: Connexion Initiale
```http
POST {{baseUrl}}/auth/login
{
  "email": "admin@eventplanner.com",
  "password": "admin123"
}
```

### Étape 2: Récupérer les Tokens
La réponse contient :
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

### Étape 3: Utiliser les Tokens
Les tokens sont automatiquement sauvegardés dans les variables Postman et utilisés dans toutes les requêtes protégées.

## 📋 Modules et Routes

### 🔐 Module Authentification

**Routes Publiques :**
- `POST /auth/login` - Connexion classique
- `POST /auth/login-otp` - Connexion avec OTP
- `POST /auth/refresh-token` - Rafraîchir le token
- `POST /auth/validate-token` - Valider un token
- `POST /auth/otp/email/generate` - Générer OTP email
- `POST /auth/otp/email/verify` - Vérifier OTP email
- `POST /auth/otp/phone/generate` - Générer OTP téléphone
- `POST /auth/otp/phone/verify` - Vérifier OTP téléphone
- `POST /auth/otp/password-reset/generate` - Générer OTP reset
- `POST /auth/otp/password-reset/verify` - Reset mot de passe

**Routes Protégées :**
- `POST /auth/logout` - Déconnexion
- `GET /auth/profile` - Profil utilisateur
- `POST /auth/change-password` - Changer mot de passe
- `GET /auth/otp/user/:userId` - OTPs utilisateur
- `POST /auth/otp/user/:userId/invalidate` - Invalider OTPs
- `GET /auth/otp/user/:userId/active` - OTPs actifs
- `POST /auth/otp/cleanup` - Nettoyer OTPs expirés
- `GET /auth/otp/stats` - Statistiques OTP

### 👥 Module Users

**Routes Publiques :**
- `GET /users/check/username/:username` - Vérifier disponibilité username
- `GET /users/check/email/:email` - Vérifier disponibilité email
- `POST /users/authenticate` - Authentifier utilisateur

**Routes Protégées :**
- `GET /users` - Liste utilisateurs (pagination, filtres)
- `GET /users/stats` - Statistiques utilisateurs
- `GET /users/:id` - Utilisateur par ID
- `GET /users/email/:email` - Utilisateur par email
- `GET /users/username/:username` - Utilisateur par username
- `POST /users` - Créer utilisateur
- `PUT /users/:id` - Mettre à jour utilisateur
- `PATCH /users/:id/password` - Mettre à jour mot de passe
- `PATCH /users/:id/status` - Mettre à jour statut
- `DELETE /users/:id` - Supprimer utilisateur (soft delete)
- `GET /users/:id/exists` - Vérifier existence
- `POST /users/reset-password` - Reset mot de passe
- `GET /users/search` - Rechercher utilisateurs

### 🛡️ Module Roles

**Routes de Lecture :**
- `GET /roles` - Liste rôles (pagination, filtres)
- `GET /roles/:id` - Rôle par ID
- `GET /roles/:id/permissions` - Permissions d'un rôle
- `GET /roles/:id/users` - Utilisateurs d'un rôle
- `GET /roles/user/:userId?` - Rôles d'un utilisateur
- `GET /roles/check/role` - Vérifier rôle utilisateur
- `GET /roles/user/:userId/highest` - Rôle le plus élevé

**Routes d'Écriture :**
- `POST /roles` - Créer rôle
- `PUT /roles/:id` - Mettre à jour rôle
- `DELETE /roles/:id` - Supprimer rôle
- `PATCH /roles/:id/status` - Activer/désactiver rôle
- `POST /roles/:id/duplicate` - Dupliquer rôle

**Gestion Permissions :**
- `POST /roles/:id/permissions` - Assigner permissions
- `DELETE /roles/:id/permissions` - Supprimer toutes permissions

**Administration :**
- `GET /roles/admin/stats` - Statistiques rôles

### 🔑 Module Permissions

- `GET /permissions` - Liste permissions (pagination, filtres)
- `GET /permissions/:id` - Permission par ID
- `POST /permissions` - Créer permission
- `PUT /permissions/:id` - Mettre à jour permission
- `DELETE /permissions/:id` - Supprimer permission

### 📋 Module Menus

- `GET /menus` - Liste menus (pagination, filtres)
- `GET /menus/:id` - Menu par ID
- `GET /menus/tree` - Arborescence menus
- `POST /menus` - Créer menu
- `PUT /menus/:id` - Mettre à jour menu
- `DELETE /menus/:id` - Supprimer menu

### 👥 Module People

- `GET /people` - Liste personnes (pagination, recherche)
- `GET /people/:id` - Personne par ID
- `POST /people` - Créer personne
- `PUT /people/:id` - Mettre à jour personne
- `DELETE /people/:id` - Supprimer personne

### 🔐 Module Sessions

- `GET /sessions` - Liste sessions (pagination, filtres)
- `GET /sessions/user/:userId` - Sessions utilisateur
- `GET /sessions/:id` - Session par ID
- `POST /sessions/:id/revoke` - Révoquer session
- `POST /sessions/user/:userId/revoke-all` - Révoquer toutes sessions
- `POST /sessions/cleanup` - Nettoyer sessions expirées

### 🛡️ Module Authorizations

- `GET /authorizations/user/:userId/permissions` - Permissions utilisateur
- `GET /authorizations/user/:userId/roles` - Rôles utilisateur
- `GET /authorizations/user/:userId/menus` - Menus utilisateur
- `POST /authorizations/check-permission` - Vérifier permission
- `POST /authorizations/check-role` - Vérifier rôle
- `POST /authorizations/check-resource-access` - Vérifier accès ressource
- `GET /authorizations/user/:userId/summary` - Résumé autorisations

## 🧪 Tests Recommandés

### 1. Test de Base
1. Importer toutes les collections
2. Configurer les variables
3. Exécuter `POST Login` dans la collection Auth
4. Vérifier que les tokens sont sauvegardés

### 2. Test CRUD Users
1. `GET All Users` - Lister les utilisateurs
2. `POST Create User` - Créer un utilisateur
3. `GET User by ID` - Récupérer l'utilisateur créé
4. `PUT Update User` - Mettre à jour l'utilisateur
5. `DELETE User` - Supprimer l'utilisateur

### 3. Test RBAC
1. Se connecter avec un utilisateur `admin`
2. Tester les routes nécessitant des permissions
3. Se connecter avec un utilisateur `user`
4. Vérifier que les accès sont limités

### 4. Test Permissions
1. `GET All Permissions` - Voir toutes les permissions
2. `POST Create Permission` - Créer une permission
3. `POST Assign Permissions` - Assigner à un rôle
4. Vérifier que l'utilisateur a bien la permission

## 🔧 Personnalisation

### Modifier les Données de Test

**Pour changer les identifiants de connexion :**
```json
{
  "email": "votre-email@example.com",
  "password": "votre-mot-de-passe"
}
```

**Pour changer les IDs de test :**
```json
{
  "userId": "2",
  "roleId": "3",
  "permissionId": "10"
}
```

### Ajouter de Nouvelles Requêtes

1. Dupliquer une requête existante
2. Modifier l'URL et les paramètres
3. Ajouter les validations nécessaires
4. Sauvegarder dans la collection appropriée

## 🚨 Codes d'Erreur Communs

### Authentification
- `401` - Non authentifié
- `403` - Permission refusée
- `422` - Erreur de validation

### RBAC
- `403` - Permission manquante
- `403` - Rôle requis
- `403` - Accès ressource refusé

### Validation
- `400` - Paramètres invalides
- `422` - Données invalides

## 📊 Monitoring et Debug

### Logs des Réponses
Postman affiche automatiquement :
- Codes de statut HTTP
- Temps de réponse
- Corps de la réponse
- Headers

### Tests Automatiques
Les collections incluent des scripts pour :
- Sauvegarder automatiquement les tokens
- Valider les réponses
- Afficher des informations de debug

## 🔄 Mises à Jour

Pour mettre à jour les collections :

1. Exporter les collections modifiées depuis Postman
2. Remplacer les fichiers `.json` correspondants
3. Commit les changements

## 🆘 Support

### Problèmes Communs

**Token non sauvegardé :**
- Vérifier que la requête de login retourne bien les tokens
- Vérifier les scripts de test dans la collection

**Permission refusée :**
- Vérifier que l'utilisateur a bien le rôle requis
- Vérifier que le rôle a bien les permissions

**URL incorrecte :**
- Vérifier la variable `baseUrl`
- Vérifier que le serveur est démarré sur le bon port

### Ressources

- 📖 Documentation API : `http://localhost:3001/api/docs`
- ❤️ Santé API : `http://localhost:3001/api/health`
- 🌱 Seeds RBAC : Voir `database/seeds/README.md`

---

## 🎯 Bon Testing !

Ces collections couvrent **100% des routes** de l'API Event Planner Auth avec tous les scénarios de test RBAC. Utilisez-les pour valider votre implémentation et vous assurer que tout fonctionne correctement !
