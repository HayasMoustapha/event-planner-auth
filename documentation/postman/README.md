# 📮 Postman Collections - Event Planner Auth API

## 📁 Structure du Dossier

```
postman/
├── collections/                    # Collections Postman
│   ├── Event-Planner-Auth-API.postman_collection.json
│   └── Event-Planner-Complete-API.postman_collection.json
├── environments/                  # Environnements Postman
│   └── Event-Planner-Complete-Environment.postman_environment.json
├── tests/                        # Tests automatisés
│   └── automated-tests.postman_collection.json
└── docs/                         # Documentation
    └── README.md                  # Guide d'utilisation détaillé
```

## 🚀 Collections Disponibles

### 1. Event-Planner-Auth-API
Collection **originale** avec les fonctionnalités de base :
- 🏠 Health & Status
- 📝 Inscription
- 🔐 Authentification  
- 👤 Profil Utilisateur
- 🔢 OTP Management
- 👥 Gestion Utilisateurs
- 👥 Gestion People

### 2. Event-Planner-Complete-API ⭐
Collection **complète** avec TOUS les modules :
- 🏠 Health & System
- 🔐 Authentification (complet)
- 🔢 OTP Management (complet)
- 👥 Users Management (CRUD complet)
- 👥 People Management (CRUD complet)
- 🔐 Roles Management (CRUD complet)
- 🔑 Permissions Management (CRUD complet)
- 📋 Menus Management (CRUD complet)
- 🛡️ RBAC Management (autorisations)
- 🧪 Tests & Validation

### 3. Automated Tests
Collection de **tests automatisés** pour :
- Validation des health checks
- Tests d'inscription et connexion
- Validation des réponses
- Tests d'erreurs

## 🌍 Environnements

### Event-Planner-Complete-Environment
Variables configurées pour tous les scénarios :
- `baseUrl` : URL de l'API
- `authToken` : Token JWT (auto-sauvegardé)
- `userEmail` : Email utilisateur (auto-sauvegardé)
- `otpCode` : Code OTP (à saisir)
- `createdUserId` : ID utilisateur créé (auto)
- `createdPersonId` : ID personne créée (auto)
- `createdRoleId` : ID rôle créé (auto)
- `createdPermissionId` : ID permission créée (auto)
- `createdMenuId` : ID menu créé (auto)
- `timestamp` : Timestamp unique
- `randomInt` : Nombre aléatoire
- `guid` : Identifiant unique

## 📋 Guide d'Installation

### 1. Importer les Collections

1. Ouvrir Postman
2. Cliquer sur **Import**
3. Importer les fichiers depuis `collections/` :
   - `Event-Planner-Complete-API.postman_collection.json` (recommandé)
   - `Event-Planner-Auth-API.postman_collection.json` (optionnel)

### 2. Importer l'Environnement

1. Dans Postman, cliquer sur **Import**
2. Importer `environments/Event-Planner-Complete-Environment.postman_environment.json`
3. Sélectionner l'environnement dans le menu déroulant

### 3. Importer les Tests Automatisés (Optionnel)

1. Importer `tests/automated-tests.postman_collection.json`
2. Exécuter via **Runner** de Postman

## 🧪 Scénarios de Test

### Scénario 1 : Inscription Complète
1. **1. Inscription (Register)** → Crée un utilisateur
2. **Récupérer OTP** → Dans les logs du serveur
3. **2. Vérifier Email avec OTP** → Valide l'email
4. **3. Login (après vérification)** → Obtient le token

### Scénario 2 : Gestion Utilisateurs
1. **4. Login Admin** → Token administrateur
2. **1. Lister tous les utilisateurs** → Vérifie la liste
3. **4. Créer utilisateur** → Ajoute un utilisateur
4. **5. Mettre à jour utilisateur** → Modifie l'utilisateur
5. **6. Désactiver utilisateur** → Change le statut
6. **7. Activer utilisateur** → Réactive l'utilisateur
7. **8. Supprimer utilisateur** → Nettoie

### Scénario 3 : RBAC Complet
1. **4. Login Admin** → Token administrateur
2. **3. Créer rôle** → Nouveau rôle
3. **3. Créer permission** → Nouvelle permission
4. **1. Assigner rôle à utilisateur** → Lie utilisateur-rôle
5. **2. Lister autorisations utilisateur** → Vérifie les droits

### Scénario 4 : Tests Automatisés
1. Importer la collection `automated-tests`
2. Lancer **Postman Runner**
3. Sélectionner tous les tests
4. Exécuter et voir les résultats

## 🔧 Personnalisation

### Modifier les Données de Test
Les requêtes utilisent des variables dynamiques :
- `{{$randomInt}}` : Nombre aléatoire
- `{{$timestamp}}` : Timestamp actuel
- `{{$guid}}` : Identifiant unique

### Ajouter de Nouveaux Tests
1. Dupliquer une requête existante
2. Modifier l'URL et les paramètres
3. Ajouter des scripts de test si nécessaire

## 🐛 Débogage

### Vérifier les Variables
1. Cliquer sur l'icône 🧮 (Variables rapides)
2. Vérifier les valeurs actuelles

### Logs du Serveur
```bash
npm run dev
```
Les codes OTP apparaissent dans les logs.

### Erreurs Communes
- **401 Unauthorized** : Token invalide ou manquant
- **403 Forbidden** : Permissions insuffisantes  
- **422 Validation Error** : Données invalides
- **404 Not Found** : Ressource inexistante

## 📚 Documentation Complète

Pour plus de détails :
- [Guide d'utilisation détaillé](./docs/README.md)
- [Documentation API](../docs/)
- [Guide Bootstrap](../BOOTSTRAP_GUIDE.md)

---

💡 **Conseil** : Utiliser la collection **Event-Planner-Complete-API** pour couvrir tous les modules de l'API !
