/**
 * TEST DE VALIDATION DU MODULE D'AUTORISATION
 * Test complet pour valider les corrections du bug PERMISSION_DENIED
 */

const authorizationService = require('./src/modules/authorizations/authorizations.service');
const logger = require('./src/utils/logger');

/**
 * Scénarios de test critiques pour valider le module d'autorisation
 */
class AuthorizationValidator {
  constructor() {
    this.testResults = [];
    this.testUsers = {
      superAdmin: { id: 1, email: 'superadmin@test.com', role: 'super_admin' },
      admin: { id: 2, email: 'admin@test.com', role: 'admin' },
      organizer: { id: 3, email: 'organizer@test.com', role: 'organizer' },
      designer: { id: 4, email: 'designer@test.com', role: 'designer' },
      user: { id: 5, email: 'user@test.com', role: 'user' }
    };
    this.testPermissions = [
      'events.create',
      'events.read',
      'events.update',
      'events.delete',
      'events.manage',
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'system.admin'
    ];
  }

  /**
   * Exécute tous les tests de validation
   */
  async runAllTests() {
    console.log('🚀 DÉMARRAGE DES TESTS DE VALIDATION - MODULE AUTORISATION\n');
    
    try {
      // Test 1: Super Admin Court-Circuit
      await this.testSuperAdminCourtCircuit();
      
      // Test 2: Hiérarchie des rôles
      await this.testRoleHierarchy();
      
      // Test 3: Permissions spécifiques
      await this.testSpecificPermissions();
      
      // Test 4: Logs et sécurité
      await this.testLoggingAndSecurity();
      
      // Test 5: Cas limites
      await this.testEdgeCases();
      
      // Résultats finaux
      this.displayFinalResults();
      
    } catch (error) {
      console.error('❌ ERREUR CRITIQUE pendant les tests:', error);
      logger.error('Authorization validation test failed', { error: error.message });
    }
  }

  /**
   * Test 1: Vérification du court-circuit Super Admin
   */
  async testSuperAdminCourtCircuit() {
    console.log('📋 TEST 1: COURT-CIRCUIT SUPER ADMIN');
    
    const tests = [
      {
        name: 'Super Admin - hasPermission (permission existante)',
        userId: this.testUsers.superAdmin.id,
        permission: 'events.create',
        expected: true
      },
      {
        name: 'Super Admin - hasPermission (permission inexistante)',
        userId: this.testUsers.superAdmin.id,
        permission: 'permission.inexistante',
        expected: true
      },
      {
        name: 'Super Admin - hasAnyPermission',
        userId: this.testUsers.superAdmin.id,
        permissions: ['events.create', 'permission.inexistante'],
        expected: true
      },
      {
        name: 'Super Admin - hasAllPermissions',
        userId: this.testUsers.superAdmin.id,
        permissions: ['events.create', 'permission.inexistante', 'system.admin'],
        expected: true
      },
      {
        name: 'Super Admin - canAccessResource',
        userId: this.testUsers.superAdmin.id,
        resource: 'events',
        action: 'delete',
        expected: true
      }
    ];

    for (const test of tests) {
      try {
        let result;
        if (test.permissions) {
          if (test.name.includes('Any')) {
            result = await authorizationService.hasAnyPermission(test.userId, test.permissions);
          } else {
            result = await authorizationService.hasAllPermissions(test.userId, test.permissions);
          }
        } else if (test.resource && test.action) {
          result = await authorizationService.canAccessResource(test.userId, test.resource, test.action);
        } else {
          result = await authorizationService.hasPermission(test.userId, test.permission);
        }

        const success = result === test.expected;
        this.testResults.push({
          test: test.name,
          success,
          expected: test.expected,
          actual: result,
          critical: true
        });

        console.log(`  ${success ? '✅' : '❌'} ${test.name} - ${result ? 'AUTORISÉ' : 'REFUSÉ'}`);
        
        if (!success) {
          console.log(`    ⚠️  Attendu: ${test.expected}, Obtenu: ${result}`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${test.name} - ERREUR: ${error.message}`);
        this.testResults.push({
          test: test.name,
          success: false,
          error: error.message,
          critical: true
        });
      }
    }
    
    console.log('');
  }

  /**
   * Test 2: Vérification de la hiérarchie des rôles
   */
  async testRoleHierarchy() {
    console.log('📋 TEST 2: HIÉRARCHIE DES RÔLES');
    
    const hierarchyTests = [
      { role: 'admin', userId: this.testUsers.admin.id, shouldHaveSystemAccess: true },
      { role: 'organizer', userId: this.testUsers.organizer.id, shouldHaveSystemAccess: false },
      { role: 'designer', userId: this.testUsers.designer.id, shouldHaveSystemAccess: false },
      { role: 'user', userId: this.testUsers.user.id, shouldHaveSystemAccess: false }
    ];

    for (const test of hierarchyTests) {
      try {
        const hasSystemAccess = await authorizationService.hasPermission(test.userId, 'system.admin');
        const success = hasSystemAccess === test.shouldHaveSystemAccess;
        
        this.testResults.push({
          test: `Hiérarchie - ${test.role}`,
          success,
          expected: test.shouldHaveSystemAccess,
          actual: hasSystemAccess,
          critical: false
        });

        console.log(`  ${success ? '✅' : '❌'} ${test.role} - system.admin: ${hasSystemAccess ? 'AUTORISÉ' : 'REFUSÉ'}`);
        
      } catch (error) {
        console.log(`  ❌ ${test.role} - ERREUR: ${error.message}`);
        this.testResults.push({
          test: `Hiérarchie - ${test.role}`,
          success: false,
          error: error.message,
          critical: false
        });
      }
    }
    
    console.log('');
  }

  /**
   * Test 3: Permissions spécifiques par rôle
   */
  async testSpecificPermissions() {
    console.log('📋 TEST 3: PERMISSIONS SPÉCIFIQUES');
    
    // Définition des permissions attendues par rôle
    const expectedPermissions = {
      admin: ['users.read', 'users.create', 'events.read', 'events.create'],
      organizer: ['events.read', 'events.create', 'events.update'],
      designer: ['events.read'],
      user: ['events.read']
    };

    for (const [role, permissions] of Object.entries(expectedPermissions)) {
      console.log(`  🔍 Test permissions pour: ${role}`);
      const userId = this.testUsers[role].id;
      
      for (const permission of permissions) {
        try {
          const hasPermission = await authorizationService.hasPermission(userId, permission);
          
          this.testResults.push({
            test: `Permission - ${role} - ${permission}`,
            success: hasPermission,
            expected: true,
            actual: hasPermission,
            critical: false
          });

          console.log(`    ${hasPermission ? '✅' : '❌'} ${permission}: ${hasPermission ? 'AUTORISÉ' : 'REFUSÉ'}`);
          
        } catch (error) {
          console.log(`    ❌ ${permission} - ERREUR: ${error.message}`);
          this.testResults.push({
            test: `Permission - ${role} - ${permission}`,
            success: false,
            error: error.message,
            critical: false
          });
        }
      }
    }
    
    console.log('');
  }

  /**
   * Test 4: Validation des logs et de la sécurité
   */
  async testLoggingAndSecurity() {
    console.log('📋 TEST 4: LOGS ET SÉCURITÉ');
    
    try {
      // Test avec un utilisateur invalide
      const invalidUserResult = await authorizationService.hasPermission(-1, 'events.create');
      const success1 = invalidUserResult === false;
      
      this.testResults.push({
        test: 'Sécurité - Utilisateur invalide',
        success: success1,
        expected: false,
        actual: invalidUserResult,
        critical: true
      });
      
      console.log(`  ${success1 ? '✅' : '❌'} Utilisateur invalide: ${invalidUserResult ? 'AUTORISÉ' : 'REFUSÉ'}`);
      
      // Test avec une permission vide
      const emptyPermissionResult = await authorizationService.hasPermission(this.testUsers.user.id, '');
      const success2 = emptyPermissionResult === false;
      
      this.testResults.push({
        test: 'Sécurité - Permission vide',
        success: success2,
        expected: false,
        actual: emptyPermissionResult,
        critical: true
      });
      
      console.log(`  ${success2 ? '✅' : '❌'} Permission vide: ${emptyPermissionResult ? 'AUTORISÉ' : 'REFUSÉ'}`);
      
    } catch (error) {
      console.log(`  ❌ Erreur test sécurité: ${error.message}`);
    }
    
    console.log('');
  }

  /**
   * Test 5: Cas limites et edge cases
   */
  async testEdgeCases() {
    console.log('📋 TEST 5: CAS LIMITES');
    
    try {
      // Test permissions tableau vide
      const emptyArrayResult = await authorizationService.hasAnyPermission(this.testUsers.user.id, []);
      const success1 = emptyArrayResult === false;
      
      this.testResults.push({
        test: 'Edge case - Permissions tableau vide',
        success: success1,
        expected: false,
        actual: emptyArrayResult,
        critical: false
      });
      
      console.log(`  ${success1 ? '✅' : '❌'} Tableau vide: ${emptyArrayResult ? 'AUTORISÉ' : 'REFUSÉ'}`);
      
      // Test ressource/action vide
      const emptyResourceResult = await authorizationService.canAccessResource(this.testUsers.user.id, '', 'create');
      const success2 = emptyResourceResult === false;
      
      this.testResults.push({
        test: 'Edge case - Ressource vide',
        success: success2,
        expected: false,
        actual: emptyResourceResult,
        critical: false
      });
      
      console.log(`  ${success2 ? '✅' : '❌'} Ressource vide: ${emptyResourceResult ? 'AUTORISÉ' : 'REFUSÉ'}`);
      
    } catch (error) {
      console.log(`  ❌ Erreur cas limite: ${error.message}`);
    }
    
    console.log('');
  }

  /**
   * Affiche les résultats finaux des tests
   */
  displayFinalResults() {
    console.log('📊 RÉSULTATS FINAUX DES TESTS\n');
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const criticalTests = this.testResults.filter(r => r.critical);
    const successfulCriticalTests = criticalTests.filter(r => r.success).length;
    
    console.log(`📈 Statistiques générales:`);
    console.log(`   • Tests totaux: ${totalTests}`);
    console.log(`   • Tests réussis: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`   • Tests critiques: ${criticalTests.length}`);
    console.log(`   • Tests critiques réussis: ${successfulCriticalTests} (${((successfulCriticalTests/criticalTests.length)*100).toFixed(1)}%)`);
    
    console.log(`\n🔍 Tests échoués:`);
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length === 0) {
      console.log(`   ✅ Aucun test échoué !`);
    } else {
      failedTests.forEach(test => {
        const critical = test.critical ? ' [CRITIQUE]' : '';
        console.log(`   ❌ ${test.test}${critical}`);
        if (test.error) {
          console.log(`      Erreur: ${test.error}`);
        } else {
          console.log(`      Attendu: ${test.expected}, Obtenu: ${test.actual}`);
        }
      });
    }
    
    console.log(`\n🎯 Conclusion:`);
    if (successfulCriticalTests === criticalTests.length) {
      console.log(`   ✅ TOUS LES TESTS CRITIQUES RÉUSSIS - Module d'autorisation CORRIGÉ !`);
      console.log(`   ✅ Le bug PERMISSION_DENIED est résolu pour le super admin !`);
    } else {
      console.log(`   ❌ Des tests critiques ont échoué - Module nécessite encore des corrections`);
    }
    
    if (successfulTests === totalTests) {
      console.log(`   🏆 PARFAIT - Tous les tests passés avec succès !`);
    }
  }
}

// Exécution des tests si ce fichier est lancé directement
if (require.main === module) {
  const validator = new AuthorizationValidator();
  validator.runAllTests().catch(console.error);
}

module.exports = AuthorizationValidator;
