const { validationResult } = require('express-validator');
const {
  validateGeneratePasswordResetOtp,
  validateLogin,
  validateRegister
} = require('../../src/modules/auth/auth.validation');

async function runValidation(chain, body) {
  const req = { body: { ...body }, params: {}, query: {} };

  for (const middleware of chain.slice(0, -1)) {
    await middleware.run(req);
  }

  return {
    req,
    errors: validationResult(req).array()
  };
}

describe('auth validation email sanitization', () => {
  it('preserves Gmail dots while trimming and lowercasing for password reset', async () => {
    const { req, errors } = await runValidation(validateGeneratePasswordResetOtp, {
      email: '  GE.ABESSOLO@GMAIL.COM  '
    });

    expect(errors).toHaveLength(0);
    expect(req.body.email).toBe('ge.abessolo@gmail.com');
  });

  it('sanitizes login email without canonicalizing the local part', async () => {
    const { req, errors } = await runValidation(validateLogin, {
      email: 'Ge.Abessolo+designer@Gmail.com',
      password: 'Password123'
    });

    expect(errors).toHaveLength(0);
    expect(req.body.email).toBe('ge.abessolo+designer@gmail.com');
  });

  it('applies the same behavior during registration', async () => {
    const { req, errors } = await runValidation(validateRegister, {
      first_name: 'Germaine',
      email: ' GE.ABESSOLO@GMAIL.COM ',
      password: 'Password123'
    });

    expect(errors).toHaveLength(0);
    expect(req.body.email).toBe('ge.abessolo@gmail.com');
  });
});
