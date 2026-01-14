# 📖 Scripts - Documentation

Ce répertoire contient tous les scripts nécessaires pour tester efficacement l'API Event Planner Auth avec Postman.

## 📁 Structure des Scripts

```
scripts/
├── README.md           # Documentation des scripts
├── pre-request.md     # Scripts prérequis (avant les requêtes)
├── tests.md           # Scripts de test (après les requêtes)
└── examples.md        # Exemples d'utilisation et scénarios
```

## 🔧 Scripts Disponibles

### 📋 Pre-request Scripts
Scripts à exécuter avant chaque requête pour préparer l'environnement de test :

- **Configuration générale** : Variables, compteurs, logs
- **Authentification** : Vérification des tokens
- **Préparation des données** : Génération de données uniques
- **Monitoring** : Démarrage des chronomètres
- **Gestion des erreurs** : Configuration des tests d'erreur

### 🧪 Test Scripts
Scripts à exécuter après chaque requête pour valider les réponses :

- **Validation générale** : Structure, timestamp, performance
- **Tests CRUD** : Création, lecture, mise à jour, suppression
- **Authentification** : Tokens, permissions, erreurs
- **Performance** : Temps de réponse, taille des réponses
- **Validation des données** : Format des champs, cohérence

### 🎯 Exemples
Scénarios complets pour illustrer l'utilisation des scripts :

- **Flux complet** : CRUD + OTP
- **Tests de validation** : Tous les cas d'erreur
- **Authentification** : Tokens et permissions
- **Performance** : Monitoring et analyse
- **Intégration** : Flux complexes
- **Débogage** : Informations détaillées

## 🚀 Utilisation Rapide

### 1. Importer les Scripts
```javascript
// Copiez les scripts des fichiers .md dans Postman
// Pre-request Script → onglet "Pre-request Script"
// Test Scripts → onglet "Tests"
```

### 2. Configurer l'Environnement
```javascript
// Variables d'environnement à définir
pm.environment.set("baseUrl", "http://localhost:3000");
pm.environment.set("authToken", "votre-jeton-admin");
pm.environment.set("userToken", "votre-jeton-user");
```

### 3. Exécuter les Tests
- **Manuel** : Lancez chaque requête individuellement
- **Automatisé** : Utilisez Postman Runner
- **CI/CD** : Utilisez Newman avec les scripts

## 📊 Fonctionnalités des Scripts

### 🔄 Automatisation
- Génération automatique de données uniques
- Partage de variables entre les requêtes
- Configuration automatique de l'environnement

### 📈 Monitoring
- Mesure des temps de réponse
- Analyse des performances
- Détection des anomalies

### 🔍 Validation
- Structure des réponses API
- Format des données
- Codes de statut

### 📝 Logging
- Logs détaillés des requêtes
- Informations de débogage
- Historique des tests

## 🎯 Personnalisation

### Ajouter des Scripts Personnalisés
```javascript
// Dans Pre-request Script
pm.test("Custom setup", function () {
    // Votre logique personnalisée
});

// Dans Test Scripts  
pm.test("Custom validation", function () {
    // Vos validations personnalisées
});
```

### Adapter les Variables
```javascript
// Modifier les variables selon vos besoins
pm.globals.set("customVar", "customValue");
pm.environment.set("envVar", "envValue");
```

### Étendre les Validations
```javascript
// Ajouter des validations spécifiques
pm.test("Custom business rule", function () {
    const jsonData = pm.response.json();
    // Votre logique métier
});
```

## 🛠️ Maintenance

### Mise à Jour des Scripts
1. Modifiez les fichiers .md avec les nouvelles fonctionnalités
2. Copiez les scripts mis à jour dans Postman
3. Testez avec différentes requêtes
4. Documentez les changements

### Versionnement
- Utilisez Git pour suivre les modifications
- Documentez les versions majeures
- Gardez une compatibilité ascendante

### Nettoyage
- Supprimez les variables obsolètes
- Nettoyez les logs anciens
- Optimisez les performances

## 🚨 Bonnes Pratiques

### 1. Organisation
- Utilisez des noms clairs pour les tests
- Groupez les scripts par fonctionnalité
- Documentez les cas d'usage

### 2. Performance
- Évitez les opérations lourdes dans les scripts
- Utilisez des variables pour éviter les répétitions
- Surveillez les temps d'exécution

### 3. Sécurité
- Masquez les données sensibles dans les logs
- Utilisez des variables d'environnement
- Ne stockez pas de tokens en dur

### 4. Débogage
- Utilisez des logs détaillés
- Testez tous les cas d'erreur
- Validez les réponses inattendues

## 📞 Support

Pour toute question sur l'utilisation des scripts :

1. **Consultez la documentation** dans chaque fichier
2. **Vérifiez les exemples** dans `examples.md`
3. **Utilisez les logs** pour le débogage
4. **Testez progressivement** les fonctionnalités

## 🔄 Évolution

Les scripts sont conçus pour être évolutifs :
- Ajout de nouvelles validations
- Support de nouveaux endpoints
- Amélioration des performances
- Extension des fonctionnalités
