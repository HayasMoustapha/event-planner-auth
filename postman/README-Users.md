# 📋 Guide de Test Postman - Module Users

## 🚀 Configuration Initiale

### 1. Variables d'Environnement
Configurez ces variables dans Postman :
- `baseUrl` : `http://localhost:3000` (ou votre URL de serveur)
- `authToken` : Token JWT avec permissions admin
- `userToken` : Token JWT avec permissions utilisateur standard
- `testEmail` : Email de test (ex: `test@example.com`)
- `testPassword` : Mot de passe de test (ex: `Password123!`)
- `testUsername` : Username de test (ex: `testuser`)
- `testUserId` : ID d'utilisateur pour les tests

### 2. Démarrage du Serveur
```bash
npm run dev
```

## 🔓 Routes Publiques (Sans Authentification)

### Authentification
- **Endpoint** : `POST /api/users/authenticate`
- **Corps** : `{ "email": "test@example.com", "password": "Password123!" }`
- **Retour** : Token JWT et données utilisateur (sans mot de passe)

### Vérification de disponibilité
- **Email** : `GET /api/users/check/email/test@example.com`
- **Username** : `GET /api/users/check/username/testuser`
- **Retour** : `{ "available": true/false }`

## 🔒 Routes Protégées (Avec Authentification)

### Gestion des Utilisateurs
- **Liste** : `GET /api/users?page=1&limit=10&search=test&status=active&role=user`
- **Statistiques** : `GET /api/users/stats`
- **Détails** : `GET /api/users/:id`
- **Recherche par email** : `GET /api/users/email/:email`
- **Recherche par username** : `GET /api/users/username/:username`
- **Existence** : `GET /api/users/:id/exists`

### Opérations CRUD
- **Création** : `POST /api/users`
- **Mise à jour** : `PUT /api/users/:id`
- **Suppression** : `DELETE /api/users/:id` (soft delete)

### Gestion des Mots de Passe
- **Changement** : `PATCH /api/users/:id/password`
  - Corps : `{ "currentPassword": "ancien", "newPassword": "nouveau" }`
- **Réinitialisation** : `POST /api/users/reset-password`
  - Corps : `{ "email": "test@example.com", "newPassword": "nouveau" }`

### Gestion des Statuts
- **Changement** : `PATCH /api/users/:id/status`
  - Corps : `{ "status": "active|inactive|locked" }`

## 🎯 Cas de Test

### ✅ Tests Positifs

#### Authentification
1. **Connexion valide** : Email et mot de passe corrects
2. **Token généré** : Vérifier la présence du token JWT
3. **Données utilisateur** : Vérifier l'absence du mot de passe

#### Création
1. **Création complète** : Tous les champs valides
2. **Données uniques** : Email et username non utilisés
3. **Mot de passe fort** : 8+ caractères, majuscule, minuscule, chiffre
4. **Rôle par défaut** : `user` si non spécifié

#### Mise à jour
1. **Mise à jour partielle** : Uniquement certains champs
2. **Changement de mot de passe** : Avec vérification de l'ancien
3. **Changement de statut** : Activation/désactivation/verrouillage

#### Recherche
1. **Pagination** : Vérifier les métadonnées de pagination
2. **Filtres** : Par statut, rôle, terme de recherche
3. **Tri** : Par date de création (décroissant)

### ❌ Tests Négatifs

#### Authentification
1. **Email invalide** : Format incorrect
2. **Mot de passe incorrect** : Mauvais mot de passe
3. **Compte inexistant** : Email non trouvé
4. **Compte désactivé** : Status `inactive`
5. **Compte verrouillé** : Status `locked`

#### Création
1. **Champs manquants** : Username, email ou password
2. **Email invalide** : Format incorrect
3. **Username invalide** : Moins de 3 caractères ou caractères spéciaux
4. **Mot de passe faible** : Moins de 8 caractères, pas de majuscule/minuscule/chiffre
5. **Email déjà utilisé** : Conflit d'unicité
6. **Username déjà utilisé** : Conflit d'unicité
7. **Rôle invalide** : Valeur non autorisée
8. **Statut invalide** : Valeur non autorisée

#### Mise à jour
1. **ID invalide** : Non numérique ou négatif
2. **Utilisateur non trouvé** : ID inexistant
3. **Email déjà utilisé** : Conflit avec autre utilisateur
4. **Username déjà utilisé** : Conflit avec autre utilisateur
5. **Mot de passe déjà utilisé** : Dans l'historique récent
6. **Ancien mot de passe incorrect** : Pour changement de mot de passe

#### Suppression
1. **Auto-suppression** : Supprimer son propre compte
2. **ID inexistant** : Utilisateur non trouvé
3. **Permissions insuffisantes** : Pas le droit de supprimer

#### Changement de statut
1. **Auto-verrouillage** : Verrouiller son propre compte
2. **Statut invalide** : Valeur non autorisée
3. **ID inexistant** : Utilisateur non trouvé

## 📊 Réponses Attendues

### Succès (200/201)
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { ... },
  "timestamp": "2024-01-14T02:00:00.000Z"
}
```

### Erreur de Validation (400)
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "field": "email",
      "message": "Format d'email invalide",
      "value": "invalid-email"
    }
  ],
  "timestamp": "2024-01-14T02:00:00.000Z"
}
```

### Non trouvé (404)
```json
{
  "success": false,
  "message": "Utilisateur non trouvé",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-14T02:00:00.000Z"
}
```

### Conflit (409)
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé",
  "field": "email",
  "timestamp": "2024-01-14T02:00:00.000Z"
}
```

### Non autorisé (401)
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect",
  "code": "AUTHENTICATION_FAILED",
  "timestamp": "2024-01-14T02:00:00.000Z"
}
```

### Interdit (403)
```json
{
  "success": false,
  "message": "Permission refusée",
  "code": "PERMISSION_DENIED",
  "timestamp": "2024-01-14T02:00:00.000Z"
}
```

## 🔧 Scripts de Test Automatisés

### Script de Test pour les Réponses
```javascript
// Dans l'onglet Tests de Postman
pm.test("Status code is correct", function () {
    if (pm.response.code >= 200 && pm.response.code < 300) {
        pm.expect(pm.response.code).to.be.oneOf([200, 201]);
    } else {
        pm.expect(pm.response.code).to.be.oneOf([400, 401, 403, 404, 409, 500]);
    }
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('timestamp');
});

pm.test("Success response has data", function () {
    const jsonData = pm.response.json();
    if (jsonData.success) {
        pm.expect(jsonData).to.have.property('data');
    }
});

pm.test("Password never returned", function () {
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.data) {
        pm.expect(jsonData.data).to.not.have.property('password_hash');
        pm.expect(jsonData.data).to.not.have.property('password');
    }
});
```

## 🎯 Scénarios de Test Complets

### Scénario 1 : Cycle de Vie Complet
1. Vérifier disponibilité email/username
2. Créer un utilisateur
3. S'authentifier avec le nouvel utilisateur
4. Récupérer les détails de l'utilisateur
5. Mettre à jour le profil
6. Changer le mot de passe
7. Mettre à jour le statut
8. Supprimer l'utilisateur

### Scénario 2 : Tests de Sécurité
1. Tentatives d'authentification avec mauvais mot de passe
2. Tentatives de création avec email existant
3. Tentatives de suppression de son propre compte
4. Tentatives de verrouillage de son propre compte
5. Tentatives de changement de mot de passe sans ancien mot de passe

### Scénario 3 : Tests de Validation
1. Tester toutes les validations de création
2. Tester toutes les validations de mise à jour
3. Tester les erreurs d'authentification
4. Tester les erreurs de permissions

## 📝 Notes importantes

- **Soft Delete** : Les utilisateurs supprimés ne sont pas vraiment supprimés
- **Hashage** : Les mots de passe sont hashés avec bcrypt (12 rounds)
- **Historique** : Les 5 derniers mots de passe sont conservés
- **Audit** : Toutes les opérations sont tracées (created_by, updated_by, deleted_by)
- **Unicité** : Email et username doivent être uniques
- **Pagination** : Maximum 100 résultats par page
- **Recherche** : Insensible à la casse (ILIKE)
- **Sécurité** : Le mot de passe n'est jamais retourné dans les réponses

## 🚀 Pour Aller Plus Loin

1. **Tests de charge** : Tester avec Postman Runner
2. **Tests d'intégration** : Avec d'autres modules
3. **Tests de sécurité** : Injection SQL, XSS, etc.
4. **Tests de performance** : Temps de réponse, mémoire
