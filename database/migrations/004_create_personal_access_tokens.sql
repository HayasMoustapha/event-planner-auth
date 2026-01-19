-- ========================================
-- TABLE PERSONAL ACCESS TOKENS (BLACKLIST)
-- ========================================

DROP TABLE IF EXISTS personal_access_tokens CASCADE;

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    token_type VARCHAR(50) NOT NULL DEFAULT 'access',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    reason VARCHAR(255),
    revoked_by BIGINT,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Index pour optimiser les requêtes
-- ========================================

-- Index pour la recherche par token (blacklist check)
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_token 
    ON personal_access_tokens(token, is_active, expires_at);

-- Index pour la recherche par utilisateur
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_user_id 
    ON personal_access_tokens(user_id, is_active, expires_at);

-- Index pour l'expiration des tokens
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_expires_at 
    ON personal_access_tokens(expires_at, is_active);

-- Index pour le type de token
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_token_type 
    ON personal_access_tokens(token_type, is_active);

-- Index pour la révocation (sans prédicat de fonction)
CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_revoked_at 
    ON personal_access_tokens(revoked_at);

-- Contraintes
-- ========================================

-- Contrainte pour éviter les doublons de tokens actifs (IDEMPOTENT - Simplifiée)
ALTER TABLE personal_access_tokens 
DROP CONSTRAINT IF EXISTS unique_active_token;
CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_access_tokens_active_token 
    ON personal_access_tokens(token);

-- Trigger pour mettre à jour le champ updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_personal_access_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personal_access_tokens_updated_at
    BEFORE UPDATE ON personal_access_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_personal_access_tokens_updated_at();

-- ========================================
-- Commentaires sur les tables et colonnes
-- ========================================

COMMENT ON TABLE personal_access_tokens IS 'Table des tokens d''acces personnels et blacklistes';
COMMENT ON COLUMN personal_access_tokens.id IS 'Identifiant unique du token';
COMMENT ON COLUMN personal_access_tokens.token IS 'Token JWT blackliste';
COMMENT ON COLUMN personal_access_tokens.user_id IS 'ID de l''utilisateur proprietaire du token';
COMMENT ON COLUMN personal_access_tokens.token_type IS 'Type de token (access, refresh, reset, etc.)';
COMMENT ON COLUMN personal_access_tokens.expires_at IS 'Date et heure d''expiration du token';
COMMENT ON COLUMN personal_access_tokens.created_at IS 'Date et heure de creation du token';
COMMENT ON COLUMN personal_access_tokens.updated_at IS 'Date et heure de derniere mise a jour';
COMMENT ON COLUMN personal_access_tokens.is_active IS 'Indique si le token est actif';
COMMENT ON COLUMN personal_access_tokens.metadata IS 'Metadonnees supplementaires (JSON)';
COMMENT ON COLUMN personal_access_tokens.reason IS 'Raison de la revocation (logout, security, admin, etc.)';
COMMENT ON COLUMN personal_access_tokens.revoked_by IS 'ID de l''utilisateur qui a revoque le token';
COMMENT ON COLUMN personal_access_tokens.revoked_at IS 'Date et heure de revocation';

-- ========================================
-- Procédures de nettoyage automatique
-- ========================================

-- Fonction pour nettoyer les tokens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM personal_access_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaire sur la fonction de nettoyage
COMMENT ON FUNCTION cleanup_expired_tokens() IS 'Nettoie les tokens expirés de plus de 7 jours et retourne le nombre de tokens supprimés';
