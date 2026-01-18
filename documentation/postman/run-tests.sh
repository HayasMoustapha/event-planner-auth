#!/bin/bash

# Script pour lancer les tests Postman automatisés
# Nécessite Newman (CLI de Postman)

echo "🚀 Lancement des tests Postman pour Event Planner API"
echo "================================================"

# Vérifier si Newman est installé
if ! command -v newman &> /dev/null; then
    echo "❌ Newman n'est pas installé. Installation en cours..."
    npm install -g newman
    echo "✅ Newman installé avec succès"
fi

# Variables
API_URL=${1:-http://localhost:3000}
ENVIRONMENT_FILE="postman/environments/Event-Planner-Complete-Environment.postman_environment.json"
TESTS_FILE="postman/tests/automated-tests.postman_collection.json"

echo "📍 URL de l'API: $API_URL"
echo "📁 Fichier d'environnement: $ENVIRONMENT_FILE"
echo "📁 Fichier de tests: $TESTS_FILE"
echo ""

# Vérifier si les fichiers existent
if [ ! -f "$TESTS_FILE" ]; then
    echo "❌ Fichier de tests non trouvé: $TESTS_FILE"
    exit 1
fi

if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo "❌ Fichier d'environnement non trouvé: $ENVIRONMENT_FILE"
    exit 1
fi

# Lancer les tests
echo "🧪 Exécution des tests automatisés..."
newman run "$TESTS_FILE" \
    --environment "$ENVIRONMENT_FILE" \
    --global-var "baseUrl=$API_URL" \
    --reporters cli,html \
    --reporter-html-export "postman/reports/test-report.html" \
    --bail

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Tous les tests ont réussi !"
    echo "📊 Rapport HTML généré: postman/reports/test-report.html"
else
    echo ""
    echo "❌ Certains tests ont échoué"
    echo "📊 Rapport HTML généré: postman/reports/test-report.html"
    exit 1
fi
