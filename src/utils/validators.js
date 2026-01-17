/**
 * Utilitaires de validation pour les données du module people
 */

/**
 * Valide le format d'un email
 * @param {string} email - Email à valider
 * @returns {boolean} True si l'email est valide
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Expression régulière pour valider les emails
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Test basique du format
  if (!emailRegex.test(email)) {
    return false;
  }

  // Tests supplémentaires
  const [localPart, domain] = email.split('@');
  
  // La partie locale ne doit pas dépasser 64 caractères
  if (localPart.length > 64) {
    return false;
  }
  
  // Le domaine ne doit pas dépasser 253 caractères
  if (domain.length > 253) {
    return false;
  }
  
  // La longueur totale ne doit pas dépasser 254 caractères
  if (email.length > 254) {
    return false;
  }

  return true;
}

/**
 * Valide le format d'un numéro de téléphone
 * @param {string} phone - Téléphone à valider
 * @returns {boolean} True si le téléphone est valide
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Nettoyage du numéro (supprime espaces, tirets, parenthèses, etc.)
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Formats acceptés:
  // - International: +[code][number] (ex: +33612345678)
  // - National: 0[number] (ex: 0612345678)
  // - Court: [number] (ex: 612345678)
  
  const phoneRegex = /^(\+?[1-9]\d{1,3})?[0-9]{7,15}$/;
  
  return phoneRegex.test(cleanPhone);
}

/**
 * Valide le format d'un mot de passe
 * @param {string} password - Mot de passe à valider
 * @returns {boolean} True si le mot de passe est valide
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Longueur minimale
  if (password.length < 8) {
    return false;
  }

  // Doit contenir au moins une majuscule, une minuscule et un chiffre
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  
  return passwordRegex.test(password);
}

/**
 * Valide le format d'un nom ou prénom
 * @param {string} name - Nom à valider
 * @returns {boolean} True si le nom est valide
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // Nettoyage
  const cleanName = name.trim();
  
  // Longueur minimale et maximale
  if (cleanName.length < 2 || cleanName.length > 100) {
    return false;
  }

  // Accepte les lettres, espaces, tirets et apostrophes
  const nameRegex = /^[a-zA-Z\u00C0-\u017F\s'\-]+$/;
  
  return nameRegex.test(cleanName);
}

/**
 * Valide une URL de photo
 * @param {string} url - URL à valider
 * @returns {boolean} True si l'URL est valide
 */
function validatePhotoUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Nettoie et normalise un email
 * @param {string} email - Email à nettoyer
 * @returns {string} Email nettoyé
 */
function cleanEmail(email) {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Nettoie et normalise un numéro de téléphone
 * @param {string} phone - Téléphone à nettoyer
 * @returns {string} Téléphone nettoyé
 */
function cleanPhone(phone) {
  if (!phone) return '';
  
  // Supprime tous les caractères non numériques sauf le +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Nettoie et normalise un nom
 * @param {string} name - Nom à nettoyer
 * @returns {string} Nom nettoyé
 */
function cleanName(name) {
  if (!name) return '';
  
  // Supprime les espaces multiples et met en majuscule la première lettre
  return name.trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
  validatePhotoUrl,
  cleanEmail,
  cleanPhone,
  cleanName
};
