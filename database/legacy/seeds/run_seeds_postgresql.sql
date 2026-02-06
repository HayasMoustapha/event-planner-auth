-- ========================================
-- SCRIPT D'EXÉCUTION DES SEEDS POSTGRESQL
-- ========================================
-- Exécution complète des seeds pour initialiser le système RBAC
-- Ordre d'exécution: 1. Rôles → 2. Permissions → 3. Menus → 4. Admin
-- Compatible avec le schéma PostgreSQL actuel

-- Démarrer une transaction pour garantir la cohérence
BEGIN;

-- Message de début
DO $$
BEGIN
    RAISE NOTICE '🚀 Démarrage du processus de seed PostgreSQL...';
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
    SELECT COUNT(*) INTO roles_count FROM roles;
    RAISE NOTICE '✅ Rôles créés: % rôles', roles_count;
    
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
    groups_count INT;
BEGIN
    SELECT COUNT(*) INTO permissions_count FROM permissions;
    SELECT COUNT(DISTINCT "group") INTO groups_count FROM permissions;
    
    RAISE NOTICE '✅ Permissions créées: % permissions dans % groupes', permissions_count, groups_count;
    
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
BEGIN
    SELECT COUNT(*) INTO menus_count FROM menus;
    SELECT COUNT(*) INTO parent_menus_count FROM menus WHERE parent_id IS NULL;
    
    RAISE NOTICE '✅ Menus créés: % menus (% parents)', menus_count, parent_menus_count;
    
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
    admin_user_id BIGINT;
    admin_roles_count INT;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    SELECT COUNT(*) INTO admin_roles_count FROM accesses WHERE user_id = admin_user_id;
    
    RAISE NOTICE '✅ Administrateur créé: ID=% avec % rôles', admin_user_id, admin_roles_count;
    
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
    total_accesses INT;
BEGIN
    -- Compter tous les éléments
    SELECT COUNT(*) INTO total_roles FROM roles;
    SELECT COUNT(*) INTO total_permissions FROM permissions;
    SELECT COUNT(*) INTO total_menus FROM menus;
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_accesses FROM accesses;
    
    -- Afficher le résumé
    RAISE NOTICE '';
    RAISE NOTICE '📊 RÉSUMÉ DU SYSTÈME RBAC';
    RAISE NOTICE '================================';
    RAISE NOTICE '👥 Utilisateurs: %', total_users;
    RAISE NOTICE '🛡️  Rôles: %', total_roles;
    RAISE NOTICE '🔑 Permissions: %', total_permissions;
    RAISE NOTICE '📋 Menus: %', total_menus;
    RAISE NOTICE '🔗 Accès utilisateur-rôle: %', total_accesses;
    RAISE NOTICE '================================';
    
    -- Vérifications critiques
    IF total_roles < 4 THEN
        RAISE WARNING '⚠️  Attention: Moins de 4 rôles créés';
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
    
    IF total_accesses = 0 THEN
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

-- Valider la transaction
COMMIT;

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

-- ========================================
-- RAPPORT FINAL
-- ========================================
\echo ''
\echo '🏗️  STRUCTURE RBAC CRÉÉE:'
\echo '├─ 👤 Utilisateurs (1 admin)'
\echo '├─ 🛡️  Rôles (10 rôles: super_admin → guest)'
\echo '├─ 🔑 Permissions (27+ permissions par groupe)'
\echo '├─ 📋 Menus (6 menus principaux avec sous-menus)'
\echo '└─ 🔗 Associations (complètes et cohérentes)'
\echo ''

\echo '✅ SYSTÈME RBAC PRÊT À L''EMPLOI!'
