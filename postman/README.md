# 📦 Postman - Event Planner Auth

Ce répertoire contient toutes les ressources Postman pour tester l'API Event Planner Auth.

## 📁 Structure

```
postman/
├── README.md                    # Documentation principale
├── collections/                 # Collections de tests
│   └── People Module.postman_collection.json  # Tests complets du module people
├── environments/                # Environnements de configuration
│   └── Environment.postman_environment.json    # Variables d'environnement
├── scripts/                     # Scripts de test
│   └── test-scripts.md         # Scripts de validation et exemples
└── globals/                     # Variables globales
    └── workspace.postman_globals.json  # Configuration globale
```

## 🚀 Démarrage Rapide

### 1. Importer dans Postman

```bash
# Importer la collection
postman collection import "postman/collections/People Module.postman_collection.json"

# Importer l'environnement
postman environment import "postman/environments/Environment.postman_environment.json"
```

### 2. Configuration

1. **Variables d'environnement** :
   - `baseUrl` : URL de votre serveur (ex: `http://localhost:3000`)
   - `authToken` : Token JWT administrateur
   - `userToken` : Token JWT utilisateur standard

2. **Variables de test** :
   - `testPersonId` : ID de personne pour les tests
   - `testEmail` : Email de test
   - `testPhone` : Téléphone de test

### 3. Exécuter les Tests

- **Manuel** : Lancer les requêtes une par une
- **Automatisé** : Utiliser Postman Runner
- **CI/CD** : Utiliser Newman

```bash
# Avec Newman
newman run "postman/collections/People Module.postman_collection.json" \
  -e "postman/environments/Environment.postman_environment.json" \
  --reporters cli,html
```

## 📋 Collections Disponibles

### 🧑‍💼 People Module
Tests complets pour le module de gestion des personnes :

- **Routes publiques** : Recherche, OTP (email/téléphone)
- **Routes protégées** : CRUD complet avec authentification
- **Validation** : Tous les cas d'erreur
- **Permissions** : Tests RBAC

**Endpoints testés :**
- `GET /api/people/search` - Recherche publique
- `GET /api/people/email/:email` - OTP par email
- `GET /api/people/phone/:phone` - OTP par téléphone
- `GET /api/people/:id/exists` - Vérification existence
- `GET /api/people` - Liste paginée (protégé)
- `POST /api/people` - Création (protégé)
- `PUT /api/people/:id` - Mise à jour (protégé)
- `PATCH /api/people/:id/status` - Changement statut (protégé)
- `DELETE /api/people/:id` - Suppression (protégé)

## 🎯 Cas de Test

### ✅ Tests Positifs
- Création avec données valides
- Mise à jour complète
- Activation/désactivation
- Recherche avec pagination
- Flux OTP complets

### ❌ Tests Négatifs
- Validation des données
- Conflits (email/téléphone dupliqués)
- Authentification manquante/invalidée
- Permissions insuffisantes
- Ressources non trouvées
- Opérations non autorisées

## 📊 Scripts

### Scripts Prérequis
- Configuration automatique
- Génération de données uniques
- Logging des requêtes

### Scripts de Test
- Validation des réponses
- Tests de performance
- Monitoring des erreurs
- Génération de rapports

## 🔧 Environnements

### Development
- Serveur local
- Tokens de test
- Logs activés

### Production
- Serveur de production
- Tokens réels
- Monitoring activé

## 📈 Rapports

Les tests génèrent des rapports détaillés :
- **Temps de réponse**
- **Taux de succès**
- **Erreurs détaillées**
- **Performance**

## 🚨 Notes importantes

- **Soft Delete** : Les suppressions sont logiques
- **OTP Public** : Routes email/téléphone sans auth
- **RBAC** : Permissions requises pour les opérations
- **Validation** : Express-validator pour toutes les entrées
- **Audit** : Traçabilité complète des opérations

## 🔄 Mise à Jour

Pour mettre à jour les tests :
1. Modifier les fichiers dans `collections/`
2. Mettre à jour les variables dans `environments/`
3. Ajouter des scripts dans `scripts/`
4. Tester avec Postman Runner

## 📞 Support

Pour toute question sur les tests :
- Consulter la documentation dans `scripts/`
- Vérifier les logs de Postman
- Utiliser les scripts de débogage
