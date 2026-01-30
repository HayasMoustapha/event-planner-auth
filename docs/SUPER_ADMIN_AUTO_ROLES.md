# 👑 Super Admin Auto-Roles Assignment

## 🎯 Objectif

Assurer que les super administrateurs ont **automatiquement accès à TOUS les rôles** du système Event Planner SaaS.

## 🔥 Fonctionnalités

### 1. **Assignment Automatique à la Connexion**
Lorsqu'un super admin se connecte, le système vérifie et assigne automatiquement tous les rôles disponibles.

```javascript
// Déclenché automatiquement dans auth.service.js
if (user.email === 'admin@eventplanner.com' || user.email?.includes('admin@')) {
  await rbacSeeder.ensureSuperAdminCompleteAccess(user.id);
}
```

### 2. **Endpoints Manuels**

#### Assigner tous les rôles à un super admin
```http
POST /api/admin/users/{userId}/assign-all-roles
Authorization: Bearer {super_admin_token}
```

#### Vérifier et corriger les accès super admin
```http
POST /api/admin/users/{userId}/ensure-super-admin
Authorization: Bearer {super_admin_token}
```

### 3. **Fonctions du RBAC Seeder**

#### `assignAllRolesToSuperAdmin(userId)`
- Récupère TOUS les rôles existants
- Assigne chaque rôle à l'utilisateur
- Gère les doublons avec `ON CONFLICT`
- Retourne les statistiques d'assignment

#### `ensureSuperAdminCompleteAccess(userId)`
- Vérifie l'existence de l'utilisateur
- Assigne tous les rôles
- S'assure que le rôle super_admin a toutes les permissions
- Nettoie le cache

#### `ensureSuperAdminHasAllPermissions()`
- Récupère le rôle super_admin
- Assigne toutes les permissions disponibles
- Maintient la cohérence des autorisations

## 📊 Rôles Disponibles

Le système inclut ces rôles par défaut :

1. **super_admin** - Accès complet au système
2. **admin** - Administration système
3. **organizer** - Gestion d'événements
4. **event_manager** - Coordination événements
5. **ticket_manager** - Gestion billets
6. **designer** - Marketplace et design
7. **guest** - Accès invité de base

## 🔧 Configuration

### Emails Super Admin
Par défaut, les emails suivants sont considérés comme super admins :
- `admin@eventplanner.com`
- Tous les emails contenant `admin@`

### Modification des critères
Dans `auth.service.js`, modifier la condition :
```javascript
if (user.email === 'admin@eventplanner.com' || user.email?.includes('admin@')) {
  // Ajouter vos propres critères
}
```

## 🚀 Utilisation

### 1. **Assignment Automatique**
Aucune action requise - le système gère automatiquement lors de la connexion.

### 2. **Assignment Manuel**
```bash
# Via API
curl -X POST http://localhost:3000/api/admin/users/1/assign-all-roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Via code Node.js
const rbacSeeder = require('./database/seeders/rbac-seeder');
await rbacSeeder.ensureSuperAdminCompleteAccess(userId);
```

### 3. **Vérification**
```bash
curl -X POST http://localhost:3000/api/admin/users/1/ensure-super-admin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 📈 Résultats Attendus

### Réponse API réussie
```json
{
  "success": true,
  "message": "All roles assigned to super admin successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@eventplanner.com",
      "status": "active"
    },
    "roles": {
      "totalRoles": 7,
      "assignedCount": 7,
      "skippedCount": 0,
      "roles": ["super_admin", "admin", "organizer", "event_manager", "ticket_manager", "designer", "guest"]
    }
  }
}
```

### Rapport de vérification
```json
{
  "success": true,
  "message": "Super admin access verified and corrected",
  "data": {
    "user": { "id": 1, "email": "admin@eventplanner.com", "status": "active" },
    "before": {
      "roles": ["super_admin"],
      "permissions": ["admin.access"],
      "roleCount": 1,
      "permissionCount": 1
    },
    "after": {
      "roles": ["super_admin", "admin", "organizer", "event_manager", "ticket_manager", "designer", "guest"],
      "permissions": ["*"],
      "roleCount": 7,
      "permissionCount": 1
    },
    "changes": {
      "rolesAdded": 6,
      "permissionsAdded": 0
    }
  }
}
```

## 🛡️ Sécurité

### Permissions Requises
- `admin.access` - Accès administration
- `permissions.manage` - Gestion des permissions

### Validation
- Vérification de l'existence de l'utilisateur
- Validation des IDs numériques
- Gestion des erreurs sans bloquer la connexion

### Logs
Toutes les opérations sont loggées :
- `👑 Super admin {email} automatically granted all roles`
- `✅ Role '{code}' assigned to super admin {userId}`
- `🎯 Complete access ensured for super admin`

## 🔍 Débogage

### Vérifier les rôles d'un utilisateur
```sql
SELECT r.code, r.label 
FROM roles r
INNER JOIN user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = 1
ORDER BY r.code;
```

### Vérifier les permissions du rôle super_admin
```sql
SELECT p.code, p.label
FROM permissions p
INNER JOIN authorizations a ON p.id = a.permission_id
WHERE a.role_id = (SELECT id FROM roles WHERE code = 'super_admin')
ORDER BY p.code;
```

### Logs de debugging
Activer le mode développement pour voir les logs détaillés :
```bash
NODE_ENV=development npm run dev
```

## 🎯 Cas d'Usage

1. **Initialisation** : Premier super admin du système
2. **Maintenance** : Correction des accès après migration
3. **Sécurité** : Assurance que les super admins ont toujours accès complet
4. **Testing** : Tests automatisés avec super admin

## 📝 Notes

- L'assignment est **idempotent** - peut être exécuté plusieurs fois
- Le cache est automatiquement nettoyé après modification
- Les erreurs d'assignment n'empêchent pas la connexion
- Le système est **résilient** et gère les cas de doublons

---

**Cette fonctionnalité garantit que les super admins ont TOUJOURS un accès complet au système, même après des migrations ou des modifications de la structure RBAC.**
