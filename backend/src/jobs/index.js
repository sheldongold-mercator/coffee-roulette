const cron = require('node-cron');
const logger = require('../utils/logger');

// Import job execution functions (not the cron instances)
const { executeMonthlyMatching } = require('./monthlyMatching');
const notificationProcessingJob = require('./processNotifications');
const dailyUserSyncJob = require('./dailyUserSync');
const weeklyRemindersJob = require('./weeklyReminders');

/**
 * Job orchestrator
 * Manages all scheduled jobs with dynamic schedule support
 */
class JobOrchestrator {
  constructor() {
    // Job configurations - monthlyMatching uses dynamic scheduling
    this.jobConfigs = {
      monthlyMatching: {
        name: 'Monthly Matching',
        defaultSchedule: '0 9 1 * *',
        description: 'Creates coffee pairing matches on configured schedule',
        isDynamic: true, // Schedule can be updated at runtime
        timezone: 'America/New_York'
      },
      notificationProcessing: {
        name: 'Notification Processing',
        defaultSchedule: '*/5 * * * *',
        description: 'Processes pending notifications every 5 minutes',
        isDynamic: false
      },
      dailyUserSync: {
        name: 'Daily User Sync',
        defaultSchedule: '0 2 * * *',
        description: 'Syncs users from Microsoft Graph every day at 2:00 AM',
        isDynamic: false,
        timezone: 'America/New_York'
      },
      weeklyReminders: {
        name: 'Weekly Pairing Reminders',
        defaultSchedule: '0 9 * * 1',
        description: 'Sends reminder notifications for pending pairings every Monday at 9:00 AM',
        isDynamic: false,
        timezone: 'America/New_York'
      }
    };

    // Active cron job instances
    this.cronInstances = {};

    // Legacy compatibility
    this.jobs = {};

    this.isRunning = false;
  }

  /**
   * Create a matching cron job with the specified schedule
   */
  createMatchingCronJob(schedule, timezone, configName) {
    return cron.schedule(schedule, async () => {
      logger.info(`Executing job: ${configName}`);
      try {
        await executeMonthlyMatching();
        const scheduleService = require('../services/scheduleService');
        await scheduleService.recordScheduledRun();
      } catch (error) {
        logger.error(`Job ${configName} execution failed:`, error);
      }
    }, {
      scheduled: false,
      timezone: timezone
    });
  }

  /**
   * Initialize and start all scheduled jobs
   */
  async startAll() {
    if (this.isRunning) {
      logger.warn('Jobs are already running');
      return;
    }

    logger.info('Starting all scheduled jobs...');

    try {
      // Start dynamic job (monthly matching) with schedule from settings
      await this.initializeDynamicJob('monthlyMatching');

      // Start static jobs
      this.startStaticJob('notificationProcessing', notificationProcessingJob);
      this.startStaticJob('dailyUserSync', dailyUserSyncJob);
      this.startStaticJob('weeklyReminders', weeklyRemindersJob);

      this.isRunning = true;
      logger.info('All scheduled jobs started successfully');
    } catch (error) {
      logger.error('Error starting jobs:', error);
    }
  }

  /**
   * Initialize a dynamic job with schedule from database
   */
  async initializeDynamicJob(jobKey) {
    const config = this.jobConfigs[jobKey];
    if (!config) {
      throw new Error(`Job config not found: ${jobKey}`);
    }

    try {
      // Stop existing job if it exists (for reinitialization scenarios)
      if (this.cronInstances[jobKey] && typeof this.cronInstances[jobKey].stop === 'function') {
        this.cronInstances[jobKey].stop();
        delete this.cronInstances[jobKey];
        logger.info(`Stopped existing job ${config.name} for reinitialization`);
      }

      // Get schedule from database settings
      const scheduleService = require('../services/scheduleService');
      const scheduleConfig = await scheduleService.getScheduleConfig();

      const schedule = scheduleConfig.cronExpression || config.defaultSchedule;
      const timezone = scheduleConfig.timezone || config.timezone || 'America/New_York';
      const enabled = scheduleConfig.enabled !== false;

      if (!enabled) {
        logger.info(`Job ${config.name} is disabled, skipping...`);
        this.jobs[jobKey] = {
          name: config.name,
          schedule: schedule,
          description: config.description,
          running: false,
          enabled: false
        };
        return;
      }

      // Create and start cron job
      const cronJob = this.createMatchingCronJob(schedule, timezone, config.name);
      cronJob.start();
      this.cronInstances[jobKey] = cronJob;
      this.jobs[jobKey] = {
        name: config.name,
        schedule: schedule,
        description: config.description,
        running: true,
        enabled: true,
        isDynamic: true
      };

      logger.info(`Started dynamic job: ${config.name}`, {
        schedule: schedule,
        timezone: timezone,
        nextRun: scheduleConfig.nextRunDate
      });
    } catch (error) {
      logger.error(`Failed to initialize dynamic job ${jobKey}:`, error);
      // Fall back to default schedule
      this.startStaticJobWithConfig(jobKey, config, executeMonthlyMatching);
    }
  }

  /**
   * Start a static (non-dynamic) job
   */
  startStaticJob(jobKey, jobInstance) {
    const config = this.jobConfigs[jobKey];
    if (!config) {
      logger.error(`Job config not found: ${jobKey}`);
      return;
    }

    try {
      jobInstance.start();
      this.cronInstances[jobKey] = jobInstance;
      this.jobs[jobKey] = {
        name: config.name,
        schedule: config.defaultSchedule,
        description: config.description,
        running: true,
        enabled: true,
        isDynamic: false
      };

      logger.info(`Started job: ${config.name}`, {
        schedule: config.defaultSchedule
      });
    } catch (error) {
      logger.error(`Failed to start job ${config.name}:`, error);
    }
  }

  /**
   * Start a static job with config (fallback method)
   */
  startStaticJobWithConfig(jobKey, config, executeFunction) {
    try {
      const cronJob = cron.schedule(config.defaultSchedule, async () => {
        logger.info(`Executing job: ${config.name}`);
        try {
          await executeFunction();
        } catch (error) {
          logger.error(`Job ${config.name} execution failed:`, error);
        }
      }, {
        scheduled: false,
        timezone: config.timezone || 'America/New_York'
      });

      cronJob.start();
      this.cronInstances[jobKey] = cronJob;
      this.jobs[jobKey] = {
        name: config.name,
        schedule: config.defaultSchedule,
        description: config.description,
        running: true,
        enabled: true,
        isDynamic: false
      };

      logger.info(`Started job (fallback): ${config.name}`);
    } catch (error) {
      logger.error(`Failed to start job ${config.name}:`, error);
    }
  }

  /**
   * Update job schedule dynamically
   */
  async updateJobSchedule(jobKey, newSchedule, timezone = null) {
    const config = this.jobConfigs[jobKey];
    if (!config) {
      throw new Error(`Job config not found: ${jobKey}`);
    }

    if (!config.isDynamic) {
      throw new Error(`Job ${jobKey} does not support dynamic scheduling`);
    }

    // Validate cron expression
    if (!cron.validate(newSchedule)) {
      throw new Error(`Invalid cron expression: ${newSchedule}`);
    }

    logger.info(`Updating schedule for ${config.name}: ${newSchedule}`);

    try {
      // Stop existing job if running
      if (this.cronInstances[jobKey]) {
        this.cronInstances[jobKey].stop();
        logger.info(`Stopped existing job: ${config.name}`);
      }

      const effectiveTimezone = timezone || config.timezone || 'America/New_York';

      // Create and start new job with updated schedule
      const cronJob = this.createMatchingCronJob(newSchedule, effectiveTimezone, config.name);
      cronJob.start();
      this.cronInstances[jobKey] = cronJob;
      this.jobs[jobKey] = {
        ...this.jobs[jobKey],
        schedule: newSchedule,
        running: true
      };

      logger.info(`Successfully updated schedule for ${config.name} to ${newSchedule}`);

      return {
        success: true,
        jobKey,
        newSchedule,
        timezone: effectiveTimezone
      };
    } catch (error) {
      logger.error(`Failed to update schedule for ${jobKey}:`, error);
      throw error;
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(jobKey) {
    const config = this.jobConfigs[jobKey];
    if (!config) {
      throw new Error(`Job config not found: ${jobKey}`);
    }

    try {
      if (this.cronInstances[jobKey] && typeof this.cronInstances[jobKey].stop === 'function') {
        this.cronInstances[jobKey].stop();
        delete this.cronInstances[jobKey];
      }

      // Update job status
      if (this.jobs[jobKey]) {
        this.jobs[jobKey].running = false;
        this.jobs[jobKey].enabled = false;
      }

      logger.info(`Stopped job: ${config.name}`);
      return { success: true, message: `Job ${config.name} stopped` };
    } catch (error) {
      logger.error(`Failed to stop job ${jobKey}:`, error);
      throw error;
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    if (!this.isRunning) {
      logger.warn('Jobs are not running');
      return;
    }

    logger.info('Stopping all scheduled jobs...');

    try {
      Object.entries(this.cronInstances).forEach(([key, cronInstance]) => {
        try {
          if (cronInstance && typeof cronInstance.stop === 'function') {
            cronInstance.stop();
            logger.info(`Stopped job: ${this.jobs[key]?.name || key}`);
          }
        } catch (error) {
          logger.error(`Failed to stop job ${key}:`, error);
        }
      });

      this.isRunning = false;
      logger.info('All scheduled jobs stopped');
    } catch (error) {
      logger.error('Error stopping jobs:', error);
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Object.entries(this.jobs).map(([key, jobInfo]) => ({
        key,
        name: jobInfo.name,
        schedule: jobInfo.schedule,
        description: jobInfo.description || this.jobConfigs[key]?.description,
        running: jobInfo.running,
        enabled: jobInfo.enabled,
        isDynamic: jobInfo.isDynamic || false
      }))
    };
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(jobKey) {
    const config = this.jobConfigs[jobKey];
    if (!config) {
      throw new Error(`Job ${jobKey} not found`);
    }

    logger.info(`Manually triggering job: ${config.name}`);

    try {
      if (jobKey === 'monthlyMatching') {
        await executeMonthlyMatching();
        return {
          success: true,
          message: `Job ${config.name} executed successfully`
        };
      }

      // For other jobs, we cannot manually trigger them as they're imported instances
      return {
        success: false,
        message: 'Manual triggering not supported for this job'
      };
    } catch (error) {
      logger.error(`Error triggering job ${config.name}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
const orchestrator = new JobOrchestrator();

module.exports = orchestrator;
