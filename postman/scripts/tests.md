# 🧪 Scripts de Test - Postman

Ces scripts doivent être ajoutés dans l'onglet "Tests" de Postman pour valider les réponses.

## 🔍 Script de Test Général

```javascript
// Script à ajouter au niveau de la collection
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
        pm.globals.set('lastCreatedEmail', jsonData.data.email);
        console.log('✅ ID stocké:', jsonData.data.id);
    }
});
```

## ✅ Script de Test pour les Routes de Création

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
        
        console.log('✅ Personne créée avec succès:', jsonData.data.id);
    }
});

pm.test("❌ Creation validation errors", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        
        if (jsonData.errors) {
            pm.expect(jsonData.errors).to.be.an('array');
            pm.expect(jsonData.errors.length).to.be.above(0);
            
            // Vérifier la structure des erreurs
            jsonData.errors.forEach(error => {
                pm.expect(error).to.have.property('field');
                pm.expect(error).to.have.property('message');
                pm.expect(error).to.have.property('value');
            });
        }
        
        console.log('❌ Erreurs de validation:', jsonData.errors);
    }
});

pm.test("🚫 Creation conflict errors", function () {
    if (pm.response.code === 409) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        pm.expect(jsonData).to.have.property('field');
        pm.expect(['email', 'phone']).to.include(jsonData.field);
        
        console.log('🚫 Conflit détecté:', jsonData.field);
    }
});
```

## 📖 Script de Test pour les Routes de Lecture

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
                pm.expect(jsonData.meta.pagination).to.have.property('pages');
                
                console.log('📄 Pagination:', jsonData.meta.pagination);
            }
        } else {
            // Test pour un objet unique
            pm.expect(jsonData.data).to.be.an('object');
            pm.expect(jsonData.data).to.have.property('id');
            
            console.log('👤 Personne trouvée:', jsonData.data.id);
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
                
                // Vérifier que la recherche fonctionne
                const searchLower = searchQuery.toLowerCase();
                const foundMatch = jsonData.data.some(person => 
                    (person.firstName && person.firstName.toLowerCase().includes(searchLower)) ||
                    (person.lastName && person.lastName.toLowerCase().includes(searchLower)) ||
                    (person.email && person.email.toLowerCase().includes(searchLower)) ||
                    (person.phone && person.phone.includes(searchQuery))
                );
                
                pm.expect(foundMatch).to.be.true;
            } else {
                console.log('ℹ️ Aucun résultat trouvé');
            }
        }
    }
});
```

## ✏️ Script de Test pour les Routes de Mise à Jour

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
            
            console.log('✏️ Mise à jour réussie:', JSON.stringify(requestBody, null, 2));
        }
    }
});

pm.test("❌ Update not found", function () {
    if (pm.response.code === 404) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        pm.expect(jsonData.code).to.equal('NOT_FOUND');
        
        console.log('❌ Personne non trouvée pour la mise à jour');
    }
});

pm.test("🚫 Update conflict", function () {
    if (pm.response.code === 409) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        pm.expect(jsonData).to.have.property('field');
        
        console.log('🚫 Conflit lors de la mise à jour:', jsonData.field);
    }
});
```

## 🗑️ Script de Test pour les Routes de Suppression

```javascript
pm.test("🗑️ Delete successful", function () {
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        
        // Marquer comme supprimé pour les tests suivants
        const personId = pm.request.url.path[pm.request.url.path.length - 1];
        pm.globals.set('deletedPersonId', personId);
        
        console.log('🗑️ Personne supprimée avec succès:', personId);
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

pm.test("❌ Delete not found", function () {
    if (pm.response.code === 404) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        pm.expect(jsonData.code).to.equal('NOT_FOUND');
        
        console.log('❌ Personne non trouvée pour la suppression');
    }
});
```

## 🔐 Script de Test pour les Erreurs d'Authentification

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

pm.test("❌ Invalid token", function () {
    if (pm.response.code === 401 && pm.request.headers.some(h => h.key === 'Authorization')) {
        const authHeader = pm.request.headers.find(h => h.key === 'Authorization').value;
        
        if (authHeader.includes('invalid') || authHeader.includes('expired')) {
            console.log('❌ Token invalide ou expiré');
        }
    }
});
```

## 📊 Script de Test de Performance

```javascript
pm.test("⏱️ Performance monitoring", function () {
    const startTime = pm.globals.get('requestStartTime');
    if (startTime) {
        const duration = Date.now() - startTime;
        console.log(`⏱️ Durée de la requête: ${duration}ms`);
        
        // Alertes de performance
        if (duration > 1000) {
            console.warn('⚠️ Requête lente (>1s)');
        }
        if (duration > 2000) {
            console.error('🚨 Requête très lente (>2s)');
        }
        
        // Stocker pour analyse
        const performances = pm.globals.get('performances') || [];
        performances.push({
            timestamp: new Date().toISOString(),
            request: pm.info.requestName,
            duration: duration,
            status: pm.response.code
        });
        pm.globals.set('performances', JSON.stringify(performances));
    }
});

pm.test("📈 Response size monitoring", function () {
    const responseSize = JSON.stringify(pm.response.json()).length;
    console.log(`📈 Taille de la réponse: ${responseSize} caractères`);
    
    if (responseSize > 10000) {
        console.warn('⚠️ Réponse volumineuse');
    }
});
```

## 🎯 Script de Test de Validation

```javascript
pm.test("🔍 Data validation", function () {
    if (pm.response.code >= 200 && pm.response.code < 300) {
        const jsonData = pm.response.json();
        
        if (jsonData.data && typeof jsonData.data === 'object') {
            // Validation pour les objets personne
            if (jsonData.data.firstName) {
                pm.expect(jsonData.data.firstName).to.be.a('string');
                pm.expect(jsonData.data.firstName.length).to.be.at.least(2);
            }
            
            if (jsonData.data.lastName) {
                pm.expect(jsonData.data.lastName).to.be.a('string');
                pm.expect(jsonData.data.lastName.length).to.be.at.least(2);
            }
            
            if (jsonData.data.email) {
                pm.expect(jsonData.data.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            }
            
            if (jsonData.data.phone) {
                pm.expect(jsonData.data.phone).to.match(/^(\+?[1-9]\d{1,3})?[0-9]{7,15}$/);
            }
            
            if (jsonData.data.status) {
                pm.expect(['active', 'inactive']).to.include(jsonData.data.status);
            }
        }
    }
});
```

## 📋 Script de Génération de Rapport

```javascript
pm.test("📊 Generate test report", function () {
    const report = {
        timestamp: new Date().toISOString(),
        test: pm.info.requestName,
        status: pm.response.code,
        success: pm.response.code >= 200 && pm.response.code < 300,
        responseTime: pm.response.responseTime,
        environment: {
            baseUrl: pm.environment.get('baseUrl'),
            testCounter: pm.globals.get('testCounter')
        }
    };
    
    console.log('📊 Rapport de test:', JSON.stringify(report, null, 2));
    
    // Stocker pour analyse ultérieure
    const reports = pm.globals.get('testReports') || [];
    reports.push(report);
    pm.globals.set('testReports', JSON.stringify(reports));
    
    // Nettoyer les anciens rapports
    if (reports.length > 100) {
        pm.globals.set('testReports', JSON.stringify(reports.slice(-50)));
    }
});
```

## 🔄 Utilisation

1. **Copiez** les scripts nécessaires selon vos tests
2. **Collez-les** dans l'onglet "Tests" de Postman
3. **Adaptez** les validations selon vos besoins
4. **Exécutez** les tests pour voir les résultats

## 🔧 Personnalisation

Vous pouvez modifier ces scripts pour :
- Ajouter des validations spécifiques
- Adapter les seuils de performance
- Intégrer avec des systèmes de monitoring
- Ajouter des rapports personnalisés
