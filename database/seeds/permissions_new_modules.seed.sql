-- Permissions pour le module ACCESSES (User-Role Management)
-- Ces permissions permettent de gérer les associations entre utilisateurs et rôles

INSERT INTO permissions (code, label, group, description, created_at, updated_at) VALUES
-- Permissions de lecture
('accesses.read', 
 '{"fr": "Lire les accès", "en": "Read accesses"}', 
 'accesses', 
 '{"fr": "Permet de lire les associations utilisateur-rôle", "en": "Allows reading user-role associations"}',
 NOW(), NOW()),

-- Permissions de création
('accesses.create', 
 '{"fr": "Créer des accès", "en": "Create accesses"}', 
 'accesses', 
 '{"fr": "Permet de créer de nouvelles associations utilisateur-rôle", "en": "Allows creating new user-role associations"}',
 NOW(), NOW()),

-- Permissions de mise à jour
('accesses.update', 
 '{"fr": "Mettre à jour les accès", "en": "Update accesses"}', 
 'accesses', 
 '{"fr": "Permet de modifier les associations utilisateur-rôle existantes", "en": "Allows modifying existing user-role associations"}',
 NOW(), NOW()),

-- Permissions de suppression
('accesses.delete', 
 '{"fr": "Supprimer les accès", "en": "Delete accesses"}', 
 'accesses', 
 '{"fr": "Permet de supprimer (soft delete) les associations utilisateur-rôle", "en": "Allows soft deleting user-role associations"}',
 NOW(), NOW()),

-- Permissions de suppression définitive
('accesses.hard_delete', 
 '{"fr": "Supprimer définitivement les accès", "en": "Hard delete accesses"}', 
 'accesses', 
 '{"fr": "Permet de supprimer définitivement les associations utilisateur-rôle", "en": "Allows hard deleting user-role associations"}',
 NOW(), NOW()),

-- Permissions d'assignation multiple
('accesses.assign', 
 '{"fr": "Assigner des rôles", "en": "Assign roles"}', 
 'accesses', 
 '{"fr": "Permet d''assigner plusieurs rôles à un utilisateur", "en": "Allows assigning multiple roles to a user"}',
 NOW(), NOW()),

-- Permissions de retrait multiple
('accesses.remove', 
 '{"fr": "Retirer des rôles", "en": "Remove roles"}', 
 'accesses', 
 '{"fr": "Permet de retirer plusieurs rôles d''un utilisateur", "en": "Allows removing multiple roles from a user"}',
 NOW(), NOW()),

-- Permissions pour le module AUTHORIZATIONS (Role-Permission-Menu Management)
-- Ces permissions permettent de gérer les autorisations complexes

-- Permissions de lecture
('authorizations.read', 
 '{"fr": "Lire les autorisations", "en": "Read authorizations"}', 
 'authorizations', 
 '{"fr": "Permet de lire les associations rôle-permission-menu", "en": "Allows reading role-permission-menu associations"}',
 NOW(), NOW()),

-- Permissions de création
('authorizations.create', 
 '{"fr": "Créer des autorisations", "en": "Create authorizations"}', 
 'authorizations', 
 '{"fr": "Permet de créer de nouvelles associations rôle-permission-menu", "en": "Allows creating new role-permission-menu associations"}',
 NOW(), NOW()),

-- Permissions de mise à jour
('authorizations.update', 
 '{"fr": "Mettre à jour les autorisations", "en": "Update authorizations"}', 
 'authorizations', 
 '{"fr": "Permet de modifier les associations rôle-permission-menu existantes", "en": "Allows modifying existing role-permission-menu associations"}',
 NOW(), NOW()),

-- Permissions de suppression
('authorizations.delete', 
 '{"fr": "Supprimer les autorisations", "en": "Delete authorizations"}', 
 'authorizations', 
 '{"fr": "Permet de supprimer (soft delete) les associations rôle-permission-menu", "en": "Allows soft deleting role-permission-menu associations"}',
 NOW(), NOW()),

-- Permissions de suppression définitive
('authorizations.hard_delete', 
 '{"fr": "Supprimer définitivement les autorisations", "en": "Hard delete authorizations"}', 
 'authorizations', 
 '{"fr": "Permet de supprimer définitivement les associations rôle-permission-menu", "en": "Allows hard deleting role-permission-menu associations"}',
 NOW(), NOW()),

-- Permissions de vérification (déjà existantes mais regroupées ici pour cohérence)
('authorizations.check', 
 '{"fr": "Vérifier les autorisations", "en": "Check authorizations"}', 
 'authorizations', 
 '{"fr": "Permet de vérifier les permissions d''un utilisateur", "en": "Allows checking user permissions"}',
 NOW(), NOW()),

-- Permissions de gestion du cache
('authorizations.cache', 
 '{"fr": "Gérer le cache d''autorisations", "en": "Manage authorization cache"}', 
 'authorizations', 
 '{"fr": "Permet de gérer le cache des autorisations utilisateur", "en": "Allows managing user authorization cache"}',
 NOW(), NOW()),

-- Permissions avancées pour l'administration système
('system.admin', 
 '{"fr": "Administration système", "en": "System administration"}', 
 'system', 
 '{"fr": "Accès complet à l''administration du système", "en": "Full system administration access"}',
 NOW(), NOW()),

('system.monitoring', 
 '{"fr": "Monitoring système", "en": "System monitoring"}', 
 'system', 
 '{"fr": "Permet d''accéder aux outils de monitoring", "en": "Allows accessing monitoring tools"}',
 NOW(), NOW()),

('system.audit', 
 '{"fr": "Audit système", "en": "System audit"}', 
 'system', 
 '{"fr": "Permet d''accéder aux logs et rapports d''audit", "en": "Allows accessing audit logs and reports"}',
 NOW(), NOW());

-- Mettre à jour la séquence pour les prochaines insertions
SELECT setval('permissions_id_seq', (SELECT MAX(id) FROM permissions));
