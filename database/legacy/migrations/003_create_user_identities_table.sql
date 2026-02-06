-- Migration: Création de la table user_identities pour OAuth
-- Version: 003
-- Description: Stockage des identités externes (Google, Apple) liées aux utilisateurs

-- Table des identités OAuth
DROP TABLE IF EXISTS user_identities CASCADE;
CREATE TABLE user_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'apple')),
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    provider_data JSONB, -- Données supplémentaires du fournisseur
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid()
);

-- Index pour les performances et unicité
CREATE UNIQUE INDEX user_identities_provider_unique ON user_identities(provider, provider_user_id);
CREATE INDEX user_identities_user_id_foreign ON user_identities(user_id);
CREATE INDEX user_identities_email_index ON user_identities(email);
CREATE UNIQUE INDEX user_identities_uid_unique ON user_identities(uid);
CREATE INDEX user_identities_created_by_foreign ON user_identities(created_by);
CREATE INDEX user_identities_updated_by_foreign ON user_identities(updated_by);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_identities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER user_identities_updated_at_trigger
    BEFORE UPDATE ON user_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_identities_updated_at();

-- Commentaires
COMMENT ON TABLE user_identities IS 'Stockage des identités OAuth externes (Google, Apple)';
COMMENT ON COLUMN user_identities.provider IS 'Fournisseur OAuth: google, apple';
COMMENT ON COLUMN user_identities.provider_user_id IS 'ID unique utilisateur chez le fournisseur';
COMMENT ON COLUMN user_identities.email IS 'Email fourni par le fournisseur OAuth';
COMMENT ON COLUMN user_identities.provider_data IS 'Données supplémentaires (profile, tokens, etc.)';
COMMENT ON COLUMN user_identities.last_used_at IS 'Dernière utilisation de cette identité';
