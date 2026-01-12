const { User, Pairing, MeetingFeedback, MatchingRound } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');
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
        availableFrom: user.available_from,
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

    if (seniorityLevel && ['junior', 'mid', 'senior', 'lead', 'head', 'executive'].includes(seniorityLevel)) {
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

    // When user manually opts in via Portal, skip the grace period
    // so they can participate in the next matching round immediately
    await user.update({
      is_opted_in: true,
      opted_in_at: new Date(),
      skip_grace_period: true
    });
    logger.info(`User ${user.id} opted in to Coffee Roulette (grace period skipped)`);

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
        },
        {
          association: 'feedback',
          attributes: ['id', 'user_id', 'rating', 'comments', 'created_at']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    const formattedPairings = pairings.rows.map(pairing => {
      const partner = pairing.user1_id === user.id ? pairing.user2 : pairing.user1;
      const feedbackList = pairing.feedback || [];

      // Get user's own feedback and partner's feedback
      const myFeedback = feedbackList.find(f => f.user_id === user.id);
      const partnerFeedback = feedbackList.find(f => f.user_id === partner.id);

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
        myFeedback: myFeedback ? {
          rating: myFeedback.rating,
          comments: myFeedback.comments,
          submittedAt: myFeedback.created_at
        } : null,
        partnerFeedback: partnerFeedback ? {
          rating: partnerFeedback.rating,
          comments: partnerFeedback.comments,
          submittedAt: partnerFeedback.created_at
        } : null,
        createdAt: pairing.created_at
      };
    });

    // Get total matching rounds in the system
    const totalRounds = await MatchingRound.count();

    res.json({
      pairings: formattedPairings,
      total: pairings.count,
      totalRounds,
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
          [Op.in]: ['pending', 'confirmed', 'completed']
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
        },
        {
          association: 'feedback',
          where: { user_id: user.id },
          required: false,
          attributes: ['id', 'rating', 'comments', 'topics_discussed']
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
    const userFeedback = pairing.feedback && pairing.feedback.length > 0 ? pairing.feedback[0] : null;

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
        feedback: userFeedback ? {
          id: userFeedback.id,
          rating: userFeedback.rating,
          comments: userFeedback.comments,
          topicsDiscussed: userFeedback.topics_discussed
        } : null,
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

      // Notify the partner that the meeting was confirmed and ask for feedback
      try {
        await notificationService.notifyPartnerMeetingConfirmed(pairingId, user.id);
      } catch (notifyError) {
        // Log but don't fail the request if notification fails
        logger.error('Failed to notify partner of meeting confirmation:', notifyError);
      }
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

/**
 * Set availability date (temporary opt-out)
 * Users can set a future date when they'll be available again
 */
const setAvailability = async (req, res) => {
  try {
    const user = req.user;
    const { availableFrom } = req.body;

    // Validate the date if provided
    if (availableFrom) {
      const date = new Date(availableFrom);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid date format'
        });
      }

      // Date must be in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Available from date must be today or in the future'
        });
      }
    }

    await user.update({
      available_from: availableFrom || null
    });

    if (availableFrom) {
      logger.info(`User ${user.id} set temporary opt-out until ${availableFrom}`);
    } else {
      logger.info(`User ${user.id} cleared their availability date`);
    }

    res.json({
      message: availableFrom
        ? 'Availability date set successfully'
        : 'Availability date cleared',
      availableFrom: user.available_from
    });
  } catch (error) {
    logger.error('Set availability error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to set availability'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  optIn,
  optOut,
  setAvailability,
  getPairings,
  getCurrentPairing,
  confirmMeeting,
  submitFeedback
};
