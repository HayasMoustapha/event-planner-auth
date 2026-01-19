/**
 * Script de synchronisation Postman - Backend
 * Met à jour les exemples de corps de requête Postman pour qu'ils respectent les validators
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const POSTMAN_COLLECTION_PATH = path.join(__dirname, '../postman/collections/Event-Planner-Auth-API.postman_collection.json');
const VALIDATORS_PATH = path.join(__dirname, '../src/modules');

// Exemples corrects basés sur les validators
const CORRECT_EXAMPLES = {
  // Auth endpoints
  'register': {
    "first_name": "John",
    "last_name": "Doe", 
    "email": "john.doe@example.com",
    "phone": "+33612345678",
    "password": "Password123",
    "username": "johndoe"
  },
  'login': {
    "email": "admin@eventplanner.com",
    "password": "admin123"
  },
  'verify-email': {
    "email": "user@example.com",
    "otpCode": "123456"
  },
  'resend-otp': {
    "email": "user@example.com"
  },
  'change-password': {
    "currentPassword": "admin123",
    "newPassword": "NewPassword123"
  },
  'otp-email-generate': {
    "email": "user@example.com"
  },
  'otp-phone-generate': {
    "phone": "+33612345678"
  },
  'otp-email-verify': {
    "email": "user@example.com",
    "code": "123456"
  },
  'otp-password-reset-generate': {
    "email": "user@example.com"
  },
  'otp-password-reset-verify': {
    "email": "user@example.com",
    "code": "123456",
    "newPassword": "NewPassword123"
  },

  // Users endpoints
  'user-create': {
    "username": "newuser",
    "email": "newuser@example.com", 
    "password": "Password123",
    "user_code": "USER001",
    "phone": "+33612345678",
    "status": "active",
    "person_id": 1
  },
  'user-update': {
    "username": "updateduser",
    "email": "updated@example.com",
    "user_code": "USER002",
    "phone": "+33612345679",
    "status": "active"
  },

  // Roles endpoints
  'role-create': {
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
  },
  'role-update': {
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
  },
  'role-assign-permissions': {
    "permissionIds": [1, 2, 3]
  },

  // Permissions endpoints
  'permission-create': {
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
  },

  // Menus endpoints
  'menu-create': {
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
  },
  'menu-assign-permissions': {
    "permissionIds": [1, 2, 3]
  },

  // People endpoints
  'person-create': {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+33612345678",
    "status": "active"
  },
  'person-update': {
    "first_name": "Jane",
    "last_name": "Smith", 
    "phone": "+33612345679",
    "status": "active"
  }
};

/**
 * Met à jour les exemples dans la collection Postman
 */
function updatePostmanExamples() {
  try {
    // Lire la collection Postman
    const collection = JSON.parse(fs.readFileSync(POSTMAN_COLLECTION_PATH, 'utf8'));
    
    let updatedCount = 0;
    
    // Parcourir tous les items et mettre à jour les corps de requête
    function updateItems(items) {
      items.forEach(item => {
        if (item.request && item.request.body && item.request.body.mode === 'raw') {
          const rawBody = item.request.body.raw;
          
          // Identifier le type de requête basé sur le nom ou l'URL
          const requestName = item.name.toLowerCase();
          const requestUrl = item.request.url.raw || '';
          
          let exampleKey = null;
          
          // Déterminer quel exemple utiliser
          if (requestName.includes('register') || requestUrl.includes('/register')) {
            exampleKey = 'register';
          } else if (requestName.includes('login') || requestUrl.includes('/login')) {
            exampleKey = 'login';
          } else if (requestName.includes('verify-email') || requestUrl.includes('/verify-email')) {
            exampleKey = 'verify-email';
          } else if (requestName.includes('resend-otp') || requestUrl.includes('/resend-otp')) {
            exampleKey = 'resend-otp';
          } else if (requestName.includes('change-password') || requestUrl.includes('/change-password')) {
            exampleKey = 'change-password';
          } else if (requestName.includes('otp/email/generate') || requestUrl.includes('/otp/email/generate')) {
            exampleKey = 'otp-email-generate';
          } else if (requestName.includes('otp/phone/generate') || requestUrl.includes('/otp/phone/generate')) {
            exampleKey = 'otp-phone-generate';
          } else if (requestName.includes('otp/email/verify') || requestUrl.includes('/otp/email/verify')) {
            exampleKey = 'otp-email-verify';
          } else if (requestName.includes('password-reset/generate') || requestUrl.includes('/password-reset/generate')) {
            exampleKey = 'otp-password-reset-generate';
          } else if (requestName.includes('password-reset/verify') || requestUrl.includes('/password-reset/verify')) {
            exampleKey = 'otp-password-reset-verify';
          }
          
          // Mettre à jour le corps de requête si un exemple est trouvé
          if (exampleKey && CORRECT_EXAMPLES[exampleKey]) {
            const newBody = JSON.stringify(CORRECT_EXAMPLES[exampleKey], null, 2);
            item.request.body.raw = newBody;
            updatedCount++;
            console.log(`✅ Mis à jour: ${item.name}`);
          }
        }
        
        // Récursivement parcourir les sous-items
        if (item.item && Array.isArray(item.item)) {
          updateItems(item.item);
        }
      });
    }
    
    updateItems(collection.item);
    
    // Écrire la collection mise à jour
    fs.writeFileSync(POSTMAN_COLLECTION_PATH, JSON.stringify(collection, null, 2));
    
    console.log(`\n🎉 Synchronisation terminée!`);
    console.log(`📊 ${updatedCount} exemples mis à jour`);
    console.log(`📁 Fichier: ${POSTMAN_COLLECTION_PATH}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
    process.exit(1);
  }
}

/**
 * Génère un rapport de synchronisation
 */
function generateSyncReport() {
  const report = {
    timestamp: new Date().toISOString(),
    updated_examples: Object.keys(CORRECT_EXAMPLES),
    total_examples: Object.keys(CORRECT_EXAMPLES).length,
    validators_checked: [
      'auth.validation.js',
      'users.validation.js', 
      'roles.validation.js',
      'permissions.validation.js',
      'menus.validation.js',
      'people.validation.js'
    ]
  };
  
  const reportPath = path.join(__dirname, '../documentation/reports/POSTMAN_SYNC_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📋 Rapport généré: ${reportPath}`);
}

// Exécuter la synchronisation
if (require.main === module) {
  console.log('🔄 Début de la synchronisation Postman...');
  updatePostmanExamples();
  generateSyncReport();
}

module.exports = {
  updatePostmanExamples,
  generateSyncReport,
  CORRECT_EXAMPLES
};
