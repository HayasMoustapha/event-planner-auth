const crypto = require('crypto');
const env = require('../config/env');

const generateOTP = (length = null) => {
  const otpLength = length || env.OTP_LENGTH;
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < otpLength; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

const generateSecureOTP = (length = null) => {
  const otpLength = length || env.OTP_LENGTH;
  const buffer = crypto.randomBytes(Math.ceil(otpLength / 2));
  const hex = buffer.toString('hex').slice(0, otpLength);
  
  // Convert hex to digits
  let otp = '';
  for (let i = 0; i < hex.length; i++) {
    otp = (otp + (parseInt(hex[i], 16) % 10)).slice(-otpLength);
  }
  
  return otp.padStart(otpLength, '0');
};

const verifyOTP = (providedOTP, storedOTP) => {
  return providedOTP === storedOTP;
};

const generateOTPWithExpiry = (length = null) => {
  const otp = generateSecureOTP(length);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN * 1000);
  
  return {
    otp,
    expiresAt,
    expiresIn: env.OTP_EXPIRES_IN
  };
};

const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

const generateTOTPSecret = () => {
  return crypto.randomBytes(20).toString('base64');
};

const generateTOTPURI = (secret, accountName, issuer = 'EventPlanner') => {
  return `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
};

const verifyTOTP = (token, secret) => {
  // This would require the 'otplib' package for full TOTP implementation
  // For now, return false as placeholder
  return false;
};

const maskOTP = (otp) => {
  if (!otp || otp.length < 4) return '****';
  
  const visibleChars = 2;
  const maskedChars = otp.length - visibleChars;
  const mask = '*'.repeat(maskedChars);
  
  return otp.slice(0, visibleChars) + mask;
};

module.exports = {
  generateOTP,
  generateSecureOTP,
  verifyOTP,
  generateOTPWithExpiry,
  isOTPExpired,
  generateTOTPSecret,
  generateTOTPURI,
  verifyTOTP,
  maskOTP
};
