const jwt = require('jsonwebtoken');
const logger = require('./logger');

// SECURITY: JWT_SECRET must be explicitly configured - no fallback
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  const errorMsg = 'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set. ' +
    'This is required for secure token signing. ' +
    'Set JWT_SECRET in your .env file with a strong random value (minimum 32 characters).';
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

// Warn if JWT_SECRET appears to be weak
if (JWT_SECRET.length < 32) {
  logger.warn('WARNING: JWT_SECRET is shorter than 32 characters. Consider using a longer, more secure value.');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 * @param {Object} user - User object from database
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      microsoft_id: user.microsoft_id
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'coffee-roulette-api',
      audience: 'coffee-roulette-frontend'
    });

    return token;
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw error;
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'coffee-roulette-api',
      audience: 'coffee-roulette-frontend'
    });
    return decoded;
  } catch (error) {
    logger.error('Error verifying JWT token:', error);
    throw error;
  }
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding JWT token:', error);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
