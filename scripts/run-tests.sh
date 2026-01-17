#!/bin/bash

# Script d'exécution des tests complets
# Valide le système avant et après les tests

set -e

echo "🚀 Lancement des tests de validation du système..."

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        echo -e "${YELLOW}Détails: $3${NC}"
    fi
}

# Validation du schéma
echo -e "\n${YELLOW}🔍 Validation du schéma...${NC}"
if psql -h localhost -p 5432 -U postgres -d event_planner_auth -f scripts/validate-schema.sql > /tmp/schema-validation.log 2>&1; then
    print_result 0 "Validation du schéma réussie" "Voir /tmp/schema-validation.log"
else
    print_result 1 "Validation du schéma échouée" "Voir /tmp/schema-validation.log"
fi

# Validation des données
echo -e "\n${YELLOW}📊 Validation des données...${NC}"
if node scripts/validate-data.js > /tmp/data-validation.log 2>&1; then
    print_result 0 "Validation des données réussie" "Voir /tmp/data-validation.log"
else
    print_result 1 "Validation des données échouée" "Voir /tmp/data-validation.log"
fi

# Tests unitaires
echo -e "\n${YELLOW}🧪 Tests unitaires...${NC}"
if npm test -- --testPathPatterns=tests/unit/ --verbose > /tmp/unit-tests.log 2>&1; then
    print_result 0 "Tests unitaires réussis" "Voir /tmp/unit-tests.log"
else
    print_result 1 "Tests unitaires échoués" "Voir /tmp/unit-tests.log"
fi

# Tests d'intégration
echo -e "\n${YELLOW}🔗 Tests d'intégration...${NC}"
if npm test -- --testPathPatterns=tests/integration/ --verbose > /tmp/integration-tests.log 2>&1; then
    print_result 0 "Tests d'intégration réussis" "Voir /tmp/integration-tests.log"
else
    print_result 1 "Tests d'intégration échoués" "Voir /tmp/integration-tests.log"
fi

# Tests de performance
echo -e "\n${YELLOW}⚡ Tests de performance...${NC}"
if npm test -- --testPathPatterns=tests/performance/ --verbose > /tmp/performance-tests.log 2>&1; then
    print_result 0 "Tests de performance réussis" "Voir /tmp/performance-tests.log"
else
    print_result 1 "Tests de performance échoués" "Voir /tmp/performance-tests.log"
fi

# Tests de sécurité
echo -e "\n${YELLOW}🔒 Tests de sécurité...${NC}"
if npm test -- --testPathPatterns=tests/integration/security.test.js --verbose > /tmp/security-tests.log 2>&1; then
    print_result 0 "Tests de sécurité réussis" "Voir /tmp/security-tests.log"
else
    print_result 1 "Tests de sécurité échoués" "Voir /tmp/security-tests.log"
fi

# Rapport de synthèse
echo -e "\n${YELLOW}📋 Rapport de synthèse${NC}"
echo "=================================="
echo "Rapport généré le: $(date)"
echo "Logs disponibles dans: /tmp/"
echo "=================================="

# Compter les erreurs totales
TOTAL_ERRORS=0
for log_file in schema-validation.log data-validation.log unit-tests.log integration-tests.log performance-tests.log security-tests.log; do
    if [ -f "/tmp/$log_file" ]; then
        if grep -q "❌\|FAIL\|Error" "/tmp/$log_file"; then
            ((TOTAL_ERRORS++))
        fi
    fi
done

if [ $TOTAL_ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés avec succès!${NC}"
else
    echo -e "${RED}⚠️  $TOTAL_ERRORS erreur(s) détectée(s)${NC}"
fi

echo -e "\n${GREEN}✅ Validation du système terminée!${NC}"
