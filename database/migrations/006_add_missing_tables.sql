-- Migration pour ajouter les tables manquantes
-- Ajout de password_reset_tokens et password_histories

-- Table des tokens de réinitialisation de mot de passe
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
CREATE TABLE password_reset_tokens (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    PRIMARY KEY (email)
);

-- Table des historiques de mots de passe
DROP TABLE IF EXISTS password_histories CASCADE;
CREATE TABLE password_histories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index
CREATE INDEX password_histories_user_id_created_at_index ON password_histories(user_id, created_at);

-- Insérer la migration dans schema_migrations
INSERT INTO schema_migrations (migration_name, executed_at, checksum, file_size, execution_time_ms, created_at) 
VALUES ('006_add_missing_tables.sql', CURRENT_TIMESTAMP, '8', 1024, 100, CURRENT_TIMESTAMP) 
ON CONFLICT (migration_name) DO NOTHING;
