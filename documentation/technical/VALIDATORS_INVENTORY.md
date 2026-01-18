# 📋 INVENTAIRE DES VALIDATORS - SCHÉMAS DE REQUÊTES

## 🎯 OBJECTIF
Lister les champs exacts attendus par chaque validateur pour synchroniser les collections Postman.

---

## 🔐 MODULE AUTH - AUTHENTIFICATION & INSCRIPTION

### POST /api/auth/login - validateLogin
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | body | ✅ | email, max:254 | Format email valide |
| password | body | ✅ | min:8, regex complexité | Mot de passe complexe |

### POST /api/auth/login-otp - validateLoginWithOtp
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| contactInfo | body | ✅ | min:3, max:254 | Email ou téléphone |
| code | body | ✅ | min:4, max:10, numeric | Code OTP numérique |
| type | body | ❌ | enum: [email, phone] | Type d'OTP |

### POST /api/auth/refresh-token - validateRefreshToken
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| refreshToken | body | ✅ | min:10 | Token de rafraîchissement |

### POST /api/auth/validate-token - validateToken
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| token | body | ✅ | min:10 | Token JWT |

### POST /api/auth/otp/email/generate - validateGenerateEmailOtp
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | body | ✅ | email, max:254 | Format email valide |
| userId | body | ❌ | min:1, integer | ID utilisateur |
| expiresInMinutes | body | ❌ | min:1, max:60, integer | Durée validité OTP |

### POST /api/auth/otp/phone/generate - validateGeneratePhoneOtp
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| phone | body | ✅ | mobilePhone, min:10, max:15 | Format téléphone international |
| userId | body | ❌ | min:1, integer | ID utilisateur |
| expiresInMinutes | body | ❌ | min:1, max:60, integer | Durée validité OTP |

### POST /api/auth/otp/email/verify - validateVerifyEmailOtp
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | body | ✅ | email, max:254 | Format email valide |
| code | body | ✅ | min:4, max:10, numeric | Code OTP numérique |
| userId | body | ❌ | min:1, integer | ID utilisateur |

### POST /api/auth/otp/phone/verify - validateVerifyPhoneOtp
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| phone | body | ✅ | mobilePhone, min:10, max:15 | Format téléphone international |
| code | body | ✅ | min:4, max:10, numeric | Code OTP numérique |
| userId | body | ❌ | min:1, integer | ID utilisateur |

### POST /api/auth/otp/password-reset/generate - validateGeneratePasswordResetOtp
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | body | ✅ | email, max:254 | Format email valide |
| userId | body | ❌ | min:1, integer | ID utilisateur |
| expiresInMinutes | body | ❌ | min:1, max:60, integer | Durée validité OTP |

### POST /api/auth/otp/password-reset/verify - validateResetPasswordWithOtp
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | body | ✅ | email, max:254 | Format email valide |
| code | body | ✅ | min:4, max:10, numeric | Code OTP numérique |
| newPassword | body | ✅ | min:8, regex complexité | Nouveau mot de passe complexe |
| userId | body | ❌ | min:1, integer | ID utilisateur |

### POST /api/auth/register - validateRegister
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| first_name | body | ✅ | min:2, max:50, regex lettres | Prénom (2-50 caractères) |
| last_name | body | ❌ | max:50, regex lettres | Nom de famille (max 50) |
| email | body | ✅ | email, max:254 | Format email valide |
| phone | body | ❌ | regex téléphone | Format téléphone international |
| password | body | ✅ | min:8, regex complexité | Mot de passe complexe |
| username | body | ❌ | min:3, max:20, regex alphanum | Username alphanumérique |
| userCode | body | ❌ | max:50, regex alphanum | Code utilisateur |

### POST /api/auth/verify-email - validateVerifyEmail
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | body | ✅ | email, max:254 | Format email valide |
| otpCode | body | ✅ | min:4, max:10, numeric | Code OTP numérique |

### POST /api/auth/resend-otp - validateResendOtp
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | body | ✅ | email, max:254 | Format email valide |

### POST /api/auth/login-after-verification - validateLogin
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | body | ✅ | email, max:254 | Format email valide |
| password | body | ✅ | min:8, regex complexité | Mot de passe complexe |

### GET /api/auth/check-email/:email - validateEmailParam
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | param | ✅ | email | Format email valide |

### GET /api/auth/check-username/:username - validateUsernameParam
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| username | param | ✅ | regex alphanum | Format username valide |

### POST /api/auth/change-password - validateChangePassword
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| currentPassword | body | ✅ | min:1 | Mot de passe actuel |
| newPassword | body | ✅ | min:8, regex complexité | Nouveau mot de passe complexe |
| userId | body | ❌ | min:1, integer | ID utilisateur |

---

## 👥 MODULE PEOPLE - GESTION DES PERSONNES

### POST /api/people/ - validateCreate
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| first_name | body | ✅ | min:2, max:100, regex lettres | Prénom (2-100 caractères) |
| last_name | body | ✅ | min:2, max:100, regex lettres | Nom de famille (2-100) |
| email | body | ✅ | email, max:254 | Format email valide |
| phone | body | ❌ | regex téléphone | Format téléphone international |
| photo | body | ❌ | URL | URL de la photo |
| status | body | ❌ | enum: [active, inactive] | Statut de la personne |

### PUT /api/people/:id - validateUpdate
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID personne (paramètre URL) |
| first_name | body | ❌ | min:2, max:100, regex lettres | Prénom (2-100) |
| last_name | body | ❌ | min:2, max:100, regex lettres | Nom de famille (2-100) |
| email | body | ❌ | email, max:254 | Format email valide |
| phone | body | ❌ | regex téléphone | Format téléphone international |
| photo | body | ❌ | URL | URL de la photo |
| status | body | ❌ | enum: [active, inactive] | Statut de la personne |

### PATCH /api/people/:id/status - validateStatusUpdate
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID personne (paramètre URL) |
| status | body | ✅ | enum: [active, inactive] | Statut de la personne |

---

## 👤 MODULE USERS - GESTION DES UTILISATEURS

### POST /api/users/ - validateCreate
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| first_name | body | ✅ | min:2, max:50, regex lettres | Prénom (2-50 caractères) |
| last_name | body | ✅ | min:2, max:50, regex lettres | Nom de famille (2-50) |
| email | body | ✅ | email, max:254 | Format email valide |
| phone | body | ❌ | regex téléphone | Format téléphone international |
| password | body | ✅ | min:8, regex complexité | Mot de passe complexe |
| username | body | ✅ | min:3, max:20, regex alphanum | Username unique |
| userCode | body | ❌ | max:50, regex alphanum | Code utilisateur |
| status | body | ❌ | enum: [active, inactive] | Statut utilisateur |

### PUT /api/users/:id - validateUpdate
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID utilisateur (paramètre URL) |
| first_name | body | ❌ | min:2, max:50, regex lettres | Prénom (2-50) |
| last_name | body | ❌ | min:2, max:50, regex lettres | Nom de famille (2-50) |
| email | body | ❌ | email, max:254 | Format email valide |
| phone | body | ❌ | regex téléphone | Format téléphone international |
| status | body | ❌ | enum: [active, inactive] | Statut utilisateur |

### PATCH /api/users/:id/password - validatePasswordUpdate
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID utilisateur (paramètre URL) |
| password | body | ✅ | min:8, regex complexité | Nouveau mot de passe |

### PATCH /api/users/:id/status - validateStatusUpdate
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID utilisateur (paramètre URL) |
| status | body | ✅ | enum: [active, inactive] | Statut utilisateur |

### POST /api/users/reset-password - validatePasswordReset
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID utilisateur (paramètre URL) |
| password | body | ✅ | min:8, regex complexité | Nouveau mot de passe |

---

## 🔐 MODULE SESSIONS - GESTION DES SESSIONS

### POST /api/sessions/create - validateCreateSession
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| userId | body | ✅ | min:1, integer | ID utilisateur |
| deviceInfo | body | ❌ | string | Informations appareil |
| ipAddress | body | ❌ | string | Adresse IP |
| userAgent | body | ❌ | string | User agent |
| expiresIn | body | ❌ | min:1, integer | Durée session (secondes) |

### POST /api/sessions/refresh - validateRefreshSession
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| refreshToken | body | ✅ | string | Token de rafraîchissement |
| expiresIn | body | ❌ | integer | Durée tokens (secondes) |

### POST /api/sessions/password-reset/verify - validateVerifyPasswordResetToken
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| token | body | ✅ | string | Token de réinitialisation |

### POST /api/sessions/password-reset/generate - validateGeneratePasswordResetToken
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| email | body | ✅ | email, max:254 | Format email valide |

---

## 🔑 MODULE PERMISSIONS - GESTION DES PERMISSIONS

### GET /api/permissions/ - validateGetPermissions
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| page | query | ❌ | min:1, integer | Numéro page |
| limit | query | ❌ | min:1, max:100, integer | Limite par page |
| search | query | ❌ | max:100 | Terme recherche |
| group | query | ❌ | max:50 | Groupe de permissions |
| sortBy | query | ❌ | enum: [code, description, group, created_at, updated_at] | Champ tri |
| sortOrder | query | ❌ | enum: [ASC, DESC] | Ordre tri |

### GET /api/permissions/:id - validateGetPermissionById
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID permission |

### GET /api/permissions/user/:userId? - validateGetUserPermissions
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| userId | param | ❌ | min:1, integer | ID utilisateur |

### GET /api/permissions/role/:roleId - validateGetRolePermissions
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| roleId | param | ✅ | min:1, integer | ID rôle |

### GET /api/permissions/resource/:resource/actions - validateGetActionsByResource
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| resource | param | ✅ | min:2, max:50 | Nom ressource |

### GET /api/permissions/check - validateCheckUserPermission
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| userId | body | ❌ | min:1, integer | ID utilisateur |
| permission | body | ✅ | string | Nom permission |

### POST /api/permissions/ - validateCreatePermission
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| code | body | ✅ | min:3, max:100, regex avec points | Code permission (ex: user.read) |
| description | body | ✅ | max:500 | Description permission |
| group | body | ✅ | max:50 | Groupe de permission |
| label | body | ❌ | JSON | Label multilingue |

### PUT /api/permissions/:id - validateUpdatePermission
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID permission |
| code | body | ❌ | min:3, max:100, regex avec points | Code permission |
| description | body | ❌ | max:500 | Description permission |
| group | body | ❌ | max:50 | Groupe de permission |
| label | body | ❌ | JSON | Label multilingue |

### POST /api/permissions/generate - validateGenerateResourcePermissions
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| group | body | ✅ | max:50 | Nom groupe ressource |
| actions | body | ✅ | array, min:1 | Liste actions à générer |

---

## 👑 MODULE ROLES - GESTION DES RÔLES

### GET /api/roles/ - validateGetRoles
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| page | query | ❌ | min:1, integer | Numéro page |
| limit | query | ❌ | min:1, max:100, integer | Limite par page |
| search | query | ❌ | max:100 | Terme recherche |
| sortBy | query | ❌ | enum: [code, label, created_at, updated_at] | Champ tri |
| sortOrder | query | ❌ | enum: [ASC, DESC] | Ordre tri |

### GET /api/roles/:id - validateGetRoleById
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID rôle |

### GET /api/roles/user/:userId? - validateGetUserRoles
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| userId | param | ❌ | min:1, integer | ID utilisateur |

### POST /api/roles/ - validateCreateRole
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| code | body | ✅ | max:255, unique | Code rôle unique |
| label | body | ✅ | JSON | Label multilingue |
| description | body | ❌ | JSON | Description rôle |
| level | body | ❌ | integer | Niveau hiérarchique |

### PUT /api/roles/:id - validateUpdateRole
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID rôle |
| code | body | ❌ | max:255 | Code rôle |
| label | body | ❌ | JSON | Label multilingue |
| description | body | ❌ | JSON | Description rôle |
| level | body | ❌ | integer | Niveau hiérarchique |

### POST /api/roles/:id/permissions - validateAssignPermissions
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID rôle |
| permissions | body | ✅ | array, min:1 | Liste IDs permissions |

---

## 🔐 MODULE AUTHORIZATIONS - VÉRIFICATION DES AUTORISATIONS

### POST /api/authorizations/check/permission - validateCheckPermission
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| userId | body | ❌ | min:1, integer | ID utilisateur |
| permission | body | ✅ | string | Nom permission |

### POST /api/authorizations/check/any-permission - validateCheckPermissions
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| userId | body | ❌ | min:1, integer | ID utilisateur |
| permissions | body | ✅ | array, min:1 | Liste permissions |

### POST /api/authorizations/check/role - validateCheckRole
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| userId | body | ❌ | min:1, integer | ID utilisateur |
| role | body | ✅ | string | Nom rôle |

### POST /api/authorizations/check/policy - validateCheckPolicy
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| userId | body | ❌ | min:1, integer | ID utilisateur |
| policy | body | ✅ | object | Politique complexe |

---

## 📋 MODULE MENUS - GESTION DES MENUS

### GET /api/menus/ - validateGetMenus
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| page | query | ❌ | min:1, integer | Numéro page |
| limit | query | ❌ | min:1, max:100, integer | Limite par page |
| search | query | ❌ | max:100 | Terme recherche |
| sortBy | query | ❌ | enum: [code, label, created_at, updated_at] | Champ tri |
| sortOrder | query | ❌ | enum: [ASC, DESC] | Ordre tri |

### GET /api/menus/:id - validateGetMenuById
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID menu |

### POST /api/menus/ - validateCreateMenu
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| label | body | ✅ | max:255, unique | Label menu unique |
| icon | body | ❌ | string | Icône menu |
| url | body | ❌ | string | URL menu |
| parentId | body | ❌ | integer | Menu parent |
| order | body | ❌ | integer | Ordre affichage |
| status | body | ❌ | enum: [active, inactive] | Statut menu |

### PUT /api/menus/:id - validateUpdateMenu
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID menu |
| label | body | ❌ | max:255 | Label menu |
| icon | body | ❌ | string | Icône menu |
| url | body | ❌ | string | URL menu |
| parentId | body | ❌ | integer | Menu parent |
| order | body | ❌ | integer | Ordre affichage |
| status | body | ❌ | enum: [active, inactive] | Statut menu |

### POST /api/menus/:id/permissions - validateAssignMenuPermissions
| Champ | Type | Obligatoire | Contraintes | Description |
|-------|------|-------------|------------|-------------|
| id | param | ✅ | min:1, integer | ID menu |
| permissions | body | ✅ | array, min:1 | Liste IDs permissions |

---

## 📊 INCOHÉRENCES IDENTIFIÉES

### 🔍 **Nommage des champs**
- **Support double format** : `first_name` ET `firstName` acceptés
- **Regex complexité mot de passe** : `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$`
- **Format téléphone** : Support international avec `+`
- **Codes permissions** : Supporte points (ex: `user.read`)

### ⚠️ **Points d'attention pour Postman**
1. **Champs obligatoires vs optionnels** : Bien vérifier les champs requis
2. **Types de données** : string, integer, array, JSON, enum
3. **Contraintes de longueur** : Respecter les min/max
4. **Formats regex** : Respecter les patterns exacts
5. **Paramètres de query** : Utiliser `?` pour les optionnels
6. **Enums** : Respecter les valeurs exactes (ex: [active, inactive])

### 🎯 **Prochaine étape**
Comparer cet inventaire avec les collections Postman existantes pour identifier les incohérences.

---

*Inventaire des validateurs généré le 2026-01-18 à partir du code source*
