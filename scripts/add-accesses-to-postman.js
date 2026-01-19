/**
 * Script pour ajouter le module accesses à la collection Postman
 */

const fs = require('fs');
const path = require('path');

const POSTMAN_COLLECTION_PATH = path.join(__dirname, '../postman/collections/Event-Planner-Auth-API.postman_collection.json');

// Définition du module accesses pour Postman
const ACCESSES_FOLDER = {
  "name": "🔐 Gestion Accesses (User-Role)",
  "item": [
    {
      "name": "1. Lister tous les accès",
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
          "raw": "{{baseUrl}}/api/accesses?page=1&limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses"],
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
      "name": "2. Créer un accès",
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
          "raw": "{\n  \"userId\": 1,\n  \"roleId\": 2,\n  \"status\": \"active\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/accesses",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses"]
        }
      },
      "response": []
    },
    {
      "name": "3. Voir un accès par ID",
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
          "raw": "{{baseUrl}}/api/accesses/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "1"]
        }
      },
      "response": []
    },
    {
      "name": "4. Mettre à jour le statut d'un accès",
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
          "raw": "{\n  \"status\": \"inactive\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/accesses/1/status",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "1", "status"]
        }
      },
      "response": []
    },
    {
      "name": "5. Supprimer un accès (soft delete)",
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
          "raw": "{{baseUrl}}/api/accesses/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "1"]
        }
      },
      "response": []
    },
    {
      "name": "6. Supprimer définitivement un accès",
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
          "raw": "{{baseUrl}}/api/accesses/1/hard",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "1", "hard"]
        }
      },
      "response": []
    },
    {
      "name": "7. Lister les rôles d'un utilisateur",
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
          "raw": "{{baseUrl}}/api/accesses/user/1/roles?onlyActive=true",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "user", "1", "roles"],
          "query": [
            {
              "key": "onlyActive",
              "value": "true"
            }
          ]
        }
      },
      "response": []
    },
    {
      "name": "8. Lister les utilisateurs d'un rôle",
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
          "raw": "{{baseUrl}}/api/accesses/role/2/users?onlyActive=true",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "role", "2", "users"],
          "query": [
            {
              "key": "onlyActive",
              "value": "true"
            }
          ]
        }
      },
      "response": []
    },
    {
      "name": "9. Vérifier si un utilisateur a un rôle",
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
          "raw": "{{baseUrl}}/api/accesses/user/1/role/2?onlyActive=true",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "user", "1", "role", "2"],
          "query": [
            {
              "key": "onlyActive",
              "value": "true"
            }
          ]
        }
      },
      "response": []
    },
    {
      "name": "10. Assigner plusieurs rôles à un utilisateur",
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
          "raw": "{\n  \"roleIds\": [1, 2, 3]\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/accesses/user/1/roles/assign",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "user", "1", "roles", "assign"]
        }
      },
      "response": []
    },
    {
      "name": "11. Retirer plusieurs rôles d'un utilisateur",
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
          "raw": "{\n  \"roleIds\": [1, 2]\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/accesses/user/1/roles/remove",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "user", "1", "roles", "remove"]
        }
      },
      "response": []
    },
    {
      "name": "12. Statistiques des accès",
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
          "raw": "{{baseUrl}}/api/accesses/stats",
          "host": ["{{baseUrl}}"],
          "path": ["api", "accesses", "stats"]
        }
      },
      "response": []
    }
  ]
};

/**
 * Ajoute le module accesses à la collection Postman
 */
function addAccessesModuleToCollection() {
  try {
    console.log('🔄 Lecture de la collection Postman...');
    const collection = JSON.parse(fs.readFileSync(POSTMAN_COLLECTION_PATH, 'utf8'));
    
    // Vérifier si le module existe déjà
    const existingFolder = collection.item.find(item => item.name === ACCESSES_FOLDER.name);
    
    if (existingFolder) {
      console.log('⚠️  Le module accesses existe déjà, mise à jour...');
      // Remplacer le contenu existant
      const index = collection.item.indexOf(existingFolder);
      collection.item[index] = ACCESSES_FOLDER;
    } else {
      console.log('➕ Ajout du module accesses...');
      // Ajouter le nouveau module
      collection.item.push(ACCESSES_FOLDER);
    }
    
    // Mettre à jour la description de la collection
    collection.description = "Collection complète pour l'API d'authentification Event Planner avec inscription, connexion, OTP, gestion des comptes, rôles, permissions, accès et hardening de validation (Rule 3) - PRODUCTION READY v1.0";
    
    // Écrire la collection mise à jour
    fs.writeFileSync(POSTMAN_COLLECTION_PATH, JSON.stringify(collection, null, 2));
    
    console.log('✅ Module accesses ajouté avec succès!');
    console.log(`📁 Fichier: ${POSTMAN_COLLECTION_PATH}`);
    console.log(`📊 ${ACCESSES_FOLDER.item.length} endpoints ajoutés`);
    
    return {
      success: true,
      endpointsAdded: ACCESSES_FOLDER.item.length,
      updated: !!existingFolder
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du module accesses:', error.message);
    throw error;
  }
}

/**
 * Génère un rapport de l'ajout du module accesses
 */
function generateAccessesReport(result) {
  const report = {
    timestamp: new Date().toISOString(),
    module: 'accesses',
    operation: result.updated ? 'updated' : 'added',
    endpoints_count: ACCESSES_FOLDER.item.length,
    endpoints: ACCESSES_FOLDER.item.map(item => ({
      name: item.name,
      method: item.request?.method || 'GET',
      url: item.request?.url?.raw || 'N/A'
    })),
    features: [
      'CRUD complet des accès utilisateur-rôle',
      'Assignation multiple de rôles',
      'Retrait multiple de rôles',
      'Vérification des rôles utilisateur',
      'Soft delete et hard delete',
      'Validation complète avec RBAC',
      'Gestion des statuts (active/inactive/lock)',
      'Pagination et filtrage avancé'
    ],
    next_steps: [
      'Tester chaque endpoint dans Postman',
      'Valider les permissions RBAC',
      'Vérifier la cohérence avec le schéma SQL',
      'Documenter les cas d\'usage avancés'
    ]
  };
  
  const reportPath = path.join(__dirname, '../documentation/reports/ACCESSES_MODULE_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📋 Rapport généré: ${reportPath}`);
  return report;
}

// Exécuter l'ajout du module
if (require.main === module) {
  console.log('🚀 Ajout du module accesses à la collection Postman...');
  
  try {
    const result = addAccessesModuleToCollection();
    generateAccessesReport(result);
    
    console.log('\n✨ Module accesses ajouté avec succès!');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Ouvrir la collection dans Postman');
    console.log('   2. Tester les endpoints accesses');
    console.log('   3. Valider les permissions RBAC');
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    process.exit(1);
  }
}

module.exports = {
  addAccessesModuleToCollection,
  generateAccessesReport,
  ACCESSES_FOLDER
};
