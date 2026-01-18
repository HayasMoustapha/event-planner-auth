# 📮 Documentation Postman

Ce dossier contient les collections Postman, configurations et scripts de test pour l'API Event Planner Auth.

---

## 📋 **Fichiers Disponibles**

### 📮 **Collections**
- **`POSTMAN_README.md`** - Guide d'utilisation des collections
- **`../collections/Event-Planner-Complete-API.postman_collection.json`** - Collection complète
- **`../collections/Event-Planner-Auth-API.postman_collection.json`** - Collection authentification

### ⚙️ **Configuration**
- **`package.json`** - Dépendances Newman pour tests automatisés
- **`newman-config.json`** - Configuration d'exécution des tests
- **`run-tests.sh`** - Script d'exécution des tests Postman

### 🌐 **Environnements**
- **`../environments/Event-Planner-Complete-Environment.postman_environment.json`** - Variables d'environnement
- **`../environments/Event-Planner-Auth-Environment.postman_environment.json`** - Environnement auth

---

## 🚀 **Installation et Configuration**

### 📦 **Prérequis**
```bash
# Node.js 16+ requis
node --version

# Newman pour tests automatisés
npm install -g newman

# Postman Desktop (optionnel)
# Télécharger depuis https://www.postman.com/downloads/
```

### ⚙️ **Configuration**
```bash
# Importer les collections dans Postman
1. Ouvrir Postman Desktop
2. File → Import → Upload Files
3. Sélectionner les fichiers .postman_collection.json
4. Importer les environnements .postman_environment.json

# Configurer l'environnement
- baseUrl: http://localhost:3000 (développement)
- baseUrl: https://api.eventplanner.com (production)
```

---

## 📮 **Collections Disponibles**

### 🌐 **Collection Complète**
**Fichier**: `Event-Planner-Complete-API.postman_collection.json`

**Modules inclus**:
- 🔐 **Authentification** (7 endpoints)
- 👤 **Users** (6 endpoints)  
- 👥 **People** (5 endpoints)
- 👑 **Roles** (6 endpoints)
- 📋 **Menus** (5 endpoints)
- 🔑 **Permissions** (5 endpoints)
- 🔐 **Sessions** (3 endpoints)

**Total**: **37 endpoints** complets

### 🔐 **Collection Authentification**
**Fichier**: `Event-Planner-Auth-API.postman_collection.json`

**Endpoints inclus**:
- Inscription utilisateur
- Login avec récupération token
- Validation email OTP
- Refresh token
- Logout
- Profil utilisateur

---

## 🎯 **Utilisation des Collections**

### 🧪 **Tests Manuel (Postman Desktop)**
```bash
# 1. Importer la collection
File → Import → Event-Planner-Complete-API.postman_collection.json

# 2. Sélectionner l'environnement
En haut à droite → Event-Planner-Complete-Environment

# 3. Exécuter les tests dans l'ordre
1. Authentification (créer compte, login)
2. Users (créer, lister, modifier)
3. Roles (créer, lister, assigner permissions)
4. Menus (créer, lister, organiser)
```

### 🤖 **Tests Automatisés (Newman)**
```bash
# Exécuter tous les tests
./run-tests.sh

# Exécuter avec rapport détaillé
newman run collections/Event-Planner-Complete-API.postman_collection.json \
  -e environments/Event-Planner-Complete-Environment.postman_environment.json \
  -r html \
  --reporter-html-export reports/test-report.html

# Exécuter seulement les tests d'authentification
newman run collections/Event-Planner-Auth-API.postman_collection.json \
  -e environments/Event-Planner-Auth-Environment.postman_environment.json
```

---

## 🔧 **Variables d'Environnement**

### 🌐 **Variables Globales**
```json
{
  "baseUrl": "http://localhost:3000",
  "apiVersion": "v1",
  "timestamp": "{{$timestamp}}",
  "randomInt": "{{$randomInt}}",
  "randomEmail": "{{$randomEmail}}"
}
```

### 🔐 **Variables d'Authentification**
```json
{
  "userEmail": "email@exemple.com",
  "userPassword": "Password123",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "otpCode": "123456",
  "createdUserId": "123",
  "createdRoleId": "456"
}
```

---

## 📊 **Structure des Tests**

### 🧪 **Tests par Module**

#### 🔐 **Module Authentification**
```
1. POST /api/auth/register
   - Création compte utilisateur
   - Validation email automatique
   
2. POST /api/auth/login  
   - Connexion avec identifiants
   - Récupération tokens JWT
   
3. POST /api/auth/verify-email
   - Validation avec code OTP
   - Activation compte utilisateur
```

#### 👑 **Module Roles**
```
1. POST /api/roles
   - Création rôle avec label JSONB
   - Validation des permissions
   
2. GET /api/roles
   - Liste paginée des rôles
   - Filtres et recherche
   
3. PUT /api/roles/:id
   - Mise à jour rôle existant
   - Modification label et description
```

#### 📋 **Module Menus**
```
1. POST /api/menus
   - Création menu avec structure hiérarchique
   - Configuration composant et route
   
2. GET /api/menus
   - Liste organisée des menus
   - Pagination et filtres
```

### ✅ **Assertions de Tests**
```javascript
// Tests Postman inclus dans chaque requête
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('data');
});

pm.test("Valid JWT token", function () {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.token) {
        const token = jsonData.data.token;
        const parts = token.split('.');
        pm.expect(parts).to.have.lengthOf(3);
    }
});
```

---

## 🔄 **Scripts Postman**

### 🔐 **Scripts de Pré-requête**
```javascript
// Génération de données de test
if (!pm.environment.get("userEmail")) {
    pm.environment.set("userEmail", `test${pm.variables.replaceIn("{{$randomInt}}")}@example.com`);
}

// Timestamp pour unicité
pm.environment.set("timestamp", Date.now());

// Headers d'authentification
if (pm.environment.get("accessToken")) {
    pm.request.headers.add({
        key: "Authorization",
        value: `Bearer ${pm.environment.get("accessToken")}`
    });
}
```

### 📊 **Scripts de Post-requête**
```javascript
// Extraction des tokens
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.token) {
        pm.environment.set("accessToken", jsonData.data.token);
    }
    if (jsonData.data && jsonData.data.refreshToken) {
        pm.environment.set("refreshToken", jsonData.data.refreshToken);
    }
}

// Sauvegarde IDs créés
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.id) {
        pm.environment.set("createdUserId", jsonData.data.id);
    }
}
```

---

## 📈 **Rapports de Tests**

### 📊 **Génération de Rapports**
```bash
# Rapport HTML détaillé
newman run collections/Event-Planner-Complete-API.postman_collection.json \
  -e environments/Event-Planner-Complete-Environment.postman_environment.json \
  -r html \
  --reporter-html-export reports/complete-api-report.html

# Rapport JSON pour CI/CD
newman run collections/Event-Planner-Complete-API.postman_collection.json \
  -e environments/Event-Planner-Complete-Environment.postman_environment.json \
  -r json \
  --reporter-json-export reports/complete-api-report.json

# Rapport JUnit pour intégration CI
newman run collections/Event-Planner-Complete-API.postman_collection.json \
  -e environments/Event-Planner-Complete-Environment.postman_environment.json \
  -r junit \
  --reporter-junit-export reports/junit-results.xml
```

### 📋 **Analyse des Résultats**
```bash
# Statistiques de succès/échec
grep -c "PASS" reports/complete-api-report.html
grep -c "FAIL" reports/complete-api-report.html

# Temps de réponse moyen
grep "responseTime" reports/complete-api-report.json | awk '{sum+=$2} END {print sum/NR}'
```

---

## 🛠️ **Dépannage**

### 🔧 **Problèmes Communs**
```bash
# Erreur de connexion
vérifier que le serveur est démarré sur le bon port
curl -I http://localhost:3000/api/health

# Variables non définies  
exécuter les requêtes dans l'ordre pour initialiser les variables
POST /api/auth/register → génère userEmail
POST /api/auth/login → génère accessToken

# Erreur de validation
vérifier le corps de la requête correspond au validator
voir la réponse pour les messages d'erreur spécifiques
```

### 📝 **Logs et Debug**
```bash
# Mode verbeux Newman
newman run ... --verbose

# Logs du serveur
npm start 2>&1 | tee server.log

# Tests avec curl pour debug
curl -v -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

---

## 🎯 **Bonnes Pratiques**

### 🧪 **Testing**
- **Exécuter** les tests dans l'ordre logique
- **Vérifier** les variables d'environnement avant chaque test
- **Utiliser** les assertions pour valider les réponses
- **Générer** des rapports pour suivi

### 🔧 **Maintenance**
- **Mettre à jour** les collections lors de modifications API
- **Versionner** les collections avec Git
- **Documenter** les nouveaux scénarios de test
- **Automatiser** les tests récurrents

### 🌐 **CI/CD**
```yaml
# Exemple GitHub Actions
- name: Run Postman Tests
  run: |
    npm install -g newman
    newman run postman/collections/Event-Planner-Complete-API.postman_collection.json \
      -e postman/environments/Event-Planner-Complete-Environment.postman_environment.json \
      -r junit \
      --reporter-junit-export reports/junit.xml
```

---

## 📝 **Conclusion**

**Les collections Postman sont complètes et synchronisées avec le backend.**

- ✅ **37 endpoints** testés et documentés
- ✅ **Zero mismatch** entre Postman et l'API
- ✅ **Tests automatisés** avec Newman
- ✅ **Rapports détaillés** disponibles

**Prêtes pour le développement et les tests d'intégration.** 🚀

---

*Dernière mise à jour : $(date)*
