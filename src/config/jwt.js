const jwt = require('jsonwebtoken');
const env = require('./env');

const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  
  generateToken: (payload) => {
    return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
  },
  
  generateRefreshToken: (payload) => {
    return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.refreshExpiresIn });
  },
  
  verifyToken: (token) => {
    return jwt.verify(token, jwtConfig.secret);
  },
  
  decodeToken: (token) => {
    return jwt.decode(token);
  }
};

module.exports = jwtConfig;
