# 📋 Guide de Test Postman - Module People

## 🚀 Configuration Initiale

### 1. Variables d'Environnement
Configurez ces variables dans Postman :
- `baseUrl` : `http://localhost:3000` (ou votre URL de serveur)
- `authToken` : Token JWT avec permissions admin
- `userToken` : Token JWT avec permissions utilisateur standard

### 2. Démarrage du Serveur
```bash
npm run dev
```

## 🔓 Routes Publiques (Sans Authentification)

### Recherche de personnes
- **Endpoint** : `GET /api/people/search`
- **Paramètres** :
  - `page` : Numéro de page (défaut: 1)
  - `limit` : Nombre de résultats par page (1-100)
  - `search` : Terme de recherche (nom, prénom, email, téléphone)
  - `status` : Filtre par statut (active/inactive)

### Recherche par email (OTP)
- **Endpoint** : `GET /api/people/email/:email`
- **Usage** : Pour les flux OTP de vérification par email

### Recherche par téléphone (OTP)
- **Endpoint** : `GET /api/people/phone/:phone`
- **Usage** : Pour les flux OTP de vérification par téléphone

### Vérification d'existence
- **Endpoint** : `GET /api/people/:id/exists`
- **Retour** : `{ success: true, data: { exists: true/false } }`

## 🔒 Routes Protégées (Avec Authentification)

### Liste des personnes
- **Endpoint** : `GET /api/people`
- **Permissions requises** : `people.list`
- **Paramètres** : Mêmes que la recherche publique

### Statistiques
- **Endpoint** : `GET /api/people/stats`
- **Permissions requises** : `people.stats`
- **Retour** : `{ total, active, inactive }`

### Détails d'une personne
- **Endpoint** : `GET /api/people/:id`
- **Permissions requises** : `people.read`

## ➕ Création de Personnes

### Cas de Test Valides
1. **Création complète** : Tous les champs valides
2. **Création minimale** : Seulement les champs obligatoires
3. **Avec photo** : URL de photo valide

### Cas de Test Invalides
1. **Prénom manquant** : Erreur 400
2. **Nom manquant** : Erreur 400
3. **Email manquant** : Erreur 400
4. **Email invalide** : Erreur 400
5. **Téléphone invalide** : Erreur 400
6. **Statut invalide** : Erreur 400
7. **URL photo invalide** : Erreur 400
8. **Email déjà existant** : Erreur 409
9. **Téléphone déjà existant** : Erreur 409

## ✏️ Mise à Jour

### Cas de Test Valides
1. **Mise à jour complète** : Tous les champs
2. **Mise à jour partielle** : Uniquement certains champs
3. **Changement d'email** : Avec validation d'unicité

### Cas de Test Invalides
1. **Personne non trouvée** : ID inexistant
2. **Email déjà utilisé** : Conflit d'unicité
3. **Téléphone déjà utilisé** : Conflit d'unicité
4. **Données invalides** : Format incorrect

## 🔄 Changement de Statut

### Cas de Test Valides
1. **Activation** : `active`
2. **Désactivation** : `inactive`

### Cas de Test Invalides
1. **Statut invalide** : Valeur non autorisée
2. **Personne non trouvée** : ID inexistant

## 🗑️ Suppression (Soft Delete)

### Cas de Test Valides
1. **Suppression normale** : Personne sans utilisateur associé

### Cas de Test Invalides
1. **Personne non trouvée** : ID inexistant
2. **Personne associée** : A des utilisateurs liés
3. **Auto-suppression** : Supprimer son propre profil

## 🚫 Erreurs d'Authentification

### Cas de Test
1. **Pas de token** : Erreur 401
2. **Token invalide** : Erreur 401
3. **Token expiré** : Erreur 401
4. **Permissions insuffisantes** : Erreur 403

## 📊 Réponses Attendues

### Succès (200/201)
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { ... },
  "timestamp": "2024-01-14T01:00:00.000Z"
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
  "timestamp": "2024-01-14T01:00:00.000Z"
}
```

### Non trouvé (404)
```json
{
  "success": false,
  "message": "Personne non trouvée",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-14T01:00:00.000Z"
}
```

### Conflit (409)
```json
{
  "success": false,
  "message": "Cet email est déjà utilisé",
  "field": "email",
  "timestamp": "2024-01-14T01:00:00.000Z"
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
```

## 🎯 Scénarios de Test Complets

### Scénario 1 : Flux OTP Complet
1. Créer une personne
2. Rechercher par email (OTP)
3. Rechercher par téléphone (OTP)
4. Vérifier l'existence
5. Supprimer la personne

### Scénario 2 : Gestion Complète
1. Lister toutes les personnes
2. Créer une nouvelle personne
3. Mettre à jour la personne
4. Changer le statut
5. Récupérer les statistiques
6. Supprimer la personne

### Scénario 3 : Tests de Validation
1. Tester toutes les validations de création
2. Tester toutes les validations de mise à jour
3. Tester les erreurs d'authentification
4. Tester les erreurs de permissions

## 📝 Notes importantes

- **Soft Delete** : Les personnes supprimées ne sont pas vraiment supprimées
- **Audit** : Toutes les opérations sont tracées (created_by, updated_by, deleted_by)
- **Unicité** : Email et téléphone doivent être uniques
- **Pagination** : Maximum 100 résultats par page
- **Recherche** : Insensible à la casse (ILIKE)

## 🚀 Pour Aller Plus Loin

1. **Tests de charge** : Tester avec Postman Runner
2. **Tests d'intégration** : Avec d'autres modules
3. **Tests de sécurité** : Injection SQL, XSS, etc.
4. **Tests de performance** : Temps de réponse, mémoire
