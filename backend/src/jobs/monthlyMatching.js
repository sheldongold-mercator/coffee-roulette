const cron = require('node-cron');
const matchingService = require('../services/matchingService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Execute monthly matching logic
 * This function can be called by the JobOrchestrator or manually triggered
 */
async function executeMonthlyMatching() {
  logger.info('Starting monthly matching job');

  try {
    const scheduledDate = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const name = `${monthNames[scheduledDate.getMonth()]} ${scheduledDate.getFullYear()} Coffee Roulette`;

    const result = await matchingService.createAndExecuteRound(scheduledDate, name, {
      source: 'scheduled'
    });

    logger.info('Monthly matching job completed successfully:', {
      roundId: result.round.id,
      totalPairings: result.round.totalPairings,
      totalParticipants: result.round.totalParticipants
    });

    // Notify admin users about the completed matching round
    try {
      await notificationService.notifyAdminsMatchingComplete(result);
    } catch (adminNotifyError) {
      logger.error('Failed to notify admins (non-fatal):', adminNotifyError);
    }

    return result;
  } catch (error) {
    logger.error('Monthly matching job failed:', error);
    throw error;
  }
}

/**
 * Legacy cron job instance for backwards compatibility
 * Note: Schedule is now managed dynamically by JobOrchestrator
 */
const monthlyMatchingJob = cron.schedule('0 9 1 * *', executeMonthlyMatching, {
  scheduled: false,
  timezone: 'America/New_York'
});

module.exports = monthlyMatchingJob;
module.exports.executeMonthlyMatching = executeMonthlyMatching;
