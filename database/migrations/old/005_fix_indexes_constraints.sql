-- Migration 005 : Correction des index et contraintes manquants pour l'intégrité des données
-- Basé sur l'analyse comparative entre auth_tables_export.sql et 001_init_auth.sql

-- 1. Ajout des index uniques manquants sur la table people
-- Référence : UNIQUE KEY `users_first_name_unique` (`first_name`) et `users_last_name_unique` (`last_name`)
-- Note : Les noms d'index dans le schéma de référence commencent par "users_" mais sont sur la table "people"

-- Index unique sur first_name (selon schéma de référence)
CREATE UNIQUE INDEX IF NOT EXISTS people_first_name_unique ON people(first_name);

-- Index unique sur last_name (selon schéma de référence)  
CREATE UNIQUE INDEX IF NOT EXISTS people_last_name_unique ON people(last_name);

-- Commentaire : Index uniques sur first_name et last_name pour garantir l'unicité
-- Ces index étaient manquants dans la migration initiale mais présents dans le schéma de référence

-- 2. Ajout des contraintes de clés étrangères manquantes sur la table people
-- Référence : CONSTRAINT `users_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL

-- Contrainte pour created_by
ALTER TABLE people 
ADD CONSTRAINT IF NOT EXISTS people_created_by_foreign 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Contrainte pour updated_by  
ALTER TABLE people 
ADD CONSTRAINT IF NOT EXISTS people_updated_by_foreign 
FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Contrainte pour deleted_by
ALTER TABLE people 
ADD CONSTRAINT IF NOT EXISTS people_deleted_by_foreign 
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Commentaire : Contraintes d'intégrité référentielle pour les champs d'audit de la table people
-- ON DELETE SET NULL permet de conserver les enregistrements si l'utilisateur référencé est supprimé

-- 3. Correction des noms d'index existants pour correspondre au schéma de référence
-- Renommage des index pour cohérence avec le schéma de référence (optionnel, car les noms ne sont pas critiques)

-- Index sur uid (déjà existant mais avec nom cohérent)
-- L'index people_uid_unique existe déjà et est correctement nommé

-- 4. Vérification et ajout d'index manquants pour les performances
-- Index sur les champs fréquemment utilisés dans les jointures et recherches

-- Index sur people.email pour optimiser les recherches (déjà UNIQUE mais ajout explicite)
CREATE INDEX IF NOT EXISTS people_email_index ON people(email);

-- Index sur people.phone pour optimiser les recherches (déjà UNIQUE mais ajout explicite)  
CREATE INDEX IF NOT EXISTS people_phone_index ON people(phone);

-- Index sur people.status pour optimiser les filtres
CREATE INDEX IF NOT EXISTS people_status_index ON people(status);

-- Commentaire : Index supplémentaires pour optimiser les performances des requêtes courantes

-- 5. Ajout de contraintes de validation supplémentaires si nécessaire

-- Contrainte pour s'assurer que au moins un des champs de contact est présent
-- (Optionnel - à décommenter si nécessaire)
-- ALTER TABLE people 
-- ADD CONSTRAINT IF NOT EXISTS people_contact_required 
-- CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Commentaire : Contrainte optionnelle pour garantir qu'au moins un moyen de contact existe
-- Laisser en commentaire pour ne pas imposer cette règle pour le moment

-- 6. Mise à jour des statistiques de la table pour optimiser les performances
ANALYZE people;

-- Commentaire : Mise à jour des statistiques PostgreSQL pour optimiser le planificateur de requêtes

-- 7. Documentation des index et contraintes ajoutés

-- Commentaires sur les index uniques
COMMENT ON INDEX people_first_name_unique IS 'Index unique sur first_name selon schéma de référence';
COMMENT ON INDEX people_last_name_unique IS 'Index unique sur last_name selon schéma de référence';

-- Commentaires sur les contraintes de clés étrangères
COMMENT ON CONSTRAINT people_created_by_foreign ON people IS 'Clé étrangère vers users.id pour created_by';
COMMENT ON CONSTRAINT people_updated_by_foreign ON people IS 'Clé étrangère vers users.id pour updated_by';  
COMMENT ON CONSTRAINT people_deleted_by_foreign ON people IS 'Clé étrangère vers users.id pour deleted_by';

-- Fin de la migration 005
