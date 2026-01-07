const cron = require('node-cron');
const microsoftGraphService = require('../services/microsoftGraphService');
const { User, Department } = require('../models');
const logger = require('../utils/logger');

/**
 * Daily user sync job
 * Runs every day at 2:00 AM to sync users from Microsoft Graph
 */
const dailyUserSyncJob = cron.schedule('0 2 * * *', async () => {
  logger.info('Starting daily user sync job');

  try {
    // Get admin token for Graph API
    const adminToken = process.env.MICROSOFT_ADMIN_TOKEN; // This should be obtained via proper auth flow

    if (!adminToken) {
      logger.warn('No admin token available, skipping user sync');
      return;
    }

    // Get all users from Microsoft Graph
    const graphUsers = await microsoftGraphService.getAllUsers(adminToken);

    if (!graphUsers || graphUsers.length === 0) {
      logger.warn('No users returned from Microsoft Graph');
      return;
    }

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const graphUser of graphUsers) {
      try {
        if (!graphUser.mail) {
          continue; // Skip users without email
        }

        // Find or create department
        let department = null;
        if (graphUser.department) {
          [department] = await Department.findOrCreate({
            where: { name: graphUser.department },
            defaults: {
              name: graphUser.department,
              is_active: true
            }
          });
        }

        // Find or create user
        const [user, isCreated] = await User.findOrCreate({
          where: { microsoft_id: graphUser.id },
          defaults: {
            microsoft_id: graphUser.id,
            email: graphUser.mail,
            first_name: graphUser.givenName || '',
            last_name: graphUser.surname || '',
            department_id: department?.id || null,
            role: graphUser.jobTitle || null,
            is_active: true,
            is_opted_in: false // Default to opted out, users must opt in
          }
        });

        if (isCreated) {
          created++;
          logger.info(`Created new user: ${user.email}`);
        } else {
          // Update existing user
          await user.update({
            email: graphUser.mail,
            first_name: graphUser.givenName || user.first_name,
            last_name: graphUser.surname || user.last_name,
            department_id: department?.id || user.department_id,
            role: graphUser.jobTitle || user.role
          });
          updated++;
        }
      } catch (error) {
        logger.error(`Error syncing user ${graphUser.mail}:`, error);
        errors++;
      }
    }

    logger.info('Daily user sync job completed:', {
      total: graphUsers.length,
      created,
      updated,
      errors
    });
  } catch (error) {
    logger.error('Daily user sync job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'America/New_York' // Adjust to company timezone
});

module.exports = dailyUserSyncJob;
