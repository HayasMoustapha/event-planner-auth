-- Migration 014: Attribuer tous les rôles à super_admin (version sans accents)

-- Créer tous les rôles manquants s'ils n'existent pas
INSERT INTO roles (code, label, description, is_system, level, created_at, updated_at) VALUES 
('admin', '{"en": "Administrator", "fr": "Administrateur"}', '{"en": "System administrator", "fr": "Administrateur systeme"}', TRUE, 90, NOW(), NOW()),
('organizer', '{"en": "Organizer", "fr": "Organisateur"}', '{"en": "Event organizer", "fr": "Organisateur d evenements"}', TRUE, 80, NOW(), NOW()),
('event_manager', '{"en": "Event Manager", "fr": "Gestionnaire evenements"}', '{"en": "Event manager", "fr": "Gestionnaire d evenements"}', TRUE, 75, NOW(), NOW()),
('designer', '{"en": "Designer", "fr": "Designer"}', '{"en": "Template designer", "fr": "Designer de modeles"}', TRUE, 70, NOW(), NOW()),
('participant', '{"en": "Participant", "fr": "Participant"}', '{"en": "Event participant", "fr": "Participant aux evenements"}', TRUE, 50, NOW(), NOW()),
('staff', '{"en": "Staff", "fr": "Staff"}', '{"en": "Event staff", "fr": "Staff d evenements"}', TRUE, 60, NOW(), NOW()),
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
('events.create', '{"en": "Create Events", "fr": "Creer evenements"}', 'events', '{"en": "Create new events", "fr": "Creer nouveaux evenements"}', NOW(), NOW()),
('events.read', '{"en": "Read Events", "fr": "Lire evenements"}', 'events', '{"en": "View events", "fr": "Voir evenements"}', NOW(), NOW()),
('events.update', '{"en": "Update Events", "fr": "Mettre a jour evenements"}', 'events', '{"en": "Update existing events", "fr": "Mettre a jour evenements existants"}', NOW(), NOW()),
('events.delete', '{"en": "Delete Events", "fr": "Supprimer evenements"}', 'events', '{"en": "Delete events", "fr": "Supprimer evenements"}', NOW(), NOW()),
('events.invitations.send', '{"en": "Send Invitations", "fr": "Envoyer invitations"}', 'events', '{"en": "Send event invitations", "fr": "Envoyer invitations evenements"}', NOW(), NOW()),
('events.invitations.read', '{"en": "Read Invitations", "fr": "Lire invitations"}', 'events', '{"en": "View event invitations", "fr": "Voir invitations evenements"}', NOW(), NOW()),
('events.invitations.delete', '{"en": "Delete Invitations", "fr": "Supprimer invitations"}', 'events', '{"en": "Delete event invitations", "fr": "Supprimer invitations evenements"}', NOW(), NOW()),
('guests.create', '{"en": "Create Guests", "fr": "Creer invites"}', 'guests', '{"en": "Create new guests", "fr": "Creer nouveaux invites"}', NOW(), NOW()),
('guests.read', '{"en": "Read Guests", "fr": "Lire invites"}', 'guests', '{"en": "View guests", "fr": "Voir invites"}', NOW(), NOW()),
('guests.update', '{"en": "Update Guests", "fr": "Mettre a jour invites"}', 'guests', '{"en": "Update existing guests", "fr": "Mettre a jour invites existants"}', NOW(), NOW()),
('guests.delete', '{"en": "Delete Guests", "fr": "Supprimer invites"}', 'guests', '{"en": "Delete guests", "fr": "Supprimer invites"}', NOW(), NOW()),
('guests.manage', '{"en": "Manage Guests", "fr": "Gerer invites"}', 'guests', '{"en": "Full guest management", "fr": "Gestion complete invites"}', NOW(), NOW()),
('tickets.create', '{"en": "Create Tickets", "fr": "Creer tickets"}', 'tickets', '{"en": "Create new tickets", "fr": "Creer nouveaux tickets"}', NOW(), NOW()),
('tickets.read', '{"en": "Read Tickets", "fr": "Lire tickets"}', 'tickets', '{"en": "View tickets", "fr": "Voir tickets"}', NOW(), NOW()),
('tickets.update', '{"en": "Update Tickets", "fr": "Mettre a jour tickets"}', 'tickets', '{"en": "Update existing tickets", "fr": "Mettre a jour tickets existants"}', NOW(), NOW()),
('tickets.delete', '{"en": "Delete Tickets", "fr": "Supprimer tickets"}', 'tickets', '{"en": "Delete tickets", "fr": "Supprimer tickets"}', NOW(), NOW()),
('tickets.generate', '{"en": "Generate Tickets", "fr": "Generer tickets"}', 'tickets', '{"en": "Generate event tickets", "fr": "Generer tickets evenements"}', NOW(), NOW()),
('tickets.validate', '{"en": "Validate Tickets", "fr": "Valider tickets"}', 'tickets', '{"en": "Validate event tickets", "fr": "Valider tickets evenements"}', NOW(), NOW()),
('tickets.types.read', '{"en": "Read Ticket Types", "fr": "Lire types tickets"}', 'tickets', '{"en": "View ticket types", "fr": "Voir types tickets"}', NOW(), NOW()),
('tickets.types.update', '{"en": "Update Ticket Types", "fr": "Mettre a jour types tickets"}', 'tickets', '{"en": "Update ticket types", "fr": "Mettre a jour types tickets"}', NOW(), NOW()),
('tickets.types.delete', '{"en": "Delete Ticket Types", "fr": "Supprimer types tickets"}', 'tickets', '{"en": "Delete ticket types", "fr": "Supprimer types tickets"}', NOW(), NOW()),
('tickets.templates.read', '{"en": "Read Ticket Templates", "fr": "Lire modeles tickets"}', 'tickets', '{"en": "View ticket templates", "fr": "Voir modeles tickets"}', NOW(), NOW()),
('tickets.templates.update', '{"en": "Update Ticket Templates", "fr": "Mettre a jour modeles tickets"}', 'tickets', '{"en": "Update ticket templates", "fr": "Mettre a jour modeles tickets"}', NOW(), NOW()),
('tickets.templates.delete', '{"en": "Delete Ticket Templates", "fr": "Supprimer modeles tickets"}', 'tickets', '{"en": "Delete ticket templates", "fr": "Supprimer modeles tickets"}', NOW(), NOW()),
('tickets.jobs.create', '{"en": "Create Ticket Jobs", "fr": "Creer jobs tickets"}', 'tickets', '{"en": "Create ticket generation jobs", "fr": "Creer jobs generation tickets"}', NOW(), NOW()),
('tickets.jobs.process', '{"en": "Process Ticket Jobs", "fr": "Traiter jobs tickets"}', 'tickets', '{"en": "Process ticket generation jobs", "fr": "Traiter jobs generation tickets"}', NOW(), NOW()),
('tickets.stats.read', '{"en": "Read Ticket Stats", "fr": "Lire statistiques tickets"}', 'tickets', '{"en": "View ticket statistics", "fr": "Voir statistiques tickets"}', NOW(), NOW()),
('marketplace.create', '{"en": "Create Marketplace Items", "fr": "Creer elements marketplace"}', 'marketplace', '{"en": "Create marketplace items", "fr": "Creer elements marketplace"}', NOW(), NOW()),
('marketplace.read', '{"en": "Read Marketplace", "fr": "Lire marketplace"}', 'marketplace', '{"en": "View marketplace", "fr": "Voir marketplace"}', NOW(), NOW()),
('marketplace.update', '{"en": "Update Marketplace", "fr": "Mettre a jour marketplace"}', 'marketplace', '{"en": "Update marketplace items", "fr": "Mettre a jour elements marketplace"}', NOW(), NOW()),
('marketplace.design', '{"en": "Design Templates", "fr": "Designer modeles"}', 'marketplace', '{"en": "Design marketplace templates", "fr": "Designer modeles marketplace"}', NOW(), NOW()),
('admin.access', '{"en": "Admin Access", "fr": "Acces admin"}', 'admin', '{"en": "Access admin panel", "fr": "Acceder panneau administration"}', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Donner toutes les permissions à super_admin
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
WHERE r.code = 'super_admin'
AND NOT EXISTS (
    SELECT 1 FROM authorizations a2 
    WHERE a2.role_id = r.id AND a2.permission_id = p.id
)
ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
