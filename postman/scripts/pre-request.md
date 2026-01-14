# 📋 Scripts Prérequis - Postman

Ces scripts doivent être ajoutés dans l'onglet "Pre-request Script" de Postman.

## 🔧 Script de Configuration Générale

```javascript
// Script à ajouter au niveau de la collection
console.log('=== Test People Module ===');
console.log('URL:', pm.request.url);
console.log('Méthode:', pm.request.method);
console.log('Timestamp:', new Date().toISOString());

// Auto-incrément pour les tests uniques
if (!pm.globals.get('testCounter')) {
    pm.globals.set('testCounter', 1);
} else {
    pm.globals.set('testCounter', pm.globals.get('testCounter') + 1);
}

// Email unique pour les tests de création
const uniqueEmail = `test${pm.globals.get('testCounter')}@example.com`;
pm.globals.set('uniqueEmail', uniqueEmail);

// Téléphone unique pour les tests
const uniquePhone = `+336${String(pm.globals.get('testCounter')).padStart(8, '0')}`;
pm.globals.set('uniquePhone', uniquePhone);

console.log('📧 Email unique:', uniqueEmail);
console.log('📱 Téléphone unique:', uniquePhone);
```

## 🔐 Script de Vérification d'Authentification

```javascript
// Pour les routes nécessitant une authentification
if (pm.request.headers.some(header => header.key === 'Authorization')) {
    const authHeader = pm.request.headers.find(h => h.key === 'Authorization').value;
    console.log('🔐 Token présent:', authHeader.substring(0, 20) + '...');
    
    // Vérifier si le token est valide (format Bearer)
    if (!authHeader.startsWith('Bearer ')) {
        console.warn('⚠️ Format de token invalide, devrait commencer par "Bearer "');
    }
} else {
    console.log('⚠️ Pas de token d\'authentification');
}
```

## 🎯 Script de Préparation des Données de Test

```javascript
// Préparer les données de test selon le type de requête
if (pm.request.method === 'POST' && pm.request.body && pm.request.body.raw) {
    const body = JSON.parse(pm.request.body.raw);
    
    // Remplacer les variables dynamiques
    if (body.email === '{{uniqueEmail}}') {
        body.email = pm.globals.get('uniqueEmail');
        pm.request.body.raw = JSON.stringify(body);
    }
    
    if (body.phone === '{{uniquePhone}}') {
        body.phone = pm.globals.get('uniquePhone');
        pm.request.body.raw = JSON.stringify(body);
    }
    
    console.log('📝 Données préparées:', JSON.stringify(body, null, 2));
}
```

## 📊 Script de Monitoring des Performances

```javascript
// Démarrer le chronomètre
pm.globals.set('requestStartTime', Date.now());

// Logger les informations de la requête
console.log('📊 Informations de la requête:');
console.log('- Méthode:', pm.request.method);
console.log('- URL:', pm.request.url);
console.log('- Headers:', pm.request.headers);

if (pm.request.body && pm.request.body.raw) {
    console.log('- Body:', pm.request.body.raw);
}
```

## 🔄 Script de Gestion des Variables

```javascript
// Gérer les variables entre les requêtes
const currentTest = pm.info.requestName;
console.log('🔄 Test actuel:', currentTest);

// Stocker l'ID de la dernière personne créée
if (pm.globals.get('lastCreatedId')) {
    console.log('📋 Dernier ID créé:', pm.globals.get('lastCreatedId'));
}

// Nettoyer les anciennes variables après un certain nombre de tests
if (pm.globals.get('testCounter') > 100) {
    console.log('🧹 Nettoyage des variables de test');
    pm.globals.unset('testCounter');
    pm.globals.unset('lastCreatedId');
    pm.globals.unset('lastCreatedEmail');
}
```

## 🚨 Script de Gestion des Erreurs

```javascript
// Préparer la gestion des erreurs
pm.globals.set('errorExpected', false);

// Marquer les tests qui doivent générer des erreurs
const errorTests = [
    '❌ Prénom manquant',
    '❌ Email invalide',
    '❌ Téléphone invalide',
    '❌ Statut invalide',
    '❌ Personne non trouvée',
    '❌ Email déjà utilisé',
    '❌ Pas de token',
    '❌ Token invalide',
    '❌ Permissions insuffisantes'
];

if (errorTests.some(test => currentTest.includes(test))) {
    pm.globals.set('errorExpected', true);
    console.log('⚠️ Erreur attendue pour ce test');
}
```

## 📝 Script de Logging Avancé

```javascript
// Logging détaillé pour le débogage
const logData = {
    timestamp: new Date().toISOString(),
    test: pm.info.requestName,
    method: pm.request.method,
    url: pm.request.url,
    headers: pm.request.headers,
    body: pm.request.body ? pm.request.body.raw : null,
    environment: {
        baseUrl: pm.environment.get('baseUrl'),
        testCounter: pm.globals.get('testCounter')
    }
};

// Stocker pour analyse ultérieure
const logs = pm.globals.get('testLogs') || [];
logs.push(logData);
pm.globals.set('testLogs', JSON.stringify(logs));

console.log('📝 Log détaillé:', JSON.stringify(logData, null, 2));
```

## 🎯 Script de Configuration des Tests

```javascript
// Configuration spécifique aux types de tests
const testType = pm.info.requestName.includes('Création') ? 'create' :
                 pm.info.requestName.includes('Mise à jour') ? 'update' :
                 pm.info.requestName.includes('Suppression') ? 'delete' :
                 pm.info.requestName.includes('Recherche') ? 'read' : 'other';

pm.globals.set('currentTestType', testType);
console.log('🎯 Type de test:', testType);

// Configuration selon le type
switch (testType) {
    case 'create':
        pm.globals.set('expectedStatus', [201, 400, 409]);
        break;
    case 'update':
        pm.globals.set('expectedStatus', [200, 400, 404, 409]);
        break;
    case 'delete':
        pm.globals.set('expectedStatus', [200, 400, 404]);
        break;
    case 'read':
        pm.globals.set('expectedStatus', [200, 401, 403, 404]);
        break;
    default:
        pm.globals.set('expectedStatus', [200, 400, 401, 403, 404, 409]);
}
```

## 📋 Utilisation

1. **Copiez** les scripts nécessaires
2. **Collez-les** dans l'onglet "Pre-request Script" de Postman
3. **Adaptez** selon vos besoins spécifiques
4. **Testez** avec différentes requêtes

## 🔧 Personnalisation

Vous pouvez modifier ces scripts pour :
- Ajouter des variables personnalisées
- Adapter les logs à votre format
- Intégrer avec des systèmes externes
- Ajouter des validations spécifiques
