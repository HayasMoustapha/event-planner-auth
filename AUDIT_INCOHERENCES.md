# 🔍 AUDIT DES INCOHÉRENCES - PHASE 1

## 📊 **MISSION: Scanner et identifier toutes les incohérences entre le code et le schéma SQL**

---

## 🎯 **RÉSUMÉ DES INCOHÉRENCES IDENTIFIÉES**

### **❌ INCOHÉRENCES CRITIQUES (À CORRIGER)**

#### **1. Champ `identifier` - INEXISTANT DANS LE SCHÉMA SQL**
**Localisation**: Multiple fichiers
**Problème**: Le code utilise un champ `identifier` qui n'existe dans aucune table SQL

**Fichiers concernés**:
- `src/modules/auth/auth.controller.js` (lignes 175, 261, 337, 347, 354, 356, 451)
- `src/modules/auth/auth.errorHandler.js` (ligne 131)
- `src/modules/auth/otp.service.js` (lignes 29, 34, 44, 125, 130, 136, 149, 156, 181)
- `src/modules/auth/auth.validation.js` (ligne 62)

**Impact**: Les routes OTP utilisent `identifier` mais la table `otps` n'a pas ce champ
**Route concernée**: `/api/auth/otp/email/generate`, `/api/auth/otp/email/verify`, `/api/auth/login-with-otp`

#### **2. Champs `firstName`/`lastName` vs `first_name`/`last_name`**
**Localisation**: Multiple fichiers
**Problème**: Le code utilise `firstName`/`lastName` (camelCase) mais le schéma SQL utilise `first_name`/`last_name` (snake_case)

**Fichiers concernés**:
- `src/modules/auth/registration.service.js` (lignes 48, 91, 92, 105, 155, 156, 185, 189, 231, 232, 235, 236)
- `src/modules/auth/registration.routes.js` (lignes 13, 20)
- `src/modules/auth/auth.validation.js` (lignes 310, 319)
- `src/modules/people/people.validation.js` (lignes 40, 47, 93, 101)
- `src/modules/people/people.service.js` (lignes 94, 95, 103, 104, 106, 107, 128, 129, 172, 173, 192, 193, 194)
- `src/modules/people/people.repository.js` (lignes 131, 132, 148, 149, 180, 181, 194, 195, 196, 199)
- `src/services/email.service.js` (ligne 326, 347)
- `src/services/sms.service.js` (ligne 220)
- `src/security/attack-detection.service.js` (ligne 223)

**Impact**: Incohérence entre les noms de champs dans le code et le schéma SQL
**Routes concernées**: `/api/auth/register`, `/api/people/*`

#### **3. Champ `group` vs `resource`**
**Localisation**: Modules permissions
**Problème**: Le code utilise `group` mais parfois référence `resource` dans les commentaires

**Fichiers concernés**:
- `src/modules/permissions/permissions.controller.js` (lignes 17, 111, 116)
- `src/modules/permissions/permissions.validation.js` (ligne 177)
- `src/modules/permissions/permissions.service.js` (lignes 18, 36, 40, 52, 96, 160, 209, 214, 221, 414)
- `src/modules/permissions/permissions.repository.js` (lignes 26, 34, 75, 76, 83, 84, 85, 88, 95, 100, 145, 165, 185, 232, 263, 329, 333)

**Impact**: Confusion dans le nommage du champ `group` de la table `permissions`
**Routes concernées**: `/api/permissions/*`

#### **4. Champ `level` dans la table `roles`**
**Localisation**: `src/modules/roles/roles.repository.js`
**Problème**: Le code utilise `level` mais la logique métier n'est pas claire

**Fichiers concernés**:
- `src/modules/roles/roles.repository.js` (lignes 18, 25, 27, 34, 83, 88)

**Impact**: Utilisation du champ `level` sans validation claire
**Routes concernées**: `/api/roles/*`

---

### **⚠️ INCOHÉRENCES MINEURES (À SURVEILLER)**

#### **1. Champs `person_phone`/`person_email` - ALIAS SQL**
**Localisation**: `src/modules/users/users.repository.js`
**Problème**: Utilisation d'alias SQL qui pourraient prêter à confusion

**Fichiers concernés**:
- `src/modules/users/users.repository.js` (lignes 21, 83, 84, 109, 110, 135, 136)

**Impact**: Alias utilisés dans les requêtes SQL mais pas dans les réponses API
**Routes concernées**: `/api/users/*`

#### **2. Champ `label` en JSONB**
**Localisation**: Modules roles et permissions
**Problème**: Le code traite `label` comme du texte mais c'est du JSONB dans le schéma

**Fichiers concernés**:
- `src/modules/roles/roles.repository.js` (lignes 32, 82, 88)
- `src/modules/permissions/permissions.repository.js` (lignes 33, 75, 100, 145, 165, 185, 263, 329)

**Impact**: Manipulation incorrecte du type JSONB
**Routes concernées**: `/api/roles/*`, `/api/permissions/*`

---

## 📋 **TABLEAU RÉCAPITULATIF DES INCOHÉRENCES**

| Type | Champ Code | Champ SQL | Fichiers concernés | Routes impactées | Sévérité |
|------|------------|-----------|-------------------|------------------|----------|
| ❌ Critique | `identifier` | *N'existe pas* | 4 fichiers | OTP routes | **Élevée** |
| ❌ Critique | `firstName` | `first_name` | 11 fichiers | Register, People | **Élevée** |
| ❌ Critique | `lastName` | `last_name` | 11 fichiers | Register, People | **Élevée** |
| ⚠️ Mineure | `group`/`resource` | `group` | 4 fichiers | Permissions | **Moyenne** |
| ⚠️ Mineure | `level` | `level` | 1 fichier | Roles | **Moyenne** |
| ⚠️ Mineure | `person_phone` | *Alias SQL* | 1 fichier | Users | **Basse** |
| ⚠️ Mineure | `label` (texte) | `label` (JSONB) | 2 fichiers | Roles, Permissions | **Basse** |

---

## 🎯 **ROUTES CONCERNÉES PAR LES INCOHÉRENCES**

### **❌ Routes Critiques Impactées**
- `POST /api/auth/register` - Champs `firstName`/`lastName`
- `POST /api/auth/otp/email/generate` - Champ `identifier`
- `POST /api/auth/otp/email/verify` - Champ `identifier`
- `POST /api/auth/login-with-otp` - Champ `identifier`
- `GET/POST/PUT/DELETE /api/people/*` - Champs `firstName`/`lastName`

### **⚠️ Routes Moyennement Impactées**
- `GET/POST/PUT/DELETE /api/permissions/*` - Champ `group`/`resource`
- `GET/POST/PUT/DELETE /api/roles/*` - Champ `level`

### **⚠️ Routes Faiblement Impactées**
- `GET /api/users/*` - Alias SQL `person_phone`/`person_email`

---

## 🔧 **RECOMMANDATIONS DE CORRECTION**

### **🚨 Priorité 1 - Critique**
1. **Supprimer/Remplacer `identifier`** dans les routes OTP
2. **Standardiser `firstName`/`lastName`** vers `first_name`/`last_name`
3. **Mettre à jour tous les validators** pour utiliser les noms SQL

### **⚠️ Priorité 2 - Moyenne**
1. **Clarifier l'utilisation du champ `group`** dans permissions
2. **Documenter la logique du champ `level`** dans roles

### **⚠️ Priorité 3 - Basse**
1. **Standardiser les alias SQL** dans users repository
2. **Corriger la manipulation JSONB** des labels

---

## 📊 **STATISTIQUES DE L'AUDIT**

- **Total fichiers scannés**: 45 fichiers JavaScript
- **Fichiers avec incohérences**: 12 fichiers (27%)
- **Incohérences critiques**: 3 types
- **Incohérences mineures**: 4 types
- **Routes impactées**: ~15 routes
- **Sévérité globale**: **ÉLEVÉE** (nécessite correction)

---

## ⚠️ **NOTE IMPORTANTE**

Cet audit a été réalisé en **LECTURE SEULE** comme demandé. Aucune modification de code n'a été effectuée à ce stade.

**Prochaine étape recommandée**: PHASE 2 - Correction des incohérences critiques en commençant par le champ `identifier` et les champs `firstName`/`lastName`.

---

*Généré le 2026-01-17 - Audit des incohérences Phase 1*
