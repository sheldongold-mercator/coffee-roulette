const { User, Department } = require('../models');
const microsoftGraphService = require('../services/microsoftGraphService');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Login with Microsoft access token
 * Frontend sends Microsoft access token, backend verifies it and issues our JWT
 */
const loginWithMicrosoft = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Access token is required'
      });
    }

    // Verify token and get user profile from Microsoft
    const msProfile = await microsoftGraphService.getUserProfile(accessToken);

    if (!msProfile || !msProfile.id || !msProfile.email) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Microsoft access token'
      });
    }

    // Find or create user in our database
    let user = await User.findOne({
      where: { microsoft_id: msProfile.id },
      include: [
        { association: 'department' },
        { association: 'adminRole' }
      ]
    });

    if (!user) {
      // Create new user
      logger.info(`Creating new user from Microsoft login: ${msProfile.email}`);

      // Find or create department
      let department = null;
      if (msProfile.department) {
        [department] = await Department.findOrCreate({
          where: { name: msProfile.department },
          defaults: {
            name: msProfile.department,
            is_active: false // New departments are inactive by default
          }
        });
      }

      try {
        user = await User.create({
          microsoft_id: msProfile.id,
          email: msProfile.email,
          first_name: msProfile.firstName || msProfile.displayName?.split(' ')[0] || 'Unknown',
          last_name: msProfile.lastName || msProfile.displayName?.split(' ').slice(1).join(' ') || 'User',
          department_id: department?.id,
          role: msProfile.jobTitle,
          seniority_level: 'mid', // Default seniority
          is_active: true,
          is_opted_in: true,
          last_synced_at: new Date()
        });

        // Reload with associations
        await user.reload({
          include: [
            { association: 'department' },
            { association: 'adminRole' }
          ]
        });

        logger.info(`User created successfully: ${user.email} (ID: ${user.id})`);
      } catch (createError) {
        // If user was created by a concurrent request or exists with different microsoft_id
        if (createError.name === 'SequelizeUniqueConstraintError') {
          logger.info(`User already exists, fetching by email: ${msProfile.email}`);
          user = await User.findOne({
            where: { email: msProfile.email },
            include: [
              { association: 'department' },
              { association: 'adminRole' }
            ]
          });

          // Update microsoft_id if it changed (e.g., user was synced before first login)
          if (user && user.microsoft_id !== msProfile.id) {
            logger.info(`Updating microsoft_id for user: ${msProfile.email}`);
            user.microsoft_id = msProfile.id;
            await user.save();
          }
        } else {
          throw createError; // Re-throw if it's not a duplicate key error
        }
      }
    } else {
      // Update existing user's last sync time
      user.last_synced_at = new Date();
      await user.save();

      logger.info(`User logged in: ${user.email} (ID: ${user.id})`);
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Generate our JWT token
    const jwtToken = generateToken(user);

    // Return user info and token
    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          isActive: user.department.is_active
        } : null,
        role: user.role,
        seniorityLevel: user.seniority_level,
        isOptedIn: user.is_opted_in,
        isAdmin: !!user.adminRole,
        adminRole: user.adminRole ? user.adminRole.role : null
      }
    });
  } catch (error) {
    logger.error('Login error:', error);

    if (error.message === 'Invalid Microsoft access token') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired Microsoft access token'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed. Please try again.'
    });
  }
};

/**
 * Get current user information
 * Requires authentication
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          isActive: user.department.is_active
        } : null,
        role: user.role,
        seniorityLevel: user.seniority_level,
        isOptedIn: user.is_opted_in,
        isActive: user.is_active,
        isAdmin: !!user.adminRole,
        adminRole: user.adminRole ? user.adminRole.role : null,
        lastSyncedAt: user.last_synced_at
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user information'
    });
  }
};

/**
 * Logout (client-side token removal, but we can log it)
 */
const logout = async (req, res) => {
  try {
    if (req.user) {
      logger.info(`User logged out: ${req.user.email} (ID: ${req.user.id})`);
    }

    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed'
    });
  }
};

module.exports = {
  loginWithMicrosoft,
  getCurrentUser,
  logout
};
