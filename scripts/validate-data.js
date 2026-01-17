#!/usr/bin/env node

/**
 * Script de validation des données
 * Vérifie la cohérence et l'intégrité des données
 */

const { connection } = require('../src/config/database');

async function validateData() {
  console.log('🔍 Début de la validation des données...');
  
  try {
    // Test de connexion à la base de données
    await connection.query('SELECT 1');
    console.log('✅ Connexion à la base de données réussie');

    // Validation des comptes utilisateurs
    console.log('\n📊 Validation des comptes utilisateurs:');
    
    const userStats = await connection.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM users 
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('Statuts des utilisateurs:');
    userStats.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

    // Validation des personnes sans utilisateurs
    const peopleWithoutUsers = await connection.query(`
      SELECT COUNT(*) as count
      FROM people 
      WHERE id NOT IN (SELECT person_id FROM users)
    `);
    
    if (parseInt(peopleWithoutUsers.rows[0].count) > 0) {
      console.log(`⚠️  ${peopleWithoutUsers.rows[0].count} personnes sans compte utilisateur`);
    }

    // Validation des utilisateurs sans personne
    const usersWithoutPeople = await connection.query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE person_id IS NULL
    `);
    
    if (parseInt(usersWithoutPeople.rows[0].count) > 0) {
      console.log(`⚠️  ${usersWithoutPeople.rows[0].count} utilisateurs sans personne associée`);
    }

    // Validation des OTPs
    console.log('\n🔐 Validation des OTPs:');
    
    const otpStats = await connection.query(`
      SELECT 
        purpose,
        COUNT(*) as total,
        COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used,
        COUNT(CASE WHEN is_used = FALSE AND expires_at > NOW() THEN 1 END) as active,
        COUNT(CASE WHEN is_used = FALSE AND expires_at <= NOW() THEN 1 END) as expired
      FROM otps 
      GROUP BY purpose
      ORDER BY purpose
    `);

    console.log('Statistiques des OTPs:');
    otpStats.rows.forEach(row => {
      console.log(`  ${row.purpose}:`);
      console.log(`    Total: ${row.total}`);
      console.log(`    Utilisés: ${row.used}`);
      console.log(`    Actifs: ${row.active}`);
      console.log(`    Expirés: ${row.expired}`);
    });

    // Validation des rôles et permissions
    console.log('\n👥 Validation des rôles et permissions:');
    
    const roleStats = await connection.query(`
      SELECT 
        COUNT(*) as total_roles
      FROM roles
    `);
    
    const permissionStats = await connection.query(`
      SELECT 
        COUNT(*) as total_permissions
      FROM permissions
    `);
    
    const authorizationStats = await connection.query(`
      SELECT 
        COUNT(*) as total_authorizations
      FROM authorizations
    `);

    console.log(`Rôles: ${roleStats.rows[0].total_roles}`);
    console.log(`Permissions: ${permissionStats.rows[0].total_permissions}`);
    console.log(`Authorizations: ${authorizationStats.rows[0].total_authorizations}`);

    // Validation des autorisations orphelines
    const orphanAuthorizations = await connection.query(`
      SELECT COUNT(*) as count
      FROM authorizations a
      LEFT JOIN roles r ON a.role_id = r.id
      LEFT JOIN permissions p ON a.permission_id = p.id
      WHERE r.id IS NULL OR p.id IS NULL
    `);

    if (parseInt(orphanAuthorizations.rows[0].count) > 0) {
      console.log(`⚠️  ${orphanAuthorizations.rows[0].count} autorisations orphelines`);
    }

    // Validation des emails dupliqués
    console.log('\n📧 Validation des emails dupliqués:');
    
    const duplicateEmails = await connection.query(`
      SELECT 
        email,
        COUNT(*) as count
      FROM people 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);

    if (duplicateEmails.rows.length > 0) {
      console.log('⚠️  Emails dupliqués trouvés:');
      duplicateEmails.rows.forEach(row => {
        console.log(`  ${row.email}: ${row.count} occurrences`);
      });
    }

    // Validation des usernames dupliqués
    const duplicateUsernames = await connection.query(`
      SELECT 
        username,
        COUNT(*) as count
      FROM users 
      GROUP BY username 
      HAVING COUNT(*) > 1
    `);

    if (duplicateUsernames.rows.length > 0) {
      console.log('⚠️  Usernames dupliqués trouvés:');
      duplicateUsernames.rows.forEach(row => {
        console.log(`  ${row.username}: ${row.count} occurrences`);
      });
    }

    console.log('\n✅ Validation des données terminée!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Exécuter la validation
if (require.main === module) {
  validateData();
}

module.exports = { validateData };
