-- Insertion de l'administrateur par défaut
-- Note: Le mot de passe doit être hashé avec bcrypt avant insertion

-- Insertion de la personne admin
INSERT INTO people (first_name, last_name, email, phone) VALUES
('Admin', 'System', 'admin@eventplanner.com', '+0000000000');

-- Récupérer l'ID de la personne insérée (MySQL)
SET @admin_person_id = LAST_INSERT_ID();

-- Insertion de l'utilisateur admin (mot de passe: admin123 - à hasher avec bcrypt)
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe
INSERT INTO users (person_id, username, password_hash, email, is_active, is_verified) VALUES
(@admin_person_id, 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'admin@eventplanner.com', TRUE, TRUE);

-- Récupérer l'ID de l'utilisateur admin
SET @admin_user_id = LAST_INSERT_ID();

-- Assigner le rôle super_admin à l'utilisateur admin
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
(@admin_user_id, 1, @admin_user_id);

-- Assigner toutes les permissions au rôle super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Assigner tous les menus au rôle super_admin
INSERT INTO role_menus (role_id, menu_id)
SELECT 1, id FROM menus;
