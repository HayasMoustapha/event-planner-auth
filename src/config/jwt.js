const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('./env');

const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,

  // E-CI(auth) — `jwtid` (jti) unique par token : chaque émission est distincte
  // même pour un payload identique dans la même seconde (l'`iat` est en secondes),
  // et permet la traçabilité/révocation côté serveur.
  generateToken: (payload) => {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      jwtid: crypto.randomUUID(),
    });
  },

  generateRefreshToken: (payload) => {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn,
      jwtid: crypto.randomUUID(),
    });
  },
  
  verifyToken: (token) => {
    return jwt.verify(token, jwtConfig.secret);
  },
  
  decodeToken: (token) => {
    return jwt.decode(token);
  }
};

module.exports = jwtConfig;
