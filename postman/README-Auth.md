# 📚 Collection Postman - Module d'Authentification

## 🎯 Vue d'ensemble

Cette collection Postman complète permet de tester toutes les fonctionnalités du module d'authentification avec OTP, login sécurisé, et gestion des tokens JWT.

## 📁 Structure des Collections

### 📦 **Auth Module.postman_collection.json**
Routes publiques d'authentification et gestion des OTP

### 📦 **Auth Module Part 2.postman_collection.json**
Routes protégées, administration et scénarios d'erreur

## 🔧 Configuration Requise

### Variables d'Environnement

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `baseUrl` | `http://localhost:3000` | URL de base de l'API |
| `testEmail` | Auto-généré | Email de test pour les requêtes |
| `testPhone` | Auto-généré | Téléphone de test pour les requêtes |
| `testPassword` | `TestPassword123!` | Mot de passe de test |
| `authToken` | Auto-rempli | Token JWT d'authentification |
| `refreshToken` | Auto-rempli | Token de rafraîchissement |
| `userId` | `1` | ID utilisateur pour les tests admin |

### Variables Auto-générées

Les variables suivantes sont générées automatiquement :
- `testEmail`: `test.user{random}@example.com`
- `testPhone`: `+336{random}`

## 🚀 Guide d'Utilisation

### 1. **Importation des Collections**

1. Ouvrir Postman
2. Cliquer sur "Import"
3. Sélectionner les deux fichiers de collection
4. Importer également l'environnement de test

### 2. **Configuration Initiale**

1. Créer un nouvel environnement dans Postman
2. Ajouter les variables requises
3. Configurer `baseUrl` selon votre serveur

### 3. **Ordre de Test Recommandé**

#### 🟢 **Phase 1: Tests de Base**
1. `POST /api/auth/login` - Connexion classique
2. `GET /api/auth/profile` - Vérifier le profil
3. `POST /api/auth/logout` - Déconnexion

#### 🟡 **Phase 2: Tests OTP**
1. `POST /api/auth/otp/email/generate` - Générer OTP email
2. `POST /api/auth/otp/email/verify` - Vérifier OTP email
3. `POST /api/auth/login-otp` - Connexion avec OTP

#### 🔵 **Phase 3: Tests Avancés**
1. `POST /api/auth/refresh-token` - Rafraîchir token
2. `POST /api/auth/change-password` - Changer mot de passe
3. `POST /api/auth/otp/password-reset/generate` - Réinitialiser mot de passe

#### 🟣 **Phase 4: Tests d'Administration**
1. `GET /api/auth/otp/user/:userId` - Voir OTP utilisateur
2. `POST /api/auth/otp/user/:userId/invalidate` - Invalider OTP
3. `GET /api/auth/otp/stats` - Statistiques OTP

#### 🔴 **Phase 5: Tests d'Erreur**
1. Connexions avec identifiants invalides
2. Accès aux routes protégées sans token
3. Validation des erreurs de format

## 📋 Scénarios de Test Détaillés

### 🔓 **Authentication Publique**

#### Login Classique
```json
POST /api/auth/login
{
  "email": "test.user1234@example.com",
  "password": "TestPassword123!"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {...},
    "token": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

#### Login avec OTP
```json
POST /api/auth/login-otp
{
  "identifier": "test.user1234@example.com",
  "code": "123456",
  "type": "email"
}
```

### 🔐 **Génération OTP**

#### OTP Email
```json
POST /api/auth/otp/email/generate
{
  "email": "test.user1234@example.com",
  "expiresInMinutes": 15
}
```

#### OTP Téléphone
```json
POST /api/auth/otp/phone/generate
{
  "phone": "+33612345678",
  "expiresInMinutes": 15
}
```

### ✅ **Vérification OTP**

#### Vérifier Email OTP
```json
POST /api/auth/otp/email/verify
{
  "email": "test.user1234@example.com",
  "code": "123456"
}
```

### 🔒 **Routes Protégées**

#### Profil Utilisateur
```http
GET /api/auth/profile
Authorization: Bearer {{authToken}}
```

#### Changer Mot de Passe
```json
POST /api/auth/change-password
{
  "currentPassword": "TestPassword123!",
  "newPassword": "NewPassword123!"
}
```

### 👮 **Administration OTP**

#### OTP d'un Utilisateur
```http
GET /api/auth/otp/user/1?type=email
Authorization: Bearer {{authToken}}
```

#### Invalider OTP
```json
POST /api/auth/otp/user/1/invalidate
{
  "type": "email"
}
```

## 🧪 Tests d'Erreur

### Scénarios Couverts

1. **Email invalide**: Format incorrect
2. **Mot de passe incorrect**: Mauvais identifiants
3. **Champs manquants**: Validation requise
4. **OTP invalide**: Code incorrect ou expiré
5. **Token manquant**: Accès non authentifié
6. **Token invalide**: Token corrompu ou expiré

### Codes d'Erreur Attendus

| Code HTTP | Description | Scénario |
|-----------|-------------|-----------|
| 400 | Bad Request | Validation des entrées |
| 401 | Unauthorized | Token invalide/expiré |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource inexistante |
| 422 | Unprocessable Entity | Erreurs de validation |
| 429 | Too Many Requests | Rate limiting |

## 🔄 Workflows de Test

### Workflow 1: Login Classique
1. Générer un utilisateur de test
2. Se connecter avec email/mot de passe
3. Sauvegarder le token
4. Accéder au profil
5. Se déconnecter

### Workflow 2: Login OTP
1. Générer un OTP email
2. Vérifier l'OTP
3. Se connecter avec OTP
4. Accéder au profil
5. Changer le mot de passe

### Workflow 3: Réinitialisation Mot de Passe
1. Générer OTP de réinitialisation
2. Réinitialiser le mot de passe
3. Se connecter avec nouveau mot de passe

### Workflow 4: Administration
1. Se connecter comme admin
2. Voir les OTP d'un utilisateur
3. Invalider les OTP
4. Consulter les statistiques

## 📊 Monitoring et Logs

### Scripts Automatiques

Les collections incluent des scripts pour:

- **Génération automatique** de données de test
- **Sauvegarde automatique** des tokens
- **Validation des réponses**
- **Logging détaillé** dans la console Postman

### Logs Disponibles

- 📧 Email de test utilisé
- 📱 Téléphone de test utilisé
- 🔐 Token JWT sauvegardé
- 📊 Statut de chaque réponse
- 📝 Corps des réponses

## 🛡️ Sécurité Testée

### Fonctionnalités de Sécurité

1. **OTP expirables**: Durée de validité limitée
2. **Usage unique**: OTP marqués comme utilisés
3. **Rate limiting**: Limites de tentatives
4. **Tokens JWT**: Signature et expiration
5. **Validation stricte**: Formats et longueurs
6. **Audit trail**: Traçabilité complète

### Tests de Sécurité

- Tentatives de connexion multiples
- Tokens expirés ou invalides
- OTP réutilisés ou expirés
- Accès non autorisé
- Injection de données malveillantes

## 🚨 Dépannage

### Problèmes Communs

1. **Token non sauvegardé**: Vérifier la réponse du login
2. **Permission refusée**: Utiliser un compte admin pour les routes d'admin
3. **OTP invalide**: Vérifier le code dans la console du serveur
4. **Variables manquantes**: Rafraîchir l'environnement Postman

### Solutions

1. **Réinitialiser l'environnement**: Supprimer et recréer les variables
2. **Vérifier le serveur**: Assurer que le serveur est démarré
3. **Logs du serveur**: Consulter les logs pour les codes OTP
4. **Mode debug**: Activer les logs détaillés dans Postman

## 📝 Notes Importantes

- Les **tokens sont automatiquement sauvegardés** après une connexion réussie
- Les **données de test sont générées** aléatoirement à chaque exécution
- Les **scénarios d'erreur** sont inclus pour valider la robustesse
- Les **routes d'administration** nécessitent des permissions spécifiques
- Les **OTP sont affichés dans la console** du serveur pour les tests

## 🎯 Prochaines Étapes

1. **Exécuter tous les scénarios de test**
2. **Valider les réponses attendues**
3. **Tester les cas limites**
4. **Vérifier la gestion des erreurs**
5. **Documenter les résultats**

---

**📞 Support**: Pour toute question sur l'utilisation de cette collection, consultez les logs Postman ou contactez l'équipe de développement.
