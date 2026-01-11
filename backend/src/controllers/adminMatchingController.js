const { MatchingRound, Pairing, SystemSetting } = require('../models');
const matchingService = require('../services/matchingService');
const scheduleService = require('../services/scheduleService');
const jobOrchestrator = require('../jobs');
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
        createdAt: round.created_at,
        source: round.source || null
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
        createdAt: round.created_at,
        source: round.source || null
      },
      pairings: (round.pairings || []).map(pairing => ({
        id: pairing.id,
        user1: pairing.user1 ? {
          id: pairing.user1.id,
          firstName: pairing.user1.first_name,
          lastName: pairing.user1.last_name,
          email: pairing.user1.email,
          department: pairing.user1.department ? pairing.user1.department.name : null
        } : { firstName: 'Unknown', lastName: 'User', department: null },
        user2: pairing.user2 ? {
          id: pairing.user2.id,
          firstName: pairing.user2.first_name,
          lastName: pairing.user2.last_name,
          email: pairing.user2.email,
          department: pairing.user2.department ? pairing.user2.department.name : null
        } : { firstName: 'Unknown', lastName: 'User', department: null },
        status: pairing.status,
        meetingScheduledAt: pairing.meeting_scheduled_at,
        meetingCompletedAt: pairing.meeting_completed_at,
        icebreakers: (pairing.icebreakers || []).map(ib => ({
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
  let tempRound = null;

  try {
    logger.info(`Admin ${req.user.id} requested matching preview`);

    // Create temporary round for preview
    tempRound = await MatchingRound.create({
      name: 'Preview',
      scheduled_date: new Date(),
      status: 'scheduled'
    });

    // Run matching algorithm in preview mode
    const result = await matchingService.runMatchingAlgorithm(tempRound.id, true);

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
  } finally {
    // Always clean up the temporary round
    if (tempRound) {
      try {
        await tempRound.destroy();
      } catch (cleanupError) {
        logger.error('Failed to cleanup preview round:', cleanupError);
      }
    }
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

/**
 * Get schedule configuration
 */
const getScheduleConfig = async (req, res) => {
  try {
    const config = await scheduleService.getScheduleConfig();
    const presets = scheduleService.getPresets();

    res.json({
      data: {
        ...config,
        presets
      }
    });
  } catch (error) {
    logger.error('Get schedule config error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch schedule configuration'
    });
  }
};

/**
 * Update schedule configuration
 */
const updateSchedule = async (req, res) => {
  try {
    const { scheduleType, nextRunDate, timezone } = req.body;

    if (!scheduleType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Schedule type is required'
      });
    }

    logger.info(`Admin ${req.user.id} updating schedule to ${scheduleType}`, { nextRunDate });

    // Update schedule in settings
    const result = await scheduleService.updateSchedule(scheduleType, { nextRunDate, timezone });

    // Update the running cron job
    let jobUpdateSuccess = true;
    try {
      await jobOrchestrator.updateJobSchedule('monthlyMatching', result.cronExpression, result.timezone);
    } catch (jobError) {
      jobUpdateSuccess = false;
      logger.error('Failed to update cron job (settings were saved):', jobError);
    }

    res.json({
      message: jobUpdateSuccess
        ? 'Schedule updated successfully'
        : 'Schedule saved but will take effect after server restart',
      data: result,
      jobActive: jobUpdateSuccess
    });
  } catch (error) {
    logger.error('Update schedule error:', error);

    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update schedule'
    });
  }
};

/**
 * Toggle auto-scheduling on/off
 */
const toggleAutoSchedule = async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'enabled must be a boolean'
      });
    }

    logger.info(`Admin ${req.user.id} ${enabled ? 'enabling' : 'disabling'} auto-schedule`);

    const result = await scheduleService.setAutoScheduleEnabled(enabled);

    res.json({
      message: `Auto-scheduling ${enabled ? 'enabled' : 'disabled'}`,
      data: result
    });
  } catch (error) {
    logger.error('Toggle auto-schedule error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to toggle auto-scheduling'
    });
  }
};

/**
 * Run manual matching with filters
 */
const runManualMatching = async (req, res) => {
  try {
    const {
      name,
      scheduledDate,
      filters,
      options = {}
    } = req.body;

    const date = scheduledDate ? new Date(scheduledDate) : new Date();

    logger.info(`Admin ${req.user.id} running manual matching`, {
      filters,
      options
    });

    const result = await matchingService.createAndExecuteRound(date, name, {
      source: 'manual',
      filters: filters || null,
      ignoreRecentHistory: options.ignoreRecentHistory || false,
      resetAutoSchedule: options.resetAutoSchedule || false,
      triggeredByUserId: req.user.id
    });

    res.json({
      message: 'Manual matching completed successfully',
      round: result.round,
      summary: {
        totalPairings: result.round.totalPairings,
        totalParticipants: result.round.totalParticipants,
        unpaired: result.unpaired,
        filtersApplied: result.round.filtersApplied,
        ignoredRecentHistory: result.round.ignoredRecentHistory
      }
    });
  } catch (error) {
    logger.error('Run manual matching error:', error);

    if (error.message.includes('Not enough eligible participants')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to run manual matching'
    });
  }
};

/**
 * Preview matching with filters
 */
const previewMatchingWithFilters = async (req, res) => {
  try {
    const { filters, options = {} } = req.body;

    logger.info(`Admin ${req.user.id} previewing matching with filters`, { filters, options });

    const result = await matchingService.previewMatchingWithFilters(filters, {
      ignoreRecentHistory: options.ignoreRecentHistory || false
    });

    res.json({
      preview: {
        totalParticipants: result.totalParticipants,
        totalPairings: result.totalPairings,
        unpaired: result.unpaired,
        settings: result.settings,
        filters: result.filters,
        ignoreRecentHistory: result.ignoreRecentHistory
      },
      pairings: result.pairings
    });
  } catch (error) {
    logger.error('Preview matching with filters error:', error);

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

module.exports = {
  getMatchingRounds,
  getMatchingRoundById,
  previewMatching,
  runMatching,
  getMatchingSettings,
  updateMatchingSettings,
  getEligibleParticipantsCount,
  getScheduleConfig,
  updateSchedule,
  toggleAutoSchedule,
  runManualMatching,
  previewMatchingWithFilters
};
