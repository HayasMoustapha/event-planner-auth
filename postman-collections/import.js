#!/usr/bin/env node

/**
 * ========================================
 * 📮 POSTMAN COLLECTIONS IMPORTER
 * ========================================
 * Script pour importer facilement toutes les collections Postman
 * de l'API Event Planner Auth
 */

const fs = require('fs');
const path = require('path');

class PostmanImporter {
  constructor() {
    this.collectionsDir = path.join(__dirname);
    this.collections = [
      {
        name: 'Authentication Module',
        file: 'Event-Planner-Auth-API-Complete.postman_collection.json',
        description: 'Module complet d\'authentification avec OTP'
      },
      {
        name: 'Users Module',
        file: 'Users-Module.postman_collection.json',
        description: 'CRUD complet pour les utilisateurs'
      },
      {
        name: 'Roles Module',
        file: 'Roles-Module.postman_collection.json',
        description: 'Gestion des rôles et permissions'
      },
      {
        name: 'Additional Modules',
        file: 'Additional-Modules.postman_collection.json',
        description: 'Permissions, Menus, People, Sessions, Authorizations'
      }
    ];
  }

  /**
   * Affiche l'en-tête du script
   */
  showHeader() {
    console.log('📮 POSTMAN COLLECTIONS IMPORTER');
    console.log('================================');
    console.log('🎯 Event Planner Auth API - Complete Testing Suite');
    console.log('');
  }

  /**
   * Vérifie que toutes les collections existent
   */
  validateCollections() {
    console.log('🔍 Vérification des collections...');
    
    let allExist = true;
    
    this.collections.forEach(collection => {
      const filePath = path.join(this.collectionsDir, collection.file);
      const exists = fs.existsSync(filePath);
      
      if (exists) {
        console.log(`✅ ${collection.name} - ${collection.description}`);
      } else {
        console.log(`❌ ${collection.name} - Fichier manquant: ${collection.file}`);
        allExist = false;
      }
    });
    
    console.log('');
    return allExist;
  }

  /**
   * Affiche les instructions d'importation
   */
  showImportInstructions() {
    console.log('📋 INSTRUCTIONS D\'IMPORTATION');
    console.log('================================');
    console.log('');
    console.log('1. 🚀 Démarrer Postman');
    console.log('2. 📂 Cliquer sur "Import" dans le coin supérieur gauche');
    console.log('3. 📁 Sélectionner "Files" ou "Folder"');
    console.log('4. 📂 Choisir le dossier "postman-collections"');
    console.log('5. ✅ Importer toutes les collections');
    console.log('');
    console.log('📁 Collections à importer :');
    
    this.collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
      console.log(`   📄 ${collection.file}`);
      console.log(`   💬 ${collection.description}`);
      console.log('');
    });
  }

  /**
   * Affiche la configuration requise
   */
  showConfiguration() {
    console.log('⚙️ CONFIGURATION REQUISE');
    console.log('================================');
    console.log('');
    console.log('🌐 URL de base :');
    console.log('   http://localhost:3001/api');
    console.log('');
    console.log('👤 Compte de test :');
    console.log('   Email: admin@eventplanner.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🔑 Variables globales :');
    console.log('   - baseUrl: URL de l\'API');
    console.log('   - authToken: Token d\'authentification');
    console.log('   - refreshToken: Token de rafraîchissement');
    console.log('   - userId: ID utilisateur pour tests');
    console.log('   - roleId: ID rôle pour tests');
    console.log('   - permissionId: ID permission pour tests');
    console.log('   - menuId: ID menu pour tests');
    console.log('');
  }

  /**
   * Affiche le flux de test recommandé
   */
  showTestFlow() {
    console.log('🧪 FLUX DE TEST RECOMMANDÉ');
    console.log('================================');
    console.log('');
    console.log('📋 ÉTAPE 1: Authentification');
    console.log('   1. "POST Login" avec admin@eventplanner.com / admin123');
    console.log('   2. Vérifier que les tokens sont sauvegardés');
    console.log('');
    console.log('👥 ÉTAPE 2: Tests Users');
    console.log('   1. "GET All Users" - Lister les utilisateurs');
    console.log('   2. "POST Create User" - Créer un utilisateur');
    console.log('   3. "GET User by ID" - Récupérer l\'utilisateur créé');
    console.log('   4. "PUT Update User" - Mettre à jour');
    console.log('   5. "DELETE User" - Supprimer');
    console.log('');
    console.log('🛡️ ÉTAPE 3: Tests RBAC');
    console.log('   1. Tester les routes avec permissions');
    console.log('   2. Vérifier les accès refusés');
    console.log('   3. Tester la hiérarchie des rôles');
    console.log('');
    console.log('📊 ÉTAPE 4: Modules Additionnels');
    console.log('   1. "GET All Permissions" - Voir les permissions');
    console.log('   2. "GET All Menus" - Voir les menus');
    console.log('   3. "GET All People" - Voir les personnes');
    console.log('   4. "GET All Sessions" - Voir les sessions');
    console.log('   5. "GET Authorization Summary" - Voir les autorisations');
    console.log('');
  }

  /**
   * Affiche les ressources utiles
   */
  showResources() {
    console.log('📚 RESSOURCES UTILES');
    console.log('================================');
    console.log('');
    console.log('📖 Documentation API :');
    console.log('   http://localhost:3001/api/docs');
    console.log('');
    console.log('❤️ Santé API :');
    console.log('   http://localhost:3001/api/health');
    console.log('');
    console.log('🌱 Seeds RBAC :');
    console.log('   Voir database/seeds/README.md');
    console.log('');
    console.log('📮 Postman Collections :');
    console.log('   Dossier courant: postman-collections/');
    console.log('   README complet: postman-collections/README.md');
    console.log('');
  }

  /**
   * Affiche les conseils de dépannage
   */
  showTroubleshooting() {
    console.log('🔧 DÉPANNAGE');
    console.log('================================');
    console.log('');
    console.log('❌ Erreur 401 (Non authentifié) :');
    console.log('   - Vérifier que le token est valide');
    console.log('   - Exécuter d\'abord "POST Login"');
    console.log('');
    console.log('❌ Erreur 403 (Permission refusée) :');
    console.log('   - Vérifier que l\'utilisateur a le rôle requis');
    console.log('   - Vérifier que le rôle a les permissions');
    console.log('');
    console.log('❌ Erreur EADDRINUSE :');
    console.log('   - Changer le port dans .env');
    console.log('   - Arrêter l\'autre serveur');
    console.log('');
    console.log('❌ Token non sauvegardé :');
    console.log('   - Vérifier les scripts de test Postman');
    console.log('   - Vérifier la réponse du login');
    console.log('');
  }

  /**
   * Fonction principale
   */
  run() {
    this.showHeader();
    
    if (!this.validateCollections()) {
      console.log('❌ Certaines collections sont manquantes. Vérifiez les fichiers.');
      process.exit(1);
    }

    this.showImportInstructions();
    this.showConfiguration();
    this.showTestFlow();
    this.showResources();
    this.showTroubleshooting();

    console.log('🎉 PRÊT À TESTER !');
    console.log('================================');
    console.log('Importez les collections dans Postman et commencez vos tests.');
    console.log('Toutes les routes de l\'API sont couvertes !');
    console.log('');
  }
}

// Exécution principale
if (require.main === module) {
  const importer = new PostmanImporter();
  importer.run();
}

module.exports = PostmanImporter;
