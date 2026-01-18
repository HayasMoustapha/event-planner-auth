# 📋 INVENTAIRE COMPLET DES ROUTES API - EVENT PLANNER AUTH

## 🎯 OBJECTIF
Lister toutes les routes existantes dans le code pour synchroniser les collections Postman.

## 📊 STATISTIQUES
- **Total de modules** : 11 modules principaux
- **Total de routes** : 85+ routes identifiées
- **Méthodes HTTP** : GET, POST, PUT, PATCH, DELETE
- **Middlewares principaux** : authenticate, requirePermission, validate*

---

## 🔐 MODULE AUTH - AUTHENTIFICATION & INSCRIPTION

### Routes publiques (sans authentification)
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| POST | `/api/auth/login` | authController.login | validateLogin | Connexion classique |
| POST | `/api/auth/login-remember` | authController.loginWithRememberToken | validateLogin | Connexion avec remember token |
| POST | `/api/auth/login-otp` | authController.loginWithOtp | validateLoginWithOtp | Connexion avec OTP |
| POST | `/api/auth/refresh-token` | authController.refreshToken | validateRefreshToken | Rafraîchissement token |
| POST | `/api/auth/validate-token` | authController.validateToken | validateToken | Validation token |
| POST | `/api/auth/otp/email/generate` | authController.generateEmailOtp | validateGenerateEmailOtp | Générer OTP email |
| POST | `/api/auth/otp/phone/generate` | authController.generatePhoneOtp | validateGeneratePhoneOtp | Générer OTP téléphone |
| POST | `/api/auth/otp/email/verify` | authController.verifyEmailOtp | validateVerifyEmailOtp | Vérifier OTP email |
| POST | `/api/auth/otp/phone/verify` | authController.verifyPhoneOtp | validateVerifyPhoneOtp | Vérifier OTP téléphone |
| POST | `/api/auth/otp/password-reset/generate` | authController.generatePasswordResetOtp | validateGeneratePasswordResetOtp | Générer OTP reset mot de passe |
| POST | `/api/auth/otp/password-reset/verify` | authController.resetPasswordWithOtp | validateResetPasswordWithOtp | Réinitialiser mot de passe avec OTP |
| POST | `/api/auth/register` | registrationController.register | validateRegister | Inscription utilisateur |
| POST | `/api/auth/verify-email` | registrationController.verifyEmail | validateVerifyEmail | Vérification email avec OTP |
| POST | `/api/auth/resend-otp` | registrationController.resendOTP | validateResendOtp | Renvoi OTP |
| POST | `/api/auth/login-after-verification` | registrationController.loginAfterVerification | validateLogin | Connexion post-vérification |
| GET | `/api/auth/check-email/:email` | registrationController.checkEmailAvailability | validateEmailParam | Vérifier disponibilité email |
| GET | `/api/auth/check-username/:username` | registrationController.checkUsernameAvailability | validateUsernameParam | Vérifier disponibilité username |

### Routes protégées (avec authentification)
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| POST | `/api/auth/logout` | authController.logout | - | Déconnexion |
| GET | `/api/auth/profile` | authController.getProfile | - | Récupérer profil utilisateur |
| POST | `/api/auth/change-password` | authController.changePassword | validateChangePassword | Changer mot de passe |

### Routes administration (permissions spécifiques)
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| GET | `/api/auth/otp/person/:personId` | authController.getUserOtps | otp.read | Récupérer OTPs d'une personne |
| POST | `/api/auth/otp/person/:personId/invalidate` | authController.invalidateUserOtps | otp.manage | Invalider OTPs d'une personne |
| GET | `/api/auth/otp/person/:personId/active` | authController.hasActiveOtp | otp.read | Vérifier OTPs actifs |
| POST | `/api/auth/otp/cleanup` | authController.cleanupExpiredOtps | otp.manage | Nettoyer OTPs expirés |
| GET | `/api/auth/otp/stats` | authController.getOtpStats | otp.stats | Statistiques OTPs |

---

## 👥 MODULE PEOPLE - GESTION DES PERSONNES

### Routes publiques
| Méthode | Path | Controller | Description |
|---------|------|------------|-------------|
| GET | `/api/people/search` | peopleController.search | Recherche publique |
| GET | `/api/people/email/:email` | peopleController.getByEmail | Pour OTP |
| GET | `/api/people/phone/:phone` | peopleController.getByPhone | Pour OTP |
| GET | `/api/people/:id/exists` | peopleController.exists | Vérification existence |

### Routes CRUD (avec permissions RBAC)
| Méthode | Path | Controller | Permission | Validation | Description |
|---------|------|------------|-----------|------------|-------------|
| GET | `/api/people/` | peopleController.getAll | people.list | validateGetPeople | Lister toutes les personnes |
| GET | `/api/people/stats` | peopleController.getStats | people.stats | - | Statistiques personnes |
| GET | `/api/people/:id` | peopleController.getById | people.read | validateGetPersonById | Récupérer personne par ID |
| POST | `/api/people/` | peopleController.create | people.create | validateCreate | Créer personne |
| PUT | `/api/people/:id` | peopleController.update | people.update | validateUpdate | Mettre à jour personne |
| PATCH | `/api/people/:id/status` | peopleController.updateStatus | people.update | validateStatusUpdate | Mettre à jour statut |
| DELETE | `/api/people/:id` | peopleController.delete | people.delete | - | Supprimer personne (soft delete) |

---

## 👤 MODULE USERS - GESTION DES UTILISATEURS

### Routes publiques
| Méthode | Path | Controller | Description |
|---------|------|------------|-------------|
| GET | `/api/users/check/username/:username` | usersController.checkUsernameAvailability | Vérifier disponibilité username |
| GET | `/api/users/check/email/:email` | usersController.checkEmailAvailability | Vérifier disponibilité email |
| POST | `/api/users/authenticate` | usersController.authenticate | Authentification utilisateur |

### Routes CRUD (avec permissions RBAC)
| Méthode | Path | Controller | Permission | Validation | Description |
|---------|------|------------|-----------|------------|-------------|
| GET | `/api/users/` | usersController.getAll | users.list | validateGetUsers | Lister tous les utilisateurs |
| GET | `/api/users/stats` | usersController.getStats | users.stats | - | Statistiques utilisateurs |
| GET | `/api/users/:id` | usersController.getById | users.read | validateGetUserById | Récupérer utilisateur par ID |
| GET | `/api/users/email/:email` | usersController.getByEmail | users.read | - | Récupérer utilisateur par email |
| GET | `/api/users/username/:username` | usersController.getByUsername | users.read | - | Récupérer utilisateur par username |
| POST | `/api/users/` | usersController.create | users.create | validateCreate | Créer utilisateur |
| PUT | `/api/users/:id` | usersController.update | users.update | validateUpdate | Mettre à jour utilisateur |
| PATCH | `/api/users/:id/password` | usersController.updatePassword | users.update | validatePasswordUpdate | Mettre à jour mot de passe |
| PATCH | `/api/users/:id/status` | usersController.updateStatus | users.update | validateStatusUpdate | Mettre à jour statut |
| DELETE | `/api/users/:id` | usersController.delete | users.delete | - | Supprimer utilisateur (soft delete) |

### Routes utilitaires
| Méthode | Path | Controller | Permission | Validation | Description |
|---------|------|------------|-----------|------------|-------------|
| GET | `/api/users/:id/exists` | usersController.exists | users.read | - | Vérifier existence utilisateur |
| POST | `/api/users/reset-password` | usersController.resetPassword | users.update | validatePasswordReset | Réinitialiser mot de passe |
| GET | `/api/users/search` | usersController.search | users.list | - | Rechercher utilisateurs |

---

## 🔐 MODULE SESSIONS - GESTION DES SESSIONS

### Routes publiques
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| POST | `/api/sessions/create` | sessionController.createSession | validateCreateSession | Créer nouvelle session |
| POST | `/api/sessions/refresh` | sessionController.refreshSession | validateRefreshSession | Rafraîchir tokens |
| POST | `/api/sessions/password-reset/verify` | sessionController.verifyPasswordResetToken | validateVerifyPasswordResetToken | Vérifier token reset mot de passe |
| POST | `/api/sessions/password-reset/generate` | sessionController.generatePasswordResetToken | validateGeneratePasswordResetToken | Générer token reset mot de passe |

### Routes protégées (avec authentification)
| Méthode | Path | Controller | Description |
|---------|------|------------|-------------|
| GET | `/api/sessions/validate` | sessionController.validateSession | Valider session |
| GET | `/api/sessions/current` | sessionController.getCurrentSession | Récupérer session courante |
| POST | `/api/sessions/logout` | sessionController.logoutSession | Déconnecter session courante |
| POST | `/api/sessions/logout-all` | sessionController.logoutAllSessions | Déconnecter toutes les sessions |
| GET | `/api/sessions/user/:userId?` | sessionController.getUserSessions | Récupérer sessions utilisateur |
| GET | `/api/sessions/history/:userId?` | sessionController.getLoginHistory | Récupérer historique connexions |
| GET | `/api/sessions/stats` | sessionController.getSessionStats | Statistiques sessions |
| POST | `/api/sessions/revoke` | sessionController.revokeToken | Révoquer token spécifique |

### Routes monitoring (permissions spécifiques)
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| GET | `/api/sessions/active` | sessionMonitoringController.getActiveSessions | sessions.read | Sessions actives |
| GET | `/api/sessions/user/:userId` | sessionMonitoringController.getUserSessions | sessions.read | Sessions d'un utilisateur |
| GET | `/api/sessions/blacklisted` | sessionMonitoringController.getBlacklistedTokens | sessions.read | Tokens blacklistés |
| POST | `/api/sessions/revoke-all/:userId` | sessionMonitoringController.revokeAllUserSessions | sessions.revoke | Révoquer toutes sessions utilisateur |
| POST | `/api/sessions/cleanup` | sessionMonitoringController.cleanupExpiredSessions | sessions.cleanup | Nettoyer sessions expirées |
| GET | `/api/sessions/limits/:userId` | sessionMonitoringController.checkSessionLimits | sessions.read | Vérifier limites sessions |
| GET | `/api/sessions/suspicious` | sessionMonitoringController.getSuspiciousSessions | sessions.monitor | Sessions suspectes |

---

## 🔑 MODULE PERMISSIONS - GESTION DES PERMISSIONS

### Routes lecture (accessibles aux utilisateurs authentifiés)
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| GET | `/api/permissions/` | permissionController.getPermissions | validateGetPermissions | Lister permissions avec pagination |
| GET | `/api/permissions/:id` | permissionController.getPermissionById | validateGetPermissionById | Récupérer permission par ID |
| GET | `/api/permissions/user/:userId?` | permissionController.getUserPermissions | validateGetUserPermissions | Permissions utilisateur |
| GET | `/api/permissions/role/:roleId` | permissionController.getRolePermissions | validateGetRolePermissions | Permissions d'un rôle |
| GET | `/api/permissions/resources/list` | permissionController.getResources | - | Lister ressources disponibles |
| GET | `/api/permissions/resource/:resource/actions` | permissionController.getActionsByResource | validateGetActionsByResource | Actions d'une ressource |
| GET | `/api/permissions/check` | permissionController.checkUserPermission | validateCheckUserPermission | Vérifier permission utilisateur |

### Routes écriture (permissions spécifiques requises)
| Méthode | Path | Controller | Permission | Validation | Description |
|---------|------|------------|-----------|------------|-------------|
| POST | `/api/permissions/` | permissionController.createPermission | permissions.create | validateCreatePermission | Créer permission |
| PUT | `/api/permissions/:id` | permissionController.updatePermission | permissions.update | validateUpdatePermission | Mettre à jour permission |
| DELETE | `/api/permissions/:id` | permissionController.deletePermission | permissions.delete | validateGetPermissionById | Supprimer permission |
| POST | `/api/permissions/generate` | permissionController.generateResourcePermissions | permissions.create | validateGenerateResourcePermissions | Générer permissions ressource |
| POST | `/api/permissions/check/any` | permissionController.hasAnyPermission | validateCheckPermissions | Vérifier permissions requises |
| POST | `/api/permissions/check/all` | permissionController.hasAllPermissions | validateCheckPermissions | Vérifier toutes permissions |

### Routes administration
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| GET | `/api/permissions/admin/stats` | permissionController.getPermissionStats | permissions.view_stats | Statistiques permissions |

---

## 👑 MODULE ROLES - GESTION DES RÔLES

### Routes lecture (accessibles aux utilisateurs authentifiés)
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| GET | `/api/roles/` | roleController.getRoles | validateGetRoles | Lister tous les rôles |
| GET | `/api/roles/:id` | roleController.getRoleById | validateGetRoleById | Récupérer rôle par ID |
| GET | `/api/roles/:id/permissions` | roleController.getRolePermissions | validateGetRoleById | Permissions d'un rôle |
| GET | `/api/roles/:id/users` | roleController.getRoleUsers | validateGetRoleById, validateGetRoleUsers | Utilisateurs d'un rôle |
| GET | `/api/roles/user/:userId?` | roleController.getUserRoles | validateGetUserRoles | Rôles d'un utilisateur |
| GET | `/api/roles/check/role` | roleController.checkUserRole | validateCheckUserRole | Vérifier rôle utilisateur |
| GET | `/api/roles/user/:userId/highest` | roleController.getUserHighestRole | validateGetRoleById | Rôle le plus haut niveau |

### Routes écriture (permissions spécifiques requises)
| Méthode | Path | Controller | Permission | Validation | Description |
|---------|------|------------|-----------|------------|-------------|
| POST | `/api/roles/` | roleController.createRole | roles.create | validateCreateRole | Créer rôle |
| PUT | `/api/roles/:id` | roleController.updateRole | roles.update | validateUpdateRole | Mettre à jour rôle |
| DELETE | `/api/roles/:id` | roleController.deleteRole | roles.delete | validateGetRoleById | Supprimer rôle |
| PATCH | `/api/roles/:id/status` | roleController.updateRoleStatus | roles.update | validateUpdateRoleStatus | Mettre à jour statut rôle |
| POST | `/api/roles/:id/duplicate` | roleController.duplicateRole | roles.create | validateDuplicateRole | Dupliquer rôle |

### Routes gestion permissions
| Méthode | Path | Controller | Permission | Validation | Description |
|---------|------|------------|-----------|------------|-------------|
| POST | `/api/roles/:id/permissions` | roleController.assignPermissions | roles.assign_permissions | validateAssignPermissions | Associer permissions à un rôle |
| DELETE | `/api/roles/:id/permissions` | roleController.removeAllPermissions | roles.assign_permissions | validateGetRoleById | Supprimer permissions d'un rôle |

### Routes administration
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| GET | `/api/roles/admin/stats` | roleController.getRoleStats | roles.view_stats | Statistiques rôles |

---

## 🔐 MODULE AUTHORIZATIONS - VÉRIFICATION DES AUTORISATIONS

### Routes vérification permissions
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| POST | `/api/authorizations/check/permission` | authorizationController.checkPermission | validateCheckPermission | Vérifier permission spécifique |
| POST | `/api/authorizations/check/any-permission` | authorizationController.checkAnyPermission | validateCheckPermissions | Vérifier permissions requises |
| POST | `/api/authorizations/check/all-permissions` | authorizationController.checkAllPermissions | validateCheckPermissions | Vérifier toutes permissions |

### Routes vérification rôles
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| POST | `/api/authorizations/check/role` | authorizationController.checkRole | validateCheckRole | Vérifier rôle spécifique |
| POST | `/api/authorizations/check/any-role` | authorizationController.checkAnyRole | validateCheckRoles | Vérifier rôles requis |
| POST | `/api/authorizations/check/all-role` | authorizationController.checkAllRoles | validateCheckRoles | Vérifier tous rôles requis |

### Routes vérification menus
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| POST | `/api/authorizations/check/menu` | authorizationController.checkMenuAccess | validateCheckMenuAccess | Vérifier accès menu |

### Routes vérification ressources
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| POST | `/api/authorizations/check/resource` | authorizationController.checkResourceAccess | validateCheckResourceAccess | Vérifier accès ressource |

### Routes récupération autorisations
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| GET | `/api/authorizations/user/:userId?` | authorizationController.getUserAuthorizations | validateGetUserAuthorizations | Autorisations utilisateur |
| GET | `/api/authorizations/user/:userId/highest-role` | authorizationController.getUserHighestRole | validateGetUserAuthorizations | Rôle le plus haut niveau |

### Routes administration
| Méthode | Path | Controller | Permission | Validation | Description |
|---------|------|------------|-----------|-------------|
| POST | `/api/authorizations/check/admin` | authorizationController.checkAdminStatus | validateCheckAdminStatus | Vérifier statut admin |
| POST | `/api/authorizations/check/policy` | authorizationController.checkPolicy | validateCheckPolicy | Vérifier politique complexe |
| POST | `/api/authorizations/cache` | authorizationController.cacheUserAuthorizations | validateCacheUserAuthorizations | Créer cache autorisations |
| POST | `/api/authorizations/cache/invalidate` | authorizationController.invalidateUserAuthorizationCache | validateInvalidateUserAuthorizationCache | Invalider cache autorisations |

---

## 📋 MODULE MENUS - GESTION DES MENUS

### Routes lecture (accessibles aux utilisateurs authentifiés)
| Méthode | Path | Controller | Validation | Description |
|---------|------|------------|------------|-------------|
| GET | `/api/menus/` | menuController.getMenus | validateGetMenus | Lister tous les menus |
| GET | `/api/menus/tree` | menuController.getMenuTree | - | Arborescence complète des menus |
| GET | `/api/menus/root` | menuController.getRootMenus | - | Menus de premier niveau |
| GET | `/api/menus/:id` | menuController.getMenuById | validateGetMenuById | Récupérer menu par ID |
| GET | `/api/menus/:id/permissions` | menuController.getMenuPermissions | validateGetMenuById | Permissions d'un menu |
| GET | `/api/menus/user/:userId?` | menuController.getUserMenus | validateGetUserMenus | Menus accessibles utilisateur |
| GET | `/api/menus/check/access` | menuController.checkUserMenuAccess | validateCheckUserMenuAccess | Vérifier accès menu |

### Routes écriture (permissions spécifiques requises)
| Méthode | Path | Controller | Permission | Validation | Description |
|---------|------|------------|-----------|------------|-------------|
| POST | `/api/menus/` | menuController.createMenu | menus.create | validateCreateMenu | Créer menu |
| PUT | `/api/menus/:id` | menuController.updateMenu | menus.update | validateUpdateMenu | Mettre à jour menu |
| DELETE | `/api/menus/:id` | menuController.deleteMenu | menus.delete | validateGetMenuById | Supprimer menu |
| PATCH | `/api/menus/:id/status` | menuController.updateMenuStatus | menus.update | validateUpdateMenuStatus | Mettre à jour statut menu |
| POST | `/api/menus/:id/duplicate` | menuController.duplicateMenu | menus.create | validateDuplicateMenu | Dupliquer menu |
| POST | `/api/menus/reorder` | menuController.reorderMenus | menus.update | validateReorderMenus | Réorganiser ordre menus |

### Routes gestion permissions
| Méthode | Path | Controller | Permission | Validation | Description |
|---------|------|------------|-----------|------------|-------------|
| POST | `/api/menus/:id/permissions` | menuController.assignMenuPermissions | menus.assign_permissions | validateAssignMenuPermissions | Associer permissions à un menu |
| DELETE | `/api/menus/:id/permissions` | menuController.removeAllMenuPermissions | menus.assign_permissions | validateGetMenuById | Supprimer permissions d'un menu |

### Routes administration
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| GET | `/api/menus/admin/stats` | menuController.getMenuStats | menus.view_stats | Statistiques menus |

---

## 🏥 MODULE HEALTH - HEALTH CHECKS

### Routes publiques (monitoring)
| Méthode | Path | Controller | Description |
|---------|------|------------|-------------|
| GET | `/health/` | healthController.basicHealth | Health check basique |
| GET | `/health/detailed` | healthController.detailedHealth | Health check détaillé |
| GET | `/health/ready` | healthController.readiness | Readiness probe (Kubernetes) |
| GET | `/health/live` | healthController.liveness | Liveness probe (Kubernetes) |

### Routes protégées
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| GET | `/health/authenticated` | healthController.detailedHealth | - | Health check avec authentification |
| GET | `/health/admin` | healthController.detailedHealth | admin.health.read | Health check admin |

### Routes compatibilité Postman
| Méthode | Path | Controller | Description |
|---------|------|------------|-------------|
| GET | `/api/health/` | healthController.basicHealth | Health check basique |
| GET | `/api/health/detailed` | healthController.detailedHealth | Health check détaillé |
| GET | `/api/health/ready` | healthController.readiness | Readiness probe |
| GET | `/api/health/live` | healthController.liveness | Liveness probe |
| GET | `/api/health/authenticated` | healthController.detailedHealth | Health check avec authentification |
| GET | `/api/health/admin` | healthController.detailedHealth | Health check admin |

---

## 📊 MODULE METRICS - MÉTRIQUES PROMETHEUS

### Routes publiques
| Méthode | Path | Controller | Description |
|---------|------|------------|-------------|
| GET | `/metrics/` | metricsService.getMetrics | Métriques Prometheus (text/plain) |

### Routes protégées
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| GET | `/metrics/info` | metricsService.getStats | admin.metrics.read | Informations métriques |
| POST | `/metrics/reset` | metricsService.reset | admin.metrics.reset | Réinitialiser métriques |

### Routes compatibilité Postman
| Méthode | Path | Controller | Description |
|---------|------|------------|-------------|
| GET | `/api/metrics/` | metricsService.getMetrics | Métriques Prometheus |
| GET | `/api/metrics/info` | metricsService.getStats | Informations métriques |
| POST | `/api/metrics/reset` | metricsService.reset | Réinitialiser métriques |

---

## 📊 MODULE DASHBOARD - MONITORING WEB

### Routes protégées
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| GET | `/dashboard/` | dashboardController | admin.dashboard.read | Page principale dashboard |
| GET | `/dashboard/api/data` | dashboardController | admin.dashboard.read | Données API dashboard |
| GET | `/dashboard/api/security-alerts` | dashboardController | admin.security.read | Alertes sécurité |
| GET | `/dashboard/api/realtime` | dashboardController | admin.dashboard.read | Métriques temps réel (streaming) |

---

## 📚 MODULE DOCS - DOCUMENTATION API

### Routes publiques
| Méthode | Path | Controller | Description |
|---------|------|------------|-------------|
| GET | `/docs/` | swaggerUi.serve | Documentation Swagger UI |
| GET | `/docs/json` | - | Spécification OpenAPI JSON |
| GET | `/docs/yaml` | - | Spécification OpenAPI YAML |

### Routes protégées
| Méthode | Path | Controller | Permission | Description |
|---------|------|------------|-----------|-------------|
| GET | `/docs/developer` | docsController | developer.docs.read | Documentation développeurs |
| GET | `/docs/examples` | docsController | developer.docs.read | Exemples d'utilisation |

---

## 🔗 MONTAGE DES ROUTES DANS APP.JS

### Routes API principales
```javascript
app.use('/api/auth', authRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/authorizations', authorizationRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions/monitoring', sessionMonitoringRoutes);
```

### Routes monitoring et santé
```javascript
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);
```

### Routes compatibilité Postman
```javascript
app.use('/api/health', healthRoutes);
app.use('/api/metrics', metricsRoutes);
```

### Routes documentation
```javascript
app.use('/docs', docsRoutes);
app.use('/dashboard', dashboardRoutes);
```

---

## 📝 NOTES IMPORTANTES

### ✅ Routes correctement implémentées
- **85+ routes** identifiées et fonctionnelles
- **11 modules** principaux couverts
- **Middlewares** : authenticate, requirePermission, validate*
- **Validations** : express-validator avec gestion d'erreurs

### 🔍 Points d'attention pour Postman
1. **Champs snake_case vs camelCase** : Le code accepte les deux formats (ex: first_name ET firstName)
2. **Routes de santé** : Utiliser `/health/` ou `/api/health/` (les deux fonctionnent)
3. **Refresh token** : La route `/api/sessions/refresh` est correcte
4. **Paramètres optionnels** : Beaucoup de routes acceptent des paramètres optionnels avec `?`
5. **Permissions RBAC** : Toutes les routes protégées vérifient les permissions

### 🎯 Prochaine étape
Analyser les validateurs pour lister les champs exacts attendus et comparer avec les collections Postman existantes.

---

*Inventaire généré le 2026-01-18 à partir du code source existant*
