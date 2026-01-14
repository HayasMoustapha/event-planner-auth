-- ========================================
-- SCRIPT PRINCIPAL DE SEEDS RBAC
-- ========================================
-- Exécution complète des seeds pour initialiser le système RBAC
-- Ordre d'exécution: 1. Rôles → 2. Permissions → 3. Menus → 4. Admin

-- Démarrer une transaction pour garantir la cohérence
BEGIN;

-- Message de début
DO $$
BEGIN
    RAISE NOTICE '🚀 Démarrage du processus de seed du système RBAC...';
    RAISE NOTICE '📋 Étapes prévues: Rôles → Permissions → Menus → Administrateur';
    RAISE NOTICE '⏰ Heure de début: %', NOW();
END $$;

-- ========================================
-- ÉTAPE 1: CRÉATION DES RÔLES
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 ÉTAPE 1/4: Création des rôles système...';
END $$;

-- Exécuter le seed des rôles
\i database/seeds/seeds/roles.seed.sql

-- Vérification
DO $$
DECLARE
    roles_count INT;
BEGIN
    SELECT COUNT(*) INTO roles_count FROM roles WHERE is_active = true;
    RAISE NOTICE '✅ Rôles créés: % rôles actifs', roles_count;
    
    IF roles_count = 0 THEN
        RAISE EXCEPTION '❌ Erreur: Aucun rôle n''a été créé';
    END IF;
END $$;

-- ========================================
-- ÉTAPE 2: CRÉATION DES PERMISSIONS
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔑 ÉTAPE 2/4: Création des permissions système...';
END $$;

-- Exécuter le seed des permissions
\i database/seeds/seeds/permissions.seed.sql

-- Vérification
DO $$
DECLARE
    permissions_count INT;
    categories_count INT;
BEGIN
    SELECT COUNT(*) INTO permissions_count FROM permissions WHERE is_active = true;
    SELECT COUNT(DISTINCT category) INTO categories_count FROM permissions WHERE is_active = true;
    
    RAISE NOTICE '✅ Permissions créées: % permissions dans % catégories', permissions_count, categories_count;
    
    IF permissions_count = 0 THEN
        RAISE EXCEPTION '❌ Erreur: Aucune permission n''a été créée';
    END IF;
END $$;

-- ========================================
-- ÉTAPE 3: CRÉATION DES MENUS
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 ÉTAPE 3/4: Création des menus système...';
END $$;

-- Exécuter le seed des menus
\i database/seeds/seeds/menus.seed.sql

-- Vérification
DO $$
DECLARE
    menus_count INT;
    parent_menus_count INT;
    menu_permissions_count INT;
BEGIN
    SELECT COUNT(*) INTO menus_count FROM menus WHERE is_active = true;
    SELECT COUNT(*) INTO parent_menus_count FROM menus WHERE parent_id IS NULL AND is_active = true;
    SELECT COUNT(*) INTO menu_permissions_count FROM menu_permissions;
    
    RAISE NOTICE '✅ Menus créés: % menus (% parents) avec % associations permissions', 
                 menus_count, parent_menus_count, menu_permissions_count;
    
    IF menus_count = 0 THEN
        RAISE EXCEPTION '❌ Erreur: Aucun menu n''a été créé';
    END IF;
END $$;

-- ========================================
-- ÉTAPE 4: CRÉATION DE L'ADMINISTRATEUR
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '👤 ÉTAPE 4/4: Création de l''administrateur par défaut...';
END $$;

-- Exécuter le seed de l'admin
\i database/seeds/seeds/admin.seed.sql

-- Vérification
DO $$
DECLARE
    admin_user_id INT;
    admin_roles_count INT;
    admin_permissions_count INT;
    admin_menus_count INT;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    SELECT COUNT(*) INTO admin_roles_count FROM user_roles WHERE user_id = admin_user_id;
    SELECT COUNT(*) INTO admin_permissions_count 
    FROM role_permissions rp 
    JOIN user_roles ur ON rp.role_id = ur.role_id 
    WHERE ur.user_id = admin_user_id;
    SELECT COUNT(*) INTO admin_menus_count 
    FROM role_menus rm 
    JOIN user_roles ur ON rm.role_id = ur.role_id 
    WHERE ur.user_id = admin_user_id;
    
    RAISE NOTICE '✅ Administrateur créé: ID=% avec % rôles, % permissions, % menus', 
                 admin_user_id, admin_roles_count, admin_permissions_count, admin_menus_count;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Erreur: L''administrateur n''a pas été créé';
    END IF;
END $$;

-- ========================================
-- VÉRIFICATIONS FINALES
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Vérifications finales du système RBAC...';
END $$;

-- Vérification de l'intégrité du système
DO $$
DECLARE
    total_roles INT;
    total_permissions INT;
    total_menus INT;
    total_users INT;
    total_user_roles INT;
    total_role_permissions INT;
    total_role_menus INT;
    total_menu_permissions INT;
BEGIN
    -- Compter tous les éléments
    SELECT COUNT(*) INTO total_roles FROM roles WHERE is_active = true;
    SELECT COUNT(*) INTO total_permissions FROM permissions WHERE is_active = true;
    SELECT COUNT(*) INTO total_menus FROM menus WHERE is_active = true;
    SELECT COUNT(*) INTO total_users FROM users WHERE is_active = true;
    SELECT COUNT(*) INTO total_user_roles FROM user_roles;
    SELECT COUNT(*) INTO total_role_permissions FROM role_permissions;
    SELECT COUNT(*) INTO total_role_menus FROM role_menus;
    SELECT COUNT(*) INTO total_menu_permissions FROM menu_permissions;
    
    -- Afficher le résumé
    RAISE NOTICE '';
    RAISE NOTICE '📊 RÉSUMÉ DU SYSTÈME RBAC';
    RAISE NOTICE '================================';
    RAISE NOTICE '👥 Utilisateurs: %', total_users;
    RAISE NOTICE '🛡️  Rôles: %', total_roles;
    RAISE NOTICE '🔑 Permissions: %', total_permissions;
    RAISE NOTICE '📋 Menus: %', total_menus;
    RAISE NOTICE '🔗 Associations utilisateur-rôle: %', total_user_roles;
    RAISE NOTICE '🔗 Associations rôle-permission: %', total_role_permissions;
    RAISE NOTICE '🔗 Associations rôle-menu: %', total_role_menus;
    RAISE NOTICE '🔗 Associations menu-permission: %', total_menu_permissions;
    RAISE NOTICE '================================';
    
    -- Vérifications critiques
    IF total_roles < 5 THEN
        RAISE WARNING '⚠️  Attention: Moins de 5 rôles créés';
    END IF;
    
    IF total_permissions < 20 THEN
        RAISE WARNING '⚠️  Attention: Moins de 20 permissions créées';
    END IF;
    
    IF total_menus < 10 THEN
        RAISE WARNING '⚠️  Attention: Moins de 10 menus créés';
    END IF;
    
    IF total_users = 0 THEN
        RAISE EXCEPTION '❌ Erreur critique: Aucun utilisateur créé';
    END IF;
    
    IF total_user_roles = 0 THEN
        RAISE EXCEPTION '❌ Erreur critique: Aucune association utilisateur-rôle';
    END IF;
END $$;

-- ========================================
-- INFORMATIONS DE CONNEXION
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔐 INFORMATIONS DE CONNEXION';
    RAISE NOTICE '================================';
    RAISE NOTICE '📧 Email: admin@eventplanner.com';
    RAISE NOTICE '🔑 Mot de passe: admin123';
    RAISE NOTICE '👤 Nom d''utilisateur: admin';
    RAISE NOTICE '🛡️  Rôle: super_admin';
    RAISE NOTICE '⚠️  IMPORTANT: Changez le mot de passe après la première connexion!';
    RAISE NOTICE '================================';
END $$;

-- ========================================
-- VALIDATION DES ACCÈS
-- ========================================
-- Test de validation des permissions de l'admin
DO $$
DECLARE
    admin_user_id INT;
    has_all_permissions BOOLEAN;
    has_all_menus BOOLEAN;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    
    -- Vérifier si l'admin a toutes les permissions
    SELECT (
        SELECT COUNT(*) FROM permissions WHERE is_active = true
    ) = (
        SELECT COUNT(DISTINCT p.id) 
        FROM permissions p 
        JOIN role_permissions rp ON p.id = rp.permission_id 
        JOIN user_roles ur ON rp.role_id = ur.role_id 
        WHERE ur.user_id = admin_user_id
    ) INTO has_all_permissions;
    
    -- Vérifier si l'admin a accès à tous les menus
    SELECT (
        SELECT COUNT(*) FROM menus WHERE is_active = true
    ) = (
        SELECT COUNT(DISTINCT m.id) 
        FROM menus m 
        JOIN role_menus rm ON m.id = rm.menu_id 
        JOIN user_roles ur ON rm.role_id = ur.role_id 
        WHERE ur.user_id = admin_user_id
    ) INTO has_all_menus;
    
    IF has_all_permissions AND has_all_menus THEN
        RAISE NOTICE '✅ Validation réussie: L''administrateur a tous les accès requis';
    ELSE
        RAISE WARNING '⚠️  Attention: L''administrateur n''a pas tous les accès';
        RAISE NOTICE '   Permissions complètes: %', has_all_permissions;
        RAISE NOTICE '   Accès menus complets: %', has_all_menus;
    END IF;
END $$;

-- ========================================
-- FINALISATION
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PROCESSUS DE SEED TERMINÉ AVEC SUCCÈS!';
    RAISE NOTICE '⏰ Heure de fin: %', NOW();
    RAISE NOTICE '🚀 Le système RBAC est prêt à être utilisé';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Prochaines étapes recommandées:';
    RAISE NOTICE '1. Connectez-vous avec le compte admin';
    RAISE NOTICE '2. Changez le mot de passe par défaut';
    RAISE NOTICE '3. Créez d''autres utilisateurs selon vos besoins';
    RAISE NOTICE '4. Configurez les rôles et permissions spécifiques';
    RAISE NOTICE '5. Personnalisez les menus pour votre application';
END $$;

-- Valider la transaction
COMMIT;

-- ========================================
-- RAPPORT FINAL
-- ========================================
-- Afficher un résumé visuel de la structure créée
\echo ''
\echo '🏗️  STRUCTURE RBAC CRÉÉE:'
\echo '├─ 👤 Utilisateurs (1 admin)'
\echo '├─ 🛡️  Rôles (10 rôles: super_admin → guest)'
\echo '├─ 🔑 Permissions (65+ permissions par catégorie)'
\echo '├─ 📋 Menus (15 menus principaux avec sous-menus)'
\echo '└─ 🔗 Associations (complètes et cohérentes)'
\echo ''

-- Afficher les catégories de permissions créées
SELECT 
    '📂 Catégories de permissions:' as info,
    category,
    COUNT(*) as permissions_count,
    STRING_AGG(SUBSTRING(name FROM 1 FOR POSITION('.' IN name) - 1), ', ' ORDER BY SUBSTRING(name FROM 1 FOR POSITION('.' IN name) - 1)) as resources
FROM permissions 
WHERE is_active = true
GROUP BY category 
ORDER BY category;

-- Afficher la structure des menus principaux
SELECT 
    '🌐 Menus principaux:' as info,
    label,
    path,
    CASE WHEN parent_id IS NULL THEN '📁 Parent' ELSE '📄 Sous-menu' END as menu_type,
    order_index
FROM menus 
WHERE parent_id IS NULL AND is_active = true
ORDER BY order_index
LIMIT 10;

\echo ''
\echo '✅ SYSTÈME RBAC PRÊT À L''EMPLOI!'
