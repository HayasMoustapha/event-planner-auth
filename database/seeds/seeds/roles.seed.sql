-- ========================================
-- SEED DES RÔLES SYSTÈME RBAC
-- ========================================
-- Création des rôles hiérarchiques pour le système RBAC
-- Compatible PostgreSQL avec syntaxe standard

-- Désactiver les contraintes temporairement
SET session_replication_role = replica;

-- Nettoyage des données existantes (développement uniquement)
-- DELETE FROM user_roles WHERE 1=1;
-- DELETE FROM role_permissions WHERE 1=1;
-- DELETE FROM role_menus WHERE 1=1;
-- DELETE FROM roles WHERE 1=1;

-- Réinitialiser les séquences
-- ALTER SEQUENCE roles_id_seq RESTART WITH 1;

-- Insertion des rôles de base avec hiérarchie claire
INSERT INTO roles (name, description, is_system, is_active, created_at, updated_at) VALUES
-- Rôles système (non modifiables)
('super_admin', 'Super administrateur avec tous les droits absolus', true, true, NOW(), NOW()),
('admin', 'Administrateur avec droits de gestion complète', true, true, NOW(), NOW()),
('manager', 'Gestionnaire avec droits de gestion limités', true, true, NOW(), NOW()),
('user', 'Utilisateur standard avec droits de base', true, true, NOW(), NOW()),
('guest', 'Invité avec droits de lecture seule', true, true, NOW(), NOW()),

-- Rôles métier (modifiables)
('event_manager', 'Gestionnaire d''événements', false, true, NOW(), NOW()),
('content_manager', 'Gestionnaire de contenu', false, true, NOW(), NOW()),
('support_agent', 'Agent de support client', false, true, NOW(), NOW()),
('moderator', 'Modérateur de contenu', false, true, NOW(), NOW()),
('reporter', 'Rapporteur avec droits de visualisation', false, true, NOW(), NOW());

-- Récupérer les IDs des rôles pour les associations
DO $$
DECLARE
    super_admin_id INT;
    admin_id INT;
    manager_id INT;
    user_id INT;
    guest_id INT;
    event_manager_id INT;
    content_manager_id INT;
    support_agent_id INT;
    moderator_id INT;
    reporter_id INT;
BEGIN
    SELECT id INTO super_admin_id FROM roles WHERE name = 'super_admin';
    SELECT id INTO admin_id FROM roles WHERE name = 'admin';
    SELECT id INTO manager_id FROM roles WHERE name = 'manager';
    SELECT id INTO user_id FROM roles WHERE name = 'user';
    SELECT id INTO guest_id FROM roles WHERE name = 'guest';
    SELECT id INTO event_manager_id FROM roles WHERE name = 'event_manager';
    SELECT id INTO content_manager_id FROM roles WHERE name = 'content_manager';
    SELECT id INTO support_agent_id FROM roles WHERE name = 'support_agent';
    SELECT id INTO moderator_id FROM roles WHERE name = 'moderator';
    SELECT id INTO reporter_id FROM roles WHERE name = 'reporter';

    -- Créer les hiérarchies de rôles si la table role_hierarchy existe
    -- (pour les systèmes qui supportent l'héritage de rôles)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_hierarchy') THEN
        -- Super Admin hérite de tout
        INSERT INTO role_hierarchy (parent_role_id, child_role_id, created_at) VALUES
        (super_admin_id, admin_id, NOW()),
        (super_admin_id, manager_id, NOW()),
        (super_admin_id, user_id, NOW()),
        (super_admin_id, guest_id, NOW()),
        (super_admin_id, event_manager_id, NOW()),
        (super_admin_id, content_manager_id, NOW()),
        (super_admin_id, support_agent_id, NOW()),
        (super_admin_id, moderator_id, NOW()),
        (super_admin_id, reporter_id, NOW());

        -- Admin hérite des rôles de gestion
        INSERT INTO role_hierarchy (parent_role_id, child_role_id, created_at) VALUES
        (admin_id, manager_id, NOW()),
        (admin_id, user_id, NOW()),
        (admin_id, guest_id, NOW()),
        (admin_id, event_manager_id, NOW()),
        (admin_id, content_manager_id, NOW()),
        (admin_id, support_agent_id, NOW()),
        (admin_id, moderator_id, NOW()),
        (admin_id, reporter_id, NOW());

        -- Manager hérite des rôles opérationnels
        INSERT INTO role_hierarchy (parent_role_id, child_role_id, created_at) VALUES
        (manager_id, user_id, NOW()),
        (manager_id, guest_id, NOW()),
        (manager_id, event_manager_id, NOW()),
        (manager_id, content_manager_id, NOW()),
        (manager_id, support_agent_id, NOW());

        -- User hérite de guest
        INSERT INTO role_hierarchy (parent_role_id, child_role_id, created_at) VALUES
        (user_id, guest_id, NOW());
    END IF;

    -- Journaliser la création des rôles
    INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id, created_at) VALUES
    ('CREATE', 'roles', super_admin_id, NULL, json_build_object('name', 'super_admin', 'is_system', true), 1, NOW()),
    ('CREATE', 'roles', admin_id, NULL, json_build_object('name', 'admin', 'is_system', true), 1, NOW()),
    ('CREATE', 'roles', manager_id, NULL, json_build_object('name', 'manager', 'is_system', true), 1, NOW()),
    ('CREATE', 'roles', user_id, NULL, json_build_object('name', 'user', 'is_system', true), 1, NOW()),
    ('CREATE', 'roles', guest_id, NULL, json_build_object('name', 'guest', 'is_system', true), 1, NOW());
END $$;

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

-- Afficher les rôles créés
SELECT 
    id,
    name,
    description,
    is_system,
    is_active,
    created_at
FROM roles 
ORDER BY id;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Seed des rôles système RBAC terminé avec succès';
    RAISE NOTICE '📋 Rôles créés: super_admin, admin, manager, user, guest, event_manager, content_manager, support_agent, moderator, reporter';
    RAISE NOTICE '🔐 Les rôles système sont protégés contre la modification';
END $$;
