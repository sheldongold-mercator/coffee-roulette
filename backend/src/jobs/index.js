const logger = require('../utils/logger');

// Import all job modules
const monthlyMatchingJob = require('./monthlyMatching');
const notificationProcessingJob = require('./processNotifications');
const dailyUserSyncJob = require('./dailyUserSync');

/**
 * Job orchestrator
 * Manages all scheduled jobs
 */
class JobOrchestrator {
  constructor() {
    this.jobs = {
      monthlyMatching: {
        job: monthlyMatchingJob,
        name: 'Monthly Matching',
        schedule: '0 9 1 * *',
        description: 'Creates monthly coffee pairing matches on the 1st of each month at 9:00 AM'
      },
      notificationProcessing: {
        job: notificationProcessingJob,
        name: 'Notification Processing',
        schedule: '*/5 * * * *',
        description: 'Processes pending notifications every 5 minutes'
      },
      dailyUserSync: {
        job: dailyUserSyncJob,
        name: 'Daily User Sync',
        schedule: '0 2 * * *',
        description: 'Syncs users from Microsoft Graph every day at 2:00 AM'
      }
    };

    this.isRunning = false;
  }

  /**
   * Start all scheduled jobs
   */
  startAll() {
    if (this.isRunning) {
      logger.warn('Jobs are already running');
      return;
    }

    logger.info('Starting all scheduled jobs...');

    try {
      Object.entries(this.jobs).forEach(([key, jobInfo]) => {
        try {
          jobInfo.job.start();
          logger.info(`Started job: ${jobInfo.name}`, {
            schedule: jobInfo.schedule,
            description: jobInfo.description
          });
        } catch (error) {
          logger.error(`Failed to start job ${jobInfo.name}:`, error);
        }
      });

      this.isRunning = true;
      logger.info('All scheduled jobs started successfully');
    } catch (error) {
      logger.error('Error starting jobs:', error);
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
      Object.entries(this.jobs).forEach(([key, jobInfo]) => {
        try {
          jobInfo.job.stop();
          logger.info(`Stopped job: ${jobInfo.name}`);
        } catch (error) {
          logger.error(`Failed to stop job ${jobInfo.name}:`, error);
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
        description: jobInfo.description,
        running: this.isRunning
      }))
    };
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(jobKey) {
    const jobInfo = this.jobs[jobKey];

    if (!jobInfo) {
      throw new Error(`Job ${jobKey} not found`);
    }

    logger.info(`Manually triggering job: ${jobInfo.name}`);

    try {
      // Note: We can't directly invoke cron jobs, so we would need to extract
      // the job logic into separate functions. For now, just log.
      logger.warn('Manual job triggering requires refactoring job functions');
      return {
        success: false,
        message: 'Manual triggering not yet implemented'
      };
    } catch (error) {
      logger.error(`Error triggering job ${jobInfo.name}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
const orchestrator = new JobOrchestrator();

module.exports = orchestrator;
