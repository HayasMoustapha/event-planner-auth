const request = require('supertest');
const app = require('../../src/app');
const connection = require('../../src/config/database');

describe('🔐 E2E Tests - OTP Flow', () => {
  let testUser = null;
  let testPerson = null;
  let emailOtpCode = null;
  let phoneOtpCode = null;

  beforeAll(async () => {
    await cleanupOtpTestData();
  });

  afterAll(async () => {
    await cleanupOtpTestData();
  });

  describe('📧 Email OTP Flow', () => {
    test('Génération OTP email', async () => {
      // Créer un utilisateur de test
      const userData = {
        email: 'otpuser@test.com',
        username: 'otpuser123',
        password: 'TestPassword123!',
        first_name: 'OTP',
        last_name: 'User',
        phone: '+33612345678'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      testUser = registerResponse.body.data.user;

      // Générer OTP email
      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({
          email: userData.email,
          purpose: 'email_verification'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'OTP generated successfully');

      // Vérifier en base
      const personResult = await connection.query(
        'SELECT * FROM people WHERE email = $1',
        [userData.email]
      );
      testPerson = personResult.rows[0];

      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
        [testPerson.id, 'email_verification']
      );
      
      expect(otpResult.rows).toHaveLength(1);
      emailOtpCode = otpResult.rows[0].otp_code;
      expect(emailOtpCode).toMatch(/^\d{6}$/);
    });

    test('Vérification OTP email', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send({
          email: testUser.email,
          otp_code: emailOtpCode
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'OTP verified successfully');

      // Vérifier que l'OTP est marqué comme utilisé
      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 AND otp_code = $2',
        [testPerson.id, emailOtpCode]
      );
      
      expect(otpResult.rows[0].used).toBe(true);
      expect(otpResult.rows[0].used_at).toBeDefined();
    });

    test('Tentative de réutilisation du même OTP', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send({
          email: testUser.email,
          otp_code: emailOtpCode
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid or expired OTP');
    });
  });

  describe('📱 Phone OTP Flow', () => {
    test('Génération OTP téléphone', async () => {
      const response = await request(app)
        .post('/api/auth/otp/phone/generate')
        .send({
          phone: testPerson.phone,
          purpose: 'phone_verification'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'OTP generated successfully');

      // Vérifier en base
      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
        [testPerson.id, 'phone_verification']
      );
      
      expect(otpResult.rows).toHaveLength(1);
      phoneOtpCode = otpResult.rows[0].otp_code;
      expect(phoneOtpCode).toMatch(/^\d{6}$/);
    });

    test('Vérification OTP téléphone', async () => {
      const response = await request(app)
        .post('/api/auth/otp/phone/verify')
        .send({
          phone: testPerson.phone,
          otp_code: phoneOtpCode
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'OTP verified successfully');

      // Vérifier que l'OTP est marqué comme utilisé
      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 AND otp_code = $2',
        [testPerson.id, phoneOtpCode]
      );
      
      expect(otpResult.rows[0].used).toBe(true);
      expect(otpResult.rows[0].used_at).toBeDefined();
    });
  });

  describe('🔄 Password Reset OTP Flow', () => {
    let resetOtpCode = null;

    test('Génération OTP reset mot de passe', async () => {
      const response = await request(app)
        .post('/api/auth/otp/password-reset/generate')
        .send({
          email: testUser.email,
          purpose: 'password_reset'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'OTP generated successfully');

      // Vérifier en base
      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
        [testPerson.id, 'password_reset']
      );
      
      expect(otpResult.rows).toHaveLength(1);
      resetOtpCode = otpResult.rows[0].otp_code;
      expect(resetOtpCode).toMatch(/^\d{6}$/);
    });

    test('Reset mot de passe avec OTP', async () => {
      const newPassword = 'NewPassword123!';
      
      const response = await request(app)
        .post('/api/auth/otp/password-reset/verify')
        .send({
          email: testUser.email,
          otp_code: resetOtpCode,
          new_password: newPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Password reset successfully');

      // Vérifier que le mot de passe a été changé
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
    });
  });

  describe('⏰ OTP Expiration', () => {
    test('OTP expiré ne devrait pas fonctionner', async () => {
      // Simuler un OTP expiré en modifiant directement la base
      await connection.query(
        'UPDATE otps SET expires_at = NOW() - INTERVAL \'1 hour\' WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
        [testPerson.id, 'email_verification']
      );

      // Générer un nouvel OTP
      const generateResponse = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({
          email: testUser.email,
          purpose: 'email_verification'
        })
        .expect(200);

      // Récupérer le nouvel OTP
      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
        [testPerson.id, 'email_verification']
      );
      
      const newOtpCode = otpResult.rows[0].otp_code;

      // Le faire expirer
      await connection.query(
        'UPDATE otps SET expires_at = NOW() - INTERVAL \'1 hour\' WHERE otp_code = $1',
        [newOtpCode]
      );

      // Tenter de l'utiliser
      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send({
          email: testUser.email,
          otp_code: newOtpCode
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid or expired OTP');
    });
  });

  describe('🚫 OTP Security Tests', () => {
    test('Génération OTP pour email inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({
          email: 'nonexistent@test.com',
          purpose: 'email_verification'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    test('Génération OTP pour téléphone inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/otp/phone/generate')
        .send({
          phone: '+999999999999',
          purpose: 'phone_verification'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    test('Trop de tentatives OTP', async () => {
      // Faire plusieurs tentatives avec des codes incorrects
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/otp/email/verify')
          .send({
            email: testUser.email,
            otp_code: '999999'
          });
      }

      // La 6ème tentative devrait être bloquée
      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send({
          email: testUser.email,
          otp_code: '999999'
        })
        .expect(429);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message.toLowerCase).toContain('too many');
    });
  });
});

async function cleanupOtpTestData() {
  try {
    await connection.query('DELETE FROM otps WHERE person_id IN (SELECT id FROM people WHERE email LIKE \'%otpuser@test.com\')');
    await connection.query('DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%otpuser@test.com\')');
    await connection.query('DELETE FROM users WHERE email LIKE \'%otpuser@test.com\'');
    await connection.query('DELETE FROM people WHERE email LIKE \'%otpuser@test.com\'');
    console.log('🧹 OTP test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up OTP test data:', error);
  }
}
