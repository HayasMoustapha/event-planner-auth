-- Migration pour ajouter les tables manquantes identifiées dans le dump MySQL
-- Basé sur l'analyse comparative du dump auth_tables_export.sql

-- Extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- Table des tokens de reset mot de passe
-- ========================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    PRIMARY KEY (email)
);

-- ========================================
-- Table des historiques de mots de passe
-- ========================================
CREATE TABLE IF NOT EXISTS password_histories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Index pour password_histories
-- ========================================
CREATE INDEX IF NOT EXISTS idx_password_histories_user_id_created_at 
    ON password_histories(user_id, created_at);

-- ========================================
-- Commentaires sur les tables
-- ========================================
COMMENT ON TABLE password_reset_tokens IS 'Table des tokens de réinitialisation de mot de passe';
COMMENT ON COLUMN password_reset_tokens.email IS 'Email de l''utilisateur';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token de réinitialisation';
COMMENT ON COLUMN password_reset_tokens.created_at IS 'Date de création du token';

COMMENT ON TABLE password_histories IS 'Table des historiques de mots de passe';
COMMENT ON COLUMN password_histories.user_id IS 'ID de l''utilisateur';
COMMENT ON COLUMN password_histories.password IS 'Mot de passe hashé';
COMMENT ON COLUMN password_histories.created_at IS 'Date de création de l''entrée';
