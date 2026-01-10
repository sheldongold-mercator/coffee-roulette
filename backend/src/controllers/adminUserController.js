const { User, Department } = require('../models');
const { Op } = require('sequelize');
const microsoftGraphService = require('../services/microsoftGraphService');
const logger = require('../utils/logger');

/**
 * Get all users with filtering and pagination
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      department,
      isActive,
      isOptedIn,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const where = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Department filter
    if (department) {
      where.department_id = department;
    }

    // Active filter
    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    // Opted in filter
    if (isOptedIn !== undefined) {
      where.is_opted_in = isOptedIn === 'true';
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const users = await User.findAndCountAll({
      where,
      include: [
        {
          association: 'department',
          attributes: ['id', 'name', 'is_active']
        },
        {
          association: 'adminRole',
          attributes: ['role', 'permissions']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      data: users.rows.map(user => ({
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
        isActive: user.is_active,
        isOptedIn: user.is_opted_in,
        isAdmin: !!user.adminRole,
        adminRole: user.adminRole ? user.adminRole.role : null,
        lastSyncedAt: user.last_synced_at,
        createdAt: user.created_at
      })),
      pagination: {
        total: users.count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(users.count / parseInt(limit, 10))
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Get specific user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [
        {
          association: 'department',
          attributes: ['id', 'name', 'is_active']
        },
        {
          association: 'adminRole',
          attributes: ['role', 'permissions']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        microsoftId: user.microsoft_id,
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
        isActive: user.is_active,
        isOptedIn: user.is_opted_in,
        isAdmin: !!user.adminRole,
        adminRole: user.adminRole ? {
          role: user.adminRole.role,
          permissions: user.adminRole.permissions
        } : null,
        lastSyncedAt: user.last_synced_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user'
    });
  }
};

/**
 * Update user (admin override)
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName,
      lastName,
      departmentId,
      role,
      seniorityLevel,
      isActive,
      isOptedIn
    } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const updates = {};

    if (firstName) updates.first_name = firstName;
    if (lastName) updates.last_name = lastName;
    if (departmentId !== undefined) updates.department_id = departmentId;
    if (role !== undefined) updates.role = role;
    if (seniorityLevel && ['junior', 'mid', 'senior', 'lead', 'executive'].includes(seniorityLevel)) {
      updates.seniority_level = seniorityLevel;
    }
    if (isActive !== undefined) updates.is_active = isActive;
    if (isOptedIn !== undefined) updates.is_opted_in = isOptedIn;

    await user.update(updates);

    logger.info(`Admin ${req.user.id} updated user ${userId}`);

    await user.reload({
      include: [
        { association: 'department' },
        { association: 'adminRole' }
      ]
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name
        } : null,
        role: user.role,
        seniorityLevel: user.seniority_level,
        isActive: user.is_active,
        isOptedIn: user.is_opted_in
      }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user'
    });
  }
};

/**
 * Sync users from Microsoft Graph API
 */
const syncUsers = async (req, res) => {
  try {
    // Note: In production, you'd use a service account token with appropriate permissions
    // For now, we'll return a placeholder response
    // The actual implementation would use microsoftGraphService.getAllUsers()

    logger.info(`Admin ${req.user.id} initiated user sync`);

    res.json({
      message: 'User sync initiated',
      note: 'This feature requires Microsoft Graph API service account configuration'
    });

    // TODO: Implement actual sync logic:
    // 1. Get all users from Microsoft Graph API
    // 2. For each user, find or create in database
    // 3. Update user information
    // 4. Find or create departments
    // 5. Return sync statistics

  } catch (error) {
    logger.error('Sync users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sync users'
    });
  }
};

/**
 * Get user statistics
 */
const getUserStats = async (req, res) => {
  try {
    const stats = await User.findAll({
      attributes: [
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'total'],
        [User.sequelize.fn('SUM', User.sequelize.literal('CASE WHEN is_active = 1 THEN 1 ELSE 0 END')), 'active'],
        [User.sequelize.fn('SUM', User.sequelize.literal('CASE WHEN is_opted_in = 1 THEN 1 ELSE 0 END')), 'optedIn'],
        [User.sequelize.fn('SUM', User.sequelize.literal('CASE WHEN is_active = 1 AND is_opted_in = 1 THEN 1 ELSE 0 END')), 'activeAndOptedIn']
      ],
      raw: true
    });

    const departmentStats = await User.findAll({
      attributes: [
        'department_id',
        [User.sequelize.fn('COUNT', User.sequelize.col('User.id')), 'userCount']
      ],
      include: [
        {
          association: 'department',
          attributes: ['name', 'is_active']
        }
      ],
      group: ['department_id', 'department.id'],
      raw: false
    });

    res.json({
      data: {
        overall: {
          total: parseInt(stats[0].total, 10) || 0,
          active: parseInt(stats[0].active, 10) || 0,
          optedIn: parseInt(stats[0].optedIn, 10) || 0,
          activeAndOptedIn: parseInt(stats[0].activeAndOptedIn, 10) || 0
        },
        byDepartment: departmentStats.map(stat => ({
          departmentId: stat.department_id,
          departmentName: stat.department ? stat.department.name : 'No Department',
          isDepartmentActive: stat.department ? stat.department.is_active : false,
          userCount: parseInt(stat.dataValues.userCount, 10)
        }))
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user statistics'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  syncUsers,
  getUserStats
};
