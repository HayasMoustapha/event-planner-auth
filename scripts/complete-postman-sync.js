/**
 * Script complet de synchronisation Postman
 * Analyse les validators et met à jour tous les exemples Postman
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const POSTMAN_COLLECTION_PATH = path.join(__dirname, '../postman/collections/Event-Planner-Auth-API.postman_collection.json');
const SRC_PATH = path.join(__dirname, '../src/modules');

// Mapping des routes vers les exemples corrects
const ROUTE_EXAMPLES = {
  // Auth routes
  '/api/auth/register': {
    method: 'POST',
    body: {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+33612345678",
      "password": "Password123",
      "username": "johndoe"
    }
  },
  '/api/auth/login': {
    method: 'POST',
    body: {
      "email": "admin@eventplanner.com",
      "password": "admin123"
    }
  },
  '/api/auth/verify-email': {
    method: 'POST',
    body: {
      "email": "user@example.com",
      "otpCode": "123456"
    }
  },
  '/api/auth/resend-otp': {
    method: 'POST',
    body: {
      "email": "user@example.com"
    }
  },
  '/api/auth/change-password': {
    method: 'POST',
    body: {
      "currentPassword": "admin123",
      "newPassword": "NewPassword123"
    }
  },
  '/api/auth/otp/email/generate': {
    method: 'POST',
    body: {
      "email": "user@example.com"
    }
  },
  '/api/auth/otp/phone/generate': {
    method: 'POST',
    body: {
      "phone": "+33612345678"
    }
  },
  '/api/auth/otp/email/verify': {
    method: 'POST',
    body: {
      "email": "user@example.com",
      "code": "123456"
    }
  },
  '/api/auth/otp/password-reset/generate': {
    method: 'POST',
    body: {
      "email": "user@example.com"
    }
  },
  '/api/auth/otp/password-reset/verify': {
    method: 'POST',
    body: {
      "email": "user@example.com",
      "code": "123456",
      "newPassword": "NewPassword123"
    }
  },
  '/api/auth/validate-token': {
    method: 'POST',
    body: {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  '/api/auth/refresh-token': {
    method: 'POST',
    body: {
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  '/api/auth/logout': {
    method: 'POST',
    body: {}
  },
  '/api/auth/login-after-verification': {
    method: 'POST',
    body: {
      "email": "user@example.com",
      "password": "Password123"
    }
  },

  // Users routes
  '/api/users': {
    method: 'POST',
    body: {
      "username": "newuser",
      "email": "newuser@example.com",
      "password": "Password123",
      "user_code": "USER001",
      "phone": "+33612345678",
      "status": "active",
      "person_id": 1
    }
  },
  '/api/users/{id}': {
    method: 'PUT',
    body: {
      "username": "updateduser",
      "email": "updated@example.com",
      "user_code": "USER002",
      "phone": "+33612345679",
      "status": "active"
    }
  },

  // Roles routes
  '/api/roles': {
    method: 'POST',
    body: {
      "code": "MANAGER",
      "label": {
        "fr": "Manager",
        "en": "Manager"
      },
      "description": {
        "fr": "Rôle de manager",
        "en": "Manager role"
      },
      "level": 2
    }
  },
  '/api/roles/{id}': {
    method: 'PUT',
    body: {
      "code": "SENIOR_MANAGER",
      "label": {
        "fr": "Senior Manager",
        "en": "Senior Manager"
      },
      "description": {
        "fr": "Rôle de senior manager",
        "en": "Senior manager role"
      },
      "level": 3
    }
  },
  '/api/roles/{id}/permissions': {
    method: 'POST',
    body: {
      "permissionIds": [1, 2, 3]
    }
  },

  // Permissions routes
  '/api/permissions': {
    method: 'POST',
    body: {
      "code": "users.create",
      "label": {
        "fr": "Créer des utilisateurs",
        "en": "Create users"
      },
      "group": "users",
      "description": {
        "fr": "Permission de créer de nouveaux utilisateurs",
        "en": "Permission to create new users"
      }
    }
  },

  // Menus routes
  '/api/menus': {
    method: 'POST',
    body: {
      "label": {
        "fr": "Utilisateurs",
        "en": "Users"
      },
      "icon": "users",
      "route": "/users",
      "component": "UsersComponent",
      "parent_path": "/admin",
      "menu_group": 1,
      "sort_order": 1,
      "depth": 1
    }
  },
  '/api/menus/{id}': {
    method: 'PUT',
    body: {
      "label": {
        "fr": "Gestion Utilisateurs",
        "en": "User Management"
      },
      "icon": "user-cog",
      "route": "/user-management",
      "component": "UserManagementComponent",
      "parent_path": "/admin",
      "menu_group": 1,
      "sort_order": 2,
      "depth": 1
    }
  },
  '/api/menus/{id}/permissions': {
    method: 'POST',
    body: {
      "permissionIds": [1, 2, 3]
    }
  },

  // People routes
  '/api/people': {
    method: 'POST',
    body: {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+33612345678",
      "status": "active"
    }
  },
  '/api/people/{id}': {
    method: 'PUT',
    body: {
      "first_name": "Jane",
      "last_name": "Smith",
      "phone": "+33612345679",
      "status": "active"
    }
  },

  // Accesses routes
  '/api/accesses': {
    method: 'POST',
    body: {
      "userId": 1,
      "roleId": 2,
      "status": "active"
    }
  },
  '/api/accesses/{id}': {
    method: 'PUT',
    body: {
      "status": "inactive"
    }
  },
  '/api/accesses/user/{userId}/roles/assign': {
    method: 'POST',
    body: {
      "roleIds": [1, 2, 3]
    }
  },
  '/api/accesses/user/{userId}/roles/remove': {
    method: 'POST',
    body: {
      "roleIds": [1, 2]
    }
  }
};

/**
 * Met à jour les exemples Postman en se basant sur les routes
 */
function updatePostmanCollection() {
  try {
    console.log('🔄 Lecture de la collection Postman...');
    const collection = JSON.parse(fs.readFileSync(POSTMAN_COLLECTION_PATH, 'utf8'));
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Fonction récursive pour parcourir tous les items
    function updateItems(items, parentPath = '') {
      items.forEach(item => {
        if (item.request && item.request.body && item.request.body.mode === 'raw') {
          const method = item.request.method;
          const url = item.request.url.raw || '';
          
          // Normaliser l'URL pour la correspondance
          let normalizedUrl = url.replace(/{{baseUrl}}/, '').replace(/\?.*$/, '');
          
          // Remplacer les paramètres de chemin par des placeholders
          normalizedUrl = normalizedUrl.replace(/\/\d+/g, '/{id}');
          
          // Trouver l'exemple correspondant
          let matchingExample = null;
          
          // Recherche exacte d'abord
          if (ROUTE_EXAMPLES[normalizedUrl] && ROUTE_EXAMPLES[normalizedUrl].method === method) {
            matchingExample = ROUTE_EXAMPLES[normalizedUrl];
          } else {
            // Recherche par pattern
            for (const [route, example] of Object.entries(ROUTE_EXAMPLES)) {
              if (example.method === method && isRouteMatch(normalizedUrl, route)) {
                matchingExample = example;
                break;
              }
            }
          }
          
          if (matchingExample) {
            const newBody = JSON.stringify(matchingExample.body, null, 2);
            item.request.body.raw = newBody;
            updatedCount++;
            console.log(`✅ Mis à jour: ${item.name} (${method} ${normalizedUrl})`);
          } else {
            skippedCount++;
            console.log(`⏭️  Non mis à jour: ${item.name} (${method} ${normalizedUrl})`);
          }
        }
        
        // Récursivement parcourir les sous-items
        if (item.item && Array.isArray(item.item)) {
          updateItems(item.item, parentPath + '/' + item.name);
        }
      });
    }
    
    updateItems(collection.item);
    
    // Écrire la collection mise à jour
    fs.writeFileSync(POSTMAN_COLLECTION_PATH, JSON.stringify(collection, null, 2));
    
    console.log(`\n🎉 Synchronisation terminée!`);
    console.log(`📊 ${updatedCount} exemples mis à jour`);
    console.log(`⏭️  ${skippedCount} exemples non mis à jour (pas de correspondance)`);
    console.log(`📁 Fichier: ${POSTMAN_COLLECTION_PATH}`);
    
    return { updatedCount, skippedCount };
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
    throw error;
  }
}

/**
 * Vérifie si une URL correspond à un pattern de route
 */
function isRouteMatch(url, pattern) {
  // Remplacer les placeholders dans le pattern
  const regexPattern = pattern
    .replace(/\{id\}/g, '\\d+')
    .replace(/\//g, '\\/')
    .replace(/\?/g, '\\?');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(url);
}

/**
 * Génère un rapport détaillé de la synchronisation
 */
function generateDetailedReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total_routes: Object.keys(ROUTE_EXAMPLES).length,
      updated_examples: results.updatedCount,
      skipped_examples: results.skippedCount
    },
    routes_available: Object.keys(ROUTE_EXAMPLES).map(route => ({
      route,
      method: ROUTE_EXAMPLES[route].method,
      has_body: !!ROUTE_EXAMPLES[route].body
    })),
    validation_files: [
      'auth.validation.js',
      'users.validation.js',
      'roles.validation.js', 
      'permissions.validation.js',
      'menus.validation.js',
      'people.validation.js'
    ],
    next_steps: [
      'Tester chaque endpoint manuellement dans Postman',
      'Vérifier que tous les validators fonctionnent correctement',
      'Documenter les cas de test spécifiques',
      'Valider la cohérence avec le schéma SQL'
    ]
  };
  
  const reportPath = path.join(__dirname, '../documentation/reports/COMPLETE_POSTMAN_SYNC_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📋 Rapport détaillé généré: ${reportPath}`);
  
  return report;
}

/**
 * Crée une documentation des cas de test
 */
function createTestCaseDocumentation() {
  const testCases = {
    authentication: [
      {
        name: "Inscription valide",
        endpoint: "/api/auth/register",
        method: "POST",
        description: "Créer un nouveau compte utilisateur avec validation OTP",
        expected_status: 201,
        test_data: ROUTE_EXAMPLES['/api/auth/register'].body
      },
      {
        name: "Connexion valide",
        endpoint: "/api/auth/login", 
        method: "POST",
        description: "Authentifier un utilisateur avec email et mot de passe",
        expected_status: 200,
        test_data: ROUTE_EXAMPLES['/api/auth/login'].body
      }
    ],
    users: [
      {
        name: "Création utilisateur",
        endpoint: "/api/users",
        method: "POST", 
        description: "Créer un nouvel utilisateur avec permissions",
        expected_status: 201,
        test_data: ROUTE_EXAMPLES['/api/users'].body
      }
    ],
    roles: [
      {
        name: "Assignation permissions",
        endpoint: "/api/roles/{id}/permissions",
        method: "POST",
        description: "Assigner des permissions à un rôle",
        expected_status: 200,
        test_data: ROUTE_EXAMPLES['/api/roles/{id}/permissions'].body
      }
    ]
  };
  
  const docPath = path.join(__dirname, '../documentation/postman/POSTMAN_TEST_CASES.md');
  
  let markdown = `# Cas de Test Postman - Event Planner Auth API\n\n`;
  markdown += `*Généré le: ${new Date().toISOString()}*\n\n`;
  
  Object.entries(testCases).forEach(([category, cases]) => {
    markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    cases.forEach(testCase => {
      markdown += `### ${testCase.name}\n\n`;
      markdown += `- **Endpoint**: \`${testCase.method} ${testCase.endpoint}\`\n`;
      markdown += `- **Description**: ${testCase.description}\n`;
      markdown += `- **Statut attendu**: ${testCase.expected_status}\n`;
      markdown += `- **Données de test**:\n\`\`\`json\n${JSON.stringify(testCase.test_data, null, 2)}\n\`\`\`\n\n`;
    });
  });
  
  fs.writeFileSync(docPath, markdown);
  console.log(`📚 Documentation des cas de test créée: ${docPath}`);
}

// Exécuter la synchronisation complète
if (require.main === module) {
  console.log('🚀 Début de la synchronisation complète Postman...');
  
  try {
    const results = updatePostmanCollection();
    generateDetailedReport(results);
    createTestCaseDocumentation();
    
    console.log('\n✨ Synchronisation Postman terminée avec succès!');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Ouvrir la collection dans Postman');
    console.log('   2. Tester chaque endpoint');
    console.log('   3. Valider les réponses attendues');
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    process.exit(1);
  }
}

module.exports = {
  updatePostmanCollection,
  generateDetailedReport,
  createTestCaseDocumentation,
  ROUTE_EXAMPLES
};
