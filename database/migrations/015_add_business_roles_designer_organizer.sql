-- Migration: Ajout des rôles métier designer et organizer
-- Généré le 2026-02-02 pour la sélection de rôle post-inscription
-- SQL natif PostgreSQL uniquement

-- ========================================
-- AJOUT DES RÔLES MÉTIER MANQUANTS
-- ========================================

-- Insertion des rôles designer et organizer (IDEMPOTENT)
INSERT INTO roles (code, label, description, is_system, level, created_at, updated_at) VALUES
('designer', '{"fr": "Designer", "en": "Designer"}', '{"fr": "Créateur de templates et designs visuels", "en": "Template creator and visual designer"}', false, 3, NOW(), NOW()),
('organizer', '{"fr": "Organisateur", "en": "Organizer"}', '{"fr": "Organisateur d''événements et gestionnaire de participants", "en": "Event organizer and participant manager"}', false, 3, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- PERMISSIONS SPÉCIFIQUES DESIGNER
-- ========================================

-- Permissions pour le designer (création et gestion de templates)
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
-- Templates et Design
('templates.design', '{"fr": "Designer template", "en": "Design template"}', 'templates', '{"fr": "Créer et designer des templates visuels", "en": "Create and design visual templates"}', NOW(), NOW()),
('templates.publish', '{"fr": "Publier template", "en": "Publish template"}', 'templates', '{"fr": "Publier des templates sur la marketplace", "en": "Publish templates on marketplace"}', NOW(), NOW()),
('templates.sell', '{"fr": "Vendre template", "en": "Sell template"}', 'templates', '{"fr": "Vendre des templates sur la marketplace", "en": "Sell templates on marketplace"}', NOW(), NOW()),
('templates.analytics', '{"fr": "Analytics templates", "en": "Template analytics"}', 'templates', '{"fr": "Voir les statistiques de ventes de templates", "en": "View template sales analytics"}', NOW(), NOW()),
-- Marketplace (limité pour designer)
('marketplace.designer.read', '{"fr": "Lire marketplace designer", "en": "Read designer marketplace"}', 'marketplace', '{"fr": "Accès à la marketplace pour designers", "en": "Access designer marketplace"}', NOW(), NOW()),
('marketplace.designer.upload', '{"fr": "Uploader sur marketplace", "en": "Upload to marketplace"}', 'marketplace', '{"fr": "Uploader des templates sur la marketplace", "en": "Upload templates to marketplace"}', NOW(), NOW()),
-- Notifications (limité pour designer)
('notifications.designer.send', '{"fr": "Notifications designer", "en": "Designer notifications"}', 'notifications', '{"fr": "Envoyer des notifications liées aux templates", "en": "Send template-related notifications"}', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- PERMISSIONS SPÉCIFIQUES ORGANIZER
-- ========================================

-- Permissions pour l'organizer (gestion complète d'événements)
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
-- Events (complet pour organizer)
('events.organizer.create', '{"fr": "Créer événement organizer", "en": "Create organizer event"}', 'events', '{"fr": "Créer et gérer des événements complets", "en": "Create and manage complete events"}', NOW(), NOW()),
('events.organizer.manage', '{"fr": "Gérer événement organizer", "en": "Manage organizer event"}', 'events', '{"fr": "Gestion complète des événements", "en": "Complete event management"}', NOW(), NOW()),
('events.organizer.publish', '{"fr": "Publier événement organizer", "en": "Publish organizer event"}', 'events', '{"fr": "Publier des événements", "en": "Publish events"}', NOW(), NOW()),
('events.organizer.analytics', '{"fr": "Analytics événements organizer", "en": "Organizer event analytics"}', 'events', '{"fr": "Voir les statistiques des événements", "en": "View event statistics"}', NOW(), NOW()),
-- Guests (complet pour organizer)
('guests.organizer.manage', '{"fr": "Gérer invités organizer", "en": "Manage organizer guests"}', 'guests', '{"fr": "Gestion complète des invités", "en": "Complete guest management"}', NOW(), NOW()),
('guests.organizer.import', '{"fr": "Importer invités organizer", "en": "Import organizer guests"}', 'guests', '{"fr": "Importer des listes d''invités", "en": "Import guest lists"}', NOW(), NOW()),
('guests.organizer.export', '{"fr": "Exporter invités organizer", "en": "Export organizer guests"}', 'guests', '{"fr": "Exporter des listes d''invités", "en": "Export guest lists"}', NOW(), NOW()),
-- Tickets (complet pour organizer)
('tickets.organizer.generate', '{"fr": "Générer tickets organizer", "en": "Generate organizer tickets"}', 'tickets', '{"fr": "Générer des tickets pour événements", "en": "Generate event tickets"}', NOW(), NOW()),
('tickets.organizer.validate', '{"fr": "Valider tickets organizer", "en": "Validate organizer tickets"}', 'tickets', '{"fr": "Valider des tickets d''événements", "en": "Validate event tickets"}', NOW(), NOW()),
('tickets.organizer.analytics', '{"fr": "Analytics tickets organizer", "en": "Organizer ticket analytics"}', 'tickets', '{"fr": "Voir les statistiques des tickets", "en": "View ticket statistics"}', NOW(), NOW()),
-- Marketplace (limité pour organizer)
('marketplace.organizer.read', '{"fr": "Lire marketplace organizer", "en": "Read organizer marketplace"}', 'marketplace', '{"fr": "Accès à la marketplace pour achats", "en": "Access marketplace for purchases"}', NOW(), NOW()),
('marketplace.organizer.purchase', '{"fr": "Acheter marketplace organizer", "en": "Purchase organizer marketplace"}', 'marketplace', '{"fr": "Acheter des templates pour événements", "en": "Purchase templates for events"}', NOW(), NOW()),
-- Notifications (limité pour organizer)
('notifications.organizer.send', '{"fr": "Notifications organizer", "en": "Organizer notifications"}', 'notifications', '{"fr": "Envoyer des notifications événementielles", "en": "Send event notifications"}', NOW(), NOW()),
-- Payments (limité pour organizer)
('payments.organizer.read', '{"fr": "Lire paiements organizer", "en": "Read organizer payments"}', 'payments', '{"fr": "Voir les paiements d''événements", "en": "View event payments"}', NOW(), NOW()),
('payments.organizer.refunds', '{"fr": "Remboursements organizer", "en": "Organizer refunds"}', 'payments', '{"fr": "Gérer les remboursements d''événements", "en": "Manage event refunds"}', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- AUTORISATIONS DESIGNER
-- ========================================

-- Récupérer les IDs et créer les autorisations pour designer
DO $$
DECLARE
    designer_role_id BIGINT;
    selected_menu_id BIGINT;
    authorization_count INTEGER := 0;
    perm_record RECORD;
BEGIN
    -- Récupérer l'ID du rôle designer
    SELECT id INTO designer_role_id FROM roles WHERE code = 'designer';
    
    IF designer_role_id IS NOT NULL THEN
        RAISE NOTICE '🎨 Création des autorisations pour le rôle designer...';
        
        -- Permissions Templates
        FOR perm_record IN SELECT id FROM permissions WHERE "group" = 'templates' AND 
                             (code LIKE '%design%' OR code LIKE '%publish%' OR code LIKE '%sell%' OR code LIKE '%analytics%') LOOP
            -- Menu principal templates
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/templates' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (designer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        -- Permissions Marketplace (limité)
        FOR perm_record IN SELECT id FROM permissions WHERE code LIKE '%marketplace.designer%' LOOP
            -- Menu marketplace
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/marketplace' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (designer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        -- Permissions Notifications (limité)
        FOR perm_record IN SELECT id FROM permissions WHERE code = 'notifications.designer.send' LOOP
            -- Menu notifications
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/notifications' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (designer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        -- Permissions de base (profil)
        FOR perm_record IN SELECT id FROM permissions WHERE "group" = 'users' AND 
                             (code = 'users.read' OR code = 'users.update') LOOP
            -- Menu profil
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/profile' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (designer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        RAISE NOTICE '🎨 DESIGNER: % autorisations créées', authorization_count;
    END IF;
END $$;

-- ========================================
-- AUTORISATIONS ORGANIZER
-- ========================================

-- Récupérer les IDs et créer les autorisations pour organizer
DO $$
DECLARE
    organizer_role_id BIGINT;
    selected_menu_id BIGINT;
    authorization_count INTEGER := 0;
    perm_record RECORD;
BEGIN
    -- Récupérer l'ID du rôle organizer
    SELECT id INTO organizer_role_id FROM roles WHERE code = 'organizer';
    
    IF organizer_role_id IS NOT NULL THEN
        RAISE NOTICE '📅 Création des autorisations pour le rôle organizer...';
        
        -- Permissions Events (complètes)
        FOR perm_record IN SELECT id FROM permissions WHERE "group" = 'events' AND 
                             (code LIKE '%organizer%' OR code LIKE '%read%' OR code LIKE '%list%') LOOP
            -- Menu events
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/events' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (organizer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        -- Permissions Guests (complètes)
        FOR perm_record IN SELECT id FROM permissions WHERE "group" = 'guests' AND 
                             (code LIKE '%organizer%' OR code LIKE '%read%' OR code LIKE '%list%') LOOP
            -- Menu guests
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/guests' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (organizer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        -- Permissions Tickets (complètes)
        FOR perm_record IN SELECT id FROM permissions WHERE "group" = 'tickets' AND 
                             (code LIKE '%organizer%' OR code LIKE '%read%' OR code LIKE '%list%') LOOP
            -- Menu tickets
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/tickets' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (organizer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        -- Permissions Marketplace (limité)
        FOR perm_record IN SELECT id FROM permissions WHERE code LIKE '%marketplace.organizer%' LOOP
            -- Menu marketplace
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/marketplace' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (organizer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        -- Permissions Notifications (limité)
        FOR perm_record IN SELECT id FROM permissions WHERE code = 'notifications.organizer.send' LOOP
            -- Menu notifications
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/notifications' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (organizer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        -- Permissions Payments (limité)
        FOR perm_record IN SELECT id FROM permissions WHERE code LIKE '%payments.organizer%' LOOP
            -- Menu payments
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/payments' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (organizer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        -- Permissions de base (profil)
        FOR perm_record IN SELECT id FROM permissions WHERE "group" = 'users' AND 
                             (code = 'users.read' OR code = 'users.update') LOOP
            -- Menu profil
            SELECT id INTO selected_menu_id FROM menus WHERE route = '/profile' LIMIT 1;
            IF selected_menu_id IS NOT NULL THEN
                INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
                VALUES (organizer_role_id, perm_record.id, selected_menu_id, NOW(), NOW())
                ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
                authorization_count := authorization_count + 1;
            END IF;
        END LOOP;
        
        RAISE NOTICE '📅 ORGANIZER: % autorisations créées', authorization_count;
    END IF;
END $$;

-- ========================================
-- CONFIRMATION
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration rôles métier terminée avec succès';
    RAISE NOTICE '   Rôles ajoutés: designer, organizer';
    RAISE NOTICE '   Total des rôles: %', (SELECT COUNT(*) FROM roles);
    RAISE NOTICE '   Total des permissions: %', (SELECT COUNT(*) FROM permissions);
    RAISE NOTICE '   Total des autorisations: %', (SELECT COUNT(*) FROM authorizations);
END $$;
