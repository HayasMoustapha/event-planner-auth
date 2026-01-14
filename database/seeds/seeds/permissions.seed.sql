-- Insertion des permissions de base
INSERT INTO permissions (name, description, resource, action) VALUES
-- Permissions utilisateurs
('users.create', 'Créer un utilisateur', 'users', 'create'),
('users.read', 'Lire les informations utilisateur', 'users', 'read'),
('users.update', 'Mettre à jour un utilisateur', 'users', 'update'),
('users.delete', 'Supprimer un utilisateur', 'users', 'delete'),
('users.list', 'Lister les utilisateurs', 'users', 'list'),

-- Permissions rôles
('roles.create', 'Créer un rôle', 'roles', 'create'),
('roles.read', 'Lire les informations rôle', 'roles', 'read'),
('roles.update', 'Mettre à jour un rôle', 'roles', 'update'),
('roles.delete', 'Supprimer un rôle', 'roles', 'delete'),
('roles.list', 'Lister les rôles', 'roles', 'list'),
('roles.assign', 'Assigner des rôles', 'roles', 'assign'),

-- Permissions permissions
('permissions.create', 'Créer une permission', 'permissions', 'create'),
('permissions.read', 'Lire les informations permission', 'permissions', 'read'),
('permissions.update', 'Mettre à jour une permission', 'permissions', 'update'),
('permissions.delete', 'Supprimer une permission', 'permissions', 'delete'),
('permissions.list', 'Lister les permissions', 'permissions', 'list'),

-- Permissions menus
('menus.create', 'Créer un menu', 'menus', 'create'),
('menus.read', 'Lire les informations menu', 'menus', 'read'),
('menus.update', 'Mettre à jour un menu', 'menus', 'update'),
('menus.delete', 'Supprimer un menu', 'menus', 'delete'),
('menus.list', 'Lister les menus', 'menus', 'list'),

-- Permissions personnes
('people.create', 'Créer une personne', 'people', 'create'),
('people.read', 'Lire les informations personne', 'people', 'read'),
('people.update', 'Mettre à jour une personne', 'people', 'update'),
('people.delete', 'Supprimer une personne', 'people', 'delete'),
('people.list', 'Lister les personnes', 'people', 'list'),

-- Permissions sessions
('sessions.create', 'Créer une session', 'sessions', 'create'),
('sessions.read', 'Lire les informations session', 'sessions', 'read'),
('sessions.update', 'Mettre à jour une session', 'sessions', 'update'),
('sessions.delete', 'Supprimer une session', 'sessions', 'delete'),
('sessions.list', 'Lister les sessions', 'sessions', 'list'),
('sessions.revoke', 'Révoquer une session', 'sessions', 'revoke'),

-- Permissions authentification
('auth.login', 'Se connecter', 'auth', 'login'),
('auth.logout', 'Se déconnecter', 'auth', 'logout'),
('auth.register', 'S''inscrire', 'auth', 'register'),
('auth.reset_password', 'Réinitialiser le mot de passe', 'auth', 'reset_password'),
('auth.verify_email', 'Vérifier l''email', 'auth', 'verify_email');
