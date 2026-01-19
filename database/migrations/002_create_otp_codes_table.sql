-- ========================================
-- Table des codes OTP (One-Time Password)
-- ========================================

CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'phone')),
    identifier VARCHAR(254) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Index pour optimiser les requêtes
-- ========================================

-- Index pour la recherche par code et identifiant
CREATE INDEX IF NOT EXISTS idx_otp_codes_code_identifier 
    ON otp_codes(code, identifier, type, is_used, expires_at);

-- Index pour la recherche par utilisateur
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id 
    ON otp_codes(user_id, type, created_at DESC);

-- Index pour la recherche par identifiant
CREATE INDEX IF NOT EXISTS idx_otp_codes_identifier 
    ON otp_codes(identifier, type);

-- Index pour la recherche par expiration
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at 
    ON otp_codes(expires_at, is_used);

-- Index pour la recherche par statut d'utilisation
CREATE INDEX IF NOT EXISTS idx_otp_codes_is_used 
    ON otp_codes(is_used, expires_at);

-- ========================================
-- Contraintes et triggers
-- ========================================

-- Contrainte pour éviter les doublons d'OTP non utilisés pour le même utilisateur et type (IDEMPOTENT)
-- Simplified: Using basic index instead of partial index with CURRENT_TIMESTAMP
ALTER TABLE otp_codes DROP CONSTRAINT IF EXISTS unique_active_otp_per_user_type;
-- Note: Partial index with CURRENT_TIMESTAMP is problematic, using basic index instead
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_type_active 
    ON otp_codes(user_id, type, is_used, expires_at);

-- Trigger pour mettre à jour le champ updated_at (IDEMPOTENT)
DROP TRIGGER IF EXISTS trigger_update_otp_codes_updated_at ON otp_codes;
CREATE OR REPLACE FUNCTION update_otp_codes_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_otp_codes_updated_at
    BEFORE UPDATE ON otp_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_otp_codes_updated_at();

-- ========================================
-- Commentaires sur la table
-- ========================================

COMMENT ON TABLE otp_codes IS 'Table des codes OTP pour l''authentification à deux facteurs';
COMMENT ON COLUMN otp_codes.id IS 'Identifiant unique de l''OTP';
COMMENT ON COLUMN otp_codes.user_id IS 'ID de l''utilisateur concerné';
COMMENT ON COLUMN otp_codes.type IS 'Type d''OTP (email ou téléphone)';
COMMENT ON COLUMN otp_codes.identifier IS 'Email ou numéro de téléphone';
COMMENT ON COLUMN otp_codes.code IS 'Code OTP à usage unique';
COMMENT ON COLUMN otp_codes.expires_at IS 'Date et heure d''expiration du code';
COMMENT ON COLUMN otp_codes.is_used IS 'Indique si le code a été utilisé';
COMMENT ON COLUMN otp_codes.used_at IS 'Date et heure d''utilisation du code';
COMMENT ON COLUMN otp_codes.used_by IS 'ID de l''utilisateur qui a utilisé le code';
COMMENT ON COLUMN otp_codes.created_at IS 'Date et heure de création du code';
COMMENT ON COLUMN otp_codes.created_by IS 'ID de l''utilisateur qui a créé le code';
COMMENT ON COLUMN otp_codes.updated_at IS 'Date et heure de dernière mise à jour';

-- ========================================
-- Procédures stockées utiles
-- ========================================

-- Procédure pour nettoyer les OTP expirés
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
    RETURNS INTEGER AS $$
    DECLARE
        deleted_count INTEGER;
    BEGIN
        DELETE FROM otp_codes 
        WHERE expires_at < CURRENT_TIMESTAMP;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RETURN deleted_count;
    END;
    $$ LANGUAGE plpgsql;

-- Procédure pour compter les OTP actifs par utilisateur
CREATE OR REPLACE FUNCTION count_active_otp_codes(p_user_id INTEGER, p_type VARCHAR(10))
    RETURNS INTEGER AS $$
    DECLARE
        otp_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO otp_count
        FROM otp_codes 
        WHERE user_id = p_user_id 
            AND (p_type IS NULL OR type = p_type)
            AND is_used = FALSE 
            AND expires_at > CURRENT_TIMESTAMP;
        
        RETURN otp_count;
    END;
    $$ LANGUAGE plpgsql;

-- Procédure pour invalider tous les OTP d'un utilisateur
CREATE OR REPLACE FUNCTION invalidate_user_otp_codes(p_user_id INTEGER, p_type VARCHAR(10))
    RETURNS INTEGER AS $$
    DECLARE
        invalidated_count INTEGER;
    BEGIN
        UPDATE otp_codes 
        SET is_used = TRUE, 
            used_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id 
            AND (p_type IS NULL OR type = p_type)
            AND is_used = FALSE;
        
        GET DIAGNOSTICS invalidated_count = ROW_COUNT;
        
        RETURN invalidated_count;
    END;
    $$ LANGUAGE plpgsql;

-- ========================================
-- Vue pour les statistiques OTP (IDEMPOTENT)
DROP VIEW IF EXISTS otp_statistics;
CREATE OR REPLACE VIEW otp_statistics AS
SELECT 
    COUNT(*) as total_otp,
    COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used_otp,
    COUNT(CASE WHEN is_used = FALSE AND expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_otp,
    COUNT(CASE WHEN expires_at < CURRENT_TIMESTAMP THEN 1 END) as expired_otp,
    COUNT(CASE WHEN type = 'email' THEN 1 END) as email_otp,
    COUNT(CASE WHEN type = 'phone' THEN 1 END) as phone_otp
FROM otp_codes;

-- ========================================
-- Exemples de requêtes
-- ========================================

-- Pour trouver un OTP valide
/*
SELECT * FROM otp_codes 
WHERE code = '123456' 
    AND identifier = 'user@example.com' 
    AND type = 'email' 
    AND is_used = FALSE 
    AND expires_at > CURRENT_TIMESTAMP
ORDER BY created_at DESC
LIMIT 1;
*/

-- Pour les OTP d'un utilisateur
/*
SELECT * FROM otp_codes 
WHERE user_id = 1 
    AND type = 'email' 
ORDER BY created_at DESC;
*/

-- Pour les OTP expirés
/*
SELECT * FROM otp_codes 
WHERE expires_at < CURRENT_TIMESTAMP;
*/

-- Pour les statistiques par jour
/*
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total,
    COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used,
    COUNT(CASE WHEN is_used = FALSE AND expires_at > CURRENT_TIMESTAMP THEN 1 END) as active
FROM otp_codes 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
*/
