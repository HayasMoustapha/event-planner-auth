-- ========================================
-- SEED ROLES (4 roles stricts)
-- ========================================
DELETE FROM roles WHERE code NOT IN ('super_admin', 'organizer', 'designer', 'user', 'scan_operator');

-- Insertion idempotente sans ON CONFLICT (index partiel)
INSERT INTO roles (code, label, description, is_system, level, created_at, updated_at)
SELECT * FROM (VALUES
('super_admin', '{"fr": "Super Administrateur", "en": "Super Administrator"}'::jsonb, '{"fr": "Tous les droits", "en": "All permissions"}'::jsonb, TRUE, 1, NOW(), NOW()),
('organizer', '{"fr": "Organisateur", "en": "Organizer"}'::jsonb, '{"fr": "Gestion d''evenements et billets", "en": "Event organizer"}'::jsonb, FALSE, 3, NOW(), NOW()),
('designer', '{"fr": "Designer", "en": "Designer"}'::jsonb, '{"fr": "Creation de templates", "en": "Template creator"}'::jsonb, FALSE, 3, NOW(), NOW()),
('user', '{"fr": "Utilisateur", "en": "User"}'::jsonb, '{"fr": "Participant standard", "en": "Standard user"}'::jsonb, TRUE, 4, NOW(), NOW()),
('scan_operator', '{"fr": "Opérateur de Scan", "en": "Scan Operator"}'::jsonb, '{"fr": "Scan des billets sur site", "en": "On-site ticket scanning"}'::jsonb, FALSE, 4, NOW(), NOW())
) AS v(code, label, description, is_system, level, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.code = v.code AND r.deleted_at IS NULL
);

-- Réactivation / mise à jour des rôles existants
UPDATE roles r
SET label = v.label,
    description = v.description,
    is_system = v.is_system,
    level = v.level,
    deleted_at = NULL,
    updated_at = NOW()
FROM (VALUES
('super_admin', '{"fr": "Super Administrateur", "en": "Super Administrator"}'::jsonb, '{"fr": "Tous les droits", "en": "All permissions"}'::jsonb, TRUE, 1),
('organizer', '{"fr": "Organisateur", "en": "Organizer"}'::jsonb, '{"fr": "Gestion d''evenements et billets", "en": "Event organizer"}'::jsonb, FALSE, 3),
('designer', '{"fr": "Designer", "en": "Designer"}'::jsonb, '{"fr": "Creation de templates", "en": "Template creator"}'::jsonb, FALSE, 3),
('user', '{"fr": "Utilisateur", "en": "User"}'::jsonb, '{"fr": "Participant standard", "en": "Standard user"}'::jsonb, TRUE, 4),
('scan_operator', '{"fr": "Opérateur de Scan", "en": "Scan Operator"}'::jsonb, '{"fr": "Scan des billets sur site", "en": "On-site ticket scanning"}'::jsonb, FALSE, 4)
) AS v(code, label, description, is_system, level)
WHERE r.code = v.code;
