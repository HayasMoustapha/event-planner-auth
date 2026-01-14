# 🧪 Scripts de Test Automatisés - Module Users

## 📋 Scripts Prérequis (Pre-request)

### Script de Configuration Générale
```javascript
// Script à ajouter dans l'onglet "Pre-request Script" au niveau de la collection
console.log('=== Test Users Module ===');
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

// Username unique pour les tests
const uniqueUsername = `testuser${pm.globals.get('testCounter')}`;
pm.globals.set('uniqueUsername', uniqueUsername);

console.log('📧 Email unique:', uniqueEmail);
console.log('👤 Username unique:', uniqueUsername);
```

### Script de Test d'Authentification
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

### Script de Préparation des Données de Test
```javascript
// Préparer les données de test selon le type de requête
if (pm.request.method === 'POST' && pm.request.body && pm.request.body.raw) {
    const body = JSON.parse(pm.request.body.raw);
    
    // Remplacer les variables dynamiques
    if (body.email === '{{uniqueEmail}}') {
        body.email = pm.globals.get('uniqueEmail');
        pm.request.body.raw = JSON.stringify(body);
    }
    
    if (body.username === '{{uniqueUsername}}') {
        body.username = pm.globals.get('uniqueUsername');
        pm.request.body.raw = JSON.stringify(body);
    }
    
    console.log('📝 Données préparées:', JSON.stringify(body, null, 2));
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
        pm.globals.set('lastCreatedEmail', jsonData.data.email);
        console.log('✅ ID stocké:', jsonData.data.id);
    }
});
```

### Script de Test pour l'Authentification
```javascript
pm.test("🔐 Authentication successful", function () {
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.data).to.have.property('id');
        pm.expect(jsonData.data).to.have.property('email');
        pm.expect(jsonData.data).to.have.property('username');
        pm.expect(jsonData.data).to.not.have.property('password_hash');
        
        // Stocker le token pour les tests suivants
        if (jsonData.data.token) {
            pm.globals.set('authToken', jsonData.data.token);
            console.log('✅ Token stocké');
        }
        
        // Stocker l'ID utilisateur
        pm.globals.set('testUserId', jsonData.data.id);
        console.log('✅ Utilisateur authentifié:', jsonData.data.id);
    }
});

pm.test("❌ Authentication failed", function () {
    if (pm.response.code === 401) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        pm.expect(jsonData.code).to.equal('AUTHENTICATION_FAILED');
        console.log('❌ Authentification échouée');
    }
});

pm.test("🚫 Account locked", function () {
    if (pm.response.code === 403) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        if (jsonData.code === 'ACCOUNT_LOCKED') {
            console.log('🚫 Compte verrouillé');
        }
    }
});
```

### Script de Test pour les Routes de Création
```javascript
pm.test("✅ User creation successful", function () {
    if (pm.response.code === 201) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.data).to.have.property('id');
        pm.expect(jsonData.data).to.have.property('username');
        pm.expect(jsonData.data).to.have.property('email');
        pm.expect(jsonData.data).to.have.property('status');
        pm.expect(jsonData.data).to.not.have.property('password_hash');
        
        // Stocker l'ID pour les tests suivants
        pm.globals.set('createdUserId', jsonData.data.id);
        pm.globals.set('createdUserEmail', jsonData.data.email);
        
        console.log('✅ Utilisateur créé avec succès:', jsonData.data.id);
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
        pm.expect(['email', 'username']).to.include(jsonData.field);
        
        console.log('🚫 Conflit détecté:', jsonData.field);
    }
});
```

### Script de Test pour la Gestion des Mots de Passe
```javascript
pm.test("🔐 Password update successful", function () {
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.data).to.have.property('id');
        pm.expect(jsonData.data).to.not.have.property('password_hash');
        
        console.log('✅ Mot de passe mis à jour');
    }
});

pm.test("❌ Password update errors", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        
        if (jsonData.errors) {
            const passwordError = jsonData.errors.find(e => e.field === 'newPassword');
            if (passwordError) {
                pm.expect(passwordError.message).to.include('mot de passe');
            }
        }
        
        console.log('❌ Erreur de mise à jour du mot de passe');
    }
});

pm.test("🚫 Password already used", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        if (jsonData.message.includes('déjà utilisé')) {
            console.log('🚫 Mot de passe déjà utilisé');
        }
    }
});
```

### Script de Test pour la Gestion des Statuts
```javascript
pm.test("🔄 Status update successful", function () {
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.data).to.have.property('status');
        pm.expect(['active', 'inactive', 'locked']).to.include(jsonData.data.status);
        
        console.log('✅ Statut mis à jour:', jsonData.data.status);
    }
});

pm.test("❌ Status update errors", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        
        if (jsonData.message.includes('Impossible de verrouiller')) {
            console.log('❌ Tentative de verrouillage de son propre compte');
        }
    }
});
```

### Script de Test pour les Vérifications de Disponibilité
```javascript
pm.test("📧 Email availability check", function () {
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.data).to.have.property('available');
        pm.expect(jsonData.data.available).to.be.a('boolean');
        
        console.log('📧 Email disponible:', jsonData.data.available);
    }
});

pm.test("👤 Username availability check", function () {
    if (pm.response.code === 200) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.data).to.have.property('available');
        pm.expect(jsonData.data.available).to.be.a('boolean');
        
        console.log('👤 Username disponible:', jsonData.data.available);
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

pm.test("❌ Invalid token", function () {
    if (pm.response.code === 401 && pm.request.headers.some(h => h.key === 'Authorization')) {
        const authHeader = pm.request.headers.find(h => h.key === 'Authorization').value;
        
        if (authHeader.includes('invalid') || authHeader.includes('expired')) {
            console.log('❌ Token invalide ou expiré');
        }
    }
});
```

### Script de Test de Sécurité
```javascript
pm.test("🔒 Security checks", function () {
    const jsonData = pm.response.json();
    
    // Vérifier que le mot de passe n'est jamais retourné
    if (jsonData.success && jsonData.data) {
        pm.expect(jsonData.data).to.not.have.property('password_hash');
        pm.expect(jsonData.data).to.not.have.property('password');
        pm.expect(jsonData.data).to.not.have.property('currentPassword');
        pm.expect(jsonData.data).to.not.have.property('newPassword');
    }
    
    // Vérifier les informations sensibles dans les logs
    if (pm.request.body && pm.request.body.raw) {
        const body = JSON.parse(pm.request.body.raw);
        if (body.password || body.currentPassword || body.newPassword) {
            console.warn('⚠️ Mot de passe détecté dans la requête');
        }
    }
});

pm.test("🛡️ Input validation", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.false;
        
        if (jsonData.errors) {
            // Vérifier que les erreurs sont bien structurées
            jsonData.errors.forEach(error => {
                pm.expect(error).to.have.property('field');
                pm.expect(error).to.have.property('message');
                pm.expect(error).to.have.property('value');
            });
        }
    }
});
```

### Script de Test de Performance
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
    }
    
    // Test de performance général
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("📈 Response size monitoring", function () {
    const responseSize = JSON.stringify(pm.response.json()).length;
    console.log(`📈 Taille de la réponse: ${responseSize} caractères`);
    
    if (responseSize > 10000) {
        console.warn('⚠️ Réponse volumineuse');
    }
});
```

## 🎯 Scénarios de Test Automatisés

### Scénario 1 : Flux Complet d'Utilisateur
```javascript
// Dans le premier test de création
pm.test("🚀 Start user flow test", function () {
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

### Scénario 2 : Tests de Sécurité
```javascript
pm.test("🔒 Security validation", function () {
    const jsonData = pm.response.json();
    
    // Vérifier l'absence de fuites de données
    if (jsonData.success && jsonData.data) {
        const sensitiveFields = ['password', 'password_hash', 'token', 'secret'];
        sensitiveFields.forEach(field => {
            pm.expect(jsonData.data).to.not.have.property(field);
        });
    }
    
    // Vérifier les en-têtes de sécurité
    if (pm.response.headers) {
        const securityHeaders = ['x-content-type-options', 'x-frame-options'];
        securityHeaders.forEach(header => {
            const hasHeader = pm.response.headers.some(h => h.key.toLowerCase() === header);
            if (hasHeader) {
                console.log(`✅ En-tête de sécurité présent: ${header}`);
            }
        });
    }
});
```

## 📊 Scripts de Rapport

### Script de Génération de Rapport
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
});
```

## 🔧 Utilisation

1. **Copiez** les scripts nécessaires selon vos tests
2. **Collez-les** dans l'onglet "Tests" de Postman
3. **Adaptez** les validations selon vos besoins
4. **Exécutez** les tests pour voir les résultats

## 🎯 Personnalisation

Vous pouvez modifier ces scripts pour :
- Ajouter des validations spécifiques
- Adapter les seuils de performance
- Intégrer avec des systèmes de monitoring
- Ajouter des rapports personnalisés
