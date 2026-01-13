-- Migration initiale pour le module d'authentification
-- Exécuter cette migration pour créer les tables de base

-- Désactiver les vérifications de clés étrangères temporairement (MySQL)
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer les tables si elles existent (pour développement)
DROP TABLE IF EXISTS email_verifications;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_menus;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS people;
DROP TABLE IF EXISTS menus;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Créer les tables dans le bon ordre
-- Source: auth_schema.sql
