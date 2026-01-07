const { User, Pairing, MeetingFeedback } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get user's own profile
 */
const getProfile = async (req, res) => {
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
        lastSyncedAt: user.last_synced_at,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch profile'
    });
  }
};

/**
 * Update user's own profile
 */
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { seniorityLevel } = req.body;

    // Users can only update limited fields themselves
    const allowedUpdates = {};

    if (seniorityLevel && ['junior', 'mid', 'senior', 'lead', 'executive'].includes(seniorityLevel)) {
      allowedUpdates.seniority_level = seniorityLevel;
    }

    if (Object.keys(allowedUpdates).length > 0) {
      await user.update(allowedUpdates);
      logger.info(`User ${user.id} updated their profile`);
    }

    await user.reload({
      include: [{ association: 'department' }]
    });

    res.json({
      message: 'Profile updated successfully',
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
        isOptedIn: user.is_opted_in
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
};

/**
 * Opt in to Coffee Roulette
 */
const optIn = async (req, res) => {
  try {
    const user = req.user;

    if (user.is_opted_in) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You are already opted in'
      });
    }

    await user.update({ is_opted_in: true });
    logger.info(`User ${user.id} opted in to Coffee Roulette`);

    res.json({
      message: 'Successfully opted in to Coffee Roulette',
      isOptedIn: true
    });
  } catch (error) {
    logger.error('Opt in error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to opt in'
    });
  }
};

/**
 * Opt out of Coffee Roulette
 */
const optOut = async (req, res) => {
  try {
    const user = req.user;

    if (!user.is_opted_in) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You are already opted out'
      });
    }

    await user.update({ is_opted_in: false });
    logger.info(`User ${user.id} opted out of Coffee Roulette`);

    res.json({
      message: 'Successfully opted out of Coffee Roulette',
      isOptedIn: false
    });
  } catch (error) {
    logger.error('Opt out error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to opt out'
    });
  }
};

/**
 * Get user's pairing history
 */
const getPairings = async (req, res) => {
  try {
    const user = req.user;
    const { limit = 10, offset = 0 } = req.query;

    const pairings = await Pairing.findAndCountAll({
      where: {
        [Op.or]: [
          { user1_id: user.id },
          { user2_id: user.id }
        ]
      },
      include: [
        {
          association: 'user1',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role']
        },
        {
          association: 'user2',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role']
        },
        {
          association: 'matchingRound',
          attributes: ['id', 'name', 'scheduled_date']
        },
        {
          association: 'icebreakers',
          attributes: ['id', 'topic', 'category'],
          through: { attributes: [] }
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    const formattedPairings = pairings.rows.map(pairing => {
      const partner = pairing.user1_id === user.id ? pairing.user2 : pairing.user1;

      return {
        id: pairing.id,
        partner: {
          id: partner.id,
          firstName: partner.first_name,
          lastName: partner.last_name,
          email: partner.email,
          role: partner.role
        },
        round: pairing.matchingRound ? {
          id: pairing.matchingRound.id,
          name: pairing.matchingRound.name,
          date: pairing.matchingRound.scheduled_date
        } : null,
        status: pairing.status,
        meetingScheduledAt: pairing.meeting_scheduled_at,
        meetingCompletedAt: pairing.meeting_completed_at,
        icebreakers: pairing.icebreakers.map(ib => ({
          id: ib.id,
          topic: ib.topic,
          category: ib.category
        })),
        createdAt: pairing.created_at
      };
    });

    res.json({
      pairings: formattedPairings,
      total: pairings.count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
  } catch (error) {
    logger.error('Get pairings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch pairings'
    });
  }
};

/**
 * Get user's current/upcoming pairing
 */
const getCurrentPairing = async (req, res) => {
  try {
    const user = req.user;

    const pairing = await Pairing.findOne({
      where: {
        [Op.or]: [
          { user1_id: user.id },
          { user2_id: user.id }
        ],
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      },
      include: [
        {
          association: 'user1',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'department_id'],
          include: [{ association: 'department', attributes: ['name'] }]
        },
        {
          association: 'user2',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'department_id'],
          include: [{ association: 'department', attributes: ['name'] }]
        },
        {
          association: 'matchingRound',
          attributes: ['id', 'name', 'scheduled_date']
        },
        {
          association: 'icebreakers',
          attributes: ['id', 'topic', 'category'],
          through: { attributes: [] }
        }
      ],
      order: [['created_at', 'DESC']]
    });

    if (!pairing) {
      return res.json({
        pairing: null,
        message: 'No current pairing'
      });
    }

    const partner = pairing.user1_id === user.id ? pairing.user2 : pairing.user1;

    res.json({
      pairing: {
        id: pairing.id,
        partner: {
          id: partner.id,
          firstName: partner.first_name,
          lastName: partner.last_name,
          email: partner.email,
          role: partner.role,
          department: partner.department ? partner.department.name : null
        },
        round: pairing.matchingRound ? {
          id: pairing.matchingRound.id,
          name: pairing.matchingRound.name,
          date: pairing.matchingRound.scheduled_date
        } : null,
        status: pairing.status,
        meetingScheduledAt: pairing.meeting_scheduled_at,
        icebreakers: pairing.icebreakers.map(ib => ({
          id: ib.id,
          topic: ib.topic,
          category: ib.category
        })),
        createdAt: pairing.created_at
      }
    });
  } catch (error) {
    logger.error('Get current pairing error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch current pairing'
    });
  }
};

/**
 * Confirm meeting completion
 */
const confirmMeeting = async (req, res) => {
  try {
    const user = req.user;
    const { pairingId } = req.params;

    const pairing = await Pairing.findByPk(pairingId);

    if (!pairing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Pairing not found'
      });
    }

    // Verify user is part of this pairing
    if (pairing.user1_id !== user.id && pairing.user2_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not part of this pairing'
      });
    }

    // Update status to completed if not already
    if (pairing.status !== 'completed') {
      await pairing.update({
        status: 'completed',
        meeting_completed_at: new Date()
      });

      logger.info(`User ${user.id} confirmed meeting completion for pairing ${pairingId}`);
    }

    res.json({
      message: 'Meeting confirmed successfully',
      pairing: {
        id: pairing.id,
        status: pairing.status,
        meetingCompletedAt: pairing.meeting_completed_at
      }
    });
  } catch (error) {
    logger.error('Confirm meeting error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to confirm meeting'
    });
  }
};

/**
 * Submit meeting feedback
 */
const submitFeedback = async (req, res) => {
  try {
    const user = req.user;
    const { pairingId } = req.params;
    const { rating, comments, topicsDiscussed } = req.body;

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rating must be between 1 and 5'
      });
    }

    const pairing = await Pairing.findByPk(pairingId);

    if (!pairing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Pairing not found'
      });
    }

    // Verify user is part of this pairing
    if (pairing.user1_id !== user.id && pairing.user2_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not part of this pairing'
      });
    }

    // Create or update feedback
    const [feedback, created] = await MeetingFeedback.findOrCreate({
      where: {
        pairing_id: pairingId,
        user_id: user.id
      },
      defaults: {
        rating,
        comments,
        topics_discussed: topicsDiscussed
      }
    });

    if (!created) {
      await feedback.update({
        rating,
        comments,
        topics_discussed: topicsDiscussed
      });
    }

    logger.info(`User ${user.id} submitted feedback for pairing ${pairingId}`);

    res.json({
      message: created ? 'Feedback submitted successfully' : 'Feedback updated successfully',
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
        comments: feedback.comments,
        topicsDiscussed: feedback.topics_discussed
      }
    });
  } catch (error) {
    logger.error('Submit feedback error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit feedback'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  optIn,
  optOut,
  getPairings,
  getCurrentPairing,
  confirmMeeting,
  submitFeedback
};
