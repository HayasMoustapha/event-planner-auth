# Role-Based Access Control (RBAC) - Event Planner

## Overview

Le système RBAC (Role-Based Access Control) d'Event Planner permet une gestion fine des permissions basée sur les rôles assignés aux utilisateurs.

## Concepts Clés

### 1. Personnes (People)
- Entité de base pour les informations personnelles
- Contient : nom, prénom, email, téléphone, photo
- Liée aux utilisateurs via `person_id`
- Une personne peut avoir zéro ou plusieurs utilisateurs

### 2. Utilisateurs (Users)
- Entité qui se connecte au système
- Liée à une personne via `person_id`
- Possède un compte avec email, mot de passe, username
- Peut avoir plusieurs rôles via la table `accesses`
- Statuts : active, inactive, lock(Roles)
- Définissent un ensemble de permissions
- Peuvent être assignés à plusieurs utilisateurs
- Hiérarchie implicite par les permissions

### 3. Permissions (Permissions)
- Actions spécifiques sur des ressources
- Format : `resource.action`
- Exemples : `users.create`, `roles.read`

### 4. OTP (One-Time Password)
- Codes temporaires pour vérification
- Liés aux personnes via `person_id`
- Utilisés pour : vérification email, réinitialisation mot de passe
- Durée de vie configurable (défaut: 15 minutes)

### 5. Ressources (Resources)
- Entités du système : people, users, roles, permissions, menus, sessions, auth
- Actions possibles : create, read, update, delete, list, assign, revoke, manage

## Rôles Prédéfinis

### Super Administrateur (super_admin)
- **Description** : Accès complet à toutes les fonctionnalités
- **Permissions** : Toutes les permissions disponibles
- **Accès** : Tous les menus

### Administrateur (admin)
- **Description** : Gestion complète des utilisateurs et rôles
- **Permissions** : 
  - Gestion des utilisateurs (sauf super admins)
  - Gestion des rôles (sauf super admin)
  - Gestion des permissions
  - Gestion des menus
  - Lecture des personnes
- **Accès** : Tous les menus sauf gestion super admin

### Gestionnaire (manager)
- **Description** : Gestion limitée aux utilisateurs standards
- **Permissions** :
  - Lecture des utilisateurs
  - Création/Mise à jour des utilisateurs standards
  - Lecture des rôles (sans modification)
  - Gestion des personnes
- **Accès** : Menus de gestion limités

### Utilisateur Standard (user)
- **Description** : Accès de base à son propre profil
- **Permissions** :
  - Lecture/mise à jour de son profil
  - Changement de son mot de passe
  - Gestion de ses sessions
- **Accès** : Menu profil et paramètres personnels

### Invité (guest)
- **Description** : Accès en lecture seule
- **Permissions** :
  - Lecture publique limitée
- **Accès** : Minimum de menus

## Structure des Permissions

### Format de nommage
```
{resource}.{action}
```

### Ressources disponibles
- **users** : Gestion des utilisateurs
- **roles** : Gestion des rôles
- **permissions** : Gestion des permissions
- **menus** : Gestion des menus
- **people** : Gestion des personnes
- **sessions** : Gestion des sessions
- **auth** : Authentification
- **accesses** : Gestion des accès user-rôle
- **authorizations** : Gestion des autorisations rôle-permission-menu

### Actions par ressource

#### Users
- `users.create` : Créer un utilisateur
- `users.read` : Lire les informations utilisateur
- `users.update` : Mettre à jour un utilisateur
- `users.delete` : Supprimer un utilisateur
- `users.list` : Lister les utilisateurs

#### Roles
- `roles.create` : Créer un rôle
- `roles.read` : Lire les informations rôle
- `roles.update` : Mettre à jour un rôle
- `roles.delete` : Supprimer un rôle
- `roles.list` : Lister les rôles
- `roles.assign` : Assigner des rôles

#### Permissions
- `permissions.create` : Créer une permission
- `permissions.read` : Lire les informations permission
- `permissions.update` : Mettre à jour une permission
- `permissions.delete` : Supprimer une permission
- `permissions.list` : Lister les permissions

#### Menus
- `menus.create` : Créer un menu
- `menus.read` : Lire les informations menu
- `menus.update` : Mettre à jour un menu
- `menus.delete` : Supprimer un menu
- `menus.list` : Lister les menus

#### People
- `people.create` : Créer une personne
- `people.read` : Lire les informations personne
- `people.update` : Mettre à jour une personne
- `people.delete` : Supprimer une personne
- `people.list` : Lister les personnes

#### OTP
- `otp.generate` : Générer un code OTP
- `otp.verify` : Vérifier un code OTP
- `otp.manage` : Gérer les codes OTP

#### Sessions
- `sessions.create` : Créer une session
- `sessions.read` : Lire les informations session
- `sessions.update` : Mettre à jour une session
- `sessions.delete` : Supprimer une session
- `sessions.list` : Lister les sessions
- `sessions.revoke` : Révoquer une session

#### Accesses
- `accesses.create` : Créer un accès user-rôle
- `accesses.read` : Lire les informations accès
- `accesses.update` : Mettre à jour un accès
- `accesses.delete` : Supprimer un accès
- `accesses.list` : Lister les accès
- `accesses.activate` : Activer un accès
- `accesses.deactivate` : Désactiver un accès

#### Authorizations
- `authorizations.create` : Créer une autorisation rôle-permission-menu
- `authorizations.read` : Lire les informations autorisation
- `authorizations.update` : Mettre à jour une autorisation
- `authorizations.delete` : Supprimer une autorisation
- `authorizations.list` : Lister les autorisations

#### Auth
- `auth.login` : Se connecter
- `auth.logout` : Se déconnecter
- `auth.register` : S'inscrire
- `auth.reset_password` : Réinitialiser le mot de passe
- `auth.verify_email` : Vérifier l'email

## Implémentation Technique

### Middleware RBAC
```javascript
// Vérification d'une permission spécifique
router.get('/users', 
  authMiddleware.authenticate,
  rbacMiddleware.requirePermission('users.list'),
  usersController.getAll
);

// Vérification d'un rôle spécifique
router.delete('/users/:id',
  authMiddleware.authenticate,
  rbacMiddleware.requireRole('admin'),
  usersController.delete
);

// Vérification de plusieurs rôles (un des deux requis)
router.post('/users',
  authMiddleware.authenticate,
  rbacMiddleware.requireAnyRole(['admin', 'manager']),
  usersController.create
);

// Accès à sa propre ressource ou rôle requis
router.put('/users/:id',
  authMiddleware.authenticate,
  rbacMiddleware.requireOwnershipOrRole('admin'),
  usersController.update
);
```

### Vérification des permissions
```javascript
// Dans le service ou controller
const hasPermission = await usersRepository.getUserPermissions(userId);
const canDeleteUser = hasPermission.some(p => p.code === 'users.delete');

if (!canDeleteUser) {
  throw new Error('Permission insuffisante pour supprimer un utilisateur');
}

// Vérification via la table accesses
const userAccesses = await accessesRepository.getUserAccesses(userId);
const hasActiveRole = userAccesses.some(access => 
  access.role.code === 'admin' && access.status === 'active'
);

// Vérification via la table authorizations
const roleAuthorizations = await authorizationsRepository.getRoleAuthorizations(roleId);
const hasMenuPermission = roleAuthorizations.some(auth => 
  auth.permission.code === 'users.read' && auth.menu.id === menuId
);

// Vérification OTP (nouveau)
const personOtps = await otpRepository.findByPersonId(personId, 'email');
const hasActiveOtp = personOtps.some(otp => !otp.is_used && otp.expires_at > new Date());
```

## Gestion des Menus

### Structure hiérarchique
```json
{
  "id": 1,
  "name": "users_management",
  "label": "Gestion des utilisateurs",
  "icon": "Users",
  "path": null,
  "parent_id": null,
  "children": [
    {
      "id": 2,
      "name": "users_list",
      "label": "Liste des utilisateurs",
      "icon": "List",
      "path": "/users",
      "parent_id": 1
    }
  ]
}
```

### Filtrage par rôle
Les menus sont filtrés dynamiquement selon les rôles de l'utilisateur :
- Seuls les menus associés aux rôles de l'utilisateur sont affichés via la table `authorizations`
- La hiérarchie est préservée
- Les menus sans enfants visibles sont masqués
- Chaque autorisation lie un rôle, une permission et un menu spécifique

## Sécurité

### Principe du moindre privilège
- Les utilisateurs n'ont que les permissions nécessaires
- Les permissions sont accordées explicitement
- Pas d'héritage automatique de permissions

### Audit et traçabilité
- Toutes les assignations de rôles sont tracées via la table `accesses`
- L'historique des modifications est conservé avec les champs audit
- Les tentatives d'accès non autorisées sont journalisées
- Le statut des accès peut être activé/désactivé
- Les autorisations sont traçables par rôle, permission et menu

### Validation des permissions
- Vérification à chaque requête
- Pas de cache côté client pour les permissions
- Validation côté serveur obligatoire

## Bonnes Pratiques

### Nommage des permissions
- Utiliser le format `resource.action`
- Être spécifique et descriptif
- Éviter les permissions trop génériques

### Gestion des rôles
- Limiter le nombre de rôles
- Documenter clairement chaque rôle
- Éviter la duplication des permissions

### Évolution du système
- Ajouter des permissions granulaires
- Maintenir la compatibilité ascendante
- Documenter les changements

## Exemples d'Utilisation

### Cas 1 : Manager qui veut supprimer un utilisateur
```
1. Vérification authentification ✓
2. Vérification accès actif via table accesses ✓
3. Vérification permission users.delete ✗
4. Accès refusé (403)
```

### Cas 2 : Admin qui modifie son profil
```
1. Vérification authentification ✓
2. Vérification ownership (même utilisateur) ✓
3. Accès autorisé
```

### Cas 3 : Super admin qui gère les rôles
```
1. Vérification authentification ✓
2. Vérification rôle super_admin via accesses ✓
3. Vérification autorisations complètes via authorizations ✓
4. Accès autorisé à toutes les opérations
```

### Cas 4 : Utilisateur avec accès désactivé
```
1. Vérification authentification ✓
2. Vérification statut access = 'inactive' ✗
3. Accès refusé (403)
```

## Flux OTP (One-Time Password)

### Vue d'ensemble
Les OTP sont utilisés pour sécuriser les opérations sensibles comme :
- Vérification d'email lors de l'inscription
- Réinitialisation de mot de passe
- Authentification à deux facteurs

### Structure OTP
```sql
CREATE TABLE otps (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    otp_code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    purpose VARCHAR(255),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Flux d'inscription avec OTP
1. **Inscription** : Création personne + utilisateur (statut: inactive)
2. **Génération OTP** : Code généré et envoyé à l'email
3. **Vérification** : Validation du code et activation du compte
4. **Connexion** : Accès autorisé après vérification

### Sécurité OTP
- **Durée de vie** : 15 minutes par défaut (configurable)
- **Limite de génération** : Maximum 3 OTP actifs par personne/purpose
- **Usage unique** : Chaque OTP ne peut être utilisé qu'une seule fois
- **Nettoyage automatique** : Suppression des OTP expirés

### Exemples d'utilisation
```javascript
// Générer OTP pour vérification email
const otp = await otpService.generateEmailOtp(personId, email);

// Vérifier l'OTP
const verification = await otpService.verifyEmailOtp(code, email, personId);

// Réinitialiser mot de passe
const resetOtp = await otpService.generatePasswordResetOtp(personId, email);
const newPassword = 'NewSecurePassword123!';
await authService.resetPasswordWithOtp(email, resetOtp.otp_code, newPassword);
```

## Migration et Évolution

### Ajout de nouvelles permissions
1. Créer la permission dans la table `permissions`
2. L'assigner aux rôles appropriés via la table `authorizations`
3. Associer aux menus concernés dans `authorizations`
4. Mettre à jour le code pour utiliser la nouvelle permission

### Modification de rôles existants
1. Analyser l'impact sur les accès via la table `accesses`
2. Mettre à jour les autorisations dans `authorizations`
3. Gérer les statuts d'accès si nécessaire
4. Communiquer les changements aux utilisateurs

### Audit régulier
- Vérifier les permissions excessives dans `authorizations`
- Identifier les accès inutilisés dans `accesses`
- Optimiser les assignations de permissions
- Vérifier la cohérence des statuts d'accès
