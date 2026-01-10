const { MatchingRound, Pairing, SystemSetting } = require('../models');
const matchingService = require('../services/matchingService');
const { getStartOfNextMonth } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get all matching rounds
 */
const getMatchingRounds = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const rounds = await MatchingRound.findAndCountAll({
      where,
      include: [
        {
          association: 'pairings',
          attributes: [],
          duplicating: false
        }
      ],
      order: [['scheduled_date', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      data: rounds.rows.map(round => ({
        id: round.id,
        name: round.name,
        scheduledDate: round.scheduled_date,
        executedAt: round.executed_at,
        status: round.status,
        totalParticipants: round.total_participants,
        totalPairings: round.total_pairings,
        errorMessage: round.error_message,
        createdAt: round.created_at
      })),
      pagination: {
        total: rounds.count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(rounds.count / parseInt(limit, 10))
      }
    });
  } catch (error) {
    logger.error('Get matching rounds error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch matching rounds'
    });
  }
};

/**
 * Get specific matching round by ID
 */
const getMatchingRoundById = async (req, res) => {
  try {
    const { roundId } = req.params;

    const round = await MatchingRound.findByPk(roundId, {
      include: [
        {
          association: 'pairings',
          include: [
            {
              association: 'user1',
              attributes: ['id', 'first_name', 'last_name', 'email', 'department_id'],
              include: [{ association: 'department', attributes: ['name'] }]
            },
            {
              association: 'user2',
              attributes: ['id', 'first_name', 'last_name', 'email', 'department_id'],
              include: [{ association: 'department', attributes: ['name'] }]
            },
            {
              association: 'icebreakers',
              attributes: ['id', 'topic', 'category'],
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!round) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Matching round not found'
      });
    }

    res.json({
      round: {
        id: round.id,
        name: round.name,
        scheduledDate: round.scheduled_date,
        executedAt: round.executed_at,
        status: round.status,
        totalParticipants: round.total_participants,
        totalPairings: round.total_pairings,
        errorMessage: round.error_message,
        createdAt: round.created_at
      },
      pairings: round.pairings.map(pairing => ({
        id: pairing.id,
        user1: {
          id: pairing.user1.id,
          firstName: pairing.user1.first_name,
          lastName: pairing.user1.last_name,
          email: pairing.user1.email,
          department: pairing.user1.department ? pairing.user1.department.name : null
        },
        user2: {
          id: pairing.user2.id,
          firstName: pairing.user2.first_name,
          lastName: pairing.user2.last_name,
          email: pairing.user2.email,
          department: pairing.user2.department ? pairing.user2.department.name : null
        },
        status: pairing.status,
        meetingScheduledAt: pairing.meeting_scheduled_at,
        meetingCompletedAt: pairing.meeting_completed_at,
        icebreakers: pairing.icebreakers.map(ib => ({
          id: ib.id,
          topic: ib.topic,
          category: ib.category
        })),
        createdAt: pairing.created_at
      }))
    });
  } catch (error) {
    logger.error('Get matching round by ID error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch matching round'
    });
  }
};

/**
 * Preview matching results (dry run)
 */
const previewMatching = async (req, res) => {
  try {
    logger.info(`Admin ${req.user.id} requested matching preview`);

    // Create temporary round for preview
    const tempRound = await MatchingRound.create({
      name: 'Preview',
      scheduled_date: new Date(),
      status: 'scheduled'
    });

    try {
      // Run matching algorithm in preview mode
      const result = await matchingService.runMatchingAlgorithm(tempRound.id, true);

      // Delete temporary round
      await tempRound.destroy();

      res.json({
        preview: {
          totalParticipants: result.totalParticipants,
          totalPairings: result.totalPairings,
          unpaired: result.unpaired,
          settings: result.settings
        },
        pairings: result.pairings
      });
    } catch (error) {
      // Clean up temporary round on error
      await tempRound.destroy();
      throw error;
    }
  } catch (error) {
    logger.error('Preview matching error:', error);

    if (error.message.includes('Not enough eligible participants')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to preview matching'
    });
  }
};

/**
 * Run matching algorithm (create and execute round)
 */
const runMatching = async (req, res) => {
  try {
    const { scheduledDate, name } = req.body;

    const date = scheduledDate ? new Date(scheduledDate) : new Date();

    logger.info(`Admin ${req.user.id} triggered matching for ${date.toISOString()}`);

    const result = await matchingService.createAndExecuteRound(date, name);

    res.json({
      message: 'Matching completed successfully',
      round: result.round,
      summary: {
        totalPairings: result.round.totalPairings,
        totalParticipants: result.round.totalParticipants,
        unpaired: result.unpaired
      }
    });
  } catch (error) {
    logger.error('Run matching error:', error);

    if (error.message.includes('Not enough eligible participants')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to run matching'
    });
  }
};

/**
 * Get matching settings
 */
const getMatchingSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll({
      where: {
        setting_key: {
          [require('sequelize').Op.like]: 'matching.%'
        }
      }
    });

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = {
        value: setting.getValue(),
        dataType: setting.data_type,
        description: setting.description
      };
    });

    res.json({ data: settingsObj });
  } catch (error) {
    logger.error('Get matching settings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch matching settings'
    });
  }
};

/**
 * Update matching settings
 */
const updateMatchingSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Settings object is required'
      });
    }

    const updatedSettings = {};

    for (const [key, value] of Object.entries(settings)) {
      const setting = await SystemSetting.findOne({
        where: { setting_key: key }
      });

      if (setting) {
        setting.setValue(value);
        setting.updated_by = req.user.id;
        await setting.save();

        updatedSettings[key] = {
          value: setting.getValue(),
          dataType: setting.data_type,
          description: setting.description
        };

        logger.info(`Admin ${req.user.id} updated setting ${key} to ${value}`);
      }
    }

    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    logger.error('Update matching settings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update settings'
    });
  }
};

/**
 * Get eligible participants count
 */
const getEligibleParticipantsCount = async (req, res) => {
  try {
    const participants = await matchingService.getEligibleParticipants();

    res.json({
      data: {
        count: participants.length,
        participants: participants.map(user => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          department: user.department ? user.department.name : null,
          seniorityLevel: user.seniority_level
        }))
      }
    });
  } catch (error) {
    logger.error('Get eligible participants error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch eligible participants'
    });
  }
};

module.exports = {
  getMatchingRounds,
  getMatchingRoundById,
  previewMatching,
  runMatching,
  getMatchingSettings,
  updateMatchingSettings,
  getEligibleParticipantsCount
};
