-- Migration pour corriger les divergences entre le dump MySQL et le schéma PostgreSQL
-- Basé sur le dump auth_tables_export.sql

-- Correction table people : aligner les contraintes avec le dump
-- Note: last_name et phone peuvent être NULL dans le dump
ALTER TABLE people 
DROP CONSTRAINT IF EXISTS people_last_name_not_null,
DROP CONSTRAINT IF EXISTS people_phone_not_null;

-- Correction table users : person_id doit être NOT NULL (selon dump)
-- Note: email, username, phone ne sont pas UNIQUE dans le dump
ALTER TABLE users 
ALTER COLUMN person_id SET NOT NULL,
DROP CONSTRAINT IF EXISTS users_email_unique,
DROP CONSTRAINT IF EXISTS users_username_unique,
DROP CONSTRAINT IF EXISTS users_phone_unique;

-- Correction table otps : purpose peut être NULL (selon dump)
ALTER TABLE otps 
ALTER COLUMN purpose DROP NOT NULL,
ALTER COLUMN purpose SET DEFAULT NULL;

-- Mise à jour des commentaires pour clarté
COMMENT ON TABLE people IS 'Table des personnes (alignée avec dump MySQL)';
COMMENT ON TABLE users IS 'Table des utilisateurs (person_id NOT NULL requis)';
COMMENT ON TABLE otps IS 'Table des codes OTP (purpose NULL autorisé)';
