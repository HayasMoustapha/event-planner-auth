-- ========================================
-- Correction : Augmenter la taille du champ ID pour les tokens JWT
-- ========================================

-- Augmenter la taille du champ id pour accommoder les tokens JWT plus longs
ALTER TABLE sessions 
ALTER COLUMN id TYPE VARCHAR(1000);

-- ========================================
-- Index pour optimiser les requêtes (recréation si nécessaire)
-- ========================================

-- Recréer l'index pour les sessions utilisateur
DROP INDEX IF EXISTS idx_sessions_user_id;
CREATE INDEX idx_sessions_user_id 
    ON sessions(user_id);

-- Recréer l'index pour la recherche par last_activity
DROP INDEX IF EXISTS idx_sessions_last_activity;
CREATE INDEX idx_sessions_last_activity 
    ON sessions(last_activity);
