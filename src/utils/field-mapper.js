/**
 * Utilitaire de mapping des champs pour standardiser les noms
 * Gère les variations first_name/firstName, last_name/lastName, etc.
 */

/**
 * Mappe les champs du body vers le format standard
 * @param {Object} data - Données à mapper
 * @returns {Object} Données mappées
 */
const mapFields = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const fieldMapping = {
    // Noms
    firstName: 'first_name',
    lastName: 'last_name',
    firstName: 'first_name',
    lastName: 'last_name',
    
    // Téléphone
    phoneNumber: 'phone',
    phone_number: 'phone',
    
    // Email
    emailAddress: 'email',
    email_address: 'email',
    
    // OTP
    otpCode: 'code',
    otp_code: 'code',
    
    // User
    userId: 'user_id',
    user_id: 'user_id',
    personId: 'person_id',
    person_id: 'person_id',
    
    // Codes
    userCode: 'user_code',
    user_code: 'user_code',
    
    // Timestamps
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  };

  const mappedData = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Utiliser le mapping si disponible, sinon garder le nom original
    const mappedKey = fieldMapping[key] || key;
    mappedData[mappedKey] = value;
  }

  return mappedData;
};

/**
 * Mappe les champs du format standard vers le format de réponse
 * @param {Object} data - Données à mapper
 * @returns {Object} Données mappées
 */
const mapFieldsToResponse = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const responseMapping = {
    // Noms (format camelCase pour la réponse)
    first_name: 'firstName',
    last_name: 'lastName',
    
    // Téléphone
    phone: 'phone',
    
    // Email
    email: 'email',
    
    // IDs
    user_id: 'userId',
    person_id: 'personId',
    
    // Codes
    user_code: 'userCode',
    
    // Timestamps
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    deleted_at: 'deletedAt'
  };

  const mappedData = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Utiliser le mapping si disponible, sinon garder le nom original
    const mappedKey = responseMapping[key] || key;
    mappedData[mappedKey] = value;
  }

  return mappedData;
};

module.exports = {
  mapFields,
  mapFieldsToResponse
};
