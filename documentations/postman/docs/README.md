# 📮 Postman Collection - Event Planner Auth API

## 🚀 Installation et Configuration

### 1. Importer la Collection

1. Ouvrir Postman
2. Cliquer sur **Import** dans le coin supérieur gauche
3. Sélectionner le fichier `Event-Planner-Auth-API.postman_collection.json`
4. Valider l'import

### 2. Importer l'Environnement

1. Dans Postman, cliquer sur **Import**
2. Sélectionner le fichier `Event-Planner-Auth-Environment.postman_environment.json`
3. Dans le sélecteur d'environnement (en haut à droite), choisir **Event Planner Auth - Environment**

### 3. Variables d'Environnement

L'environnement contient les variables suivantes :

- `baseUrl`: URL de base de l'API (http://localhost:3000)
- `authToken`: Token JWT d'authentification (rempli automatiquement)
- `userEmail`: Email de l'utilisateur (rempli automatiquement)
- `otpCode`: Code OTP pour la vérification (à saisir manuellement)
- `timestamp`: Timestamp unique pour éviter les doublons

## 📋 Flux d'Utilisation Complet

### 🏃‍♂️ Test Rapide (Compte Admin)

1. **Login Standard** dans le dossier `🔐 Authentification`
   - Email: `admin@example.com`
   - Password: `Admin123!`
   - Le token sera automatiquement sauvegardé

### 📝 Flux d'Inscription Complet

1. **Vérifier disponibilité Email**
   - Remplacer `{{userEmail}}` par l'email désiré
   - Ex: `test@example.com`

2. **Vérifier disponibilité Username**
   - Remplacer `testuser123` par le username désiré

3. **Inscription (Register)**
   - Les données utilisent `{{timestamp}}` pour éviter les doublons
   - L'email sera automatiquement sauvegardé dans `{{userEmail}}`

4. **Récupérer le code OTP**
   - Le code est affiché dans la console du serveur
   - Saisir ce code dans la variable `otpCode` de l'environnement

5. **Vérifier Email avec OTP**
   - Utiliser l'email sauvegardé et le code OTP saisi

6. **Login (après vérification)**
   - Le token JWT sera automatiquement sauvegardé

## 🔧 Variables Automatiques

### Scripts Postman

Les requêtes suivantes mettent à jour automatiquement les variables :

- **Inscription**: Sauvegarde `userEmail` et `userId`
- **Login**: Sauvegarde `authToken`

### Variables à Saisir Manuellement

- `otpCode`: Code OTP reçu par email (visible dans les logs du serveur)

## 📁 Structure des Dossiers

### 🏠 Health & Status
- Vérification de l'état de l'API

### 📝 Inscription
- Flux complet d'inscription avec vérification OTP

### 🔐 Authentification
- Login, validation de token, rafraîchissement, logout

### 👤 Profil Utilisateur
- Accès au profil et changement de mot de passe

### 🔢 OTP Management
- Gestion complète des OTP (email, téléphone, réinitialisation)

### 👥 Gestion Utilisateurs
- CRUD sur les utilisateurs (nécessite authentification)

### 👥 Gestion People
- CRUD sur les personnes (nécessite authentification)

## 🛠️ Personnalisation

### Modifier l'URL de base

1. Aller dans l'environnement **Event Planner Auth - Environment**
2. Modifier la valeur de `baseUrl`
3. Cliquer sur **Save**

### Ajouter de nouvelles requêtes

1. Dupliquer une requête existante
2. Modifier l'URL et les paramètres
3. Utiliser les variables d'environnement avec la syntaxe `{{variableName}}`

## 🐛 Débogage

### Vérifier les variables

1. Cliquer sur l'icône 🧮 (Variables rapides) en bas
2. Vérifier les valeurs actuelles des variables

### Logs du serveur

Les codes OTP sont affichés dans les logs du serveur :
```bash
npm run dev
```

### Erreurs communes

- **401 Unauthorized**: Token invalide ou expiré
- **403 Forbidden**: Permissions insuffisantes
- **422 Validation Error**: Données invalides
- **404 Not Found**: Ressource inexistante

## 📞 Support

Pour toute question sur l'utilisation de cette collection :
1. Vérifier les logs du serveur
2. Consulter la documentation API
3. Vérifier les variables d'environnement

---

**Note**: Cette collection est conçue pour fonctionner avec l'API Event Planner Auth en local sur le port 3000.
