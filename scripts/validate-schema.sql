-- Validation du schéma de base de données
-- Vérifie l'intégrité et la cohérence des tables

\echo '🔍 Validation du schéma de base de données...'

-- Vérification des tables principales
DO $$
BEGIN;

-- Vérifier que les tables essentielles existent
SELECT 
    'people' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'people') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'people'
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users'
UNION ALL
SELECT 
    'otps' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'otps') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'otps'
UNION ALL
SELECT 
    'roles' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'roles') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'roles'
UNION ALL
SELECT 
    'permissions' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'permissions') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'permissions'
UNION ALL
SELECT 
    'authorizations' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'authorizations') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'authorizations';

-- Vérification des contraintes de clés étrangères
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('people', 'users', 'otps', 'roles', 'permissions', 'authorizations')
ORDER BY tc.table_name, tc.constraint_name;

-- Vérification des données de test
\echo '📊 Statistiques des données:'

-- Compteurs par statut
SELECT 
    'users' as table_name,
    status,
    COUNT(*) as count
FROM users 
GROUP BY status;

-- Distribution des OTPs par purpose
SELECT 
    purpose,
    COUNT(*) as count,
    COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used_count,
    COUNT(CASE WHEN is_used = FALSE AND expires_at > NOW() THEN 1 END) as active_count
FROM otps 
GROUP BY purpose;

-- Vérification des relations people/users
SELECT 
    COUNT(*) as users_without_people,
    (SELECT COUNT(*) FROM users WHERE person_id IS NULL) as null_person_ids
FROM users 
WHERE person_id NOT IN (SELECT id FROM people);

-- Vérification des orphelins
SELECT 
    'people_without_users' as entity_type,
    COUNT(*) as count
FROM people 
WHERE id NOT IN (SELECT person_id FROM users)
UNION ALL
SELECT 
    'expired_otps' as entity_type,
    COUNT(*) as count
FROM otps 
WHERE expires_at <= NOW() AND is_used = FALSE;

COMMIT;

END $$;

-- Validation des indexes
\echo '🔍 Validation des indexes...'

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('people', 'users', 'otps', 'roles', 'permissions', 'authorizations')
ORDER BY tablename, indexname;

\echo '✅ Validation du schéma terminée!'
