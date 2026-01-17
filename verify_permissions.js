const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'event_planner_auth',
  password: 'postgres',
  port: 5432,
});

async function verifyPermissions() {
  try {
    console.log('🔍 VÉRIFICATION DES PERMISSIONS APRÈS MIGRATION');
    
    const allPermissions = await pool.query('SELECT code, "group" FROM permissions ORDER BY "group", code');
    console.log(`\n📊 TOTAL PERMISSIONS: ${allPermissions.rows.length}`);
    
    console.log('\n📋 PERMISSIONS PAR GROUPE:');
    const grouped = {};
    allPermissions.rows.forEach(perm => {
      const group = perm.group || 'no-group';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(perm.code);
    });
    
    Object.keys(grouped).sort().forEach(group => {
      console.log(`\n📋 ${group.toUpperCase()} (${grouped[group].length}):`);
      grouped[group].sort().forEach(code => {
        console.log(`  - ${code}`);
      });
    });

    console.log('\n🔍 VÉRIFICATION DU RÔLE SUPER_ADMIN...');
    
    const superAdminRole = await pool.query('SELECT id, code, level FROM roles WHERE code = \'super_admin\'');
    
    if (superAdminRole.rows.length > 0) {
      const roleId = superAdminRole.rows[0].id;
      
      const superAdminPermissions = await pool.query(`
        SELECT p.code, p."group" 
        FROM permissions p 
        INNER JOIN authorizations a ON p.id = a.permission_id 
        WHERE a.role_id = $1
        ORDER BY p."group", p.code
      `, [roleId]);
      
      console.log(`\n✅ Rôle super_admin trouvé (ID: ${roleId})`);
      console.log(`📊 PERMISSIONS DU SUPER_ADMIN: ${superAdminPermissions.rows.length}`);
      
      if (superAdminPermissions.rows.length === allPermissions.rows.length) {
        console.log('🎉 SUPER_ADMIN A ACCÈS TOTAL À TOUTES LES PERMISSIONS!');
      } else {
        console.log(`⚠️  SUPER_ADMIN a ${superAdminPermissions.rows.length}/${allPermissions.rows.length} permissions`);
      }
      
      console.log('\n📋 PERMISSIONS DU SUPER_ADMIN:');
      superAdminPermissions.rows.forEach(perm => {
        console.log(`  - ${perm.code} (group: ${perm.group || 'null'})`);
      });
    } else {
      console.log('❌ Rôle super_admin NON TROUVÉ!');
    }

  } catch (error) {
    console.log('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

verifyPermissions();
