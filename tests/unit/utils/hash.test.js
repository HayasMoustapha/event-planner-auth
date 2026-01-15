const { hashPassword, verifyPassword, generateRandomPassword, isStrongPassword } = require('../../../src/utils/hash');

describe('Hash Utils', () => {
  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'Password123!';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Password123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hashedPassword = await hashPassword('');
      expect(hashedPassword).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'Password123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Password123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password with default length', () => {
      const password = generateRandomPassword();
      expect(password).toHaveLength(12);
      expect(/[a-zA-Z0-9@$!%*?&]/.test(password)).toBe(true);
    });

    it('should generate password with custom length', () => {
      const password = generateRandomPassword(16);
      expect(password).toHaveLength(16);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateRandomPassword();
      const password2 = generateRandomPassword();
      expect(password1).not.toBe(password2);
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong password', () => {
      const password = 'StrongPass123!';
      const result = isStrongPassword(password);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const password = 'Short1!';
      const result = isStrongPassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins 8 caractères');
    });

    it('should reject password without uppercase', () => {
      const password = 'weakpass123!';
      const result = isStrongPassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins une majuscule');
    });

    it('should reject password without lowercase', () => {
      const password = 'STRONG123!';
      const result = isStrongPassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins une minuscule');
    });

    it('should reject password without numbers', () => {
      const password = 'StrongPassword!';
      const result = isStrongPassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins un chiffre');
    });

    it('should reject password without special characters', () => {
      const password = 'StrongPassword123';
      const result = isStrongPassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)');
    });

    it('should return all errors for weak password', () => {
      const password = 'weak';
      const result = isStrongPassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });
});
