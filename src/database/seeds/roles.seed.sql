-- Insertion des rôles de base
INSERT INTO roles (name, description) VALUES
('super_admin', 'Super administrateur avec tous les droits'),
('admin', 'Administrateur avec droits de gestion'),
('manager', 'Gestionnaire avec droits limités'),
('user', 'Utilisateur standard'),
('guest', 'Invité avec droits de lecture seule');
