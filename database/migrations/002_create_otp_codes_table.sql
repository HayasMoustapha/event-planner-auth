-- ========================================
-- Table des codes OTP (One-Time Password)
-- ========================================

CREATE TABLE IF NOT EXISTS otps (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    purpose VARCHAR(255) DEFAULT NULL,
    otp_code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);

-- ========================================
-- Index pour optimiser les requêtes
-- ========================================

-- Index pour la recherche par code et personne
CREATE INDEX IF NOT EXISTS idx_otps_person_id_code 
    ON otps(person_id, purpose, is_used, expires_at);

-- Index pour la recherche par personne
CREATE INDEX IF NOT EXISTS idx_otps_person_id 
    ON otps(person_id, purpose, created_at DESC);

-- Index pour la recherche par expiration
CREATE INDEX IF NOT EXISTS idx_otps_expires_at 
    ON otps(expires_at, is_used);

-- Index pour la recherche par statut d'utilisation
CREATE INDEX IF NOT EXISTS idx_otps_is_used 
    ON otps(is_used, expires_at);

-- Index unique sur UID
CREATE UNIQUE INDEX IF NOT EXISTS otps_uid_unique ON otps(uid);

-- ========================================
-- Contraintes et triggers
-- ========================================

-- Trigger pour mettre à jour le champ updated_at
DROP TRIGGER IF EXISTS trigger_update_otps_updated_at ON otps;
CREATE OR REPLACE FUNCTION update_otps_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_otps_updated_at
    BEFORE UPDATE ON otps
    FOR EACH ROW
    EXECUTE FUNCTION update_otps_updated_at();

-- ========================================
-- Commentaires sur la table
-- ========================================

COMMENT ON TABLE otps IS 'Table des codes OTP pour l''authentification à deux facteurs';
COMMENT ON COLUMN otps.id IS 'Identifiant unique de l''OTP';
COMMENT ON COLUMN otps.person_id IS 'ID de la personne concernée';
COMMENT ON COLUMN otps.purpose IS 'Purpose de l''OTP (email, phone, etc.)';
COMMENT ON COLUMN otps.otp_code IS 'Code OTP à usage unique';
COMMENT ON COLUMN otps.expires_at IS 'Date et heure d''expiration du code';
COMMENT ON COLUMN otps.is_used IS 'Indique si le code a été utilisé';
COMMENT ON COLUMN otps.created_at IS 'Date et heure de création du code';
COMMENT ON COLUMN otps.created_by IS 'ID de l''utilisateur qui a créé le code';
COMMENT ON COLUMN otps.updated_at IS 'Date et heure de dernière mise à jour';
COMMENT ON COLUMN otps.deleted_at IS 'Date et heure de suppression';

-- ========================================
-- Procédures stockées utiles
-- ========================================

-- Procédure pour nettoyer les OTP expirés
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
    RETURNS INTEGER AS $$
    DECLARE
        deleted_count INTEGER;
    BEGIN
        DELETE FROM otps 
        WHERE expires_at < CURRENT_TIMESTAMP;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RETURN deleted_count;
    END;
    $$ LANGUAGE plpgsql;

-- Procédure pour compter les OTP actifs par personne
CREATE OR REPLACE FUNCTION count_active_otps(p_person_id BIGINT, p_purpose VARCHAR(255))
    RETURNS INTEGER AS $$
    DECLARE
        otp_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO otp_count
        FROM otps 
        WHERE person_id = p_person_id 
            AND (p_purpose IS NULL OR purpose = p_purpose)
            AND is_used = FALSE 
            AND expires_at > CURRENT_TIMESTAMP;
        
        RETURN otp_count;
    END;
    $$ LANGUAGE plpgsql;

-- Procédure pour invalider tous les OTP d'une personne
CREATE OR REPLACE FUNCTION invalidate_person_otps(p_person_id BIGINT, p_purpose VARCHAR(255))
    RETURNS INTEGER AS $$
    DECLARE
        invalidated_count INTEGER;
    BEGIN
        UPDATE otps 
        SET is_used = TRUE, 
            updated_at = CURRENT_TIMESTAMP
        WHERE person_id = p_person_id 
            AND (p_purpose IS NULL OR purpose = p_purpose)
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
SELECT * FROM otps 
WHERE otp_code = '123456' 
    AND person_id = 1 
    AND purpose = 'email' 
    AND is_used = FALSE 
    AND expires_at > CURRENT_TIMESTAMP
ORDER BY created_at DESC
LIMIT 1;
*/

-- Pour les OTP d'une personne
/*
SELECT * FROM otps 
WHERE person_id = 1 
    AND purpose = 'email' 
ORDER BY created_at DESC;
*/

-- Pour les OTP expirés
/*
SELECT * FROM otps 
WHERE expires_at < CURRENT_TIMESTAMP;
*/

-- Pour les statistiques par jour
/*
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total,
    COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used,
    COUNT(CASE WHEN is_used = FALSE AND expires_at > CURRENT_TIMESTAMP THEN 1 END) as active
FROM otps 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
*/
