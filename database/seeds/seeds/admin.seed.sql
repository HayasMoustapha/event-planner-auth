-- ========================================
-- SEED DE L'ADMINISTRATEUR PAR DÉFAUT (POSTGRESQL)
-- ========================================
-- Création du compte administrateur principal
-- Compatible avec le schéma PostgreSQL actuel

-- ========================================
-- 👤 CRÉATION DE LA PERSONNE ADMIN (IDEMPOTENT)
-- ========================================
INSERT INTO people (
    first_name, 
    last_name, 
    email, 
    phone, 
    status,
    created_at, 
    updated_at
) VALUES (
    'Super', 
    'Administrateur', 
    'admin@eventplanner.com', 
    '+33612345678', 
    'active',
    NOW(), 
    NOW()
) ON CONFLICT (email) DO NOTHING
RETURNING id AS admin_person_id;

-- ========================================
-- 👤 CRÉATION DE L'UTILISATEUR ADMIN (IDEMPOTENT)
-- ========================================
INSERT INTO users (
    person_id,
    user_code,
    username,
    email,
    password,
    status,
    email_verified_at,
    created_at, 
    updated_at
) VALUES (
    (SELECT id FROM people WHERE email = 'admin@eventplanner.com'),
    'ADMIN001',
    'admin',
    'admin@eventplanner.com',
    '$2b$12$o2YoqvCJC4h724K0ZtIyMObi1UDWX0xmvTrvTdkv.yLAl/PtFW19y', -- Admin123!
    'active',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING
RETURNING id AS admin_user_id;

-- ========================================
-- 🔗 ASSOCIATION AU RÔLE SUPER_ADMIN (IDEMPOTENT)
-- ========================================
INSERT INTO accesses (
    user_id,
    role_id,
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM users WHERE username = 'admin'),
    (SELECT id FROM roles WHERE code = 'super_admin'),
    'active',
    NOW(),
    NOW()
) ON CONFLICT (user_id, role_id) DO NOTHING;

-- Afficher confirmation
DO $$
DECLARE
    admin_user_id BIGINT;
    admin_role_id BIGINT;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    SELECT id INTO admin_role_id FROM roles WHERE code = 'super_admin';
    
    RAISE NOTICE '✅ Administrateur créé avec succès:';
    RAISE NOTICE '   ID Utilisateur: %', admin_user_id;
    RAISE NOTICE '   ID Rôle: %', admin_role_id;
    RAISE NOTICE '   Email: admin@eventplanner.com';
    RAISE NOTICE '   Username: admin';
    RAISE NOTICE '   Mot de passe: Admin123!';
END $$;
