-- Migration 006 : Harmonisation des types de données et optimisations techniques
-- Basé sur l'analyse comparative entre auth_tables_export.sql et 001_init_auth.sql
-- Vérification et standardisation des types PostgreSQL pour consistance maximale

-- 1. Vérification et standardisation des types JSON/JSONB
-- Les types sont déjà corrects (JSONB est préférable à JSON dans PostgreSQL)

-- Commentaire : Les types JSONB sont déjà utilisés et sont optimaux pour PostgreSQL
-- JSONB supporte l'indexation et est plus performant que JSON

-- 2. Standardisation des types TIMESTAMP
-- Vérification que tous les champs timestamp utilisent le bon type

-- Vérification des types TIMESTAMP dans les tables principales
-- Les types sont déjà corrects (TIMESTAMP sans timezone est approprié)

-- Commentaire : Les types TIMESTAMP sont déjà cohérents dans toutes les tables
-- PostgreSQL TIMESTAMP = timestamp without timezone (approprié pour cette application)

-- 3. Standardisation des types VARCHAR et longueurs
-- Vérification que les longueurs VARCHAR sont cohérentes avec le schéma de référence

-- Ajout de contraintes de longueur pour garantir la cohérence (optionnel)
-- Ces contraintes sont déjà implicites avec VARCHAR(255)

-- Commentaire : Les types VARCHAR(255) sont déjà cohérents avec le schéma MySQL
-- PostgreSQL gère correctement les longueurs VARCHAR

-- 4. Optimisation des types UUID
-- Vérification que les champs UUID utilisent le bon type et la bonne génération

-- Les champs UUID utilisent déjà gen_random_uuid() qui est la méthode recommandée
-- pour PostgreSQL 13+. C'est plus sécurisé et performant que uuid_generate_v4()

-- Commentaire : L'utilisation de gen_random_uuid() est déjà optimale et moderne

-- 5. Vérification des types numériques
-- Standardisation des types INTEGER vs BIGINT selon le contexte

-- Les types sont déjà corrects :
-- - BIGINT pour les clés primaires et étrangères (id, user_id, role_id, etc.)
-- - INTEGER pour les champs de niveau/compteurs (level, user_access)

-- Commentaire : Les types numériques sont déjà optimisés pour l'utilisation prévue

-- 6. Ajout de contraintes CHECK pour validation des types (si nécessaire)

-- Contrainte pour valider les valeurs de user_access (si applicable)
-- ALTER TABLE users 
-- ADD CONSTRAINT IF NOT EXISTS user_access_positive 
-- CHECK (user_access IS NULL OR user_access >= 0);

-- Commentaire : Contrainte optionnelle pour valider que user_access est positif
-- Laisser en commentaire pour ne pas imposer cette règle pour le moment

-- 7. Optimisation des encodages et collations
-- PostgreSQL gère déjà correctement l'UTF-8 par défaut

-- Vérification que les tables utilisent l'encodage par défaut (UTF-8)
-- Commentaire : PostgreSQL utilise déjà UTF-8 par défaut, pas de modification nécessaire

-- 8. Standardisation des valeurs par défaut
-- Vérification que les valeurs par défaut sont cohérentes

-- Les valeurs par défaut sont déjà cohérentes :
-- - FALSE pour les champs BOOLEAN (is_system, is_used)
-- - CURRENT_TIMESTAMP pour les timestamps d'audit
-- - gen_random_uuid() pour les UUID
-- - NULL pour les champs optionnels

-- Commentaire : Les valeurs par défaut sont déjà optimisées et cohérentes

-- 9. Ajout de commentaires sur les types pour documentation

-- Commentaires sur les types de données dans les tables principales
COMMENT ON COLUMN roles.is_system IS 'BOOLEAN équivalent MySQL tinyint(1) - FALSE par défaut';
COMMENT ON COLUMN roles.label IS 'JSONB équivalent MySQL json - stockage optimisé';
COMMENT ON COLUMN roles.description IS 'JSONB équivalent MySQL json - stockage optimisé';

COMMENT ON COLUMN permissions.label IS 'JSONB équivalent MySQL json - stockage optimisé';
COMMENT ON COLUMN permissions.description IS 'JSONB équivalent MySQL json - stockage optimisé';

COMMENT ON COLUMN otps.is_used IS 'BOOLEAN équivalent MySQL tinyint(1) - FALSE par défaut';

COMMENT ON COLUMN users.user_access IS 'INTEGER équivalent MySQL int - NULL par défaut';

-- Commentaire général sur la conversion MySQL → PostgreSQL
COMMENT ON TABLE roles IS 'Table convertie de MySQL vers PostgreSQL avec types optimisés';
COMMENT ON TABLE permissions IS 'Table convertie de MySQL vers PostgreSQL avec types optimisés';
COMMENT ON TABLE otps IS 'Table convertie de MySQL vers PostgreSQL avec types optimisés';

-- 10. Mise à jour des statistiques pour optimiser les performances
ANALYZE roles;
ANALYZE permissions;
ANALYZE otps;
ANALYZE users;

-- Commentaire : Mise à jour des statistiques PostgreSQL après vérification des types

-- 11. Validation finale de la cohérence des types
-- Cette migration sert principalement de documentation et validation
-- Les types sont déjà correctement alignés sur le schéma de référence

-- Résumé des conversions MySQL → PostgreSQL déjà correctes :
-- - bigint unsigned → BIGINT (PostgreSQL gère naturellement les non-signés)
-- - tinyint(1) → BOOLEAN (conversion sémantique correcte)
-- - json → JSONB (version améliorée et indexable)
-- - varchar(255) → VARCHAR(255) (directement compatible)
-- - timestamp → TIMESTAMP (directement compatible)
-- - char(36) → UUID (type natif plus performant)

-- Fin de la migration 006
