const { User, Department, Pairing, MeetingFeedback, MatchingRound } = require('../models');
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
      status,        // 'active' or 'inactive' - filters is_active
      isOptedIn,     // 'true' or 'false' - filters is_opted_in
      participation, // 'eligible', 'opted_in_excluded', 'opted_out' - computed status
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

    // Status filter (user account active/inactive)
    if (status !== undefined && status !== '') {
      where.is_active = status === 'active';
    }

    // Opted in filter (check for non-empty string)
    if (isOptedIn !== undefined && isOptedIn !== '') {
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

    // Helper to compute participation status
    const getParticipationStatus = (user) => {
      if (!user.is_opted_in) return 'opted_out';
      if (!user.department || !user.department.is_active) return 'opted_in_excluded';
      return 'eligible';
    };

    // Filter by participation status if specified
    let filteredUsers = users.rows;
    if (participation && participation !== '') {
      filteredUsers = users.rows.filter(user => getParticipationStatus(user) === participation);
    }

    res.json({
      data: filteredUsers.map(user => {
        const participationStatus = getParticipationStatus(user);
        return {
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
          participationStatus, // 'eligible', 'opted_in_excluded', or 'opted_out'
          isAdmin: !!user.adminRole,
          adminRole: user.adminRole ? user.adminRole.role : null,
          lastSyncedAt: user.last_synced_at,
          createdAt: user.created_at
        };
      }),
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
 * Get specific user by ID with pairing history
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

    // Fetch pairing history for this user
    const pairings = await Pairing.findAll({
      where: {
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: MatchingRound,
          as: 'matchingRound',
          attributes: ['id', 'name', 'scheduled_date']
        },
        {
          model: MeetingFeedback,
          as: 'feedback',
          where: { user_id: userId },
          required: false,
          attributes: ['id', 'rating', 'comments', 'created_at']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    // Transform pairings to show partner info
    const pairingHistory = pairings.map(pairing => {
      const isUser1 = pairing.user1_id === parseInt(userId, 10);
      const partner = isUser1 ? pairing.user2 : pairing.user1;
      const userFeedback = pairing.feedback && pairing.feedback.length > 0 ? pairing.feedback[0] : null;

      return {
        id: pairing.id,
        partner: partner ? {
          id: partner.id,
          firstName: partner.first_name,
          lastName: partner.last_name,
          email: partner.email
        } : null,
        status: pairing.status,
        meetingScheduledAt: pairing.meeting_scheduled_at,
        meetingCompletedAt: pairing.meeting_completed_at,
        round: pairing.matchingRound ? {
          id: pairing.matchingRound.id,
          name: pairing.matchingRound.name,
          scheduledDate: pairing.matchingRound.scheduled_date
        } : null,
        feedback: userFeedback ? {
          rating: userFeedback.rating,
          comments: userFeedback.comments,
          submittedAt: userFeedback.created_at
        } : null,
        createdAt: pairing.created_at
      };
    });

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
      },
      pairingHistory,
      stats: {
        totalPairings: pairings.length,
        completedPairings: pairings.filter(p => p.status === 'completed').length,
        averageRating: pairings
          .filter(p => p.feedback && p.feedback.length > 0)
          .reduce((acc, p) => acc + (p.feedback[0]?.rating || 0), 0) /
          (pairings.filter(p => p.feedback && p.feedback.length > 0).length || 1) || null
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
    if (seniorityLevel && ['junior', 'mid', 'senior', 'lead', 'head', 'executive'].includes(seniorityLevel)) {
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
    const { v4: uuidv4 } = require('uuid');
    const emailService = require('../services/emailService');

    logger.info(`Admin ${req.user.id} initiated user sync`);

    // Get all users from Microsoft Graph API
    const msUsers = await microsoftGraphService.getAllUsers();
    logger.info(`Fetched ${msUsers.length} users from Microsoft Graph API`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let welcomeEmailsSent = 0;
    const errors = [];
    const newUsersInActiveDepts = [];

    // Process each user
    for (const msUser of msUsers) {
      try {
        // Skip users without email
        const email = msUser.mail || msUser.userPrincipalName;
        if (!email) {
          skipped++;
          continue;
        }

        // Find or create department (new departments start inactive)
        let department = null;
        if (msUser.department) {
          [department] = await Department.findOrCreate({
            where: { name: msUser.department },
            defaults: {
              name: msUser.department,
              is_active: false // New departments start inactive
            }
          });
        }

        // Check if department is active (for auto opt-in of new users)
        const isDeptActive = department?.is_active || false;

        // Find or create user
        const [user, isCreated] = await User.findOrCreate({
          where: { microsoft_id: msUser.id },
          defaults: {
            microsoft_id: msUser.id,
            email: email,
            first_name: msUser.givenName || msUser.displayName?.split(' ')[0] || 'Unknown',
            last_name: msUser.surname || msUser.displayName?.split(' ').slice(1).join(' ') || 'User',
            department_id: department?.id,
            role: msUser.jobTitle,
            seniority_level: 'mid',
            is_active: true,
            // Auto opt-in if department is active
            is_opted_in: isDeptActive,
            opted_in_at: isDeptActive ? new Date() : null,
            opt_out_token: uuidv4(),
            last_synced_at: new Date()
          }
        });

        if (isCreated) {
          created++;
          logger.info(`Created new user: ${email}`);

          // If department is active, queue welcome email
          if (isDeptActive) {
            newUsersInActiveDepts.push({
              user,
              departmentName: department?.name
            });
          }
        } else {
          // Update existing user (but don't change opt-in status)
          const updates = {
            email: email,
            first_name: msUser.givenName || user.first_name,
            last_name: msUser.surname || user.last_name,
            department_id: department?.id || user.department_id,
            role: msUser.jobTitle || user.role,
            last_synced_at: new Date()
          };

          // Generate opt_out_token if missing
          if (!user.opt_out_token) {
            updates.opt_out_token = uuidv4();
          }

          await user.update(updates);
          updated++;
          logger.info(`Updated existing user: ${email}`);
        }
      } catch (userError) {
        logger.error(`Error processing user ${msUser.id}:`, userError);
        errors.push({
          userId: msUser.id,
          email: msUser.mail || msUser.userPrincipalName,
          error: userError.message
        });
      }
    }

    // Send welcome emails to new users in active departments
    for (const { user, departmentName } of newUsersInActiveDepts) {
      try {
        await emailService.sendWelcomeEmail(user, departmentName);
        await user.update({ welcome_sent_at: new Date() });
        welcomeEmailsSent++;
        logger.info(`Sent welcome email to new user: ${user.email}`);
      } catch (emailError) {
        logger.error(`Failed to send welcome email to ${user.email}:`, emailError);
      }
    }

    logger.info(`User sync completed: ${created} created, ${updated} updated, ${skipped} skipped, ${errors.length} errors, ${welcomeEmailsSent} welcome emails sent`);

    res.json({
      success: true,
      message: 'User sync completed',
      stats: {
        total: msUsers.length,
        created,
        updated,
        skipped,
        errors: errors.length,
        welcomeEmailsSent
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    logger.error('Sync users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to sync users'
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
