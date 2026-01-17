const authService = require('./src/modules/auth/auth.service');
const sessionService = require('./src/modules/sessions/sessions.service');

async function test() {
  try {
    console.log('🚀 Test des services...');
    
    // Test de génération de token avec un utilisateur existant (id=2)
    const testUser = { id: 2, email: 'admin@eventplanner.com', username: 'admin', role: 'admin', status: 'active' };
    const token = authService.generateToken(testUser);
    console.log('✅ Token généré:', token ? 'Oui' : 'Non');
    console.log('✅ Token length:', token ? token.length : 0);
    
    if (token) {
      console.log('🚀 Test création session...');
      const sessionResult = await sessionService.createSession({
        accessToken: token,
        userId: testUser.id,
        ipAddress: null,
        userAgent: null,
        expiresIn: 24 * 60 * 60
      });
      console.log('✅ Session créée:', sessionResult.success);
      
      if (sessionResult.success) {
        console.log('🚀 Test logout...');
        const logoutResult = await sessionService.logoutSession(token);
        console.log('✅ Logout réussi:', logoutResult.success);
      }
    }
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
    console.log('❌ Stack:', error.stack);
  }
}

test();
