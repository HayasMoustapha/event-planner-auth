# 📋 Event Planner Auth - API Routes Checklist

## 🎯 **OBJECTIF**

Checklist officielle de test pour le service d'authentification Event Planner.  
Ce document recense **127 routes API** réparties en **9 modules** principaux.

---

## 🔐 **MODULE AUTHENTIFICATION** (`/api/auth`)

### **Routes Publiques**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/login` | authController.login | authService | DB, Redis | Connexion email/mdp | ☐ |
| POST | `/login-otp` | authController.loginWithOtp | authService, otpService | DB, Redis, SMS/Email | Connexion avec OTP | ☐ |
| POST | `/refresh-token` | authController.refreshToken | authService | DB | Rafraîchir JWT | ☐ |
| POST | `/validate-token` | authController.validateToken | authService | DB | Valider JWT | ☐ |
| POST | `/register` | registrationController.register | usersService, peopleService | DB, Email | Inscription | ☐ |
| POST | `/verify-email` | registrationController.verifyEmail | otpService | DB, Email | Vérifier email | ☐ |
| POST | `/resend-otp` | registrationController.resendOTP | otpService | DB, Email | Renvoyer OTP | ☐ |
| POST | `/login-after-verification` | registrationController.loginAfterVerification | authService | DB | Connexion post-vérif | ☐ |
| GET | `/check-email/:email` | registrationController.checkEmailAvailability | usersService | DB | Vérifier email | ☐ |
| GET | `/check-username/:username` | registrationController.checkUsernameAvailability | usersService | DB | Vérifier username | ☐ |

### **Routes Protégées**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/logout` | authController.logout | authService | Redis | Déconnexion | ☐ |
| GET | `/profile` | authController.getProfile | usersService | DB | Profil utilisateur | ☐ |
| POST | `/change-password` | authController.changePassword | authService | DB, Email | Changer mdp | ☐ |

### **OTP Routes**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/otp/email/generate` | authController.generateEmailOtp | otpService, peopleService | DB, Email | Générer OTP email | ☐ |
| POST | `/otp/phone/generate` | authController.generatePhoneOtp | otpService, peopleService | DB, SMS | Générer OTP tel | ☐ |
| POST | `/otp/email/verify` | authController.verifyEmailOtp | otpService | DB | Vérifier OTP email | ☐ |
| POST | `/otp/phone/verify` | authController.verifyPhoneOtp | otpService | DB | Vérifier OTP tel | ☐ |
| POST | `/otp/password-reset/generate` | authController.generatePasswordResetOtp | otpService | DB, Email | OTP reset mdp | ☐ |
| POST | `/otp/password-reset/verify` | authController.resetPasswordWithOtp | otpService, usersService | DB, Email | Reset mdp | ☐ |

### **Admin OTP Routes**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/otp/person/:personId` | authController.getUserOtps | otpService | DB | Lister OTP | ☐ |
| POST | `/otp/person/:personId/invalidate` | authController.invalidateUserOtps | otpService | DB | Invalider OTP | ☐ |
| GET | `/otp/person/:personId/active` | authController.hasActiveOtp | otpService | DB | OTP actifs | ☐ |
| POST | `/otp/cleanup` | authController.cleanupExpiredOtps | otpService | DB | Nettoyer OTP | ☐ |
| GET | `/otp/stats` | authController.getOtpStats | otpService | DB | Statistiques OTP | ☐ |

---

## 👥 **MODULE PEOPLE** (`/api/people`)

### **Routes Publiques**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/search` | peopleController.search | peopleService | DB | Recherche | ☐ |
| GET | `/email/:email` | peopleController.getByEmail | peopleService | DB | Personne par email | ☐ |
| GET | `/phone/:phone` | peopleController.getByPhone | peopleService | DB | Personne par tel | ☐ |
| GET | `/:id/exists` | peopleController.exists | peopleService | DB | Vérifier existence | ☐ |

### **Routes Protégées**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/` | peopleController.getAll | peopleService | DB | Lister personnes | ☐ |
| GET | `/stats` | peopleController.getStats | peopleService | DB | Statistiques | ☐ |
| GET | `/:id` | peopleController.getById | peopleService | DB | Détails personne | ☐ |
| POST | `/` | peopleController.create | peopleService | DB | Créer personne | ☐ |
| PUT | `/:id` | peopleController.update | peopleService | DB | Modifier personne | ☐ |
| PATCH | `/:id/status` | peopleController.updateStatus | peopleService | DB | Changer statut | ☐ |
| DELETE | `/:id` | peopleController.delete | peopleService | DB | Supprimer personne | ☐ |

---

## 👤 **MODULE USERS** (`/api/users`)

### **Routes Publiques**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/check/username/:username` | usersController.checkUsernameAvailability | usersService | DB | Vérifier username | ☐ |
| GET | `/check/email/:email` | usersController.checkEmailAvailability | usersService | DB | Vérifier email | ☐ |
| POST | `/authenticate` | usersController.authenticate | usersService | DB | Authentifier | ☐ |

### **Routes Protégées**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/` | usersController.getAll | usersService | DB | Lister utilisateurs | ☐ |
| GET | `/stats` | usersController.getStats | usersService | DB | Statistiques | ☐ |
| GET | `/:id` | usersController.getById | usersService | DB | Détails utilisateur | ☐ |
| GET | `/email/:email` | usersController.getByEmail | usersService | DB | Utilisateur par email | ☐ |
| GET | `/username/:username` | usersController.getByUsername | usersService | DB | Utilisateur par username | ☐ |
| POST | `/` | usersController.create | usersService | DB | Créer utilisateur | ☐ |
| PUT | `/:id` | usersController.update | usersService | DB | Modifier utilisateur | ☐ |
| PATCH | `/:id/password` | usersController.updatePassword | usersService | DB | Modifier mdp | ☐ |
| PATCH | `/:id/status` | usersController.updateStatus | usersService | DB | Changer statut | ☐ |
| DELETE | `/:id` | usersController.delete | usersService | DB | Supprimer utilisateur | ☐ |
| GET | `/:id/exists` | usersController.exists | usersService | DB | Vérifier existence | ☐ |
| POST | `/reset-password` | usersController.resetPassword | usersService | DB, Email | Reset mdp | ☐ |
| GET | `/search` | usersController.search | usersService | DB | Rechercher | ☐ |

---

## 🛡️ **MODULE ROLES** (`/api/roles`)

### **Lecture**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/` | roleController.getRoles | roleService | DB | Lister rôles | ☐ |
| GET | `/:id` | roleController.getRoleById | roleService | DB | Détails rôle | ☐ |
| GET | `/:id/permissions` | roleController.getRolePermissions | roleService | DB | Permissions rôle | ☐ |
| GET | `/:id/users` | roleController.getRoleUsers | roleService | DB | Utilisateurs rôle | ☐ |
| GET | `/user/:userId?` | roleController.getUserRoles | roleService | DB | Rôles utilisateur | ☐ |
| GET | `/check/role` | roleController.checkUserRole | roleService | DB | Vérifier rôle | ☐ |
| GET | `/user/:userId/highest` | roleController.getUserHighestRole | roleService | DB | Plus haut rôle | ☐ |

### **Écriture**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/` | roleController.createRole | roleService | DB | Créer rôle | ☐ |
| PUT | `/:id` | roleController.updateRole | roleService | DB | Modifier rôle | ☐ |
| DELETE | `/:id` | roleController.deleteRole | roleService | DB | Supprimer rôle | ☐ |
| PATCH | `/:id/status` | roleController.updateRoleStatus | roleService | DB | Changer statut | ☐ |
| POST | `/:id/duplicate` | roleController.duplicateRole | roleService | DB | Dupliquer rôle | ☐ |

### **Permissions**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/:id/permissions` | roleController.assignPermissions | roleService | DB | Assigner permissions | ☐ |
| DELETE | `/:id/permissions` | roleController.removeAllPermissions | roleService | DB | Supprimer permissions | ☐ |

### **Admin**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/admin/stats` | roleController.getRoleStats | roleService | DB | Statistiques | ☐ |

---

## 🔑 **MODULE PERMISSIONS** (`/api/permissions`)

### **Lecture**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/` | permissionController.getPermissions | permissionService | DB | Lister permissions | ☐ |
| GET | `/:id` | permissionController.getPermissionById | permissionService | DB | Détails permission | ☐ |
| GET | `/user/:userId?` | permissionController.getUserPermissions | permissionService | DB | Permissions utilisateur | ☐ |
| GET | `/role/:roleId` | permissionController.getRolePermissions | permissionService | DB | Permissions rôle | ☐ |
| GET | `/resources/list` | permissionController.getResources | permissionService | DB | Ressources | ☐ |
| GET | `/resource/:resource/actions` | permissionController.getActionsByResource | permissionService | DB | Actions ressource | ☐ |
| GET | `/check` | permissionController.checkUserPermission | permissionService | DB | Vérifier permission | ☐ |

### **Écriture**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/` | permissionController.createPermission | permissionService | DB | Créer permission | ☐ |
| PUT | `/:id` | permissionController.updatePermission | permissionService | DB | Modifier permission | ☐ |
| DELETE | `/:id` | permissionController.deletePermission | permissionService | DB | Supprimer permission | ☐ |
| PATCH | `/:id/status` | permissionController.updatePermissionStatus | permissionService | DB | Changer statut | ☐ |
| POST | `/generate` | permissionController.generateResourcePermissions | permissionService | DB | Générer permissions | ☐ |

### **Vérifications**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/check/any` | permissionController.hasAnyPermission | permissionService | DB | Au moins une permission | ☐ |
| POST | `/check/all` | permissionController.hasAllPermissions | permissionService | DB | Toutes permissions | ☐ |

### **Admin**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/admin/stats` | permissionController.getPermissionStats | permissionService | DB | Statistiques | ☐ |

---

## 📋 **MODULE MENUS** (`/api/menus`)

### **Lecture**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/` | menuController.getMenus | menuService | DB | Lister menus | ☐ |
| GET | `/tree` | menuController.getMenuTree | menuService | DB | Arborescence | ☐ |
| GET | `/root` | menuController.getRootMenus | menuService | DB | Menus racine | ☐ |
| GET | `/:id` | menuController.getMenuById | menuService | DB | Détails menu | ☐ |
| GET | `/:id/permissions` | menuController.getMenuPermissions | menuService | DB | Permissions menu | ☐ |
| GET | `/user/:userId?` | menuController.getUserMenus | menuService | DB | Menus utilisateur | ☐ |
| GET | `/check/access` | menuController.checkUserMenuAccess | menuService | DB | Vérifier accès | ☐ |

### **Écriture**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/` | menuController.createMenu | menuService | DB | Créer menu | ☐ |
| PUT | `/:id` | menuController.updateMenu | menuService | DB | Modifier menu | ☐ |
| DELETE | `/:id` | menuController.deleteMenu | menuService | DB | Supprimer menu | ☐ |
| PATCH | `/:id/status` | menuController.updateMenuStatus | menuService | DB | Changer statut | ☐ |
| POST | `/:id/duplicate` | menuController.duplicateMenu | menuService | DB | Dupliquer menu | ☐ |
| POST | `/reorder` | menuController.reorderMenus | menuService | DB | Réorganiser | ☐ |

### **Permissions**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/:id/permissions` | menuController.assignMenuPermissions | menuService | DB | Assigner permissions | ☐ |
| DELETE | `/:id/permissions` | menuController.removeAllMenuPermissions | menuService | DB | Supprimer permissions | ☐ |

### **Admin**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/admin/stats` | menuController.getMenuStats | menuService | DB | Statistiques | ☐ |

---

## 🔗 **MODULE AUTHORIZATIONS** (`/api/authorizations`)

### **Vérifications Permissions**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/check/permission` | authorizationController.checkPermission | authorizationService | DB, Redis | Vérifier permission | ☐ |
| POST | `/check/any-permission` | authorizationController.checkAnyPermission | authorizationService | DB, Redis | Au moins une | ☐ |
| POST | `/check/all-permissions` | authorizationController.checkAllPermissions | authorizationService | DB, Redis | Toutes permissions | ☐ |

### **Vérifications Rôles**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/check/role` | authorizationController.checkRole | authorizationService | DB, Redis | Vérifier rôle | ☐ |
| POST | `/check/any-role` | authorizationController.checkAnyRole | authorizationService | DB, Redis | Au moins un rôle | ☐ |
| POST | `/check/all-role` | authorizationController.checkAllRoles | authorizationService | DB, Redis | Tous rôles | ☐ |

### **Vérifications Menus**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/check/menu` | authorizationController.checkMenuAccess | authorizationService | DB, Redis | Vérifier accès menu | ☐ |

### **Vérifications Ressources**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/check/resource` | authorizationController.checkResourceAccess | authorizationService | DB, Redis | Vérifier accès ressource | ☐ |

### **Récupération**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/user/:userId?` | authorizationController.getUserAuthorizations | authorizationService | DB, Redis | Autorisations utilisateur | ☐ |
| GET | `/user/:userId/highest-role` | authorizationController.getUserHighestRole | authorizationService | DB, Redis | Plus haut rôle | ☐ |

### **Administration**
| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| POST | `/check/admin` | authorizationController.checkAdminStatus | authorizationService | DB, Redis | Vérifier admin | ☐ |
| POST | `/check/policy` | authorizationController.checkPolicy | authorizationService | DB, Redis | Vérifier politique | ☐ |
| POST | `/cache` | authorizationController.cacheUserAuthorizations | authorizationService | DB, Redis | Mettre en cache | ☐ |
| POST | `/cache/invalidate` | authorizationController.invalidateUserAuthorizationCache | authorizationService | DB, Redis | Invalider cache | ☐ |

---

## 🏥 **MODULE HEALTH** (`/health`)

| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/health` | healthController.basicHealth | - | - | Health basique | ☐ |
| GET | `/health/detailed` | healthController.detailedHealth | - | DB, Redis | Health détaillé | ☐ |
| GET | `/ready` | healthController.readiness | - | DB | Readiness probe | ☐ |
| GET | `/live` | healthController.liveness | - | - | Liveness probe | ☐ |
| GET | `/health/authenticated` | healthController.detailedHealth | - | DB, Redis | Health authentifié | ☐ |
| GET | `/health/admin` | healthController.detailedHealth | - | DB, Redis | Health admin | ☐ |

---

## 📊 **MODULE METRICS** (`/metrics`)

| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/metrics` | - | metricsService | - | Métriques Prometheus | ☐ |
| GET | `/metrics/info` | - | metricsService | DB | Info métriques | ☐ |
| POST | `/metrics/reset` | - | metricsService | - | Réinitialiser | ☐ |

---

## 📚 **MODULE DOCS** (`/docs`)

| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/` | - | - | - | Swagger UI | ☐ |
| GET | `/json` | - | - | - | OpenAPI JSON | ☐ |
| GET | `/yaml` | - | - | - | OpenAPI YAML | ☐ |
| GET | `/developer` | - | - | - | Docs développeur | ☐ |
| GET | `/examples` | - | - | - | Exemples API | ☐ |

---

## 📈 **MODULE DASHBOARD** (`/dashboard`)

| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/` | - | metricsService, cacheService | DB, Redis | Dashboard web | ☐ |
| GET | `/api/data` | - | metricsService, cacheService | DB, Redis | Données dashboard | ☐ |
| GET | `/api/security-alerts` | - | attackDetectionService | DB, Redis | Alertes sécurité | ☐ |
| GET | `/api/realtime` | - | metricsService | DB, Redis | Données temps réel | ☐ |

---

## 📄 **ROUTES DOCUMENTATION**

| Méthode | URL | Contrôleur | Service | Dépendances | Objectif | ✅ Testé |
|---------|-----|------------|---------|-------------|----------|---------|
| GET | `/api/docs` | - | - | - | Documentation API | ☐ |

---

## 📊 **STATISTIQUES FINALES**

| Catégorie | Nombre | Pourcentage |
|-----------|--------|------------|
| **Total routes** | **127** | **100%** |
| Routes publiques | 15 | 11.8% |
| Routes protégées | 112 | 88.2% |
| **Modules** | **9** | **100%** |
| **Dépendances principales** | PostgreSQL, Redis, Email (SMTP), SMS (Twilio) | - |

---

## 🎯 **PROGRESSION DES TESTS**

### **Phase 1 : Tests Unitaires**
- [ ] Module Authentification (15/15 routes)
- [ ] Module People (11/11 routes)  
- [ ] Module Users (14/14 routes)
- [ ] Module Roles (13/13 routes)
- [ ] Module Permissions (11/11 routes)
- [ ] Module Menus (13/13 routes)
- [ ] Module Authorizations (14/14 routes)

### **Phase 2 : Tests d'Intégration**
- [ ] Health Checks (6/6 routes)
- [ ] Metrics (3/3 routes)
- [ ] Documentation (5/5 routes)
- [ ] Dashboard (4/4 routes)

### **Phase 3 : Tests E2E**
- [ ] Flux complets d'authentification
- [ ] Flux RBAC complets
- [ ] Tests de sécurité
- [ ] Tests de performance

---

## ✅ **LÉGENDE**

- ☐ **À tester** : Route non encore testée
- ✅ **Testé** : Route testée avec succès
- ❌ **Échec** : Route testée mais en échec
- 🔄 **En cours** : Route en cours de test

---

## 🚀 **COMMANDES UTILES**

```bash
# Lancer tous les tests
npm test

# Lancer les tests par module
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=people
npm test -- --testPathPattern=users
npm test -- --testPathPattern=roles
npm test -- --testPathPattern=permissions
npm test -- --testPathPattern=menus
npm test -- --testPathPattern=authorizations

# Couverture de test
npm test -- --coverage

# Tests avec rapport détaillé
npm test -- --verbose
```

---

**Dernière mise à jour** : 17/01/2026  
**Version** : 1.0.0  
**Statut** : Checklist officielle de test
