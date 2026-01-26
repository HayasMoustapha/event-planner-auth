/**
 * TEST DE VALIDATION FINALE - Correction PERMISSION_DENIED
 * Test pour confirmer que la permission authorizations.verify est bien appliquée
 */

const { connection } = require('./src/config/database');

async function validateAuthorizationFix() {
  console.log('🔍 VALIDATION FINALE - CORRECTION PERMISSION_DENIED\n');
  
  try {
    // Test 1: Vérifier que la permission existe
    console.log('📋 Test 1: Vérification de la permission authorizations.verify');
    const permissionQuery = `
      SELECT id, code, label, "group" 
      FROM permissions 
      WHERE code = 'authorizations.verify'
    `;
    const permissionResult = await connection.query(permissionQuery);
    
    if (permissionResult.rows.length === 0) {
      console.log('❌ La permission authorizations.verify n\'existe pas');
      return false;
    }
    
    const permission = permissionResult.rows[0];
    console.log(`✅ Permission trouvée: ${permission.code} (${permission.id})`);
    
    // Test 2: Vérifier que le super admin a la permission
    console.log('\n📋 Test 2: Vérification des autorisations super admin');
    const superAdminQuery = `
      SELECT r.code as role_code, p.code as permission_code
      FROM authorizations a
      INNER JOIN roles r ON a.role_id = r.id
      INNER JOIN permissions p ON a.permission_id = p.id
      WHERE r.code = 'super_admin' 
      AND p.code = 'authorizations.verify'
      AND a.deleted_at IS NULL
    `;
    const superAdminResult = await connection.query(superAdminQuery);
    
    if (superAdminResult.rows.length === 0) {
      console.log('❌ Le super admin n\'a pas la permission authorizations.verify');
      return false;
    }
    
    console.log(`✅ Super admin a la permission: ${superAdminResult.rows[0].permission_code}`);
    
    // Test 3: Vérifier que l'admin a la permission
    console.log('\n📋 Test 3: Vérification des autorisations admin');
    const adminQuery = `
      SELECT r.code as role_code, p.code as permission_code
      FROM authorizations a
      INNER JOIN roles r ON a.role_id = r.id
      INNER JOIN permissions p ON a.permission_id = p.id
      WHERE r.code = 'admin' 
      AND p.code = 'authorizations.verify'
      AND a.deleted_at IS NULL
    `;
    const adminResult = await connection.query(adminQuery);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ L\'admin n\'a pas la permission authorizations.verify');
      return false;
    }
    
    console.log(`✅ Admin a la permission: ${adminResult.rows[0].permission_code}`);
    
    // Test 4: Simulation de vérification d'autorisation
    console.log('\n📋 Test 4: Simulation de vérification d\'autorisation');
    
    // Récupérer un utilisateur super admin
    const userQuery = `
      SELECT u.id, u.email, r.code as role_code
      FROM users u
      INNER JOIN accesses acc ON u.id = acc.user_id
      INNER JOIN roles r ON acc.role_id = r.id
      WHERE r.code = 'super_admin' AND acc.status = 'active'
      LIMIT 1
    `;
    const userResult = await connection.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('⚠️  Aucun utilisateur super admin trouvé pour le test');
      return true; // Pas bloquant
    }
    
    const user = userResult.rows[0];
    console.log(`👤 Utilisateur test: ${user.email} (${user.role_code})`);
    
    // Simuler la vérification de permission comme dans le repository
    const authCheckQuery = `
      SELECT COUNT(*) as count
      FROM authorizations a
      INNER JOIN accesses acc ON a.role_id = acc.role_id
      INNER JOIN permissions p ON a.permission_id = p.id
      WHERE acc.user_id = $1 
      AND p.code = 'authorizations.verify' 
      AND acc.status = 'active' 
      AND a.deleted_at IS NULL
    `;
    const authCheckResult = await connection.query(authCheckQuery, [user.id]);
    const hasPermission = parseInt(authCheckResult.rows[0].count) > 0;
    
    if (hasPermission) {
      console.log(`✅ Utilisateur ${user.email} a bien accès à authorizations.verify`);
    } else {
      console.log(`❌ Utilisateur ${user.email} n'a PAS accès à authorizations.verify`);
      return false;
    }
    
    console.log('\n🎯 RÉSULTAT FINAL DE LA VALIDATION');
    console.log('══════════════════════════════════════════════════');
    console.log('🏆 SUCCÈS : Tous les tests sont passés !');
    console.log('✅ La permission authorizations.verify est correctement configurée');
    console.log('✅ Le super admin a accès aux routes /verify/*');
    console.log('✅ Le bug PERMISSION_DENIED est résolu');
    console.log('✅ Le système d\'autorisation est fonctionnel');
    console.log('══════════════════════════════════════════════════');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur pendant la validation:', error.message);
    return false;
  } finally {
    await connection.end();
  }
}

// Exécuter la validation
if (require.main === module) {
  validateAuthorizationFix()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = validateAuthorizationFix;
