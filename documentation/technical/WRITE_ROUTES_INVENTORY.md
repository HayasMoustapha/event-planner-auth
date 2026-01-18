# 📊 Inventaire des Routes d'Écriture

**Audit de cohérence transactionnelle - Étape 1**

---

## 🎯 **Objectif**

Identifier TOUTES les routes d'écriture (PUT, PATCH, DELETE, POST) et créer la matrice complète :
`route → controller → service → repository → requête SQL`

---

## 📋 **Routes d'Écriture Identifiées**

### 👑 **Module Roles**

| Route HTTP | Controller | Service | Repository | Type SQL |
|------------|-------------|----------|-------------|-----------|
| `PUT /:id` | `updateRole` | `updateRole` | `update` | UPDATE |
| `DELETE /:id` | `deleteRole` | `deleteRole` | `softDelete` | UPDATE (soft delete) |
| `POST /` | `createRole` | `createRole` | `create` | INSERT |
| `POST /:id/duplicate` | `duplicateRole` | `duplicateRole` | `create` + `findAll` | INSERT + SELECT |
| `POST /:id/permissions` | `assignPermissions` | `assignPermissions` | `assignPermissions` | INSERT |
| `DELETE /:id/permissions` | `removeAllPermissions` | `removeAllPermissions` | `removeAllPermissions` | DELETE |

### 🔑 **Module Permissions**

| Route HTTP | Controller | Service | Repository | Type SQL |
|------------|-------------|----------|-------------|-----------|
| `PUT /:id` | `updatePermission` | `updatePermission` | `update` | UPDATE |
| `DELETE /:id` | `deletePermission` | `deletePermission` | `softDelete` | UPDATE (soft delete) |
| `POST /` | `createPermission` | `createPermission` | `create` | INSERT |
| `POST /generate` | `generateResourcePermissions` | `generateResourcePermissions` | `create` | INSERT |

### 👥 **Module People**

| Route HTTP | Controller | Service | Repository | Type SQL |
|------------|-------------|----------|-------------|-----------|
| `PUT /:id` | `update` | `update` | `update` | UPDATE |
| `PATCH /:id/status` | `updateStatus` | `updateStatus` | `update` | UPDATE |
| `DELETE /:id` | `delete` | `delete` | `softDelete` | UPDATE (soft delete) |
| `POST /` | `create` | `create` | `create` | INSERT |

### 📋 **Module Menus**

| Route HTTP | Controller | Service | Repository | Type SQL |
|------------|-------------|----------|-------------|-----------|
| `PUT /:id` | `updateMenu` | `updateMenu` | `update` | UPDATE |
| `DELETE /:id` | `deleteMenu` | `deleteMenu` | `softDelete` | UPDATE (soft delete) |
| `POST /` | `createMenu` | `createMenu` | `create` | INSERT |
| `POST /:id/duplicate` | `duplicateMenu` | `duplicateMenu` | `create` + `findAll` | INSERT + SELECT |
| `POST /reorder` | `reorderMenus` | `reorderMenus` | `updateMultiple` | UPDATE (multiple) |
| `POST /:id/permissions` | `assignMenuPermissions` | `assignMenuPermissions` | `assignMenuPermissions` | INSERT |
| `DELETE /:id/permissions` | `removeAllMenuPermissions` | `removeAllMenuPermissions` | `removeAllMenuPermissions` | DELETE |
| `PATCH /:id/status` | `updateMenuStatus` | `updateMenuStatus` | `update` | UPDATE |

### 👤 **Module Users**

| Route HTTP | Controller | Service | Repository | Type SQL |
|------------|-------------|----------|-------------|-----------|
| `PUT /:id` | `update` | `update` | `update` | UPDATE |
| `PATCH /:id/password` | `updatePassword` | `updatePassword` | `updatePassword` | UPDATE |
| `PATCH /:id/status` | `updateStatus` | `updateStatus` | `update` | UPDATE |
| `DELETE /:id` | `delete` | `delete` | `softDelete` | UPDATE (soft delete) |
| `POST /` | `create` | `create` | `create` | INSERT |

### 🔐 **Module Authentification**

| Route HTTP | Controller | Service | Repository | Type SQL |
|------------|-------------|----------|-------------|-----------|
| `POST /login` | `login` | `login` | `findByEmail` + `createSession` | SELECT + INSERT |
| `POST /register` | `register` | `register` | `create` + `createUser` | INSERT |
| `POST /verify-email` | `verifyEmail` | `verifyEmail` | `verifyEmail` + `update` | SELECT + UPDATE |
| `POST /refresh-token` | `refreshToken` | `refreshToken` | `findByRefreshToken` + `updateSession` | SELECT + UPDATE |
| `POST /logout` | `logout` | `logout` | `deleteSession` | DELETE |
| `POST /change-password` | `changePassword` | `changePassword` | `updatePassword` | UPDATE |
| `POST /otp/email/generate` | `generateEmailOtp` | `generateEmailOtp` | `create` | INSERT |
| `POST /otp/email/verify` | `verifyEmailOtp` | `verifyEmailOtp` | `verifyOtp` + `update` | SELECT + UPDATE |
| `POST /otp/password-reset/verify` | `resetPasswordWithOtp` | `resetPasswordWithOtp` | `verifyOtp` + `updatePassword` | SELECT + UPDATE |

### 🔐 **Module Authorizations**

| Route HTTP | Controller | Service | Repository | Type SQL |
|------------|-------------|----------|-------------|-----------|
| `POST /assign/role` | `assignRole` | `assignRole` | `assignRole` | INSERT |
| `POST /remove/role` | `removeRole` | `removeRole` | `removeRole` | DELETE |
| `POST /assign/permission` | `assignPermission` | `assignPermission` | `assignPermission` | INSERT |
| `POST /remove/permission` | `removePermission` | `removePermission` | `removePermission` | DELETE |

---

## 📊 **Statistiques de l'Inventaire**

### 🎯 **Répartition par Type**

| Type d'Opération | Nombre de Routes | Modules |
|------------------|------------------|----------|
| **PUT** | 5 | roles, permissions, people, menus, users |
| **PATCH** | 5 | people (status), menus (status), users (password, status), auth (change-password) |
| **DELETE** | 7 | roles, permissions, people, menus, users, auth (logout), menus (permissions) |
| **POST (création)** | 8 | roles, permissions, people, menus, users, auth (register, otp) |
| **POST (opération)** | 12 | auth (login, verify, refresh), roles (duplicate, assign), menus (duplicate, reorder, assign), authorizations |

### 📈 **Total des Routes d'Écriture**

| Catégorie | Nombre |
|-----------|--------|
| **PUT** | 5 |
| **PATCH** | 5 |
| **DELETE** | 7 |
| **POST (création)** | 8 |
| **POST (opération)** | 12 |
| **TOTAL** | **37 routes d'écriture** |

---

## 🔍 **Points d'Attention Critiques**

### ⚠️ **Routes à Audit Prioritaire**

1. **Soft Deletes** (UPDATE avec `deleted_at`) :
   - `DELETE /roles/:id`
   - `DELETE /permissions/:id`
   - `DELETE /people/:id`
   - `DELETE /menus/:id`
   - `DELETE /users/:id`

2. **Mises à jour de statut** (PATCH) :
   - `PATCH /people/:id/status`
   - `PATCH /menus/:id/status`
   - `PATCH /users/:id/status`

3. **Opérations complexes** :
   - `POST /roles/:id/duplicate`
   - `POST /menus/:id/duplicate`
   - `POST /menus/reorder`
   - `POST /auth/refresh-token`

4. **Gestion des permissions** :
   - `POST /roles/:id/permissions`
   - `DELETE /roles/:id/permissions`
   - `POST /menus/:id/permissions`
   - `DELETE /menus/:id/permissions`

---

## 🎯 **Prochaines Étapes**

### Étape 2 - Audit des Chaînes d'Écriture

Pour chaque route identifiée, je vais vérifier :

1. **Le service appelle bien le repository**
2. **La méthode repository exécute une requête SQL réelle**
3. **La requête est awaitée**
4. **Le résultat SQL est utilisé (rowCount / RETURNING)**

### 🔍 **Anomalies à Détecter**

- Faux succès (return true sans DB)
- Logique simulée
- Erreurs silencieuses
- Requêtes non exécutées
- rowCount non vérifié

---

## 📝 **Notes d'Audit**

- **37 routes d'écriture** identifiées
- **5 modules** principaux concernés
- **Soft deletes** sur 5 tables différentes
- **Opérations complexes** nécessitant une attention particulière
- **Gestion des permissions** avec insert/delete multiples

---

*Inventaire terminé - Prêt pour l'audit détaillé de chaque chaîne d'écriture* ✅

---

*Date: $(date)*
*Auditeur: Senior Backend Architect*
