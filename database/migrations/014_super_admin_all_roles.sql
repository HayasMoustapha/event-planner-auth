-- Migration 014: Attribuer tous les rôles à super_admin
-- Cette migration garantit que super_admin a accès à toutes les fonctionnalités

-- Créer tous les rôles manquants s'ils n'existent pas
INSERT INTO roles (code, label, description, is_system, level, created_at, updated_at) VALUES 
('admin', '{"en": "Administrator", "fr": "Administrateur"}', '{"en": "System administrator", "fr": "Administrateur système"}', TRUE, 90, NOW(), NOW()),
('organizer', '{"en": "Organizer", "fr": "Organisateur"}', '{"en": "Event organizer", "fr": "Organisateur d''evenements"}', TRUE, 80, NOW(), NOW()),
('event_manager', '{"en": "Event Manager", "fr": "Gestionnaire d''evenements"}', '{"en": "Event manager", "fr": "Gestionnaire d''evenements"}', TRUE, 75, NOW(), NOW()),
('designer', '{"en": "Designer", "fr": "Designer"}', '{"en": "Template designer", "fr": "Designer de modeles"}', TRUE, 70, NOW(), NOW()),
('participant', '{"en": "Participant", "fr": "Participant"}', '{"en": "Event participant", "fr": "Participant aux evenements"}', TRUE, 50, NOW(), NOW()),
('staff', '{"en": "Staff", "fr": "Staff"}', '{"en": "Event staff", "fr": "Staff d''evenements"}', TRUE, 60, NOW(), NOW()),
('user', '{"en": "User", "fr": "Utilisateur"}', '{"en": "Regular user", "fr": "Utilisateur standard"}', TRUE, 40, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Donner tous les rôles à tous les utilisateurs ayant le rôle super_admin
INSERT INTO accesses (user_id, role_id, status, granted_at, created_at, updated_at)
SELECT 
    u.id as user_id,
    r.id as role_id,
    'active' as status,
    NOW() as granted_at,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
CROSS JOIN roles r
WHERE u.id IN (
    SELECT DISTINCT a.user_id 
    FROM accesses a
    INNER JOIN roles r ON a.role_id = r.id
    WHERE r.code = 'super_admin' AND a.status = 'active'
)
AND r.code IN ('admin', 'organizer', 'event_manager', 'designer', 'participant', 'staff', 'user')
AND NOT EXISTS (
    SELECT 1 FROM accesses a2 
    WHERE a2.user_id = u.id AND a2.role_id = r.id AND a2.status = 'active'
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Créer toutes les permissions manquantes pour les nouveaux modules
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES 
-- Events permissions
('events.create', '{"en": "Create Events", "fr": "Créer des événements"}', 'events', '{"en": "Create new events", "fr": "Créer de nouveaux événements"}', NOW(), NOW()),
('events.read', '{"en": "Read Events", "fr": "Lire les événements"}', 'events', '{"en": "View events", "fr": "Voir les événements"}', NOW(), NOW()),
('events.update', '{"en": "Update Events", "fr": "Mettre à jour les événements"}', 'events', '{"en": "Update existing events", "fr": "Mettre à jour les événements existants"}', NOW(), NOW()),
('events.delete', '{"en": "Delete Events", "fr": "Supprimer les événements"}', 'events', '{"en": "Delete events", "fr": "Supprimer les événements"}', NOW(), NOW()),
('events.invitations.send', '{"en": "Send Invitations", "fr": "Envoyer des invitations"}', 'events', '{"en": "Send event invitations", "fr": "Envoyer des invitations d\'événements"}', NOW(), NOW()),
('events.invitations.read', '{"en": "Read Invitations", "fr": "Lire les invitations"}', 'events', '{"en": "View event invitations", "fr": "Voir les invitations d\'événements"}', NOW(), NOW()),
('events.invitations.delete', '{"en": "Delete Invitations", "fr": "Supprimer les invitations"}', 'events', '{"en": "Delete event invitations", "fr": "Supprimer les invitations d\'événements"}', NOW(), NOW()),

-- Guests permissions  
('guests.create', '{"en": "Create Guests", "fr": "Créer des invités"}', 'guests', '{"en": "Create new guests", "fr": "Créer de nouveaux invités"}', NOW(), NOW()),
('guests.read', '{"en": "Read Guests", "fr": "Lire les invités"}', 'guests', '{"en": "View guests", "fr": "Voir les invités"}', NOW(), NOW()),
('guests.update', '{"en": "Update Guests", "fr": "Mettre à jour les invités"}', 'guests', '{"en": "Update existing guests", "fr": "Mettre à jour les invités existants"}', NOW(), NOW()),
('guests.delete', '{"en": "Delete Guests", "fr": "Supprimer les invités"}', 'guests', '{"en": "Delete guests", "fr": "Supprimer les invités"}', NOW(), NOW()),
('guests.manage', '{"en": "Manage Guests", "fr": "Gérer les invités"}', 'guests', '{"en": "Full guest management", "fr": "Gestion complète des invités"}', NOW(), NOW()),

-- Tickets permissions
('tickets.create', '{"en": "Create Tickets", "fr": "Créer des tickets"}', 'tickets', '{"en": "Create new tickets", "fr": "Créer de nouveaux tickets"}', NOW(), NOW()),
('tickets.read', '{"en": "Read Tickets", "fr": "Lire les tickets"}', 'tickets', '{"en": "View tickets", "fr": "Voir les tickets"}', NOW(), NOW()),
('tickets.update', '{"en": "Update Tickets", "fr": "Mettre à jour les tickets"}', 'tickets', '{"en": "Update existing tickets", "fr": "Mettre à jour les tickets existants"}', NOW(), NOW()),
('tickets.delete', '{"en": "Delete Tickets", "fr": "Supprimer les tickets"}', 'tickets', '{"en": "Delete tickets", "fr": "Supprimer les tickets"}', NOW(), NOW()),
('tickets.generate', '{"en": "Generate Tickets", "fr": "Générer des tickets"}', 'tickets', '{"en": "Generate event tickets", "fr": "Générer des tickets d\'événements"}', NOW(), NOW()),
('tickets.validate', '{"en": "Validate Tickets", "fr": "Valider les tickets"}', 'tickets', '{"en": "Validate event tickets", "fr": "Valider les tickets d\'événements"}', NOW(), NOW()),
('tickets.types.read', '{"en": "Read Ticket Types", "fr": "Lire les types de tickets"}', 'tickets', '{"en": "View ticket types", "fr": "Voir les types de tickets"}', NOW(), NOW()),
('tickets.types.update', '{"en": "Update Ticket Types", "fr": "Mettre à jour les types de tickets"}', 'tickets', '{"en": "Update ticket types", "fr": "Mettre à jour les types de tickets"}', NOW(), NOW()),
('tickets.types.delete', '{"en": "Delete Ticket Types", "fr": "Supprimer les types de tickets"}', 'tickets', '{"en": "Delete ticket types", "fr": "Supprimer les types de tickets"}', NOW(), NOW()),
('tickets.templates.read', '{"en": "Read Ticket Templates", "fr": "Lire les modèles de tickets"}', 'tickets', '{"en": "View ticket templates", "fr": "Voir les modèles de tickets"}', NOW(), NOW()),
('tickets.templates.update', '{"en": "Update Ticket Templates", "fr": "Mettre à jour les modèles de tickets"}', 'tickets', '{"en": "Update ticket templates", "fr": "Mettre à jour les modèles de tickets"}', NOW(), NOW()),
('tickets.templates.delete', '{"en": "Delete Ticket Templates", "fr": "Supprimer les modèles de tickets"}', 'tickets', '{"en": "Delete ticket templates", "fr": "Supprimer les modèles de tickets"}', NOW(), NOW()),
('tickets.jobs.create', '{"en": "Create Ticket Jobs", "fr": "Créer des jobs de tickets"}', 'tickets', '{"en": "Create ticket generation jobs", "fr": "Créer des jobs de génération de tickets"}', NOW(), NOW()),
('tickets.jobs.process', '{"en": "Process Ticket Jobs", "fr": "Traiter les jobs de tickets"}', 'tickets', '{"en": "Process ticket generation jobs", "fr": "Traiter les jobs de génération de tickets"}', NOW(), NOW()),
('tickets.stats.read', '{"en": "Read Ticket Stats", "fr": "Lire les statistiques de tickets"}', 'tickets', '{"en": "View ticket statistics", "fr": "Voir les statistiques de tickets"}', NOW(), NOW()),

-- Marketplace permissions
('marketplace.create', '{"en": "Create Marketplace Items", "fr": "Créer des éléments marketplace"}', 'marketplace', '{"en": "Create marketplace items", "fr": "Créer des éléments du marketplace"}', NOW(), NOW()),
('marketplace.read', '{"en": "Read Marketplace", "fr": "Lire le marketplace"}', 'marketplace', '{"en": "View marketplace", "fr": "Voir le marketplace"}', NOW(), NOW()),
('marketplace.update', '{"en": "Update Marketplace", "fr": "Mettre à jour le marketplace"}', 'marketplace', '{"en": "Update marketplace items", "fr": "Mettre à jour les éléments du marketplace"}', NOW(), NOW()),
('marketplace.design', '{"en": "Design Templates", "fr": "Designer des modèles"}', 'marketplace', '{"en": "Design marketplace templates", "fr": "Designer des modèles pour le marketplace"}', NOW(), NOW()),

-- Admin permissions
('admin.access', '{"en": "Admin Access", "fr": "Accès admin"}', 'admin', '{"en": "Access admin panel", "fr": "Accéder au panneau d\'administration"}', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Donner toutes les permissions à super_admin
INSERT INTO authorizations (role_id, permission_id, menu_id, granted_at, created_at, updated_at)
SELECT 
    r.id as role_id,
    p.id as permission_id,
    1 as menu_id, -- Menu par défaut
    NOW() as granted_at,
    NOW() as created_at,
    NOW() as updated_at
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
AND NOT EXISTS (
    SELECT 1 FROM authorizations a2 
    WHERE a2.role_id = r.id AND a2.permission_id = p.id
)
ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;

-- Donner toutes les permissions aux autres rôles selon leur niveau
-- Admin: presque tout sauf super_admin spécifique
INSERT INTO authorizations (role_id, permission_id, menu_id, granted_at, created_at, updated_at)
SELECT 
    r.id as role_id,
    p.id as permission_id,
    1 as menu_id,
    NOW() as granted_at,
    NOW() as created_at,
    NOW() as updated_at
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('admin', 'organizer', 'event_manager', 'designer', 'participant', 'staff', 'user')
AND p.code NOT LIKE '%super_admin%'
AND NOT EXISTS (
    SELECT 1 FROM authorizations a2 
    WHERE a2.role_id = r.id AND a2.permission_id = p.id
)
ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
