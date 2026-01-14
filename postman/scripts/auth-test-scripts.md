# 📜 Scripts Postman - Module d'Authentification

## 🎯 Vue d'ensemble

Ce document contient tous les scripts pré-requis et de test utilisés dans les collections Postman du module d'authentification.

## 📂 Scripts Pré-requis (Pre-request Scripts)

### Script Global pour toutes les collections

```javascript
// Global pre-request script for Auth module
// Generate random test data if not set

if (!pm.environment.get('testEmail')) {
    pm.environment.set('testEmail', 'test.user' + Math.floor(Math.random() * 10000) + '@example.com');
}

if (!pm.environment.get('testPhone')) {
    pm.environment.set('testPhone', '+336' + Math.floor(Math.random() * 900000000 + 100000000));
}

if (!pm.environment.get('testPassword')) {
    pm.environment.set('testPassword', 'TestPassword123!');
}

// Log current request
console.log('🔐 Auth Module Request:', pm.info.requestName);
console.log('📧 Test Email:', pm.environment.get('testEmail'));
console.log('📱 Test Phone:', pm.environment.get('testPhone'));
```

### Script pour Routes Protégées et Admin

```javascript
// Pre-request script for protected and admin routes

// Set default user ID if not set
if (!pm.environment.get('userId')) {
    pm.environment.set('userId', '1');
}

// Generate new test data for error scenarios
if (!pm.environment.get('invalidEmail')) {
    pm.environment.set('invalidEmail', 'invalid-email-format');
}

if (!pm.environment.get('wrongPassword')) {
    pm.environment.set('wrongPassword', 'wrongpassword123');
}

// Log current request
console.log('🔒 Protected/Admin Request:', pm.info.requestName);
console.log('👤 User ID:', pm.environment.get('userId'));
console.log('🔑 Has Auth Token:', !!pm.environment.get('authToken'));
```

### Script pour Tests d'OTP

```javascript
// Pre-request script for OTP testing

// Generate random OTP code for testing
if (!pm.environment.get('otpCode')) {
    pm.environment.set('otpCode', Math.floor(100000 + Math.random() * 900000).toString());
}

// Set expiration time
if (!pm.environment.get('otpExpiresInMinutes')) {
    pm.environment.set('otpExpiresInMinutes', '15');
}

console.log('🔢 Generated OTP Code:', pm.environment.get('otpCode'));
console.log('⏰ OTP Expires In:', pm.environment.get('otpExpiresInMinutes'), 'minutes');
```

### Script pour Tests de Token

```javascript
// Pre-request script for token testing

// Generate test tokens if needed
if (!pm.environment.get('testToken')) {
    pm.environment.set('testToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature');
}

// Set token expiration test
if (!pm.environment.get('tokenExpirationTest')) {
    pm.environment.set('tokenExpirationTest', 'false');
}

console.log('🔑 Test Token:', pm.environment.get('testToken'));
console.log('⏰ Token Expiration Test:', pm.environment.get('tokenExpirationTest'));
```

## 📊 Scripts de Test (Test Scripts)

### Script Global de Test

```javascript
// Global test script for Auth module

// Test for successful response
pm.test('Status code is successful', function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 400, 401, 403, 404, 429]);
});

// Test response structure
pm.test('Response has proper structure', function () {
    const responseJson = pm.response.json();
    pm.expect(responseJson).to.have.property('success');
    pm.expect(responseJson).to.have.property('message');
    pm.expect(responseJson).to.have.property('timestamp');
});

// Save auth token if present
if (pm.response.code === 200 || pm.response.code === 201) {
    const responseJson = pm.response.json();
    
    if (responseJson.success && responseJson.data && responseJson.data.token) {
        pm.environment.set('authToken', responseJson.data.token);
        console.log('✅ Auth token saved');
    }
    
    if (responseJson.success && responseJson.data && responseJson.data.refreshToken) {
        pm.environment.set('refreshToken', responseJson.data.refreshToken);
        console.log('✅ Refresh token saved');
    }
}

// Log response
console.log('📊 Response Status:', pm.response.code);
console.log('📝 Response Body:', pm.response.json());
```

### Script pour Routes Protégées et Admin

```javascript
// Test script for protected and admin routes

// Test for expected status codes
if (pm.info.requestName.includes('❌')) {
    // Error scenarios should return appropriate error codes
    pm.test('Error scenario returns appropriate status', function () {
        pm.expect(pm.response.code).to.be.oneOf([400, 401, 403, 404, 422]);
    });
    
    pm.test('Error response has proper structure', function () {
        const responseJson = pm.response.json();
        pm.expect(responseJson).to.have.property('success', false);
        pm.expect(responseJson).to.have.property('message');
        pm.expect(responseJson).to.have.property('code');
    });
} else {
    // Success scenarios
    pm.test('Status code is successful', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);
    });
    
    pm.test('Success response has proper structure', function () {
        const responseJson = pm.response.json();
        pm.expect(responseJson).to.have.property('success', true);
        pm.expect(responseJson).to.have.property('message');
    });
}

// Test authentication requirement
if (pm.info.requestName.includes('Protected') || pm.info.requestName.includes('Admin')) {
    pm.test('Authentication required', function () {
        const authHeader = pm.request.headers.find(h => h.key === 'Authorization');
        pm.expect(authHeader).to.exist;
        pm.expect(authHeader.value).to.include('Bearer');
    });
}

// Log response
console.log('📊 Response Status:', pm.response.code);
console.log('📝 Response Body:', pm.response.json());
```

### Script pour Tests d'OTP

```javascript
// Test script for OTP operations

pm.test('OTP response validation', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 201) {
        // OTP generation success
        pm.expect(responseJson.success).to.be.true;
        pm.expect(responseJson.data).to.have.property('identifier');
        pm.expect(responseJson.data).to.have.property('expiresAt');
        
        // Save OTP data for verification
        if (responseJson.data.identifier) {
            pm.environment.set('lastOtpIdentifier', responseJson.data.identifier);
        }
        
        console.log('🔢 OTP generated for:', responseJson.data.identifier);
        console.log('⏰ Expires at:', responseJson.data.expiresAt);
    }
    
    if (pm.response.code === 200) {
        // OTP verification success
        pm.expect(responseJson.success).to.be.true;
        pm.expect(responseJson.data).to.have.property('type');
        pm.expect(responseJson.data).to.have.property('identifier');
        
        console.log('✅ OTP verified for:', responseJson.data.identifier);
    }
});

// Test OTP expiration
pm.test('OTP expiration handling', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 400 && responseJson.message.includes('expiré')) {
        console.log('⏰ OTP correctly expired');
        pm.expect(responseJson.code).to.equal('INVALID_OTP');
    }
});
```

### Script pour Tests de Login

```javascript
// Test script for login operations

pm.test('Login response validation', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 200) {
        // Login success
        pm.expect(responseJson.success).to.be.true;
        pm.expect(responseJson.data).to.have.property('user');
        pm.expect(responseJson.data).to.have.property('token');
        
        // Validate user data
        const user = responseJson.data.user;
        pm.expect(user).to.have.property('id');
        pm.expect(user).to.have.property('email');
        pm.expect(user).to.not.have.property('password_hash'); // Security check
        
        // Save tokens
        if (responseJson.data.token) {
            pm.environment.set('authToken', responseJson.data.token);
        }
        
        if (responseJson.data.refreshToken) {
            pm.environment.set('refreshToken', responseJson.data.refreshToken);
        }
        
        // Save user info
        if (user.id) {
            pm.environment.set('loggedInUserId', user.id.toString());
        }
        
        console.log('🔐 Login successful for user:', user.email);
        console.log('👤 User ID:', user.id);
    }
});

// Test authentication failure
pm.test('Authentication failure handling', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 401) {
        pm.expect(responseJson.success).to.be.false;
        pm.expect(responseJson.code).to.equal('AUTHENTICATION_FAILED');
        console.log('❌ Authentication failed as expected');
    }
});
```

### Script pour Tests de Token

```javascript
// Test script for token operations

pm.test('Token validation', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 200) {
        // Token operation success
        pm.expect(responseJson.success).to.be.true;
        
        if (responseJson.data && responseJson.data.token) {
            // New token generated (refresh)
            pm.environment.set('authToken', responseJson.data.token);
            console.log('🔄 Token refreshed successfully');
        }
        
        if (responseJson.valid !== undefined) {
            // Token validation result
            pm.expect(responseJson).to.have.property('valid');
            console.log('✅ Token validation result:', responseJson.valid);
        }
    }
});

// Test token expiration
pm.test('Token expiration handling', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 401 && responseJson.message.includes('expiré')) {
        console.log('⏰ Token correctly expired');
        pm.expect(responseJson.code).to.equal('TOKEN_EXPIRED');
    }
});

// Test invalid token
pm.test('Invalid token handling', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 401 && responseJson.message.includes('invalide')) {
        console.log('🚫 Invalid token correctly rejected');
        pm.expect(responseJson.code).to.equal('INVALID_TOKEN');
    }
});
```

### Script pour Tests d'Administration

```javascript
// Test script for admin operations

pm.test('Admin operation validation', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 200) {
        pm.expect(responseJson.success).to.be.true;
        
        // Test different admin operations
        if (pm.info.requestName.includes('stats')) {
            pm.expect(responseJson.data).to.have.property('total_otp');
            pm.expect(responseJson.data).to.have.property('active_otp');
            console.log('📊 OTP Statistics:', responseJson.data);
        }
        
        if (pm.info.requestName.includes('invalidate')) {
            pm.expect(responseJson.data).to.have.property('invalidatedCount');
            console.log('🗑️ Invalidated OTPs:', responseJson.data.invalidatedCount);
        }
        
        if (pm.info.requestName.includes('cleanup')) {
            pm.expect(responseJson.data).to.have.property('deletedCount');
            console.log('🧹 Cleaned up OTPs:', responseJson.data.deletedCount);
        }
    }
});

// Test permission requirements
pm.test('Permission validation', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 403) {
        pm.expect(responseJson.success).to.be.false;
        pm.expect(responseJson.code).to.equal('PERMISSION_DENIED');
        console.log('🚫 Permission correctly denied');
    }
});
```

## 🔧 Fonctions Utilitaires

### Génération de Données de Test

```javascript
// Generate random email
function generateTestEmail() {
    return 'test.user' + Math.floor(Math.random() * 10000) + '@example.com';
}

// Generate random phone
function generateTestPhone() {
    return '+336' + Math.floor(Math.random() * 900000000 + 100000000);
}

// Generate random OTP
function generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate random password
function generateTestPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
```

### Validation de Réponses

```javascript
// Validate success response
function validateSuccessResponse(responseJson) {
    pm.expect(responseJson).to.have.property('success', true);
    pm.expect(responseJson).to.have.property('message');
    pm.expect(responseJson).to.have.property('timestamp');
}

// Validate error response
function validateErrorResponse(responseJson) {
    pm.expect(responseJson).to.have.property('success', false);
    pm.expect(responseJson).to.have.property('message');
    pm.expect(responseJson).to.have.property('code');
    pm.expect(responseJson).to.have.property('timestamp');
}

// Validate user data (without password)
function validateUserData(user) {
    pm.expect(user).to.have.property('id');
    pm.expect(user).to.have.property('email');
    pm.expect(user).to.not.have.property('password_hash');
}
```

### Gestion des Tokens

```javascript
// Save auth token
function saveAuthToken(token) {
    pm.environment.set('authToken', token);
    console.log('✅ Auth token saved');
}

// Save refresh token
function saveRefreshToken(token) {
    pm.environment.set('refreshToken', token);
    console.log('✅ Refresh token saved');
}

// Clear tokens
function clearTokens() {
    pm.environment.set('authToken', '');
    pm.environment.set('refreshToken', '');
    console.log('🗑️ Tokens cleared');
}
```

## 📝 Notes d'Utilisation

1. **Importation**: Copiez les scripts appropriés dans les sections correspondantes de Postman
2. **Personnalisation**: Modifiez les valeurs selon vos besoins spécifiques
3. **Debugging**: Utilisez `console.log()` pour suivre l'exécution
4. **Maintenance**: Mettez à jour les scripts lors de modifications de l'API

## 🚀 Bonnes Pratiques

1. **Validation**: Toujours valider la structure des réponses
2. **Logging**: Utilisez des logs détaillés pour le débogage
3. **Gestion d'erreurs**: Testez tous les scénarios d'erreur
4. **Sécurité**: Ne jamais exposer de données sensibles dans les logs
5. **Performance**: Évitez les opérations lourdes dans les scripts

---

**📞 Support**: Pour toute question sur ces scripts, consultez la documentation Postman ou contactez l'équipe de développement.
