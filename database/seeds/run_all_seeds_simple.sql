-- ========================================
-- SCRIPT PRINCIPAL DE SEEDS RBAC (SANS TRANSACTION)
-- ========================================
-- Exécution complète des seeds pour initialiser le système RBAC
-- Ordre d'exécution: 1. Rôles → 2. Permissions → 3. Permissions Modules → 4. Menus → 5. Autorizations → 6. Admin

-- Message de début
DO $$
BEGIN
    RAISE NOTICE '🚀 Démarrage du processus de seed du système RBAC...';
    RAISE NOTICE '📋 Étapes prévues: Rôles → Permissions → Permissions Modules → Menus → Autorizations → Admin';
    RAISE NOTICE '⏰ Heure de début: %', NOW();
END $$;

-- ========================================
-- ÉTAPE 1: CRÉATION DES RÔLES
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 ÉTAPE 1/6: Création des rôles système...';
END $$;

-- Exécuter le seed des rôles
\i database/seeds/seeds/roles.seed.sql

-- ========================================
-- ÉTAPE 2: CRÉATION DES PERMISSIONS
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔑 ÉTAPE 2/6: Création des permissions système...';
END $$;

-- Exécuter le seed des permissions
\i database/seeds/seeds/permissions.seed.sql

-- ========================================
-- ÉTAPE 2.5: CRÉATION DES PERMISSIONS MODULES
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔑 ÉTAPE 2.5/6: Création des permissions modules (authorizations/accesses)...';
END $$;

-- Exécuter le seed des permissions modules
\i database/seeds/permissions_new_modules.seed.sql

-- ========================================
-- ÉTAPE 3: CRÉATION DES MENUS
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 ÉTAPE 3/6: Création des menus système...';
END $$;

-- Exécuter le seed des menus
\i database/seeds/seeds/menus.seed.sql

-- ========================================
-- ÉTAPE 4: CRÉATION DES AUTORISATIONS
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔗 ÉTAPE 4/6: Création des autorisations système...';
END $$;

-- Exécuter le seed des autorisations
\i database/seeds/seeds/authorizations.seed.sql

-- ========================================
-- ÉTAPE 5: CRÉATION DE L'ADMINISTRATEUR
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '👤 ÉTAPE 5/6: Création de l''administrateur par défaut...';
END $$;

-- Exécuter le seed de l'admin
\i database/seeds/seeds/admin.seed.sql

-- ========================================
-- ÉTAPE 6: VALIDATION FINALE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ÉTAPE 6/6: Validation finale du système RBAC...';
END $$;

-- Vérification de l'intégrité du système
DO $$
DECLARE
    total_roles INT;
    total_permissions INT;
    total_menus INT;
    total_users INT;
    total_user_roles INT;
    total_authorizations INT;
BEGIN
    -- Compter tous les éléments
    SELECT COUNT(*) INTO total_roles FROM roles;
    SELECT COUNT(*) INTO total_permissions FROM permissions;
    SELECT COUNT(*) INTO total_menus FROM menus;
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_user_roles FROM accesses;
    SELECT COUNT(*) INTO total_authorizations FROM authorizations;
    
    -- Afficher le résumé
    RAISE NOTICE '';
    RAISE NOTICE '📊 RÉSUMÉ DU SYSTÈME RBAC';
    RAISE NOTICE '================================';
    RAISE NOTICE '👥 Utilisateurs: %', total_users;
    RAISE NOTICE '🛡️  Rôles: %', total_roles;
    RAISE NOTICE '🔑 Permissions: %', total_permissions;
    RAISE NOTICE '📋 Menus: %', total_menus;
    RAISE NOTICE '🔗 Associations utilisateur-rôle: %', total_user_roles;
    RAISE NOTICE '🔗 Associations rôle-permission-menu: %', total_authorizations;
    RAISE NOTICE '================================';
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
-- FINALISATION
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PROCESSUS DE SEED TERMINÉ AVEC SUCCÈS!';
    RAISE NOTICE '⏰ Heure de fin: %', NOW();
    RAISE NOTICE '🚀 Le système RBAC est prêt à être utilisé';
END $$;
