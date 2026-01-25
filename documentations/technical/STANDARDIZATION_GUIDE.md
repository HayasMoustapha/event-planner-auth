# 📋 GUIDE DE STANDARDISATION DU CODE

## 🎯 OBJECTIF
Standardiser les conventions de nommage et les pratiques de codage pour améliorer la maintenabilité et la cohérence.

---

## 📏 CONVENTIONS DE NOMMAGE

### **1. Variables et Fonctions (camelCase)**
```javascript
// ✅ CORRECT
const userName = 'john_doe';
const getUserById = (userId) => { ... };
const isActiveUser = true;

// ❌ INCORRECT
const user_name = 'john_doe';
const get_user_by_id = (userId) => { ... };
const is_active_user = true;
```

### **2. Classes (PascalCase)**
```javascript
// ✅ CORRECT
class UserService { ... }
class SessionRepository { ... }
class AuthController { ... }

// ❌ INCORRECT
class userService { ... }
class session_repository { ... }
class auth_controller { ... }
```

### **3. Constantes (UPPER_SNAKE_CASE)**
```javascript
// ✅ CORRECT
const MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 10;
const API_BASE_URL = 'https://api.example.com';

// ❌ INCORRECT
const maxLoginAttempts = 5;
const defaultPageSize = 10;
const apiBaseUrl = 'https://api.example.com';
```

### **4. Noms de fichiers (kebab-case)**
```javascript
// ✅ CORRECT
user-service.js
session-repository.js
auth-controller.js

// ❌ INCORRECT
userService.js
session_repository.js
authController.js
```

### **5. Colonnes de base de données (snake_case)**
```sql
-- ✅ CORRECT
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ❌ INCORRECT
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  userId VARCHAR(255),
  email VARCHAR(255),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

---

## 🔄 MAPPING DES CHAMPS

### **Mapping standard pour les API**
```javascript
// Format API (camelCase) → Format DB (snake_case)
const fieldMapping = {
  firstName: 'first_name',
  lastName: 'last_name',
  userId: 'user_id',
  personId: 'person_id',
  userCode: 'user_code',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  phoneNumber: 'phone',
  emailAddress: 'email',
  otpCode: 'code'
};
```

---

## 📝 DOCUMENTATION DES FONCTIONS

### **Format JSDoc standard**
```javascript
/**
 * Récupère un utilisateur par son ID
 * @param {number} userId - ID de l'utilisateur (doit être > 0)
 * @param {Object} options - Options supplémentaires
 * @param {boolean} options.includeProfile - Inclure le profil de l'utilisateur
 * @param {string} options.status - Filtrer par statut ('active', 'inactive')
 * @returns {Promise<Object|null>} Utilisateur trouvé ou null
 * @throws {Error} Si l'ID est invalide ou si la requête échoue
 * @example
 * // Utilisation
 * const user = await userService.findById(123, { includeProfile: true });
 */
async findById(userId, options = {}) {
  // Implémentation
}
```

---

## 🛡️ GESTION DES ERREURS

### **Pattern de gestion des erreurs**
```javascript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  // Logger l'erreur avec contexte
  logger.error('Operation failed', {
    operation: 'findById',
    userId,
    error: error.message,
    stack: error.stack
  });
  
  // Lancer une erreur formatée
  throw new Error(`Impossible de récupérer l'utilisateur ${userId}: ${error.message}`);
}
```

---

## 📊 VALIDATION DES ENTRÉES

### **Utilisation des validateurs**
```javascript
// ✅ CORRECT - Utiliser les validateurs centralisés
const { validatePaginationOptions, validateId } = require('../../utils/repository-validator');

async findAll(options = {}) {
  const validatedOptions = validatePaginationOptions(options);
  const { page, limit } = validatedOptions;
  // ...
}

async findById(userId) {
  const validatedId = validateId(userId);
  // ...
}

// ❌ INCORRECT - Validation manuelle
async findAll(options = {}) {
  const { page = 1, limit = 10 } = options;
  if (page < 1 || limit < 1) {
    throw new Error('Options invalides');
  }
  // ...
}
```

---

## 🔧 NOMMAGE DES REPOSITORIES

### **Convention de nommage**
```javascript
// ✅ CORRECT
class UsersRepository {
  async findById(id) { ... }
  async findByEmail(email) { ... }
  async create(userData) { ... }
  async update(id, userData) { ... }
  async delete(id) { ... }
}

// ❌ INCORRECT
class users_repository {
  async find_by_id(id) { ... }
  async find_by_email(email) { ... }
  async create_user(userData) { ... }
  async update_user(id, userData) { ... }
  async delete_user(id) { ... }
}
```

---

## 📋 CHECKLIST DE QUALITÉ

### **Avant de commiter le code**
- [ ] Les noms de fonctions sont en camelCase
- [ ] Les noms de classes sont en PascalCase
- [ ] Les constantes sont en UPPER_SNAKE_CASE
- [ ] Les fonctions ont une documentation JSDoc complète
- [ ] Les erreurs sont gérées avec try/catch
- [ ] Les entrées sont validées
- [ ] Les logs incluent le contexte nécessaire
- [ ] Le mapping des champs est utilisé quand nécessaire
- [ ] Les tests couvrent les cas d'erreur

---

## 🎯 EXEMPLES COMPLETS

### **Service complet standardisé**
```javascript
/**
 * Service pour la gestion des utilisateurs
 * Implémente les opérations CRUD avec validation et gestion d'erreurs
 */
class UserService {
  /**
   * Récupère un utilisateur par son ID
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object|null>} Utilisateur trouvé ou null
   * @throws {Error} Si l'ID est invalide ou si la requête échoue
   */
  async findById(userId) {
    try {
      const validatedId = validateId(userId);
      
      const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
      const result = await connection.query(query, [validatedId]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by ID', {
        userId,
        error: error.message
      });
      throw new Error(`Impossible de récupérer l'utilisateur ${userId}`);
    }
  }
}

module.exports = UserService;
```

---

## 🏆 CONCLUSION

En suivant ces conventions de standardisation :

- **Lisibilité** : Le code est plus facile à lire et comprendre
- **Maintenabilité** : Les modifications sont plus simples à effectuer
- **Cohérence** : L'ensemble du codebase suit les mêmes règles
- **Collaboration** : Les nouveaux développeurs s'intègrent plus rapidement

**Adopter ces standards est essentiel pour la qualité et l'évolutivité du projet.**
