-- ========================================
-- SEED DE L'ADMINISTRATEUR PAR DÉFAUT (POSTGRESQL)
-- ========================================
-- Création du compte administrateur principal
-- Compatible avec le schéma PostgreSQL actuel

-- Création de la personne admin
INSERT INTO people (first_name, last_name, email, phone, status, created_at, updated_at) VALUES
('Super', 'Administrateur', 'admin@eventplanner.com', '+33612345678', 'active', NOW(), NOW());

-- Création de l'utilisateur admin
INSERT INTO users (person_id, user_code, username, email, password, status, email_verified_at, created_at, updated_at) VALUES
((SELECT id FROM people WHERE email = 'admin@eventplanner.com'), 'ADMIN001', 'admin', 'admin@eventplanner.com', '$2b$12$o2YoqvCJC4h724K0ZtIyMObi1UDWX0xmvTrvTdkv.yLAl/PtFW19y', 'active', NOW(), NOW(), NOW());

-- Association au rôle super_admin
INSERT INTO accesses (user_id, role_id, status, created_at, updated_at) VALUES
((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE code = 'super_admin'), 'active', NOW(), NOW());
