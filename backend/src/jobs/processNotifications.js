const cron = require('node-cron');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Notification processing job
 * Runs every 5 minutes to process pending notifications
 */
const notificationProcessingJob = cron.schedule('*/5 * * * *', async () => {
  logger.info('Starting notification processing job');

  try {
    const result = await notificationService.processPendingNotifications(50);

    if (result.total > 0) {
      logger.info('Notification processing job completed:', {
        total: result.total,
        successful: result.successful,
        failed: result.failed
      });
    }
  } catch (error) {
    logger.error('Notification processing job failed:', error);
  }
}, {
  scheduled: false
});

module.exports = notificationProcessingJob;
