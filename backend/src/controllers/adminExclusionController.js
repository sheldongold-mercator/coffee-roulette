const { MatchingExclusion, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get all exclusions for a specific user
 */
const getUserExclusions = async (req, res) => {
  try {
    const { userId } = req.params;

    const exclusions = await MatchingExclusion.findAll({
      where: {
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
        ]
      },
      include: [
        {
          association: 'user1',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          include: [{ association: 'department', attributes: ['name'] }]
        },
        {
          association: 'user2',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          include: [{ association: 'department', attributes: ['name'] }]
        },
        {
          association: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Transform response to always show the "other" user from perspective of userId
    const transformedExclusions = exclusions.map(exc => {
      const isUser1 = exc.user1_id === parseInt(userId, 10);
      const otherUser = isUser1 ? exc.user2 : exc.user1;

      return {
        id: exc.id,
        excludedUser: {
          id: otherUser.id,
          firstName: otherUser.first_name,
          lastName: otherUser.last_name,
          email: otherUser.email,
          department: otherUser.department?.name || null
        },
        reason: exc.reason,
        createdBy: exc.createdByUser ? {
          id: exc.createdByUser.id,
          firstName: exc.createdByUser.first_name,
          lastName: exc.createdByUser.last_name
        } : null,
        createdAt: exc.created_at
      };
    });

    res.json({
      data: transformedExclusions
    });
  } catch (error) {
    logger.error('Get user exclusions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch exclusions'
    });
  }
};

/**
 * Add an exclusion between two users
 */
const addExclusion = async (req, res) => {
  try {
    const { userId } = req.params;
    const { excludedUserId, reason } = req.body;

    if (!excludedUserId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'excludedUserId is required'
      });
    }

    if (parseInt(userId, 10) === parseInt(excludedUserId, 10)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot exclude a user from themselves'
      });
    }

    // Verify both users exist
    const [user, excludedUser] = await Promise.all([
      User.findByPk(userId),
      User.findByPk(excludedUserId)
    ]);

    if (!user || !excludedUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'One or both users not found'
      });
    }

    // Ensure consistent ordering (smaller ID first) to avoid duplicate pairs
    const [smallerId, largerId] = [parseInt(userId, 10), parseInt(excludedUserId, 10)].sort((a, b) => a - b);

    // Check if exclusion already exists
    const existing = await MatchingExclusion.findOne({
      where: {
        user1_id: smallerId,
        user2_id: largerId
      }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Exclusion already exists between these users'
      });
    }

    // Create the exclusion
    const exclusion = await MatchingExclusion.create({
      user1_id: smallerId,
      user2_id: largerId,
      reason: reason || null,
      created_by: req.user.id
    });

    logger.info(`Admin ${req.user.id} created exclusion between users ${smallerId} and ${largerId}`, {
      exclusionId: exclusion.id,
      reason
    });

    res.status(201).json({
      message: 'Exclusion created successfully',
      data: {
        id: exclusion.id,
        user1Id: exclusion.user1_id,
        user2Id: exclusion.user2_id,
        reason: exclusion.reason,
        createdAt: exclusion.created_at
      }
    });
  } catch (error) {
    logger.error('Add exclusion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create exclusion'
    });
  }
};

/**
 * Remove an exclusion
 */
const removeExclusion = async (req, res) => {
  try {
    const { exclusionId } = req.params;

    const exclusion = await MatchingExclusion.findByPk(exclusionId);

    if (!exclusion) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exclusion not found'
      });
    }

    const { user1_id, user2_id } = exclusion;
    await exclusion.destroy();

    logger.info(`Admin ${req.user.id} removed exclusion ${exclusionId} between users ${user1_id} and ${user2_id}`);

    res.json({
      message: 'Exclusion removed successfully'
    });
  } catch (error) {
    logger.error('Remove exclusion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove exclusion'
    });
  }
};

/**
 * Get all exclusions (admin overview)
 */
const getAllExclusions = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows: exclusions } = await MatchingExclusion.findAndCountAll({
      include: [
        {
          association: 'user1',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          include: [{ association: 'department', attributes: ['name'] }]
        },
        {
          association: 'user2',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          include: [{ association: 'department', attributes: ['name'] }]
        },
        {
          association: 'createdByUser',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      data: exclusions.map(exc => ({
        id: exc.id,
        user1: {
          id: exc.user1.id,
          firstName: exc.user1.first_name,
          lastName: exc.user1.last_name,
          email: exc.user1.email,
          department: exc.user1.department?.name || null
        },
        user2: {
          id: exc.user2.id,
          firstName: exc.user2.first_name,
          lastName: exc.user2.last_name,
          email: exc.user2.email,
          department: exc.user2.department?.name || null
        },
        reason: exc.reason,
        createdBy: exc.createdByUser ? {
          id: exc.createdByUser.id,
          firstName: exc.createdByUser.first_name,
          lastName: exc.createdByUser.last_name
        } : null,
        createdAt: exc.created_at
      })),
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10))
      }
    });
  } catch (error) {
    logger.error('Get all exclusions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch exclusions'
    });
  }
};

module.exports = {
  getUserExclusions,
  addExclusion,
  removeExclusion,
  getAllExclusions
};
