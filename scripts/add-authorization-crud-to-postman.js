/**
 * Script pour ajouter le CRUD du module authorizations à la collection Postman
 */

const fs = require('fs');
const path = require('path');

const POSTMAN_COLLECTION_PATH = path.join(__dirname, '../postman/collections/Event-Planner-Auth-API.postman_collection.json');

// Définition du CRUD authorizations pour Postman
const AUTHORIZATIONS_CRUD_FOLDER = {
  "name": "🔑 Gestion Authorizations CRUD",
  "item": [
    {
      "name": "1. Lister toutes les autorisations",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/authorizations?page=1&limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["api", "authorizations"],
          "query": [
            {
              "key": "page",
              "value": "1"
            },
            {
              "key": "limit", 
              "value": "10"
            }
          ]
        }
      },
      "response": []
    },
    {
      "name": "2. Créer une autorisation",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"roleId\": 1,\n  \"permissionId\": 1,\n  \"menuId\": 1\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/authorizations",
          "host": ["{{baseUrl}}"],
          "path": ["api", "authorizations"]
        }
      },
      "response": []
    },
    {
      "name": "3. Voir une autorisation par ID",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/authorizations/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "authorizations", "1"]
        }
      },
      "response": []
    },
    {
      "name": "4. Mettre à jour une autorisation",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"roleId\": 2,\n  \"permissionId\": 2,\n  \"menuId\": 2\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/authorizations/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "authorizations", "1"]
        }
      },
      "response": []
    },
    {
      "name": "5. Supprimer une autorisation (soft delete)",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/authorizations/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "authorizations", "1"]
        }
      },
      "response": []
    },
    {
      "name": "6. Supprimer définitivement une autorisation",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/authorizations/1/hard",
          "host": ["{{baseUrl}}"],
          "path": ["api", "authorizations", "1", "hard"]
        }
      },
      "response": []
    },
    {
      "name": "7. Lister les autorisations d'un rôle",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/authorizations/role/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "authorizations", "role", "1"]
        }
      },
      "response": []
    },
    {
      "name": "8. Lister les autorisations d'une permission",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/authorizations/permission/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "authorizations", "permission", "1"]
        }
      },
      "response": []
    },
    {
      "name": "9. Lister les autorisations d'un menu",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/authorizations/menu/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "authorizations", "menu", "1"]
        }
      },
      "response": []
    }
  ]
};

/**
 * Ajoute le CRUD authorizations à la collection Postman
 */
function addAuthorizationsCRUDToCollection() {
  try {
    console.log('🔄 Lecture de la collection Postman...');
    const collection = JSON.parse(fs.readFileSync(POSTMAN_COLLECTION_PATH, 'utf8'));
    
    // Vérifier si le dossier existe déjà
    const existingFolder = collection.item.find(item => item.name === AUTHORIZATIONS_CRUD_FOLDER.name);
    
    if (existingFolder) {
      console.log('⚠️  Le dossier CRUD authorizations existe déjà, mise à jour...');
      // Remplacer le contenu existant
      const index = collection.item.indexOf(existingFolder);
      collection.item[index] = AUTHORIZATIONS_CRUD_FOLDER;
    } else {
      console.log('➕ Ajout du CRUD authorizations...');
      // Ajouter le nouveau dossier
      collection.item.push(AUTHORIZATIONS_CRUD_FOLDER);
    }
    
    // Mettre à jour la description de la collection
    collection.description = "Collection complète pour l'API d'authentification Event Planner avec inscription, connexion, OTP, gestion des comptes, rôles, permissions, accès, autorisations et hardening de validation (Rule 3) - PRODUCTION READY v1.1";
    
    // Écrire la collection mise à jour
    fs.writeFileSync(POSTMAN_COLLECTION_PATH, JSON.stringify(collection, null, 2));
    
    console.log('✅ CRUD authorizations ajouté avec succès!');
    console.log(`📁 Fichier: ${POSTMAN_COLLECTION_PATH}`);
    console.log(`📊 ${AUTHORIZATIONS_CRUD_FOLDER.item.length} endpoints ajoutés`);
    
    return {
      success: true,
      endpointsAdded: AUTHORIZATIONS_CRUD_FOLDER.item.length,
      updated: !!existingFolder
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du CRUD authorizations:', error.message);
    throw error;
  }
}

/**
 * Génère un rapport de l'ajout du CRUD authorizations
 */
function generateAuthorizationsCRUDReport(result) {
  const report = {
    timestamp: new Date().toISOString(),
    module: 'authorizations_crud',
    operation: result.updated ? 'updated' : 'added',
    endpoints_count: AUTHORIZATIONS_CRUD_FOLDER.item.length,
    endpoints: AUTHORIZATIONS_CRUD_FOLDER.item.map(item => ({
      name: item.name,
      method: item.request?.method || 'GET',
      url: item.request?.url?.raw || 'N/A'
    })),
    features: [
      'CRUD complet des autorisations rôle-permission-menu',
      'Soft delete et hard delete',
      'Filtrage par rôle, permission, menu',
      'Pagination et recherche avancée',
      'Validation complète avec RBAC',
      'Gestion des relations complexes',
      'Tri personnalisable'
    ],
    next_steps: [
      'Tester chaque endpoint dans Postman',
      'Valider les permissions RBAC',
      'Vérifier la cohérence avec le schéma SQL',
      'Documenter les cas d\'usage avancés'
    ]
  };
  
  const reportPath = path.join(__dirname, '../documentation/reports/AUTHORIZATIONS_CRUD_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📋 Rapport généré: ${reportPath}`);
  return report;
}

// Exécuter l'ajout du CRUD
if (require.main === module) {
  console.log('🚀 Ajout du CRUD authorizations à la collection Postman...');
  
  try {
    const result = addAuthorizationsCRUDToCollection();
    generateAuthorizationsCRUDReport(result);
    
    console.log('\n✨ CRUD authorizations ajouté avec succès!');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Ouvrir la collection dans Postman');
    console.log('   2. Tester les endpoints CRUD authorizations');
    console.log('   3. Valider les permissions RBAC');
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    process.exit(1);
  }
}

module.exports = {
  addAuthorizationsCRUDToCollection,
  generateAuthorizationsCRUDReport,
  AUTHORIZATIONS_CRUD_FOLDER
};
