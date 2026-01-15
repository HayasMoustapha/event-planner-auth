-- ========================================
-- SEED DES RÔLES SYSTÈME RBAC (POSTGRESQL)
-- ========================================
-- Création des rôles hiérarchiques pour le système RBAC
-- Compatible avec le schéma PostgreSQL actuel

-- Insertion des rôles de base avec hiérarchie claire
INSERT INTO roles (code, label, description, is_system, level, created_at, updated_at) VALUES
-- Rôles système (non modifiables)
('super_admin', '{"fr": "Super Administrateur", "en": "Super Administrator"}', '{"fr": "Super administrateur avec tous les droits absolus", "en": "Super administrator with absolute rights"}', true, 1, NOW(), NOW()),
('admin', '{"fr": "Administrateur", "en": "Administrator"}', '{"fr": "Administrateur avec droits de gestion complète", "en": "Administrator with full management rights"}', true, 2, NOW(), NOW()),
('manager', '{"fr": "Gestionnaire", "en": "Manager"}', '{"fr": "Gestionnaire avec droits de gestion limités", "en": "Manager with limited management rights"}', true, 3, NOW(), NOW()),
('user', '{"fr": "Utilisateur", "en": "User"}', '{"fr": "Utilisateur standard avec droits de base", "en": "Standard user with basic rights"}', true, 4, NOW(), NOW()),
('guest', '{"fr": "Invité", "en": "Guest"}', '{"fr": "Invité avec droits de lecture seule", "en": "Guest with read-only rights"}', true, 5, NOW(), NOW()),

-- Rôles métier (modifiables)
('event_manager', '{"fr": "Gestionnaire d''événements", "en": "Event Manager"}', '{"fr": "Gestionnaire spécialisé dans les événements", "en": "Specialized event manager"}', false, 3, NOW(), NOW()),
('content_manager', '{"fr": "Gestionnaire de contenu", "en": "Content Manager"}', '{"fr": "Gestionnaire du contenu de la plateforme", "en": "Platform content manager"}', false, 3, NOW(), NOW()),
('support_agent', '{"fr": "Agent de support", "en": "Support Agent"}', '{"fr": "Agent de support client", "en": "Customer support agent"}', false, 4, NOW(), NOW()),
('moderator', '{"fr": "Modérateur", "en": "Moderator"}', '{"fr": "Modérateur de contenu et communauté", "en": "Content and community moderator"}', false, 4, NOW(), NOW()),
('developer', '{"fr": "Développeur", "en": "Developer"}', '{"fr": "Développeur avec accès techniques", "en": "Developer with technical access"}', false, 3, NOW(), NOW());
