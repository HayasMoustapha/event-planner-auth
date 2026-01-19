-- Migration RBAC Phase 3: Création des permissions manquantes et assignation complète à super_admin
-- Généré le 2026-01-19 - VERSION CORRIGÉE ET SIMPLIFIÉE

-- Créer les permissions manquantes pour PEOPLE
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('people.list', '{"en": "List People", "fr": "Lister les personnes"}', 'people', '{"en": "List all people in system", "fr": "Lister toutes les personnes du système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.read', '{"en": "Read Person", "fr": "Lire une personne"}', 'people', '{"en": "Read person details", "fr": "Lire les détails d''une personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.create', '{"en": "Create Person", "fr": "Créer une personne"}', 'people', '{"en": "Create a new person", "fr": "Créer une nouvelle personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.update', '{"en": "Update Person", "fr": "Mettre à jour une personne"}', 'people', '{"en": "Update person information", "fr": "Mettre à jour les informations d''une personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.delete', '{"en": "Delete Person", "fr": "Supprimer une personne"}', 'people', '{"en": "Delete a person", "fr": "Supprimer une personne"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('people.stats', '{"en": "People Statistics", "fr": "Statistiques des personnes"}', 'people', '{"en": "View people statistics", "fr": "Voir les statistiques des personnes"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Créer les permissions manquantes pour USERS
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('users.stats', '{"en": "Users Statistics", "fr": "Statistiques des utilisateurs"}', 'users', '{"en": "View users statistics", "fr": "Voir les statistiques des utilisateurs"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Créer les permissions manquantes pour ROLES
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('roles.view_stats', '{"en": "Roles Statistics", "fr": "Statistiques des rôles"}', 'roles', '{"en": "View roles statistics", "fr": "Voir les statistiques des rôles"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Créer les permissions manquantes pour PERMISSIONS
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('permissions.view_stats', '{"en": "Permissions Statistics", "fr": "Statistiques des permissions"}', 'permissions', '{"en": "View permissions statistics", "fr": "Voir les statistiques des permissions"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Créer les permissions manquantes pour AUTH
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('auth.reset_password', '{"en": "Reset Password", "fr": "Réinitialiser mot de passe"}', 'auth', '{"en": "Password reset", "fr": "Réinitialisation mot de passe"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('auth.manage_tokens', '{"en": "Manage Tokens", "fr": "Gérer les tokens"}', 'auth', '{"en": "Manage authentication tokens", "fr": "Gérer les tokens d''authentification"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Créer les permissions manquantes pour SYSTEM
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('system.health', '{"en": "System Health", "fr": "Santé du système"}', 'system', '{"en": "Check system health", "fr": "Vérifier la santé du système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('system.metrics', '{"en": "System Metrics", "fr": "Métriques système"}', 'system', '{"en": "View system metrics", "fr": "Voir les métriques système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('system.logs', '{"en": "System Logs", "fr": "Logs système"}', 'system', '{"en": "View system logs", "fr": "Voir les logs système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('system.backup', '{"en": "System Backup", "fr": "Sauvegarde système"}', 'system', '{"en": "Create system backup", "fr": "Créer une sauvegarde système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('system.restore', '{"en": "System Restore", "fr": "Restauration système"}', 'system', '{"en": "Restore system", "fr": "Restaurer le système"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Assigner toutes les permissions au rôle super_admin
INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
SELECT r.id as role_id, p.id as permission_id, 1 as menu_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
