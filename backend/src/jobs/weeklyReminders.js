const cron = require('node-cron');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');

/**
 * Weekly reminders job
 * Sends reminder notifications to all users with pending pairings
 * Runs every Monday at 9:00 AM
 */

const executeWeeklyReminders = async () => {
  logger.info('Starting weekly reminders job...');

  try {
    const result = await notificationService.sendRemindersForPendingPairings();

    logger.info('Weekly reminders job completed:', {
      notificationsSent: result.sent,
      pairingsFound: result.pairings
    });

    return result;
  } catch (error) {
    logger.error('Weekly reminders job failed:', error);
    throw error;
  }
};

// Create cron job instance - runs every Monday at 9:00 AM
const job = cron.schedule('0 9 * * 1', async () => {
  logger.info('Weekly reminders cron triggered');
  try {
    await executeWeeklyReminders();
  } catch (error) {
    logger.error('Weekly reminders cron execution failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'America/New_York'
});

module.exports = job;
module.exports.executeWeeklyReminders = executeWeeklyReminders;
