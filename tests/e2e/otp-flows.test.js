const request = require('supertest');
const app = require('../../src/app');
const { connection } = require('../../src/config/database');

// De-quarantined: aligned to the REAL API contract (probed):
// - strict body whitelist rejects unknown fields -> generate takes only {email}/{phone} (no `purpose`)
// - request OTP field is `otpCode` (camelCase), reset uses `newPassword`
// - persisted column is `is_used`; on dev/test the generate endpoint returns 201 (email not sent,
//   OTP still created + retrievable) so this suite is deterministic without the notification service.
// Messages are asserted on success flags (the API is French), not on exact English text.

describe('🔐 E2E Tests - OTP Flow', () => {
  let testUser = null;
  let testPerson = null;
  let emailOtpCode = null;
  let phoneOtpCode = null;

  const latestOtp = async (personId, purpose) => {
    const r = await connection.query(
      'SELECT * FROM otps WHERE person_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1',
      [personId, purpose]
    );
    return r.rows[0];
  };

  beforeAll(async () => {
    await cleanupOtpTestData();
  });

  afterAll(async () => {
    await cleanupOtpTestData();
  });

  describe('📧 Email OTP Flow', () => {
    test('Génération OTP email', async () => {
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

      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: userData.email });
      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('success', true);

      const personResult = await connection.query('SELECT * FROM people WHERE email = $1', [userData.email]);
      testPerson = personResult.rows[0];

      const otp = await latestOtp(testPerson.id, 'email');
      expect(otp).toBeDefined();
      emailOtpCode = otp.otp_code;
      expect(emailOtpCode).toMatch(/^\d{6}$/);
    });

    test('Vérification OTP email', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send({ email: testUser.email, otpCode: emailOtpCode })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 AND otp_code = $2',
        [testPerson.id, emailOtpCode]
      );
      expect(otpResult.rows[0].is_used).toBe(true);
    });

    test('Tentative de réutilisation du même OTP', async () => {
      // API rejects an already-used OTP with 401 (invalid/expired credential).
      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send({ email: testUser.email, otpCode: emailOtpCode })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('📱 Phone OTP Flow', () => {
    test('Génération OTP téléphone', async () => {
      const response = await request(app)
        .post('/api/auth/otp/phone/generate')
        .send({ phone: testPerson.phone });
      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('success', true);

      const otp = await latestOtp(testPerson.id, 'phone');
      expect(otp).toBeDefined();
      phoneOtpCode = otp.otp_code;
      expect(phoneOtpCode).toMatch(/^\d{6}$/);
    });

    test('Vérification OTP téléphone', async () => {
      const response = await request(app)
        .post('/api/auth/otp/phone/verify')
        .send({ phone: testPerson.phone, otpCode: phoneOtpCode })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      const otpResult = await connection.query(
        'SELECT * FROM otps WHERE person_id = $1 AND otp_code = $2',
        [testPerson.id, phoneOtpCode]
      );
      expect(otpResult.rows[0].is_used).toBe(true);
    });
  });

  describe('🔄 Password Reset OTP Flow', () => {
    let resetOtpCode = null;

    test('Génération OTP reset mot de passe', async () => {
      const response = await request(app)
        .post('/api/auth/otp/password-reset/generate')
        .send({ email: testUser.email });
      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('success', true);

      // Password-reset OTP is generated via the shared email OTP path (purpose 'email').
      const otp = await latestOtp(testPerson.id, 'email');
      expect(otp).toBeDefined();
      resetOtpCode = otp.otp_code;
      expect(resetOtpCode).toMatch(/^\d{6}$/);
    });

    test('Reset mot de passe avec OTP', async () => {
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post('/api/auth/otp/password-reset/verify')
        .send({ email: testUser.email, otpCode: resetOtpCode, newPassword })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: newPassword })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
    });
  });

  describe('⏰ OTP Expiration', () => {
    test('OTP expiré ne devrait pas fonctionner', async () => {
      const generateResponse = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: testUser.email });
      expect([200, 201]).toContain(generateResponse.status);

      const otp = await latestOtp(testPerson.id, 'email');
      const newOtpCode = otp.otp_code;

      // Expire it (Postgres UPDATE cannot take ORDER BY/LIMIT -> target by id).
      await connection.query('UPDATE otps SET expires_at = NOW() - INTERVAL \'1 hour\' WHERE id = $1', [otp.id]);

      const response = await request(app)
        .post('/api/auth/otp/email/verify')
        .send({ email: testUser.email, otpCode: newOtpCode })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('🚫 OTP Security Tests', () => {
    test('Génération OTP pour email inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/otp/email/generate')
        .send({ email: 'nonexistent@test.com' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Génération OTP pour téléphone inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/otp/phone/generate')
        .send({ phone: '+33699999999' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

async function cleanupOtpTestData() {
  try {
    await connection.query('DELETE FROM otps WHERE person_id IN (SELECT id FROM people WHERE email LIKE \'%otpuser@test.com\')');
    await connection.query('DELETE FROM password_histories WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%otpuser@test.com\')');
    await connection.query('DELETE FROM users WHERE email LIKE \'%otpuser@test.com\'');
    await connection.query('DELETE FROM people WHERE email LIKE \'%otpuser@test.com\'');
  } catch (error) {
    console.error('❌ Error cleaning up OTP test data:', error.message);
  }
}
