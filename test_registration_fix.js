const { connection } = require('./src/config/database');
const bcrypt = require('bcrypt');

async function testRegistration() {
  try {
    console.log('🔍 TEST - Début du test d\'inscription');
    
    // ÉTAPE 1: Créer la personne
    const personData = {
      first_name: 'Test',
      last_name: 'User',
      email: 'testdirect@example.com',
      phone: null,
      status: 'active'
    };

    const personQuery = `
      INSERT INTO people (first_name, last_name, email, phone, status, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, first_name, last_name, email
    `;
    
    const personResult = await connection.query(personQuery, [
      personData.first_name,
      personData.last_name,
      personData.email,
      personData.phone,
      personData.status,
      null
    ]);
    
    const person = personResult.rows[0];
    console.log('🔍 TEST - Personne créée:', person);
    console.log('🔍 TEST - Person ID:', person.id);
    console.log('🔍 TEST - Type Person ID:', typeof person.id);

    // ÉTAPE 2: Créer l'utilisateur
    const userData = {
      username: 'testuser',
      email: 'testdirect@example.com',
      password: 'TestPassword123!',
      userCode: 'TEST123',
      phone: null,
      status: 'inactive',
      person_id: person.id
    };

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    console.log('🔍 TEST - User person_id avant requête:', userData.person_id);
    console.log('🔍 TEST - Type user person_id:', typeof userData.person_id);

    const userQuery = `
      INSERT INTO users (person_id, username, email, password, user_code, phone, status, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, person_id, username, email, status
    `;
    
    const userResult = await connection.query(userQuery, [
      userData.person_id,
      userData.username,
      userData.email,
      hashedPassword,
      userData.userCode,
      userData.phone,
      userData.status,
      null
    ]);
    
    const user = userResult.rows[0];
    console.log('🔍 TEST - Utilisateur créé:', user);
    console.log('🔍 TEST - User ID:', user.id);
    console.log('🔍 TEST - User person_id:', user.person_id);

    console.log('✅ TEST - Inscription réussie !');
    
  } catch (error) {
    console.error('❌ TEST - Erreur:', error.message);
    console.error('❌ TEST - Stack:', error.stack);
  } finally {
    await connection.end();
  }
}

testRegistration();
