-- ========================================
-- SEED DES RÔLES SYSTÈME RBAC (POSTGRESQL)
-- ========================================
-- Nettoyage + normalisation : 4 rôles uniques
-- Compatible avec le schéma PostgreSQL actuel

-- Supprimer tous les rôles hors modèle cible (cascade sur authorizations/accesses)
DELETE FROM roles
WHERE code NOT IN ('super_admin', 'organizer', 'designer', 'user');

-- Insertion / mise à jour des rôles cibles (IDEMPOTENT)
INSERT INTO roles (code, label, description, is_system, level, created_at, updated_at) VALUES
('super_admin', '{"fr": "Super Administrateur", "en": "Super Administrator"}'::jsonb, '{"fr": "Super administrateur avec tous les droits absolus", "en": "Super administrator with absolute rights"}'::jsonb, true, 1, NOW(), NOW()),
('organizer', '{"fr": "Organisateur", "en": "Organizer"}'::jsonb, '{"fr": "Organisateur d''événements et gestionnaire de participants", "en": "Event organizer and participant manager"}'::jsonb, false, 3, NOW(), NOW()),
('designer', '{"fr": "Designer", "en": "Designer"}'::jsonb, '{"fr": "Créateur de templates et designs visuels", "en": "Template creator and visual designer"}'::jsonb, false, 3, NOW(), NOW()),
('user', '{"fr": "Utilisateur", "en": "User"}'::jsonb, '{"fr": "Utilisateur standard avec droits de base", "en": "Standard user with basic rights"}'::jsonb, true, 4, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  level = EXCLUDED.level,
  deleted_at = NULL,
  updated_at = NOW();

-- Afficher confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Rôles normalisés avec succès: % rôles actifs', 
        (SELECT COUNT(*) FROM roles WHERE deleted_at IS NULL);
END $$;
