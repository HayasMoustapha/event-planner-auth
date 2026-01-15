-- Migration 004 : Ajout des colonnes manquantes identifiées dans le schéma de référence
-- Basé sur l'analyse comparative entre auth_tables_export.sql et 001_init_auth.sql

-- 1. Ajout de la colonne user_access dans la table users
-- Référence : `user_access` int DEFAULT NULL dans le schéma MySQL
ALTER TABLE users 
ADD COLUMN user_access INT DEFAULT NULL;

-- Commentaire : La colonne user_access permet de gérer les niveaux d'accès utilisateur
-- Valeurs possibles : NULL (défaut), ou entier pour définir le niveau d'accès

-- 2. Ajout de la colonne granted dans la table authorizations  
-- Référence : `granted` tinyint(1) NOT NULL DEFAULT '1' dans le schéma MySQL
ALTER TABLE authorizations 
ADD COLUMN granted BOOLEAN NOT NULL DEFAULT TRUE;

-- Commentaire : La colonne granted permet une gestion granulaire des autorisations
-- TRUE = permission accordée, FALSE = permission refusée

-- 3. Correction du CHECK constraint sur people.status pour inclure 'lock'
-- Référence : enum('active','inactive','lock') dans le schéma MySQL
ALTER TABLE people 
DROP CONSTRAINT IF EXISTS people_status_check;

ALTER TABLE people 
ADD CONSTRAINT people_status_check 
CHECK (status IN ('active', 'inactive', 'lock'));

-- Commentaire : Ajout du statut 'lock' pour verrouiller les personnes (compte bloqué)
-- 'active' = compte actif, 'inactive' = compte désactivé, 'lock' = compte verrouillé

-- 4. Correction de la contrainte menu_id dans authorizations (rendre optionnel)
-- Référence : menu_id peut être NULL dans certaines autorisations
-- D'abord, supprimer l'ancienne contrainte unique
ALTER TABLE authorizations 
DROP CONSTRAINT IF EXISTS authorizations_role_id_permission_id_menu_id_key;

-- Ensuite, rendre menu_id optionnel
ALTER TABLE authorizations 
ALTER COLUMN menu_id DROP NOT NULL;

-- Ajouter une nouvelle contrainte unique qui gère les NULL correctement
ALTER TABLE authorizations 
ADD CONSTRAINT authorizations_unique_role_permission_menu 
UNIQUE (role_id, permission_id, menu_id);

-- Commentaire : menu_id est maintenant optionnel pour permettre les autorisations générales
-- La contrainte unique permet plusieurs autorisations avec menu_id=NULL pour le même rôle/permission

-- 5. Mise à jour des index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS users_user_access_index ON users(user_access);
CREATE INDEX IF NOT EXISTS authorizations_granted_index ON authorizations(granted);

-- Commentaire : Index pour optimiser les requêtes sur les nouvelles colonnes

-- 6. Ajout de commentaires sur les tables pour documentation
COMMENT ON COLUMN users.user_access IS 'Niveau d''accès utilisateur (NULL par défaut, entier pour niveau spécifique)';
COMMENT ON COLUMN authorizations.granted IS 'Statut de l''autorisation (TRUE=accordée, FALSE=refusée)';
COMMENT ON COLUMN people.status IS 'Statut de la personne : active, inactive, ou lock (verrouillé)';
COMMENT ON COLUMN authorizations.menu_id IS 'Menu associé (optionnel, NULL pour autorisations générales)';

-- Fin de la migration 004
