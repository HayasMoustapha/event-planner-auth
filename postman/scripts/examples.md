# 🎯 Exemples d'Utilisation - Postman

Exemples concrets pour utiliser les scripts et collections Postman avec le module People.

## 🚀 Scénario 1 : Flux Complet de Test

### Étape 1 : Créer une personne
```json
POST /api/people
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+33612345678",
  "status": "active"
}
```

### Étape 2 : Vérifier la création
```javascript
// Dans le script de test de la création
pm.test("✅ Personne créée avec succès", function () {
    const jsonData = pm.response.json();
    if (jsonData.success) {
        // Stocker l'ID pour les tests suivants
        pm.globals.set('testPersonId', jsonData.data.id);
        pm.globals.set('testPersonEmail', jsonData.data.email);
        
        console.log('📋 Personne créée:', jsonData.data.id);
    }
});
```

### Étape 3 : Tester les routes OTP
```bash
# Recherche par email
GET /api/people/email/john.doe@example.com

# Recherche par téléphone  
GET /api/people/phone/+33612345678

# Vérifier l'existence
GET /api/people/{{testPersonId}}/exists
```

### Étape 4 : Mettre à jour la personne
```json
PUT /api/people/{{testPersonId}}
{
  "firstName": "John Updated",
  "status": "inactive"
}
```

### Étape 5 : Supprimer la personne
```bash
DELETE /api/people/{{testPersonId}}
```

## 🎯 Scénario 2 : Tests de Validation

### Test 1 : Validation des champs obligatoires
```json
POST /api/people
{
  "lastName": "Doe",
  "email": "test@example.com"
}
```
*Résultat attendu : 400 - Prénom manquant*

### Test 2 : Validation de l'email
```json
POST /api/people
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "email-invalide"
}
```
*Résultat attendu : 400 - Format d'email invalide*

### Test 3 : Validation du téléphone
```json
POST /api/people
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "123"
}
```
*Résultat attendu : 400 - Format de téléphone invalide*

### Test 4 : Conflit d'email
```json
POST /api/people
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}
```
*Résultat attendu : 409 - Email déjà utilisé*

## 🔐 Scénario 3 : Tests d'Authentification

### Test 1 : Sans token
```bash
GET /api/people
```
*Résultat attendu : 401 - Non autorisé*

### Test 2 : Token invalide
```bash
GET /api/people
Authorization: Bearer invalid-token
```
*Résultat attendu : 401 - Non autorisé*

### Test 3 : Permissions insuffisantes
```bash
POST /api/people
Authorization: Bearer {{userToken}}
```
*Résultat attendu : 403 - Permissions insuffisantes*

## 📊 Scénario 4 : Tests de Performance

### Script de monitoring
```javascript
// Dans Pre-request Script
pm.globals.set('startTime', Date.now());

// Dans Tests
pm.test("⏱️ Performance check", function () {
    const duration = Date.now() - pm.globals.get('startTime');
    pm.expect(duration).to.be.below(1000);
    
    console.log(`⏱️ Durée: ${duration}ms`);
    
    if (duration > 500) {
        console.warn('⚠️ Requête lente');
    }
});
```

### Test de charge
```javascript
// Script pour générer des données de test
const generateTestData = () => {
    const timestamp = Date.now();
    return {
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        email: `test${timestamp}@example.com`,
        phone: `+336${timestamp.toString().slice(-8)}`,
        status: 'active'
    };
};

pm.globals.set('testData', JSON.stringify(generateTestData()));
```

## 🔄 Scénario 5 : Tests d'Intégration

### Flux OTP complet
```javascript
// 1. Créer une personne
// 2. Envoyer un OTP (simulation)
// 3. Vérifier l'email
// 4. Créer un utilisateur associé
// 5. Tester l'authentification

const testOTPFlow = async () => {
    // Création personne
    const personResponse = await pm.sendRequest({
        url: pm.environment.get('baseUrl') + '/api/people',
        method: 'POST',
        header: 'Content-Type: application/json',
        body: JSON.stringify(generateTestData())
    });
    
    if (personResponse.code === 201) {
        const personId = personResponse.json().data.id;
        
        // Vérification OTP par email
        const emailCheck = await pm.sendRequest({
            url: pm.environment.get('baseUrl') + `/api/people/email/${personResponse.json().data.email}`,
            method: 'GET'
        });
        
        console.log('🔐 OTP Flow testé:', emailCheck.code);
    }
};
```

## 📈 Scénario 6 : Rapports et Monitoring

### Script de rapport détaillé
```javascript
pm.test("📊 Generate detailed report", function () {
    const report = {
        test: pm.info.requestName,
        timestamp: new Date().toISOString(),
        request: {
            method: pm.request.method,
            url: pm.request.url,
            headers: pm.request.headers,
            body: pm.request.body ? JSON.parse(pm.request.body.raw) : null
        },
        response: {
            code: pm.response.code,
            time: pm.response.responseTime,
            size: JSON.stringify(pm.response.json()).length,
            data: pm.response.json()
        },
        performance: {
            success: pm.response.code >= 200 && pm.response.code < 300,
            fast: pm.response.responseTime < 500,
            acceptable: pm.response.responseTime < 1000
        }
    };
    
    // Stocker pour analyse
    const reports = pm.globals.get('detailedReports') || [];
    reports.push(report);
    pm.globals.set('detailedReports', JSON.stringify(reports));
    
    console.log('📊 Rapport détaillé généré');
});
```

### Analyse des performances
```javascript
pm.test("📈 Performance analysis", function () {
    const performances = JSON.parse(pm.globals.get('performances') || '[]');
    
    if (performances.length > 0) {
        const avgTime = performances.reduce((sum, p) => sum + p.duration, 0) / performances.length;
        const maxTime = Math.max(...performances.map(p => p.duration));
        const minTime = Math.min(...performances.map(p => p.duration));
        
        console.log(`📈 Analyse de performance:`);
        console.log(`- Temps moyen: ${avgTime.toFixed(2)}ms`);
        console.log(`- Temps max: ${maxTime}ms`);
        console.log(`- Temps min: ${minTime}ms`);
        console.log(`- Tests: ${performances.length}`);
        
        // Alertes
        if (avgTime > 1000) {
            console.warn('⚠️ Performance moyenne dégradée');
        }
        if (maxTime > 2000) {
            console.error('🚨 Pic de performance détecté');
        }
    }
});
```

## 🛠️ Scénario 7 : Débogage

### Script de débogage avancé
```javascript
pm.test("🐛 Debug information", function () {
    const debugInfo = {
        request: {
            name: pm.info.requestName,
            method: pm.request.method,
            url: pm.request.url.toString(),
            headers: pm.request.headers,
            body: pm.request.body ? JSON.parse(pm.request.body.raw) : null
        },
        response: {
            code: pm.response.code,
            status: pm.response.status,
            headers: pm.response.headers,
            body: pm.response.json(),
            time: pm.response.responseTime
        },
        environment: {
            baseUrl: pm.environment.get('baseUrl'),
            authToken: pm.environment.get('authToken') ? '[MASKED]' : 'NOT_SET',
            testCounter: pm.globals.get('testCounter')
        },
        globals: {
            lastCreatedId: pm.globals.get('lastCreatedId'),
            lastCreatedEmail: pm.globals.get('lastCreatedEmail'),
            errorExpected: pm.globals.get('errorExpected')
        }
    };
    
    console.log('🐛 Debug info:', JSON.stringify(debugInfo, null, 2));
    
    // Vérifier les incohérences
    if (debugInfo.globals.errorExpected && debugInfo.response.code < 400) {
        console.warn('⚠️ Erreur attendue mais succès reçu');
    }
    
    if (!debugInfo.globals.errorExpected && debugInfo.response.code >= 400) {
        console.warn('⚠️ Succès attendu mais erreur reçue');
    }
});
```

## 🎯 Conseils d'Utilisation

### 1. Organisation des tests
- Utilisez des noms de test clairs et descriptifs
- Groupez les tests par fonctionnalité
- Utilisez des variables pour partager les données

### 2. Gestion des erreurs
- Prévoyez tous les cas d'erreur
- Validez les messages d'erreur
- Testez les codes de statut

### 3. Performance
- Surveillez les temps de réponse
- Identifiez les requêtes lentes
- Optimisez les tests répétitifs

### 4. Maintenance
- Mettez à jour les scripts régulièrement
- Documentez les cas de test
- Versionnez les collections

## 📚 Ressources Supplémentaires

- [Documentation Postman](https://learning.postman.com/)
- [Scripts Newman](https://learning.postman.com/docs/running-collections/using-newman/)
- [Best Practices](https://learning.postman.com/docs/writing-scripts/script-best-practices/)
