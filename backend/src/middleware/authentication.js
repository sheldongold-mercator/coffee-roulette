const passport = require('../config/passport');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT token
 * Requires a valid JWT token in Authorization header
 */
const ensureAuthenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('Authentication error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication failed'
      });
    }

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Optional authentication - doesn't fail if no token
 * Attaches user to request if token is valid
 */
const optionalAuthentication = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

module.exports = {
  ensureAuthenticated,
  optionalAuthentication
};
