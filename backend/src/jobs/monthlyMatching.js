const cron = require('node-cron');
const matchingService = require('../services/matchingService');
const logger = require('../utils/logger');

/**
 * Monthly matching job
 * Runs on the 1st of each month at 9:00 AM
 */
const monthlyMatchingJob = cron.schedule('0 9 1 * *', async () => {
  logger.info('Starting monthly matching job');

  try {
    const scheduledDate = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const name = `${monthNames[scheduledDate.getMonth()]} ${scheduledDate.getFullYear()} Coffee Roulette`;

    const result = await matchingService.createAndExecuteRound(scheduledDate, name);

    logger.info('Monthly matching job completed successfully:', {
      roundId: result.round.id,
      totalPairings: result.round.totalPairings,
      totalParticipants: result.round.totalParticipants
    });
  } catch (error) {
    logger.error('Monthly matching job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'America/New_York' // Adjust to company timezone
});

module.exports = monthlyMatchingJob;
