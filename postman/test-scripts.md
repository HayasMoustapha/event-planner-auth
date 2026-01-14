# 🧪 Scripts de Test Automatisés - Module People

## 📋 Scripts Prérequis (Pre-request)

### Script de Configuration Générale
```javascript
// Script à ajouter dans l'onglet "Pre-request Script" au niveau de la collection
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
```

### Script de Test d'Authentification
```javascript
// Pour les routes nécessitant une authentification
if (pm.request.headers.some(header => header.key === 'Authorization')) {
    console.log('🔐 Token présent:', pm.request.headers.find(h => h.key === 'Authorization').value.substring(0, 20) + '...');
} else {
    console.log('⚠️ Pas de token d\'authentification');
}
```

## 🧪 Scripts de Test (Tests)

### Script de Test Général
```javascript
// Script à ajouter dans l'onglet "Tests" au niveau de la collection
pm.test("📊 Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("📝 Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('timestamp');
    
    // Vérifier le format du timestamp
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    pm.expect(jsonData.timestamp).to.match(timestampRegex);
});

pm.test("🔍 Log response details", function () {
    const jsonData = pm.response.json();
    console.log('Response:', JSON.stringify(jsonData, null, 2));
    
    // Stocker l'ID pour les tests suivants
    if (jsonData.success && jsonData.data && jsonData.data.id) {
        pm.globals.set('lastCreatedId', jsonData.data.id);
        console.log('✅ ID stocké:', jsonData.data.id);
    }
});
```

### Script de Test pour les Routes de Création
```javascript
pm.test("✅ Creation successful", function () {
    if (pm.response.code === 201) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.data).to.have.property('id');
        pm.expect(jsonData.data).to.have.property('firstName');
        pm.expect(jsonData.data).to.have.property('lastName');
        pm.expect(jsonData.data).to.have.property('email');
        pm.expect(jsonData.data).to.have.property('status');
        
        // Stocker l'ID pour les tests suivants
        pm.globals.set('createdPersonId', jsonData.data.id);
        pm.globals.set('createdPersonEmail', jsonData.data.email);
    }
});

pm.test("❌ Creation validation errors", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        if (jsonData.errors) {
            pm.expect(jsonData.errors).to.be.an('array');
            pm.expect(jsonData.errors.length).to.be.above(0);
        }
    }
});

pm.test("🚫 Creation conflict errors", function () {
    if (pm.response.code === 409) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        pm.expect(jsonData).to.have.property('field');
        pm.expect(['email', 'phone']).to.include(jsonData.field);
    }
});
```

### Script de Test pour les Routes de Lecture
```javascript
pm.test("📖 Read successful", function () {
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        
        if (Array.isArray(jsonData.data)) {
            // Test pour les listes
            pm.expect(jsonData.data).to.be.an('array');
            if (jsonData.meta && jsonData.meta.pagination) {
                pm.expect(jsonData.meta.pagination).to.have.property('page');
                pm.expect(jsonData.meta.pagination).to.have.property('limit');
                pm.expect(jsonData.meta.pagination).to.have.property('total');
            }
        } else {
            // Test pour un objet unique
            pm.expect(jsonData.data).to.be.an('object');
            pm.expect(jsonData.data).to.have.property('id');
        }
    }
});

pm.test("🔍 Search functionality", function () {
    if (pm.request.url.query && pm.request.url.query.some(q => q.key === 'search')) {
        const searchQuery = pm.request.url.query.find(q => q.key === 'search').value;
        console.log('🔍 Recherche pour:', searchQuery);
        
        if (pm.response.code === 200) {
            const jsonData = pm.response.json();
            if (jsonData.data && jsonData.data.length > 0) {
                console.log(`✅ ${jsonData.data.length} résultats trouvés`);
            } else {
                console.log('ℹ️ Aucun résultat trouvé');
            }
        }
    }
});
```

### Script de Test pour les Routes de Mise à Jour
```javascript
pm.test("✏️ Update successful", function () {
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.data).to.have.property('id');
        
        // Vérifier que les données ont été mises à jour
        if (pm.request.body && pm.request.body.raw) {
            const requestBody = JSON.parse(pm.request.body.raw);
            Object.keys(requestBody).forEach(key => {
                if (key !== 'status') { // Le statut est géré différemment
                    pm.expect(jsonData.data).to.have.property(key);
                    if (typeof requestBody[key] === 'string') {
                        pm.expect(jsonData.data[key]).to.equal(requestBody[key]);
                    }
                }
            });
        }
    }
});

pm.test("❌ Update not found", function () {
    if (pm.response.code === 404) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        pm.expect(jsonData.code).to.equal('NOT_FOUND');
    }
});
```

### Script de Test pour les Routes de Suppression
```javascript
pm.test("🗑️ Delete successful", function () {
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        console.log('✅ Personne supprimée avec succès');
        
        // Marquer comme supprimé pour les tests suivants
        pm.globals.set('deletedPersonId', pm.request.url.path[pm.request.url.path.length - 1]);
    }
});

pm.test("🚫 Delete not allowed", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        if (jsonData.code === 'OPERATION_NOT_ALLOWED') {
            console.log('⚠️ Suppression non autorisée (personne associée à un utilisateur)');
        }
    }
});
```

### Script de Test pour les Erreurs d'Authentification
```javascript
pm.test("🔐 Authentication required", function () {
    if (pm.response.code === 401) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        pm.expect(jsonData.code).to.equal('UNAUTHORIZED');
        console.log('🔐 Authentification requise');
    }
});

pm.test("🚫 Permission denied", function () {
    if (pm.response.code === 403) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        pm.expect(jsonData.code).to.equal('FORBIDDEN');
        console.log('🚫 Permissions insuffisantes');
    }
});
```

## 🎯 Scénarios de Test Automatisés

### Scénario 1 : Flux Complet de Création
```javascript
// Dans le premier test de création
pm.test("🚀 Start full flow test", function () {
    pm.globals.set('flowStartTime', Date.now());
    pm.globals.set('flowStep', 'creation');
});

// Dans les tests suivants
pm.test("📊 Flow progress", function () {
    const startTime = pm.globals.get('flowStartTime');
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ Temps écoulé: ${elapsed}ms`);
    
    if (elapsed > 10000) {
        console.warn('⚠️ Le test prend plus de 10 secondes');
    }
});
```

### Scénario 2 : Tests de Validation
```javascript
// Tests de validation spécifiques
const validationTests = {
    'firstName': {
        valid: ['John', 'Jean-Claude', 'Marie-Pierre'],
        invalid: ['', 'a', 'a'.repeat(101), '123', 'John@123']
    },
    'email': {
        valid: ['test@example.com', 'user.name@domain.co.uk'],
        invalid: ['', 'invalid', 'test@', '@example.com', 'test..test@example.com']
    },
    'phone': {
        valid: ['+33612345678', '0123456789', '+14155552671'],
        invalid: ['', '123', 'abc', '+1234567890123456']
    }
};

// Utilisation dans les tests
Object.keys(validationTests).forEach(field => {
    pm.test(`🔍 ${field} validation`, function () {
        if (pm.request.body && pm.request.body.raw) {
            const body = JSON.parse(pm.request.body.raw);
            if (body[field]) {
                const value = body[field];
                const isValid = validationTests[field].valid.includes(value) || 
                              !validationTests[field].invalid.includes(value);
                
                if (pm.response.code === 400) {
                    pm.expect(isValid).to.be.false;
                } else if (pm.response.code === 201) {
                    pm.expect(isValid).to.be.true;
                }
            }
        }
    });
});
```

## 📊 Rapports de Test

### Script de Génération de Rapport
```javascript
// À la fin de chaque collection
pm.test("📊 Generate test report", function () {
    const report = {
        timestamp: new Date().toISOString(),
        collection: "People Module",
        totalTests: pm.info.executionCount,
        passedTests: pm.info.executionCount - pm.info.errorCount,
        failedTests: pm.info.errorCount,
        environment: {
            baseUrl: pm.environment.get('baseUrl'),
            testCounter: pm.globals.get('testCounter')
        }
    };
    
    console.log('📊 Rapport de test:', JSON.stringify(report, null, 2));
    
    // Stocker pour analyse ultérieure
    pm.globals.set('lastTestReport', JSON.stringify(report));
});
```

## 🚀 Exécution des Tests

### Avec Postman Runner
1. Importer la collection et l'environnement
2. Configurer les variables d'environnement
3. Lancer Postman Runner
4. Sélectionner la collection "People Module"
5. Choisir le nombre d'itérations
6. Activer "Save responses"
7. Lancer les tests

### Tests Automatisés avec Newman
```bash
# Installation
npm install -g newman

# Exécution
newman run "postman/People Module.postman_collection.json" \
  -e "postman/Environment.postman_environment.json" \
  --reporters cli,html \
  --reporter-html-export "test-report.html"
```

## 📝 Notes Importantes

- **Variables globales** : Utilisées pour partager des données entre tests
- **Variables d'environnement** : Configuration spécifique à l'environnement
- **Logs** : Utilisez `console.log()` pour le débogage
- **Assertions** : Utilisez `pm.test()` pour les validations
- **Conditions** : Adaptez les tests selon les codes de réponse attendus
