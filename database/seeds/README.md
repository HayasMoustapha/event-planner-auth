# 🌱 Seeds du Système RBAC

Ce dossier contient les seeds pour initialiser le système RBAC (Role-Based Access Control) avec des données par défaut.

## 📋 Structure des Fichiers

```
database/seeds/
├── seeds/
│   ├── roles.seed.sql          # Rôles système (super_admin, admin, manager, user, guest, etc.)
│   ├── permissions.seed.sql    # Permissions granulaires par catégorie
│   ├── menus.seed.sql          # Menus hiérarchiques avec sous-menus
│   └── admin.seed.sql          # Administrateur par défaut avec tous les accès
├── run_all_seeds.sql           # Script SQL principal pour exécuter tous les seeds
├── seed-runner.js              # Script Node.js pour exécution automatisée
└── README.md                   # Ce fichier
```

## 🎯 Objectifs des Seeds

### ✅ Livrables
- **Admin par défaut**: Compte administrateur avec tous les droits
- **Rôles système**: Hiérarchie complète des rôles (super_admin → guest)
- **Permissions**: 65+ permissions granulaires par catégorie
- **Menus**: Structure hiérarchique complète avec 15 menus principaux

### 🔧 Fonctionnalités
- **Hiérarchie des rôles**: Héritage automatique des permissions
- **Catégories de permissions**: Organisation logique des accès
- **Menus hiérarchiques**: Structure à 3-4 niveaux avec sous-menus
- **Associations complètes**: Liens automatiques rôles-permissions-menus
- **Audit complet**: Journalisation de toutes les créations

## 🚀 Méthodes d'Exécution

### Méthode 1: Script Node.js (Recommandée)

```bash
# Depuis la racine du projet
cd database/seeds
npm install pg dotenv

# Exécuter tous les seeds
node seed-runner.js

# Ou avec npx si vous préférez
npx seed-runner.js
```

**Avantages:**
- ✅ Gestion automatique des erreurs
- ✅ Transactions sécurisées
- ✅ Rapport détaillé
- ✅ Vérifications d'intégrité

### Méthode 2: Script SQL Direct

```bash
# Avec psql
psql -h localhost -U postgres -d event_planner_auth -f run_all_seeds.sql

# Ou avec pgAdmin
# Ouvrir run_all_seeds.sql et exécuter
```

### Méthode 3: Fichiers Individuels

```sql
-- Ordre d'exécution IMPORTANT
\i database/seeds/seeds/roles.seed.sql
\i database/seeds/seeds/permissions.seed.sql
\i database/seeds/seeds/menus.seed.sql
\i database/seeds/seeds/admin.seed.sql
```

## 📊 Contenu des Seeds

### 🛡️ Rôles Système (10 rôles)

| Rôle | Description | Type | Héritage |
|------|-------------|-------|----------|
| `super_admin` | Super administrateur avec tous les droits absolus | Système | Hérite de tout |
| `admin` | Administrateur avec droits de gestion complète | Système | Hérite des rôles de gestion |
| `manager` | Gestionnaire avec droits limités | Système | Hérite des rôles opérationnels |
| `user` | Utilisateur standard avec droits de base | Système | Hérite de guest |
| `guest` | Invité avec droits de lecture seule | Système | Aucun héritage |
| `event_manager` | Gestionnaire d'événements | Métier | - |
| `content_manager` | Gestionnaire de contenu | Métier | - |
| `support_agent` | Agent de support client | Métier | - |
| `moderator` | Modérateur de contenu | Métier | - |
| `reporter` | Rapporteur avec droits de visualisation | Métier | - |

### 🔑 Permissions (65+ permissions)

#### 📋 Catégories principales:
- **users** (8 permissions): `users.create`, `users.read`, `users.update`, `users.delete`, `users.list`, `users.search`, `users.activate`, `users.export`
- **roles** (8 permissions): `roles.create`, `roles.read`, `roles.update`, `roles.delete`, `roles.list`, `roles.assign`, `roles.duplicate`, `roles.hierarchy`
- **permissions** (7 permissions): `permissions.create`, `permissions.read`, `permissions.update`, `permissions.delete`, `permissions.list`, `permissions.assign`, `permissions.bulk`
- **menus** (8 permissions): `menus.create`, `menus.read`, `menus.update`, `menus.delete`, `menus.list`, `menus.reorder`, `menus.duplicate`, `menus.visibility`
- **people** (7 permissions): `people.create`, `people.read`, `people.update`, `people.delete`, `people.list`, `people.search`, `people.export`
- **sessions** (8 permissions): `sessions.create`, `sessions.read`, `sessions.update`, `sessions.delete`, `sessions.list`, `sessions.revoke`, `sessions.revoke_all`, `sessions.monitor`
- **auth** (7 permissions): `auth.login`, `auth.logout`, `auth.register`, `auth.reset_password`, `auth.verify_email`, `auth.change_password`, `auth.two_factor`
- **system** (5 permissions): `system.monitor`, `system.logs`, `system.backup`, `system.config`, `system.maintenance`
- **reports** (4 permissions): `reports.generate`, `reports.read`, `reports.export`, `reports.schedule`
- **events** (6 permissions): `events.create`, `events.read`, `events.update`, `events.delete`, `events.list`, `events.publish`
- **content** (6 permissions): `content.create`, `content.read`, `content.update`, `content.delete`, `content.publish`, `content.moderate`
- **support** (5 permissions): `support.create`, `support.read`, `support.update`, `support.assign`, `support.close`
- **notifications** (3 permissions): `notifications.send`, `notifications.read`, `notifications.manage`

### 📋 Menus (15 menus principaux + sous-menus)

#### 🏠 Structure hiérarchique:
1. **Tableau de bord** (`/dashboard`)
2. **Gestion des utilisateurs** (4 sous-menus)
3. **Gestion des rôles** (4 sous-menus)
4. **Gestion des permissions** (4 sous-menus)
5. **Gestion des menus** (4 sous-menus)
6. **Gestion des personnes** (4 sous-menus)
7. **Sessions actives** (3 sous-menus)
8. **Paramètres** (4 sous-menus)
9. **Rapports** (4 sous-menus)
10. **Événements** (4 sous-menus)
11. **Contenu** (4 sous-menus)
12. **Support** (3 sous-menus)
13. **Notifications** (3 sous-menus)
14. **Administration système** (4 sous-menus)
15. **Utilitaires** (3 sous-menus)

## 👤 Administrateur par Défaut

### 🔐 Identifiants de connexion:
- **Email**: `admin@eventplanner.com`
- **Username**: `admin`
- **Mot de passe**: `admin123`
- **Rôle**: `super_admin`

### 🛡️ Accès:
- ✅ Toutes les permissions (65+)
- ✅ Tous les menus (15+)
- ✅ Accès système complet
- ✅ Journalisation des actions

## 🔧 Configuration Requise

### Variables d'environnement (pour seed-runner.js):
```env
# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_planner_auth
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_SSL=false
```

### Prérequis:
- PostgreSQL 12+ avec les tables RBAC créées
- Node.js 14+ (pour le script Node.js)
- Accès administrateur à la base de données

## 📊 Rapport d'Exécution

Après exécution, vous obtiendrez:

### 📈 Statistiques:
```
👥 Utilisateurs: 1
🛡️  Rôles: 10
🔑 Permissions: 65+
📋 Menus: 15+
🔗 Associations: Complètes
```

### ✅ Validations:
- Connexion base de données
- Intégrité des tables
- Associations rôles-permissions-menus
- Accès administrateur complets

## 🔄 Réinitialisation

Pour réinitialiser complètement le système:

```sql
-- Attention: Ceci supprimera toutes les données!
DELETE FROM user_roles;
DELETE FROM role_permissions;
DELETE FROM role_menus;
DELETE FROM menu_permissions;
DELETE FROM sessions;
DELETE FROM users;
DELETE FROM people;
DELETE FROM menus;
DELETE FROM permissions;
DELETE FROM roles;

-- Réinitialiser les séquences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE roles_id_seq RESTART WITH 1;
ALTER SEQUENCE permissions_id_seq RESTART WITH 1;
ALTER SEQUENCE menus_id_seq RESTART WITH 1;

-- Puis réexécuter les seeds
```

## 🚨 Notes Importantes

### ⚠️ Sécurité:
- Changez immédiatement le mot de passe admin après la première connexion
- Le mot de passe `admin123` est fourni uniquement pour le développement
- En production, utilisez des mots de passe forts

### 🔄 Ordre d'exécution:
1. **Rôles** (doit être en premier)
2. **Permissions** (dépend des rôles)
3. **Menus** (dépend des permissions)
4. **Administrateur** (dépend de tout le reste)

### 📝 Personnalisation:
- Les rôles système sont protégés contre la modification
- Les rôles métier peuvent être modifiés/supprimés
- Les permissions et menus peuvent être étendus

## 🆘 Dépannage

### Erreurs communes:

**1. "Table does not exist"**
```bash
# Vérifiez que les migrations ont été exécutées
psql -h localhost -U postgres -d event_planner_auth -c "\dt"
```

**2. "Permission denied"**
```bash
# Vérifiez les permissions de l'utilisateur
psql -h localhost -U postgres -c "\du"
```

**3. "Connection refused"**
```bash
# Vérifiez que PostgreSQL est en cours d'exécution
pg_isready -h localhost -p 5432
```

### 📞 Support:
- Consultez les logs d'exécution du script
- Vérifiez la configuration de la base de données
- Assurez-vous que toutes les migrations sont appliquées

---

## 🎉 Résultat Final

Après exécution réussie, vous aurez:

✅ **Un système RBAC complet et fonctionnel**
✅ **Un compte administrateur prêt à l'emploi**
✅ **Une structure de permissions granulaire**
✅ **Une interface de menu hiérarchique**
✅ **Une base solide pour votre application**

Le système est maintenant prêt pour être utilisé dans votre application Event Planner! 🚀
