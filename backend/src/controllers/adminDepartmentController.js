const { Department, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get all departments
 */
const getDepartments = async (req, res) => {
  try {
    const { includeInactive = 'true' } = req.query;

    const where = {};
    if (includeInactive === 'false') {
      where.is_active = true;
    }

    const departments = await Department.findAll({
      where,
      include: [
        {
          association: 'users',
          attributes: [],
          duplicating: false
        }
      ],
      attributes: {
        include: [
          [Department.sequelize.fn('COUNT', Department.sequelize.col('users.id')), 'userCount']
        ]
      },
      group: ['Department.id'],
      order: [['name', 'ASC']]
    });

    res.json({
      data: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        microsoftId: dept.microsoft_id,
        isActive: dept.is_active,
        enrollmentDate: dept.enrollment_date,
        userCount: parseInt(dept.dataValues.userCount, 10) || 0,
        createdAt: dept.created_at,
        updatedAt: dept.updated_at
      }))
    });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch departments'
    });
  }
};

/**
 * Get specific department by ID
 */
const getDepartmentById = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findByPk(departmentId, {
      include: [
        {
          association: 'users',
          attributes: ['id', 'first_name', 'last_name', 'email', 'is_active', 'is_opted_in']
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Department not found'
      });
    }

    res.json({
      department: {
        id: department.id,
        name: department.name,
        microsoftId: department.microsoft_id,
        isActive: department.is_active,
        enrollmentDate: department.enrollment_date,
        createdAt: department.created_at,
        updatedAt: department.updated_at,
        users: department.users.map(user => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          isActive: user.is_active,
          isOptedIn: user.is_opted_in
        }))
      }
    });
  } catch (error) {
    logger.error('Get department by ID error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch department'
    });
  }
};

/**
 * Create new department
 */
const createDepartment = async (req, res) => {
  try {
    const { name, microsoftId, isActive = false } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Department name is required'
      });
    }

    // Check if department already exists
    const existing = await Department.findOne({
      where: { name }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Department with this name already exists'
      });
    }

    const department = await Department.create({
      name,
      microsoft_id: microsoftId,
      is_active: isActive,
      enrollment_date: isActive ? new Date() : null
    });

    logger.info(`Admin ${req.user.id} created department ${department.id}: ${name}`);

    res.status(201).json({
      message: 'Department created successfully',
      department: {
        id: department.id,
        name: department.name,
        microsoftId: department.microsoft_id,
        isActive: department.is_active,
        enrollmentDate: department.enrollment_date
      }
    });
  } catch (error) {
    logger.error('Create department error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Department with this name already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create department'
    });
  }
};

/**
 * Update department
 */
const updateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { name, microsoftId } = req.body;

    const department = await Department.findByPk(departmentId);

    if (!department) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Department not found'
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (microsoftId !== undefined) updates.microsoft_id = microsoftId;

    await department.update(updates);

    logger.info(`Admin ${req.user.id} updated department ${departmentId}`);

    res.json({
      message: 'Department updated successfully',
      department: {
        id: department.id,
        name: department.name,
        microsoftId: department.microsoft_id,
        isActive: department.is_active,
        enrollmentDate: department.enrollment_date
      }
    });
  } catch (error) {
    logger.error('Update department error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Department with this name already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update department'
    });
  }
};

/**
 * Enable department for Coffee Roulette (phased rollout)
 */
const enableDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findByPk(departmentId);

    if (!department) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Department not found'
      });
    }

    if (department.is_active) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Department is already enabled'
      });
    }

    await department.update({
      is_active: true,
      enrollment_date: new Date()
    });

    logger.info(`Admin ${req.user.id} enabled department ${departmentId}: ${department.name}`);

    res.json({
      message: `Department "${department.name}" has been enabled for Coffee Roulette`,
      department: {
        id: department.id,
        name: department.name,
        isActive: department.is_active,
        enrollmentDate: department.enrollment_date
      }
    });
  } catch (error) {
    logger.error('Enable department error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to enable department'
    });
  }
};

/**
 * Disable department from Coffee Roulette
 */
const disableDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findByPk(departmentId);

    if (!department) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Department not found'
      });
    }

    if (!department.is_active) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Department is already disabled'
      });
    }

    await department.update({
      is_active: false
    });

    logger.info(`Admin ${req.user.id} disabled department ${departmentId}: ${department.name}`);

    res.json({
      message: `Department "${department.name}" has been disabled from Coffee Roulette`,
      department: {
        id: department.id,
        name: department.name,
        isActive: department.is_active,
        enrollmentDate: department.enrollment_date
      }
    });
  } catch (error) {
    logger.error('Disable department error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to disable department'
    });
  }
};

/**
 * Get department statistics
 */
const getDepartmentStats = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findByPk(departmentId);

    if (!department) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Department not found'
      });
    }

    const userStats = await User.findAll({
      where: { department_id: departmentId },
      attributes: [
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'total'],
        [User.sequelize.fn('SUM', User.sequelize.literal('CASE WHEN is_active = 1 THEN 1 ELSE 0 END')), 'active'],
        [User.sequelize.fn('SUM', User.sequelize.literal('CASE WHEN is_opted_in = 1 THEN 1 ELSE 0 END')), 'optedIn'],
        [User.sequelize.fn('SUM', User.sequelize.literal('CASE WHEN is_active = 1 AND is_opted_in = 1 THEN 1 ELSE 0 END')), 'eligible']
      ],
      raw: true
    });

    res.json({
      department: {
        id: department.id,
        name: department.name,
        isActive: department.is_active,
        enrollmentDate: department.enrollment_date
      },
      stats: {
        totalUsers: parseInt(userStats[0].total, 10) || 0,
        activeUsers: parseInt(userStats[0].active, 10) || 0,
        optedInUsers: parseInt(userStats[0].optedIn, 10) || 0,
        eligibleUsers: parseInt(userStats[0].eligible, 10) || 0
      }
    });
  } catch (error) {
    logger.error('Get department stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch department statistics'
    });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  enableDepartment,
  disableDepartment,
  getDepartmentStats
};
