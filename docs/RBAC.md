# Role-Based Access Control (RBAC) - Event Planner

## Overview

Le système RBAC (Role-Based Access Control) d'Event Planner permet une gestion fine des permissions basée sur les rôles assignés aux utilisateurs.

## Concepts Clés

### 1. Utilisateurs (Users)
- Entité qui se connecte au système
- Possède un profil (personne associée)
- Peut avoir plusieurs rôles

### 2. Rôles (Roles)
- Définissent un ensemble de permissions
- Peuvent être assignés à plusieurs utilisateurs
- Hiérarchie implicite par les permissions

### 3. Permissions (Permissions)
- Actions spécifiques sur des ressources
- Format : `resource.action`
- Exemples : `users.create`, `roles.read`

### 4. Ressources (Resources)
- Entités du système : users, roles, permissions, menus, people, sessions
- Actions possibles : create, read, update, delete, list, assign, revoke

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

#### Sessions
- `sessions.create` : Créer une session
- `sessions.read` : Lire les informations session
- `sessions.update` : Mettre à jour une session
- `sessions.delete` : Supprimer une session
- `sessions.list` : Lister les sessions
- `sessions.revoke` : Révoquer une session

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
const canDeleteUser = hasPermission.some(p => p.name === 'users.delete');

if (!canDeleteUser) {
  throw new Error('Permission insuffisante pour supprimer un utilisateur');
}
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
- Seuls les menus associés aux rôles de l'utilisateur sont affichés
- La hiérarchie est préservée
- Les menus sans enfants visibles sont masqués

## Sécurité

### Principe du moindre privilège
- Les utilisateurs n'ont que les permissions nécessaires
- Les permissions sont accordées explicitement
- Pas d'héritage automatique de permissions

### Audit et traçabilité
- Toutes les assignations de rôles sont tracées
- L'historique des modifications est conservé
- Les tentatives d'accès non autorisées sont journalisées

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
2. Vérification permission users.delete ✗
3. Accès refusé (403)
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
2. Vérification rôle super_admin ✓
3. Accès autorisé à toutes les opérations
```

## Migration et Évolution

### Ajout de nouvelles permissions
1. Créer la permission dans la base de données
2. L'assigner aux rôles appropriés
3. Mettre à jour le code pour utiliser la nouvelle permission

### Modification de rôles existants
1. Analyser l'impact sur les utilisateurs
2. Mettre à jour les assignations de permissions
3. Communiquer les changements aux utilisateurs

### Audit régulier
- Vérifier les permissions excessives
- Identifier les rôles inutilisés
- Optimiser les assignations de permissions
