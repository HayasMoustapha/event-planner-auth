-- ========================================
-- Table des sessions utilisateur (alignée sur dump MySQL)
-- ========================================

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity BIGINT NOT NULL
);

-- ========================================
-- Index pour optimiser les requêtes
-- ========================================

-- Index pour les sessions utilisateur
CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
    ON sessions(user_id);

-- Index pour la recherche par last_activity
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity 
    ON sessions(last_activity);
