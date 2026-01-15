-- ========================================
-- SEED DE L'ADMINISTRATEUR PAR DÉFAUT (POSTGRESQL)
-- ========================================
-- Création du compte administrateur principal
-- Compatible avec le schéma PostgreSQL actuel

-- ========================================
-- 👤 CRÉATION DE LA PERSONNE ADMIN
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
) RETURNING id AS admin_person_id;

-- ========================================
-- 👤 CRÉATION DE L'UTILISATEUR ADMIN
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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', -- admin123
    'active',
    NOW(),
    NOW(),
    NOW()
) RETURNING id AS admin_user_id;

-- ========================================
-- 🔗 ASSOCIATION AU RÔLE SUPER_ADMIN
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
);

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
    RAISE NOTICE '   Mot de passe: admin123';
END $$;
