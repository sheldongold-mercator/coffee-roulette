const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { User } = require('../models');
const logger = require('../utils/logger');

// SECURITY: JWT_SECRET must be explicitly configured - no fallback
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  const errorMsg = 'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set. ' +
    'This is required for secure token validation. ' +
    'Set JWT_SECRET in your .env file with a strong random value (minimum 32 characters).';
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

// JWT Strategy for validating tokens issued by our backend
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
  algorithms: ['HS256']
};

passport.use('jwt', new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    // Find user by ID from JWT payload
    const user = await User.findByPk(payload.id, {
      include: [
        {
          association: 'department',
          attributes: ['id', 'name']
        },
        {
          association: 'adminRole',
          attributes: ['role', 'permissions']
        }
      ]
    });

    if (!user) {
      logger.warn(`JWT validation failed: User ${payload.id} not found`);
      return done(null, false);
    }

    if (!user.is_active) {
      logger.warn(`JWT validation failed: User ${payload.id} is inactive`);
      return done(null, false);
    }

    // Attach user to request
    return done(null, user);
  } catch (error) {
    logger.error('Error in JWT strategy:', error);
    return done(error, false);
  }
}));

// Serialize user for session (if using sessions)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
