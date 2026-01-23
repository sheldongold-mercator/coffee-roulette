const { NotificationQueue, Pairing, User, AdminUser } = require('../models');
const { Op } = require('sequelize');
const emailService = require('./emailService');
const teamsService = require('./teamsService');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Queue a notification for sending
   */
  async queueNotification({ pairingId, recipientId, notificationType, channel, scheduledFor = null }) {
    try {
      const notification = await NotificationQueue.create({
        pairing_id: pairingId,
        recipient_user_id: recipientId,
        notification_type: notificationType,
        channel,
        status: 'pending',
        scheduled_for: scheduledFor || new Date()
      });

      logger.info('Notification queued:', {
        id: notification.id,
        type: notificationType,
        channel,
        recipient: recipientId
      });

      return notification;
    } catch (error) {
      logger.error('Error queueing notification:', error);
      throw error;
    }
  }

  /**
   * Log a welcome email that was sent
   * Welcome emails are sent directly (not queued) so we log them after sending
   */
  async logWelcomeEmail(recipientId, status = 'sent', errorMessage = null) {
    try {
      const notification = await NotificationQueue.create({
        pairing_id: null,
        recipient_user_id: recipientId,
        notification_type: 'welcome',
        channel: 'email',
        status,
        scheduled_for: new Date(),
        sent_at: status === 'sent' ? new Date() : null,
        error_message: errorMessage
      });

      logger.info('Welcome email logged:', {
        id: notification.id,
        recipient: recipientId,
        status
      });

      return notification;
    } catch (error) {
      logger.error('Error logging welcome email:', error);
      // Don't throw - logging failure shouldn't block the main flow
    }
  }

  /**
   * Log an admin notification email that was sent
   * Admin notifications are sent directly (not queued) so we log them after sending
   */
  async logAdminNotification(recipientId, notificationType, status = 'sent', errorMessage = null) {
    try {
      const notification = await NotificationQueue.create({
        pairing_id: null,
        recipient_user_id: recipientId,
        notification_type: notificationType,
        channel: 'email',
        status,
        scheduled_for: new Date(),
        sent_at: status === 'sent' ? new Date() : null,
        error_message: errorMessage
      });

      logger.info('Admin notification logged:', {
        id: notification.id,
        recipient: recipientId,
        type: notificationType,
        status
      });

      return notification;
    } catch (error) {
      logger.error('Error logging admin notification:', error);
      // Don't throw - logging failure shouldn't block the main flow
    }
  }

  /**
   * Queue pairing notifications for both users
   * Creates separate email and teams notification entries for better tracking visibility
   */
  async queuePairingNotifications(pairingId) {
    const pairing = await Pairing.findByPk(pairingId);
    if (!pairing) {
      throw new Error('Pairing not found');
    }

    const notifications = [];

    // Queue separate email and teams notifications for each user
    // This provides better visibility into which channel was used
    for (const userId of [pairing.user1_id, pairing.user2_id]) {
      // Email notification
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: userId,
          notificationType: 'pairing',
          channel: 'email'
        })
      );

      // Teams notification
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: userId,
          notificationType: 'pairing',
          channel: 'teams'
        })
      );
    }

    logger.info(`Queued ${notifications.length} pairing notifications for pairing ${pairingId}`);
    return notifications;
  }

  /**
   * Queue reminder notifications
   * Creates separate email and teams notification entries for better tracking visibility
   */
  async queueReminderNotifications(pairingId, daysUntil) {
    const pairing = await Pairing.findByPk(pairingId);
    if (!pairing || !pairing.meeting_scheduled_at) {
      return [];
    }

    const scheduledFor = new Date(pairing.meeting_scheduled_at);
    scheduledFor.setDate(scheduledFor.getDate() - daysUntil);

    const notifications = [];

    // Queue separate email and teams notifications for each user
    for (const userId of [pairing.user1_id, pairing.user2_id]) {
      // Email notification
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: userId,
          notificationType: 'reminder',
          channel: 'email',
          scheduledFor
        })
      );

      // Teams notification
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: userId,
          notificationType: 'reminder',
          channel: 'teams',
          scheduledFor
        })
      );
    }

    logger.info(`Queued ${notifications.length} reminder notifications for pairing ${pairingId} (${daysUntil} days before)`);
    return notifications;
  }

  /**
   * Queue feedback request notifications
   * Creates separate email and teams notification entries for better tracking visibility
   */
  async queueFeedbackNotifications(pairingId) {
    const pairing = await Pairing.findByPk(pairingId);
    if (!pairing || !pairing.meeting_scheduled_at) {
      return [];
    }

    // Schedule for 1 day after the meeting
    const scheduledFor = new Date(pairing.meeting_scheduled_at);
    scheduledFor.setDate(scheduledFor.getDate() + 1);

    const notifications = [];

    // Queue separate email and teams notifications for each user
    for (const userId of [pairing.user1_id, pairing.user2_id]) {
      // Email notification
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: userId,
          notificationType: 'feedback_request',
          channel: 'email',
          scheduledFor
        })
      );

      // Teams notification
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: userId,
          notificationType: 'feedback_request',
          channel: 'teams',
          scheduledFor
        })
      );
    }

    logger.info(`Queued ${notifications.length} feedback notifications for pairing ${pairingId}`);
    return notifications;
  }

  /**
   * Process pending notifications
   */
  async processPendingNotifications(limit = 50) {
    try {
      // Get pending notifications that are scheduled for now or earlier
      const notifications = await NotificationQueue.findAll({
        where: {
          status: 'pending',
          scheduled_for: {
            [Op.lte]: new Date()
          }
        },
        include: [
          {
            association: 'pairing',
            include: [
              {
                association: 'user1',
                include: [{ association: 'department' }]
              },
              {
                association: 'user2',
                include: [{ association: 'department' }]
              },
              {
                association: 'icebreakers',
                attributes: ['id', 'topic', 'category'],
                through: { attributes: [] }
              }
            ]
          },
          {
            association: 'recipient',
            include: [{ association: 'department' }]
          }
        ],
        limit,
        order: [['scheduled_for', 'ASC']]
      });

      logger.info(`Processing ${notifications.length} pending notifications`);

      const results = [];

      for (const notification of notifications) {
        try {
          await this.sendNotification(notification);
          results.push({ id: notification.id, success: true });
        } catch (error) {
          results.push({ id: notification.id, success: false, error: error.message });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      logger.info('Notification processing completed:', {
        total: notifications.length,
        successful,
        failed
      });

      return { total: notifications.length, successful, failed, results };
    } catch (error) {
      logger.error('Error processing notifications:', error);
      throw error;
    }
  }

  /**
   * Send a single notification
   */
  async sendNotification(notification) {
    try {
      const { pairing, recipient, notification_type, channel } = notification;

      if (!pairing || !recipient) {
        throw new Error('Invalid notification data');
      }

      // Determine who is the user and who is the partner
      const isUser1 = recipient.id === pairing.user1_id;
      const user = recipient;
      const partner = isUser1 ? pairing.user2 : pairing.user1;
      const icebreakers = pairing.icebreakers || [];

      // Log icebreaker info for debugging
      logger.info('Sending notification with icebreakers:', {
        notificationId: notification.id,
        pairingId: pairing.id,
        icebreakerCount: icebreakers.length,
        icebreakers: icebreakers.map(ib => ({ id: ib.id, topic: ib.topic }))
      });

      let result = {};

      // Send based on channel and type
      if (channel === 'email') {
        result.email = await this.sendEmailNotification(notification_type, pairing, user, partner, icebreakers);
      } else if (channel === 'teams') {
        result.teams = await this.sendTeamsNotification(notification_type, pairing, user, partner, icebreakers);
      } else if (channel === 'both') {
        // Send to both email and Teams
        const [emailResult, teamsResult] = await Promise.allSettled([
          this.sendEmailNotification(notification_type, pairing, user, partner, icebreakers),
          this.sendTeamsNotification(notification_type, pairing, user, partner, icebreakers)
        ]);

        result.email = emailResult.status === 'fulfilled' ? emailResult.value : { error: emailResult.reason?.message };
        result.teams = teamsResult.status === 'fulfilled' ? teamsResult.value : { error: teamsResult.reason?.message };

        // If both failed, throw an error
        if (emailResult.status === 'rejected' && teamsResult.status === 'rejected') {
          throw new Error(`Both channels failed: Email: ${emailResult.reason?.message}, Teams: ${teamsResult.reason?.message}`);
        }
      } else {
        throw new Error(`Unknown notification channel: ${channel}`);
      }

      // Update notification status
      await notification.update({
        status: 'sent',
        sent_at: new Date(),
        result: JSON.stringify(result)
      });

      logger.info('Notification sent successfully:', {
        id: notification.id,
        type: notification_type,
        channel,
        recipient: user.email
      });

      return result;
    } catch (error) {
      // Update notification status to failed
      await notification.update({
        status: 'failed',
        error_message: error.message,
        retry_count: notification.retry_count + 1
      });

      logger.error('Notification send failed:', {
        id: notification.id,
        error: error.message
      });

      // Retry logic
      if (notification.retry_count < 3) {
        const retryDelay = Math.pow(2, notification.retry_count) * 5; // 5, 10, 20 minutes
        const retryAt = new Date();
        retryAt.setMinutes(retryAt.getMinutes() + retryDelay);

        await notification.update({
          status: 'pending',
          scheduled_for: retryAt
        });

        logger.info(`Notification ${notification.id} scheduled for retry at ${retryAt.toISOString()}`);
      }

      throw error;
    }
  }

  /**
   * Send email notification based on type
   */
  async sendEmailNotification(type, pairing, user, partner, icebreakers) {
    switch (type) {
      case 'pairing':
        return emailService.sendPairingNotification(pairing, user, partner, icebreakers);

      case 'reminder':
        const daysUntil = Math.ceil(
          (new Date(pairing.meeting_scheduled_at) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return emailService.sendMeetingReminder(pairing, user, partner, icebreakers, daysUntil);

      case 'feedback':
        return emailService.sendFeedbackRequest(pairing, user, partner);

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  /**
   * Send Teams notification based on type
   */
  async sendTeamsNotification(type, pairing, user, partner, icebreakers) {
    switch (type) {
      case 'pairing':
        return teamsService.sendPairingNotification(pairing, user, partner, icebreakers);

      case 'reminder':
        const daysUntil = Math.ceil(
          (new Date(pairing.meeting_scheduled_at) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return teamsService.sendMeetingReminder(pairing, user, partner, icebreakers, daysUntil);

      case 'feedback':
        return teamsService.sendFeedbackRequest(pairing, user, partner);

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  /**
   * Queue a notification to the partner when meeting is confirmed
   * This notifies them that their partner has confirmed and asks for feedback
   * Creates separate email and teams notification entries for better tracking visibility
   */
  async notifyPartnerMeetingConfirmed(pairingId, confirmerUserId) {
    try {
      const pairing = await Pairing.findByPk(pairingId);
      if (!pairing) {
        throw new Error('Pairing not found');
      }

      // Determine who the partner is
      const partnerId = pairing.user1_id === confirmerUserId
        ? pairing.user2_id
        : pairing.user1_id;

      const notifications = [];

      // Queue separate email and teams notifications for the partner
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: partnerId,
          notificationType: 'feedback_request',
          channel: 'email'
        })
      );

      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: partnerId,
          notificationType: 'feedback_request',
          channel: 'teams'
        })
      );

      logger.info(`Queued meeting confirmed notifications for partner ${partnerId} on pairing ${pairingId}`);

      return notifications;
    } catch (error) {
      logger.error('Error notifying partner of meeting confirmation:', error);
      throw error;
    }
  }

  /**
   * Send reminder notifications for pending pairings in a round
   * Creates 'reminder' notifications for pairings that haven't been completed yet
   * Creates separate email and teams notification entries for better tracking visibility
   */
  async sendRemindersForPendingPairings(roundId = null) {
    try {
      const { Op } = require('sequelize');

      // Build query for pending/confirmed pairings (not completed or cancelled)
      const where = {
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      };

      // If roundId specified, filter by that round
      if (roundId) {
        where.matching_round_id = roundId;
      }

      const pairings = await Pairing.findAll({
        where,
        include: [
          {
            association: 'user1',
            include: [{ association: 'department' }]
          },
          {
            association: 'user2',
            include: [{ association: 'department' }]
          },
          {
            association: 'icebreakers',
            attributes: ['id', 'topic', 'category'],
            through: { attributes: [] }
          }
        ]
      });

      if (pairings.length === 0) {
        logger.info('No pending pairings found for reminders');
        return { sent: 0, pairings: 0 };
      }

      logger.info(`Sending reminders for ${pairings.length} pending pairings`);

      const notifications = [];

      for (const pairing of pairings) {
        // Queue separate email and teams reminders for each user
        for (const userId of [pairing.user1_id, pairing.user2_id]) {
          // Email notification
          notifications.push(
            await this.queueNotification({
              pairingId: pairing.id,
              recipientId: userId,
              notificationType: 'reminder',
              channel: 'email'
            })
          );

          // Teams notification
          notifications.push(
            await this.queueNotification({
              pairingId: pairing.id,
              recipientId: userId,
              notificationType: 'reminder',
              channel: 'teams'
            })
          );
        }
      }

      logger.info(`Queued ${notifications.length} reminder notifications for ${pairings.length} pairings`);

      return {
        sent: notifications.length,
        pairings: pairings.length
      };
    } catch (error) {
      logger.error('Error sending reminders for pending pairings:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats() {
    const [pending, sent, failed] = await Promise.all([
      NotificationQueue.count({ where: { status: 'pending' } }),
      NotificationQueue.count({ where: { status: 'sent' } }),
      NotificationQueue.count({ where: { status: 'failed' } })
    ]);

    return {
      pending,
      sent,
      failed,
      total: pending + sent + failed
    };
  }

  /**
   * Notify admin users when a matching round completes
   * Sends email to all admin users with round summary
   */
  async notifyAdminsMatchingComplete(roundResult) {
    try {
      logger.info('Starting admin notification for matching completion:', {
        roundId: roundResult?.round?.id,
        roundName: roundResult?.round?.name,
        totalPairings: roundResult?.round?.totalPairings
      });

      // Get all admin users with their user details
      const adminUsers = await AdminUser.findAll({
        include: [{
          association: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }]
      });

      if (adminUsers.length === 0) {
        logger.info('No admin users to notify about matching completion');
        return { sent: 0, total: 0 };
      }

      logger.info(`Found ${adminUsers.length} admin users to notify`);

      // Load admin notification template
      const adminTemplate = require('../templates/emails/admin_matching_complete');
      const results = [];

      for (const admin of adminUsers) {
        if (!admin.user || !admin.user.email) {
          logger.warn(`Admin user ${admin.id} has no associated user/email`);
          continue;
        }

        try {
          const templateData = {
            adminName: admin.user.first_name || 'Admin',
            roundName: roundResult.round.name,
            roundId: roundResult.round.id,
            scheduledDate: roundResult.round.executedAt || roundResult.round.scheduledDate,
            totalParticipants: roundResult.round.totalParticipants,
            totalPairings: roundResult.round.totalPairings,
            unpairedUser: roundResult.unpaired || null,
            source: roundResult.round.source || 'scheduled'
          };

          const { subject, html, text } = adminTemplate(templateData);

          await emailService.sendEmail({
            to: admin.user.email,
            subject,
            htmlBody: html,
            textBody: text
          });

          // Log the notification for the Comms tab
          await this.logAdminNotification(admin.user.id, 'admin_matching_complete', 'sent');

          results.push({ success: true, email: admin.user.email });
          logger.info(`Admin notification sent to ${admin.user.email}`);
        } catch (error) {
          // Log the failed notification attempt
          await this.logAdminNotification(admin.user.id, 'admin_matching_complete', 'failed', error.message);

          results.push({ success: false, email: admin.user.email, error: error.message });
          logger.error(`Failed to notify admin ${admin.user.email}:`, error);
        }
      }

      const successful = results.filter(r => r.success).length;
      logger.info(`Admin matching notifications: ${successful}/${adminUsers.length} sent successfully`);

      return {
        sent: successful,
        total: adminUsers.length,
        results
      };
    } catch (error) {
      logger.error('Error notifying admins about matching completion:', error);
      // Don't throw - admin notifications shouldn't block the main flow
      return { sent: 0, total: 0, error: error.message };
    }
  }
}

module.exports = new NotificationService();
