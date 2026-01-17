-- Migration: Ajout des permissions manquantes pour le module people
-- Généré le 2026-01-17

-- Créer les permissions manquantes pour le module PEOPLE
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('people.list', '{"en": "List People", "fr": "Lister les personnes"}', 'people', '{"en": "List all people in the system", "fr": "Lister toutes les personnes du système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.read', '{"en": "Read Person", "fr": "Lire une personne"}', 'people', '{"en": "Read person details", "fr": "Lire les détails d''une personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.create', '{"en": "Create Person", "fr": "Créer une personne"}', 'people', '{"en": "Create a new person", "fr": "Créer une nouvelle personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.update', '{"en": "Update Person", "fr": "Mettre à jour une personne"}', 'people', '{"en": "Update person information", "fr": "Mettre à jour les informations d''une personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.delete', '{"en": "Delete Person", "fr": "Supprimer une personne"}', 'people', '{"en": "Delete a person", "fr": "Supprimer une personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.stats', '{"en": "People Statistics", "fr": "Statistiques des personnes"}', 'people', '{"en": "View people statistics", "fr": "Voir les statistiques des personnes"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assigner les nouvelles permissions au rôle super_admin
DO $$
DECLARE
    super_admin_id BIGINT;
    perm_id BIGINT;
    menu_id BIGINT;
BEGIN
    SELECT id INTO super_admin_id FROM roles WHERE code = 'super_admin';
    
    IF super_admin_id IS NOT NULL THEN
        -- Récupérer le premier menu disponible
        SELECT id INTO menu_id FROM menus ORDER BY id LIMIT 1;
        
        -- Assigner chaque nouvelle permission people à super_admin
        FOR perm_id IN 
            (SELECT id FROM permissions WHERE "group" = 'people')
        LOOP
            INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
            VALUES (super_admin_id, perm_id, menu_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'People permissions assigned to super_admin role';
    ELSE
        RAISE NOTICE 'Super admin role not found';
    END IF;
END $$;
