-- ========================================
-- SEED DE L'ADMINISTRATEUR PAR DÉFAUT
-- ========================================
-- Création du compte administrateur principal avec toutes les autorisations
-- Compatible PostgreSQL avec syntaxe standard

-- Désactiver les contraintes temporairement
SET session_replication_role = replica;

-- Nettoyage des données existantes (développement uniquement)
-- DELETE FROM user_roles WHERE user_id = 1;
-- DELETE FROM users WHERE username = 'admin';
-- DELETE FROM people WHERE email = 'admin@eventplanner.com';

-- Réinitialiser les séquences
-- ALTER SEQUENCE people_id_seq RESTART WITH 1;
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- ========================================
-- 👤 CRÉATION DE LA PERSONNE ADMIN
-- ========================================
INSERT INTO people (
    first_name, 
    last_name, 
    email, 
    phone, 
    address, 
    city, 
    country, 
    postal_code,
    is_active,
    created_at, 
    updated_at
) VALUES (
    'Super', 
    'Administrateur', 
    'admin@eventplanner.com', 
    '+225000000000', 
    'Siège Social', 
    'Abidjan', 
    'Côte d''Ivoire', 
    '00225',
    true,
    NOW(), 
    NOW()
);

-- Récupérer l'ID de la personne admin
DO $$
DECLARE
    admin_person_id INT;
BEGIN
    SELECT id INTO admin_person_id FROM people WHERE email = 'admin@eventplanner.com';
    
    -- Journaliser la création de la personne
    INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id, created_at) VALUES
    ('CREATE', 'people', admin_person_id, NULL, 
     json_build_object(
         'first_name', 'Super',
         'last_name', 'Administrateur',
         'email', 'admin@eventplanner.com',
         'is_active', true
     ), 1, NOW());
END $$;

-- ========================================
-- 🔐 CRÉATION DE L'UTILISATEUR ADMIN
-- ========================================
-- Mot de passe: admin123 (hashé avec bcrypt, cost 12)
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe
INSERT INTO users (
    person_id, 
    username, 
    password_hash, 
    email, 
    is_active, 
    is_verified, 
    email_verified_at,
    last_login_at,
    login_count,
    created_at, 
    updated_at
) VALUES (
    (SELECT id FROM people WHERE email = 'admin@eventplanner.com'),
    'admin', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 
    'admin@eventplanner.com', 
    true, 
    true,
    NOW(),
    NULL,
    0,
    NOW(), 
    NOW()
);

-- Récupérer l'ID de l'utilisateur admin
DO $$
DECLARE
    admin_user_id INT;
    admin_person_id INT;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    SELECT id INTO admin_person_id FROM people WHERE email = 'admin@eventplanner.com';
    
    -- Journaliser la création de l'utilisateur
    INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id, created_at) VALUES
    ('CREATE', 'users', admin_user_id, NULL, 
     json_build_object(
         'username', 'admin',
         'email', 'admin@eventplanner.com',
         'is_active', true,
         'is_verified', true
     ), admin_user_id, NOW());
END $$;

-- ========================================
-- 🛡️ ASSIGNATION DES RÔLES ET PERMISSIONS
-- ========================================
DO $$
DECLARE
    admin_user_id INT;
    super_admin_role_id INT;
    admin_role_id INT;
    permission_record RECORD;
    menu_record RECORD;
BEGIN
    -- Récupérer les IDs nécessaires
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Assigner le rôle super_admin à l'utilisateur admin
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, created_at, updated_at) VALUES
    (admin_user_id, super_admin_role_id, admin_user_id, NOW(), NOW(), NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    -- Assigner également le rôle admin (récursivité)
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, created_at, updated_at) VALUES
    (admin_user_id, admin_role_id, admin_user_id, NOW(), NOW(), NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    -- Journaliser l'assignation des rôles
    INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id, created_at) VALUES
    ('ASSIGN_ROLE', 'user_roles', admin_user_id, NULL, 
     json_build_object('role_id', super_admin_role_id, 'assigned_by', admin_user_id), admin_user_id, NOW()),
    ('ASSIGN_ROLE', 'user_roles', admin_user_id, NULL, 
     json_build_object('role_id', admin_role_id, 'assigned_by', admin_user_id), admin_user_id, NOW());
    
    -- Assigner toutes les permissions au rôle super_admin
    FOR permission_record IN 
        SELECT id FROM permissions WHERE is_active = true
    LOOP
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES
        (super_admin_role_id, permission_record.id, NOW(), NOW())
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
    
    -- Assigner tous les menus au rôle super_admin
    FOR menu_record IN 
        SELECT id FROM menus WHERE is_active = true
    LOOP
        INSERT INTO role_menus (role_id, menu_id, created_at, updated_at) VALUES
        (super_admin_role_id, menu_record.id, NOW(), NOW())
        ON CONFLICT (role_id, menu_id) DO NOTHING;
    END LOOP;
    
    -- Journaliser l'assignation massive des permissions et menus
    INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id, created_at) VALUES
    ('ASSIGN_ALL_PERMISSIONS', 'role_permissions', super_admin_role_id, NULL, 
     json_build_object('all_permissions', true), admin_user_id, NOW()),
    ('ASSIGN_ALL_MENUS', 'role_menus', super_admin_role_id, NULL, 
     json_build_object('all_menus', true), admin_user_id, NOW());
END $$;

-- ========================================
-- 📧 CRÉATION D'UNE SESSION INITIALE
-- ========================================
DO $$
DECLARE
    admin_user_id INT;
    session_token UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    
    -- Générer un token de session pour l'admin
    session_token := gen_random_uuid();
    
    -- Créer une session initiale (expirée pour forcer la connexion)
    INSERT INTO sessions (
        user_id, 
        session_token, 
        refresh_token, 
        expires_at, 
        is_active, 
        created_at, 
        updated_at
    ) VALUES (
        admin_user_id,
        session_token::TEXT,
        gen_random_uuid()::TEXT,
        NOW() - INTERVAL '1 day', -- Expirée pour forcer la reconnexion
        false,
        NOW(),
        NOW()
    );
    
    -- Journaliser la création de la session
    INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id, created_at) VALUES
    ('CREATE', 'sessions', admin_user_id, NULL, 
     json_build_object('session_token', session_token, 'is_active', false), admin_user_id, NOW());
END $$;

-- ========================================
-- 📊 STATISTIQUES DE CRÉATION
-- ========================================
DO $$
DECLARE
    admin_user_id INT;
    total_permissions INT;
    total_menus INT;
    total_roles INT;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    SELECT COUNT(*) INTO total_permissions FROM permissions WHERE is_active = true;
    SELECT COUNT(*) INTO total_menus FROM menus WHERE is_active = true;
    SELECT COUNT(*) INTO total_roles FROM roles WHERE is_active = true;
    
    -- Journaliser les statistiques
    INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id, created_at) VALUES
    ('ADMIN_SETUP_COMPLETE', 'system', 1, NULL, 
     json_build_object(
         'admin_user_id', admin_user_id,
         'total_permissions', total_permissions,
         'total_menus', total_menus,
         'total_roles', total_roles,
         'setup_completed_at', NOW()
     ), admin_user_id, NOW());
END $$;

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

-- ========================================
-- 📋 RAPPORT DE CRÉATION
-- ========================================
-- Afficher les informations de l'administrateur créé
SELECT 
    '👤 Administrateur créé' as info,
    p.first_name,
    p.last_name,
    u.username,
    u.email,
    CASE WHEN u.is_active THEN '✅ Actif' ELSE '❌ Inactif' END as status,
    CASE WHEN u.is_verified THEN '✅ Vérifié' ELSE '❌ Non vérifié' END as verification
FROM people p
JOIN users u ON p.id = u.person_id
WHERE u.username = 'admin';

-- Afficher les rôles assignés
SELECT 
    '🛡️ Rôles assignés' as info,
    r.name as role_name,
    r.description,
    ur.assigned_at
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = (SELECT id FROM users WHERE username = 'admin')
ORDER BY r.name;

-- Afficher les statistiques
SELECT 
    '📊 Statistiques' as info,
    (SELECT COUNT(*) FROM permissions WHERE is_active = true) as total_permissions,
    (SELECT COUNT(*) FROM menus WHERE is_active = true) as total_menus,
    (SELECT COUNT(*) FROM roles WHERE is_active = true) as total_roles,
    (SELECT COUNT(*) FROM user_roles WHERE user_id = (SELECT id FROM users WHERE username = 'admin')) as admin_roles;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Seed de l''administrateur par défaut terminé avec succès';
    RAISE NOTICE '👤 Compte administrateur: admin@eventplanner.com / admin123';
    RAISE NOTICE '🛡️ Rôle assigné: super_admin (avec toutes les permissions)';
    RAISE NOTICE '📋 Accès complet à tous les menus et fonctionnalités';
    RAISE NOTICE '🔐 Compte prêt pour la première connexion';
    RAISE NOTICE '⚠️  Pensez à changer le mot de passe par défaut après la première connexion';
END $$;
