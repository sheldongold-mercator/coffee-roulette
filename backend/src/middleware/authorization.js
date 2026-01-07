const logger = require('../utils/logger');

/**
 * Middleware to ensure user has admin role
 * Must be used after ensureAuthenticated middleware
 */
const ensureAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Load admin role if not already loaded
    if (!req.user.adminRole) {
      await req.user.reload({
        include: [{
          association: 'adminRole',
          attributes: ['role', 'permissions']
        }]
      });
    }

    if (!req.user.adminRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Attach admin role to request for easy access
    req.adminRole = req.user.adminRole;
    next();
  } catch (error) {
    logger.error('Authorization error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authorization check failed'
    });
  }
};

/**
 * Middleware to ensure user has specific admin role
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const ensureRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Load admin role if not already loaded
      if (!req.user.adminRole) {
        await req.user.reload({
          include: [{
            association: 'adminRole',
            attributes: ['role', 'permissions']
          }]
        });
      }

      if (!req.user.adminRole) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      if (!allowedRoles.includes(req.user.adminRole.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Required role: ${allowedRoles.join(' or ')}`
        });
      }

      req.adminRole = req.user.adminRole;
      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Role check failed'
      });
    }
  };
};

/**
 * Middleware to ensure user owns the resource or is admin
 * @param {string} userIdField - Field name containing user ID to check
 */
const ensureOwnerOrAdmin = (userIdField = 'user_id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const resourceUserId = req.params[userIdField] || req.body[userIdField];

      // Check if user is admin
      if (!req.user.adminRole) {
        await req.user.reload({
          include: [{
            association: 'adminRole',
            attributes: ['role', 'permissions']
          }]
        });
      }

      const isAdmin = !!req.user.adminRole;
      const isOwner = req.user.id === parseInt(resourceUserId, 10);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied'
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Ownership check failed'
      });
    }
  };
};

module.exports = {
  ensureAdmin,
  ensureRole,
  ensureOwnerOrAdmin
};
