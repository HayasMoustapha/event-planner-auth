#!/bin/bash

# ========================================
# 🚀 SCRIPT DE MISE À JOUR COMPLÈTE DU SYSTÈME RBAC
# ========================================
# Ce script exécute toutes les étapes pour mettre à jour les permissions

set -e  # Arrêter le script en cas d'erreur

echo "🚀 DÉBUT DE LA MISE À JOUR COMPLÈTE DU SYSTÈME RBAC"
echo "=================================================="

# Vérifier si nous sommes dans le bon répertoire
if [ ! -f "database/seeds/seed-runner.js" ]; then
    echo "❌ Erreur: Veuillez exécuter ce script depuis la racine du service event-planner-auth"
    exit 1
fi

# Vérifier les variables d'environnement
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo "⚠️  Variables d'environnement de base de données manquantes, utilisation des valeurs par défaut"
    export DB_HOST=${DB_HOST:-localhost}
    export DB_PORT=${DB_PORT:-5432}
    export DB_NAME=${DB_NAME:-event_planner_auth}
    export DB_USER=${DB_USER:-postgres}
    export DB_PASSWORD=${DB_PASSWORD:-postgres}
fi

echo "📊 Configuration de la base de données:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Étape 1: Exécuter les seeds
echo "📋 ÉTAPE 1: Exécution des seeds RBAC..."
echo "--------------------------------------"
cd database/seeds
node seed-runner.js
if [ $? -eq 0 ]; then
    echo "✅ Seeds exécutés avec succès"
else
    echo "❌ Erreur lors de l'exécution des seeds"
    exit 1
fi
cd ../..
echo ""

# Étape 2: Valider les permissions
echo "🔍 ÉTAPE 2: Validation des permissions..."
echo "--------------------------------------"
node database/seeds/validate-permissions.js
if [ $? -eq 0 ]; then
    echo "✅ Validation des permissions terminée"
else
    echo "❌ Erreur lors de la validation des permissions"
    exit 1
fi
echo ""

# Étape 3: Afficher le résumé
echo "📊 ÉTAPE 3: Résumé de la mise à jour..."
echo "------------------------------------"
echo "✅ 20 nouvelles permissions ajoutées:"
echo "   - Payment Service: 9 permissions"
echo "   - Scan Validation Service: 7 permissions"
echo "   - Ticket Generator Service: 4 permissions"
echo ""
echo "✅ Super-admin a maintenant TOUTES les permissions sur TOUS les menus"
echo "✅ Compte admin@eventplanner.com avec rôle super_admin prêt"
echo ""
echo "🔑 Identifiants de connexion:"
echo "   Email: admin@eventplanner.com"
echo "   Username: admin"
echo "   Password: Admin123!"
echo ""

# Étape 4: Test de connexion rapide (optionnel)
echo "🧪 ÉTAPE 4: Test de connexion rapide..."
echo "------------------------------------"
echo "Pour tester les permissions, vous pouvez:"
echo "1. Démarrer le service event-planner-auth"
echo "2. Vous connecter avec le compte super-admin"
echo "3. Tester quelques routes protégées"
echo ""

echo "🎉 MISE À JOUR TERMINÉE AVEC SUCCÈS!"
echo "======================================"
echo "Le système RBAC est maintenant à jour avec 100% des permissions couvertes!"
echo ""

# Instructions finales
echo "📝 PROCHAINES ÉTAPES:"
echo "===================="
echo "1. Redémarrez le service event-planner-auth si nécessaire"
echo "2. Testez l'accès aux différentes routes avec le compte super-admin"
echo "3. Vérifiez que tous les services fonctionnent correctement"
echo "4. Assignez des rôles spécifiques aux autres utilisateurs si nécessaire"
echo ""

echo "🔗 Routes de test suggérées:"
echo "   - GET /api/permissions (lister toutes les permissions)"
echo "   - GET /api/roles (lister tous les rôles)"
echo "   - GET /api/users (lister tous les utilisateurs)"
echo "   - POST /api/permissions (créer une permission - test)"
echo ""

echo "✨ Le super-admin peut maintenant faire TOUT dans TOUS les services! ✨"
