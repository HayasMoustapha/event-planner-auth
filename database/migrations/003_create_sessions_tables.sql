-- ========================================
-- Table des sessions utilisateur
-- ========================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    device_info TEXT,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Table de blacklist des tokens
-- ========================================

CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(50) NOT NULL DEFAULT 'logout',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Index pour optimiser les requêtes
-- ========================================

-- Index pour les sessions utilisateur
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
    ON user_sessions(user_id, is_active, created_at DESC);

-- Index pour la recherche par access token
CREATE INDEX IF NOT EXISTS idx_user_sessions_access_token 
    ON user_sessions(access_token, is_active, expires_at);

-- Index pour la recherche par refresh token
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token 
    ON user_sessions(refresh_token, is_active, expires_at);

-- Index pour l'expiration des sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at 
    ON user_sessions(expires_at, is_active);

-- Index pour le statut des sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active 
    ON user_sessions(is_active, updated_at);

-- Index pour le blacklist des tokens
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token 
    ON token_blacklist(token, expires_at);

-- Index pour le blacklist par utilisateur
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id 
    ON token_blacklist(user_id, created_at DESC);

-- Index pour l'expiration du blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at 
    ON token_blacklist(expires_at);

-- ========================================
-- Contraintes et triggers
-- ========================================

-- Contrainte pour éviter les doublons d'access token actifs
ALTER TABLE user_sessions ADD CONSTRAINT unique_active_access_token 
    EXCLUDE (access_token WITH =) 
    WHERE (is_active = TRUE AND expires_at > CURRENT_TIMESTAMP);

-- Contrainte pour éviter les doublons de refresh token actifs
ALTER TABLE user_sessions ADD CONSTRAINT unique_active_refresh_token 
    EXCLUDE (refresh_token WITH =) 
    WHERE (is_active = TRUE AND expires_at > CURRENT_TIMESTAMP);

-- Contrainte pour éviter les doublons dans le blacklist
ALTER TABLE token_blacklist ADD CONSTRAINT unique_blacklisted_token 
    EXCLUDE (token WITH =) 
    WHERE (expires_at > CURRENT_TIMESTAMP);

-- Trigger pour mettre à jour le champ updated_at des sessions
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_sessions_updated_at();

-- ========================================
-- Commentaires sur les tables
-- ========================================

COMMENT ON TABLE user_sessions IS 'Table des sessions utilisateur avec gestion des tokens JWT';
COMMENT ON COLUMN user_sessions.id IS 'Identifiant unique de la session';
COMMENT ON COLUMN user_sessions.user_id IS 'ID de l\'utilisateur propriétaire de la session';
COMMENT ON COLUMN user_sessions.access_token IS 'Token d\'accès JWT';
COMMENT ON COLUMN user_sessions.refresh_token IS 'Token de rafraîchissement JWT';
COMMENT ON COLUMN user_sessions.device_info IS 'Informations sur l\'appareil utilisé';
COMMENT ON COLUMN user_sessions.ip_address IS 'Adresse IP de la connexion';
COMMENT ON COLUMN user_sessions.user_agent IS 'User agent du navigateur/client';
COMMENT ON COLUMN user_sessions.expires_at IS 'Date et heure d\'expiration de la session';
COMMENT ON COLUMN user_sessions.is_active IS 'Indique si la session est active';
COMMENT ON COLUMN user_sessions.created_at IS 'Date et heure de création de la session';
COMMENT ON COLUMN user_sessions.updated_at IS 'Date et heure de dernière mise à jour';

COMMENT ON TABLE token_blacklist IS 'Table des tokens révoqués/blacklistés';
COMMENT ON COLUMN token_blacklist.id IS 'Identifiant unique du token blacklisté';
COMMENT ON COLUMN token_blacklist.token IS 'Token révoqué';
COMMENT ON COLUMN token_blacklist.user_id IS 'ID de l\'utilisateur concerné';
COMMENT ON COLUMN token_blacklist.reason IS 'Raison de la révocation';
COMMENT ON COLUMN token_blacklist.expires_at IS 'Date et heure d\'expiration du blacklist';
COMMENT ON COLUMN token_blacklist.created_at IS 'Date et heure de création du blacklist';

-- ========================================
-- Procédures stockées utiles
-- ========================================

-- Procédure pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
    RETURNS INTEGER AS $$
    DECLARE
        deleted_count INTEGER;
    BEGIN
        DELETE FROM user_sessions 
        WHERE expires_at < CURRENT_TIMESTAMP 
           OR (is_active = FALSE AND updated_at < CURRENT_TIMESTAMP - INTERVAL '7 days');
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RETURN deleted_count;
    END;
    $$ LANGUAGE plpgsql;

-- Procédure pour nettoyer le blacklist expiré
CREATE OR REPLACE FUNCTION cleanup_expired_blacklist()
    RETURNS INTEGER AS $$
    DECLARE
        deleted_count INTEGER;
    BEGIN
        DELETE FROM token_blacklist 
        WHERE expires_at < CURRENT_TIMESTAMP;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RETURN deleted_count;
    END;
    $$ LANGUAGE plpgsql;

-- Procédure pour désactiver toutes les sessions d'un utilisateur
CREATE OR REPLACE FUNCTION deactivate_user_sessions(p_user_id INTEGER, p_except_session_id INTEGER DEFAULT NULL)
    RETURNS INTEGER AS $$
    DECLARE
        deactivated_count INTEGER;
    BEGIN
        UPDATE user_sessions 
        SET is_active = FALSE, 
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id 
            AND is_active = TRUE
            AND (p_except_session_id IS NULL OR id != p_except_session_id);
        
        GET DIAGNOSTICS deactivated_count = ROW_COUNT;
        
        RETURN deactivated_count;
    END;
    $$ LANGUAGE plpgsql;

-- Procédure pour compter les sessions actives par utilisateur
CREATE OR REPLACE FUNCTION count_active_sessions(p_user_id INTEGER)
    RETURNS INTEGER AS $$
    DECLARE
        session_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO session_count
        FROM user_sessions 
        WHERE user_id = p_user_id 
            AND is_active = TRUE 
            AND expires_at > CURRENT_TIMESTAMP;
        
        RETURN session_count;
    END;
    $$ LANGUAGE plpgsql;

-- ========================================
-- Vue pour les statistiques des sessions
-- ========================================

CREATE OR REPLACE VIEW session_statistics AS
SELECT 
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN is_active = TRUE AND expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_sessions,
    COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_sessions,
    COUNT(CASE WHEN expires_at < CURRENT_TIMESTAMP THEN 1 END) as expired_sessions,
    COUNT(CASE WHEN created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 1 END) as last_24h_sessions,
    COUNT(CASE WHEN created_at > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as last_7d_sessions,
    DATE_TRUNC('day', created_at) as creation_date
FROM user_sessions;

-- ========================================
-- Vue pour les sessions actives avec informations utilisateur
-- ========================================

CREATE OR REPLACE VIEW active_sessions_with_users AS
SELECT 
    us.id as session_id,
    us.user_id,
    us.device_info,
    us.ip_address,
    us.user_agent,
    us.expires_at,
    us.created_at,
    u.email,
    u.username,
    u.role,
    u.status
FROM user_sessions us
INNER JOIN users u ON us.user_id = u.id
WHERE us.is_active = TRUE 
    AND us.expires_at > CURRENT_TIMESTAMP
ORDER BY us.created_at DESC;

-- ========================================
-- Exemples de requêtes
-- ========================================

-- Pour trouver une session par access token
/*
SELECT * FROM user_sessions 
WHERE access_token = 'eyJ...' 
    AND is_active = TRUE 
    AND expires_at > CURRENT_TIMESTAMP;
*/

-- Pour les sessions actives d'un utilisateur
/*
SELECT * FROM user_sessions 
WHERE user_id = 1 
    AND is_active = TRUE 
    AND expires_at > CURRENT_TIMESTAMP
ORDER BY created_at DESC;
*/

-- Pour les tokens blacklistés actifs
/*
SELECT * FROM token_blacklist 
WHERE expires_at > CURRENT_TIMESTAMP
ORDER BY created_at DESC;
*/

-- Pour les statistiques par jour
/*
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active
FROM user_sessions 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
*/

-- Pour les sessions par appareil
/*
SELECT 
    device_info,
    COUNT(*) as session_count,
    MAX(created_at) as last_seen
FROM user_sessions 
WHERE is_active = TRUE 
    AND expires_at > CURRENT_TIMESTAMP
GROUP BY device_info
ORDER BY session_count DESC;
*/
