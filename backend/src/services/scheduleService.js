const cron = require('node-cron');
const { CronExpressionParser } = require('cron-parser');
const { SystemSetting } = require('../models');
const logger = require('../utils/logger');

/**
 * Schedule Service
 * Manages dynamic scheduling configuration for matching rounds
 */
class ScheduleService {
  constructor() {
    // Preset schedule mappings
    this.presets = {
      weekly: '0 9 * * 1',        // Every Monday at 9:00 AM
      biweekly: '0 9 1,15 * *',   // 1st and 15th of each month at 9:00 AM
      monthly: '0 9 1 * *'        // 1st of each month at 9:00 AM
    };
  }

  /**
   * Get current schedule configuration from system settings
   */
  async getScheduleConfig() {
    try {
      const scheduleType = await this.getSetting('matching.schedule_type', 'monthly');
      const cronExpression = await this.getSetting('matching.cron_expression', '0 9 1 * *');
      const timezone = await this.getSetting('matching.schedule_timezone', 'America/New_York');
      const enabled = await this.getSetting('matching.auto_schedule_enabled', true);
      const lastScheduledRunAt = await this.getSetting('matching.last_scheduled_run_at', null);
      const storedNextRunDate = await this.getSetting('matching.next_run_date', null);

      // Use stored next run date if available and in future, otherwise calculate from cron
      let nextRunDate = null;
      if (enabled) {
        if (storedNextRunDate && new Date(storedNextRunDate) > new Date()) {
          nextRunDate = storedNextRunDate;
        } else {
          const effectiveCron = this.presets[scheduleType] || this.presets.monthly;
          nextRunDate = this.getNextRunDate(effectiveCron, timezone);
        }
      }

      return {
        scheduleType,
        cronExpression,
        timezone,
        enabled,
        nextRunDate,
        lastScheduledRunAt,
        presets: this.getPresets()
      };
    } catch (error) {
      logger.error('Error getting schedule config:', error);
      throw error;
    }
  }

  /**
   * Update schedule configuration with explicit next run date
   */
  async updateSchedule(scheduleType, options = {}) {
    try {
      const { nextRunDate, timezone } = options;

      // Validate schedule type
      const validTypes = ['weekly', 'biweekly', 'monthly'];
      if (!validTypes.includes(scheduleType)) {
        throw new Error(`Invalid schedule type: ${scheduleType}. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate next run date if provided
      if (nextRunDate) {
        const parsedDate = new Date(nextRunDate);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid next run date');
        }
        if (parsedDate <= new Date()) {
          throw new Error('Next run date must be in the future');
        }
      }

      // Calculate cron expression from schedule type and next run date
      const effectiveCron = this.calculateCronFromSchedule(scheduleType, nextRunDate);

      // Update settings
      await this.setSetting('matching.schedule_type', scheduleType);
      await this.setSetting('matching.cron_expression', effectiveCron);

      // Store the explicit next run date if provided
      if (nextRunDate) {
        await this.setSetting('matching.next_run_date', nextRunDate);
      }

      if (timezone) {
        await this.setSetting('matching.schedule_timezone', timezone);
      }

      const currentTimezone = timezone || await this.getSetting('matching.schedule_timezone', 'America/New_York');

      logger.info(`Schedule updated to ${scheduleType}, next run: ${nextRunDate || 'calculated from cron'}`);

      return {
        scheduleType,
        cronExpression: effectiveCron,
        timezone: currentTimezone,
        nextRunDate: nextRunDate || this.getNextRunDate(effectiveCron, currentTimezone)
      };
    } catch (error) {
      logger.error('Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * Calculate cron expression from schedule type and optional start date
   */
  calculateCronFromSchedule(scheduleType, startDate = null) {
    if (!startDate) {
      return this.presets[scheduleType] || this.presets.monthly;
    }

    const date = new Date(startDate);
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();

    switch (scheduleType) {
      case 'weekly':
        // Run every week on the same day of week at the same time
        return `${minute} ${hour} * * ${dayOfWeek}`;
      case 'biweekly':
        // For bi-weekly, use day of month approach (1st and 15th, or specific days)
        // This is a simplification - true bi-weekly would need more complex logic
        return `${minute} ${hour} ${dayOfMonth} * *`;
      case 'monthly':
        // Run monthly on the same day at the same time
        return `${minute} ${hour} ${dayOfMonth} * *`;
      default:
        return this.presets.monthly;
    }
  }

  /**
   * Enable or disable auto-scheduling
   */
  async setAutoScheduleEnabled(enabled) {
    await this.setSetting('matching.auto_schedule_enabled', enabled);
    logger.info(`Auto-scheduling ${enabled ? 'enabled' : 'disabled'}`);

    // If enabling, return the next run date
    let nextRunDate = null;
    if (enabled) {
      const storedNextRunDate = await this.getSetting('matching.next_run_date', null);
      if (storedNextRunDate && new Date(storedNextRunDate) > new Date()) {
        nextRunDate = storedNextRunDate;
      } else {
        const scheduleType = await this.getSetting('matching.schedule_type', 'monthly');
        const cronExpression = this.presets[scheduleType] || this.presets.monthly;
        const timezone = await this.getSetting('matching.schedule_timezone', 'America/New_York');
        nextRunDate = this.getNextRunDate(cronExpression, timezone);
      }
    }

    return { enabled, nextRunDate };
  }

  /**
   * Record that a scheduled run occurred
   */
  async recordScheduledRun() {
    const timestamp = new Date().toISOString();
    await this.setSetting('matching.last_scheduled_run_at', timestamp);
    return timestamp;
  }

  /**
   * Calculate the next run date from a cron expression
   */
  getNextRunDate(cronExpression, timezone = 'America/New_York') {
    try {
      const parser = CronExpressionParser.parse(cronExpression, {
        tz: timezone,
        currentDate: new Date()
      });
      return parser.next().toISOString();
    } catch (error) {
      logger.error('Error calculating next run date:', error.message);
      return null;
    }
  }

  /**
   * Validate a cron expression
   */
  validateCronExpression(expression) {
    return cron.validate(expression);
  }

  /**
   * Get a preset cron expression
   */
  getPresetCron(presetType) {
    return this.presets[presetType] || null;
  }

  /**
   * Get all available presets
   */
  getPresets() {
    return Object.entries(this.presets).map(([type, cron]) => ({
      type,
      cronExpression: cron,
      description: this.getPresetDescription(type)
    }));
  }

  /**
   * Get human-readable description for preset
   */
  getPresetDescription(presetType) {
    const descriptions = {
      weekly: 'Every Monday at 9:00 AM',
      biweekly: '1st and 15th of each month at 9:00 AM',
      monthly: '1st of each month at 9:00 AM'
    };
    return descriptions[presetType] || 'Custom schedule';
  }

  /**
   * Helper: Get setting value
   */
  async getSetting(key, defaultValue) {
    try {
      const setting = await SystemSetting.findOne({ where: { setting_key: key } });
      if (!setting) return defaultValue;
      return setting.getValue();
    } catch (error) {
      logger.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Helper: Set setting value
   */
  async setSetting(key, value, updatedBy = null) {
    try {
      let setting = await SystemSetting.findOne({ where: { setting_key: key } });

      if (setting) {
        setting.setValue(value);
        if (updatedBy) setting.updated_by = updatedBy;
        await setting.save();
      } else {
        // Create new setting with inferred data type
        const dataType = typeof value === 'boolean' ? 'boolean' :
                         typeof value === 'number' ? 'number' :
                         typeof value === 'object' ? 'json' : 'string';

        setting = await SystemSetting.create({
          setting_key: key,
          setting_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          data_type: dataType,
          updated_by: updatedBy
        });
      }

      return setting.getValue();
    } catch (error) {
      logger.error(`Error setting ${key}:`, error);
      throw error;
    }
  }
}

module.exports = new ScheduleService();
