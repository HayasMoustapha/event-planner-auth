const otpService = require('../../../src/modules/auth/otp.service');
const otpRepository = require('../../../src/modules/auth/otp.repository');
const peopleRepository = require('../../../src/modules/people/people.repository');

// Mock du repository
jest.mock('../../../src/modules/auth/otp.repository');
jest.mock('../../../src/modules/people/people.repository');

describe('OtpService', () => {
  let service;

  beforeEach(() => {
    service = otpService; // Utiliser l'instance exportée
    jest.clearAllMocks();
  });

  describe('generateEmailOtp', () => {
    it('should generate OTP for valid person', async () => {
      const mockPerson = {
        id: 1,
        email: 'test@example.com'
      };

      peopleRepository.findByEmail.mockResolvedValue(mockPerson);
      otpRepository.countActiveOtp.mockResolvedValue(0);
      
      try {
        const result = await service.generateEmailOtp(1, 'test@example.com');
        expect(result).toBeDefined();
        expect(peopleRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
        expect(otpRepository.countActiveOtp).toHaveBeenCalledWith(1, 'email');
      } catch (error) {
        console.error('Erreur dans generateEmailOtp:', error.message);
        expect.fail(error.message);
      }
    });

    it('should reject invalid email format', async () => {
      await expect(service.generateEmailOtp(1, 'invalid-email'))
        .rejects.toThrow('Format d\'email invalide');
    });

    it('should reject when too many active OTPs', async () => {
      peopleRepository.findByEmail.mockResolvedValue({ id: 1 });
      otpRepository.countActiveOtp.mockResolvedValue(3);

      await expect(service.generateEmailOtp(1, 'test@example.com'))
        .rejects.toThrow('Trop de codes OTP actifs pour cette personne');
    });
  });

  describe('verifyEmailOtp', () => {
    it('should verify valid OTP', async () => {
      const mockOtp = {
        id: 1,
        person_id: 1,
        otp_code: '123456',
        purpose: 'email',
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        is_used: false
      };

      otpRepository.validateOtp.mockResolvedValue(mockOtp);

      const result = await service.verifyEmailOtp('123456', 'test@example.com', 1);

      expect(result).toBeDefined();
      expect(result.purpose).toBe('email');
      expect(otpRepository.validateOtp).toHaveBeenCalledWith('123456', 1, 'email');
    });

    it('should reject invalid OTP code', async () => {
      otpRepository.validateOtp.mockResolvedValue(null);

      await expect(service.verifyEmailOtp('999999', 'test@example.com', 1))
        .rejects.toThrow('Code OTP invalide ou expiré');
    });

    it('should reject OTP for wrong person', async () => {
      const mockOtp = {
        id: 1,
        person_id: 2, // Différent person ID
        otp_code: '123456',
        purpose: 'email',
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        is_used: false
      };

      otpRepository.validateOtp.mockResolvedValue(mockOtp);

      await expect(service.verifyEmailOtp('123456', 'test@example.com', 1))
        .rejects.toThrow('Ce code OTP n\'est pas associé à cette personne');
    });
  });

  describe('generatePasswordResetOtp', () => {
    it('should generate password reset OTP', async () => {
      const mockPerson = {
        id: 1,
        email: 'test@example.com'
      };

      peopleRepository.findByEmail.mockResolvedValue(mockPerson);
      otpRepository.countActiveOtp.mockResolvedValue(0);

      try {
        const result = await service.generatePasswordResetOtp(1, 'test@example.com');
        expect(result).toBeDefined();
        expect(peopleRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      } catch (error) {
        console.error('Erreur dans generatePasswordResetOtp:', error.message);
        expect.fail(error.message);
      }
    });
  });

  describe('getPersonOtps', () => {
    it('should return OTPs for person', async () => {
      const mockOtps = [
        { id: 1, person_id: 1, purpose: 'email' },
        { id: 2, person_id: 1, purpose: 'phone' }
      ];

      otpRepository.findByPersonId.mockResolvedValue(mockOtps);

      const result = await service.getPersonOtps(1);

      expect(result).toHaveLength(2);
      expect(result[0].person_id).toBe(1);
      expect(otpRepository.findByPersonId).toHaveBeenCalledWith(1, null);
    });

    it('should return OTPs filtered by purpose', async () => {
      const mockOtps = [
        { id: 1, person_id: 1, purpose: 'email' }
      ];

      otpRepository.findByPersonId.mockResolvedValue(mockOtps);

      const result = await service.getPersonOtps(1, 'email');

      expect(result).toHaveLength(1);
      expect(result[0].purpose).toBe('email');
      expect(otpRepository.findByPersonId).toHaveBeenCalledWith(1, 'email');
    });
  });

  describe('invalidatePersonOtps', () => {
    it('should invalidate all OTPs for person', async () => {
      const mockOtps = [
        { id: 1, is_used: false },
        { id: 2, is_used: false },
        { id: 3, is_used: true }
      ];

      otpRepository.findByPersonId.mockResolvedValue(mockOtps);
      otpRepository.markAsUsed.mockResolvedValue(true);

      const result = await service.invalidatePersonOtps(1);

      expect(result).toBe(2); // Seulement les 2 non utilisés
      expect(otpRepository.markAsUsed).toHaveBeenCalledTimes(2);
    });
  });

  describe('hasActiveOtp', () => {
    it('should return true when person has active OTPs', async () => {
      otpRepository.countActiveOtp.mockResolvedValue(2);

      const result = await service.hasActiveOtp(1);

      expect(result).toBe(true);
      expect(otpRepository.countActiveOtp).toHaveBeenCalledWith(1, null);
    });

    it('should return false when person has no active OTPs', async () => {
      otpRepository.countActiveOtp.mockResolvedValue(0);

      const result = await service.hasActiveOtp(1);

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredOtps', () => {
    it('should delete expired OTPs', async () => {
      otpRepository.deleteExpired.mockResolvedValue(5);

      const result = await service.cleanupExpiredOtps();

      expect(result).toBe(5);
      expect(otpRepository.deleteExpired).toHaveBeenCalled();
    });
  });

  describe('validateOtpCode', () => {
    it('should validate OTP code format', () => {
      expect(service.validateOtpCode('123456')).toBe(true);
      expect(service.validateOtpCode('abc123')).toBe(false);
      expect(service.validateOtpCode('12345')).toBe(true);
      expect(service.validateOtpCode('')).toBe(false);
      expect(service.validateOtpCode(null)).toBe(false);
    });
  });

  describe('generateCode', () => {
    it('should generate 6-digit code by default', () => {
      const code = service.generateCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    it('should generate code with specified length', () => {
      const code = service.generateCode(8);
      expect(code).toMatch(/^\d{8}$/);
      expect(code.length).toBe(8);
    });
  });

  describe('isOtpExpired', () => {
    it('should return true for expired OTP', () => {
      const expiredOtp = {
        expires_at: new Date(Date.now() - 1000)
      };
      expect(service.isOtpExpired(expiredOtp)).toBe(true);
    });

    it('should return false for valid OTP', () => {
      const validOtp = {
        expires_at: new Date(Date.now() + 15 * 60 * 1000)
      };
      expect(service.isOtpExpired(validOtp)).toBe(false);
    });
  });

  describe('formatOtpResponse', () => {
    it('should format OTP response correctly', () => {
      const mockOtp = {
        id: 1,
        otp_code: '123456',
        expires_at: new Date()
      };
      
      const response = service.formatOtpResponse(mockOtp);
      
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('code');
      expect(response).toHaveProperty('expiresAt');
      expect(response).toHaveProperty('purpose');
      expect(response.code).toBe('123456');
    });
  });
});
