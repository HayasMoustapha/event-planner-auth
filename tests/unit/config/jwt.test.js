const jwtConfig = require('../../../src/config/jwt');

describe('JWT Configuration', () => {
  const mockPayload = { userId: 1, email: 'test@example.com' };

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const token = jwtConfig.generateToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens each time', () => {
      const token1 = jwtConfig.generateToken(mockPayload);
      const token2 = jwtConfig.generateToken(mockPayload);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = jwtConfig.generateToken(mockPayload);
      const decoded = jwtConfig.verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwtConfig.verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create token with very short expiration for testing
      const shortLivedToken = jwt.sign(mockPayload, 'test_secret', { expiresIn: '1ms' });
      
      // Wait for token to expire
      setTimeout(() => {
        expect(() => {
          jwtConfig.verifyToken(shortLivedToken);
        }).toThrow();
      }, 10);
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = jwtConfig.generateToken(mockPayload);
      const decoded = jwtConfig.decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it('should decode invalid token without throwing', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = jwtConfig.decodeToken(invalidToken);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBeUndefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token', () => {
      const refreshToken = jwtConfig.generateRefreshToken(mockPayload);
      
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.')).toHaveLength(3);
    });

    it('should generate different refresh tokens each time', () => {
      const token1 = jwtConfig.generateRefreshToken(mockPayload);
      const token2 = jwtConfig.generateRefreshToken(mockPayload);
      
      expect(token1).not.toBe(token2);
    });
  });
});
