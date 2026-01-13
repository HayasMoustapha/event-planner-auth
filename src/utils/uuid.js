const { v4: uuidv4, v1: uuidv1, v3: uuidv3, v5: uuidv5, validate: uuidValidate, version: uuidVersion } = require('uuid');

const generateUUID = (version = 'v4') => {
  switch (version) {
    case 'v1':
      return uuidv1();
    case 'v3':
      return uuidv3('eventplanner.com', uuidv3.DNS);
    case 'v5':
      return uuidv5('eventplanner.com', uuidv5.DNS);
    case 'v4':
    default:
      return uuidv4();
  }
};

const generateUUIDv4 = () => {
  return uuidv4();
};

const isValidUUID = (uuid) => {
  return uuidValidate(uuid);
};

const getUUIDVersion = (uuid) => {
  if (!isValidUUID(uuid)) {
    return null;
  }
  return uuidVersion(uuid);
};

const generateShortUUID = () => {
  const uuid = uuidv4();
  return uuid.replace(/-/g, '').substring(0, 16);
};

const generateSessionId = () => {
  return `sess_${uuidv4()}`;
};

const generateTokenId = () => {
  return `token_${uuidv4()}`;
};

const generateRequestId = () => {
  return `req_${Date.now()}_${uuidv4().substring(0, 8)}`;
};

const generateFileId = (originalName = '') => {
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  const extension = originalName.includes('.') ? 
    originalName.split('.').pop() : '';
  
  return extension ? `${timestamp}_${uuid}.${extension}` : `${timestamp}_${uuid}`;
};

const generateApiKey = () => {
  const uuid = uuidv4().replace(/-/g, '');
  return `api_${uuid}`;
};

const generateWebhookSecret = () => {
  const uuid = uuidv4().replace(/-/g, '');
  return `wh_${uuid}`;
};

const maskUUID = (uuid, visibleChars = 8) => {
  if (!isValidUUID(uuid)) {
    return '****';
  }
  
  return uuid.substring(0, visibleChars) + '****';
};

module.exports = {
  generateUUID,
  generateUUIDv4,
  isValidUUID,
  getUUIDVersion,
  generateShortUUID,
  generateSessionId,
  generateTokenId,
  generateRequestId,
  generateFileId,
  generateApiKey,
  generateWebhookSecret,
  maskUUID
};
