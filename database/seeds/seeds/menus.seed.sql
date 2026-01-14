-- Insertion des menus de base
INSERT INTO menus (name, label, icon, path, parent_id, order_index) VALUES
-- Menu principal
('dashboard', 'Tableau de bord', 'Dashboard', '/dashboard', NULL, 1),

-- Gestion des utilisateurs
('users_management', 'Gestion des utilisateurs', 'Users', NULL, NULL, 2),
('users_list', 'Liste des utilisateurs', 'UserList', '/users', 2, 1),
('users_create', 'Créer un utilisateur', 'UserPlus', '/users/create', 2, 2),

-- Gestion des rôles
('roles_management', 'Gestion des rôles', 'Shield', NULL, NULL, 3),
('roles_list', 'Liste des rôles', 'List', '/roles', 3, 1),
('roles_create', 'Créer un rôle', 'Plus', '/roles/create', 3, 2),

-- Gestion des permissions
('permissions_management', 'Gestion des permissions', 'Key', NULL, NULL, 4),
('permissions_list', 'Liste des permissions', 'List', '/permissions', 4, 1),
('permissions_create', 'Créer une permission', 'Plus', '/permissions/create', 4, 2),

-- Gestion des menus
('menus_management', 'Gestion des menus', 'Menu', NULL, NULL, 5),
('menus_list', 'Liste des menus', 'List', '/menus', 5, 1),
('menus_create', 'Créer un menu', 'Plus', '/menus/create', 5, 2),

-- Gestion des personnes
('people_management', 'Gestion des personnes', 'People', NULL, NULL, 6),
('people_list', 'Liste des personnes', 'List', '/people', 6, 1),
('people_create', 'Créer une personne', 'Plus', '/people/create', 6, 2),

-- Sessions actives
('sessions_management', 'Sessions actives', 'Activity', NULL, NULL, 7),
('sessions_list', 'Liste des sessions', 'List', '/sessions', 7, 1),

-- Paramètres
('settings', 'Paramètres', 'Settings', NULL, NULL, 8),
('profile', 'Mon profil', 'User', '/profile', 8, 1),
('security', 'Sécurité', 'Lock', '/security', 8, 2);
