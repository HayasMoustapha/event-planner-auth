const bcrypt = require('bcrypt');
const env = require('../config/env');

const hashPassword = async (password) => {
  try {
    const saltRounds = env.BCRYPT_ROUNDS;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error('Erreur lors du hashage du mot de passe');
  }
};

const verifyPassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Erreur lors de la vérification du mot de passe');
  }
};

const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

const isStrongPassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: [
      password.length < minLength ? 'Le mot de passe doit contenir au moins 8 caractères' : null,
      !hasUpperCase ? 'Le mot de passe doit contenir au moins une majuscule' : null,
      !hasLowerCase ? 'Le mot de passe doit contenir au moins une minuscule' : null,
      !hasNumbers ? 'Le mot de passe doit contenir au moins un chiffre' : null,
      !hasSpecialChar ? 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)' : null
    ].filter(error => error !== null)
  };
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateRandomPassword,
  isStrongPassword
};
