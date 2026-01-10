const { SystemSetting } = require('../models');
const logger = require('../utils/logger');
const jobOrchestrator = require('../jobs');

/**
 * Get all system settings
 */
const getAllSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll({
      order: [['setting_key', 'ASC']]
    });

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = {
        value: setting.getValue(),
        dataType: setting.data_type,
        description: setting.description,
        updatedAt: setting.updated_at,
        updatedBy: setting.updated_by
      };
    });

    res.json({ data: settingsObj });
  } catch (error) {
    logger.error('Get all settings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch settings'
    });
  }
};

/**
 * Get settings by category (prefix)
 */
const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const settings = await SystemSetting.findAll({
      where: {
        setting_key: {
          [require('sequelize').Op.like]: `${category}.%`
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

    res.json({ data: settingsObj, category });
  } catch (error) {
    logger.error('Get settings by category error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch settings'
    });
  }
};

/**
 * Update a system setting
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Value is required'
      });
    }

    const setting = await SystemSetting.findOne({
      where: { setting_key: key }
    });

    if (!setting) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Setting not found'
      });
    }

    setting.setValue(value);
    setting.updated_by = req.user.id;
    await setting.save();

    logger.info(`Admin ${req.user.id} updated setting ${key} to ${value}`);

    res.json({
      message: 'Setting updated successfully',
      setting: {
        key: setting.setting_key,
        value: setting.getValue(),
        dataType: setting.data_type,
        description: setting.description
      }
    });
  } catch (error) {
    logger.error('Update setting error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update setting'
    });
  }
};

/**
 * Update multiple settings at once
 */
const updateMultipleSettings = async (req, res) => {
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
    logger.error('Update multiple settings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update settings'
    });
  }
};

/**
 * Get job status
 */
const getJobStatus = async (req, res) => {
  try {
    const status = jobOrchestrator.getStatus();

    res.json({ data: status });
  } catch (error) {
    logger.error('Get job status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch job status'
    });
  }
};

/**
 * Manually trigger a job
 */
const triggerJob = async (req, res) => {
  try {
    const { jobKey } = req.params;

    logger.info(`Admin ${req.user.id} manually triggering job: ${jobKey}`);

    // For now, return a message that manual triggering is not yet fully implemented
    // In a full implementation, we would extract job logic into separate functions
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Manual job triggering is not yet implemented. Jobs run on their scheduled intervals.'
    });
  } catch (error) {
    logger.error('Trigger job error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to trigger job'
    });
  }
};

module.exports = {
  getAllSettings,
  getSettingsByCategory,
  updateSetting,
  updateMultipleSettings,
  getJobStatus,
  triggerJob
};
