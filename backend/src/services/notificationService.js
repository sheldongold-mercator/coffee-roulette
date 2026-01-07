const { NotificationQueue, Pairing, User } = require('../models');
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
        recipient_id: recipientId,
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
   * Queue pairing notifications for both users
   */
  async queuePairingNotifications(pairingId, channels = ['email', 'teams']) {
    const pairing = await Pairing.findByPk(pairingId);
    if (!pairing) {
      throw new Error('Pairing not found');
    }

    const notifications = [];

    for (const channel of channels) {
      // Queue for user1
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: pairing.user1_id,
          notificationType: 'pairing',
          channel
        })
      );

      // Queue for user2
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: pairing.user2_id,
          notificationType: 'pairing',
          channel
        })
      );
    }

    logger.info(`Queued ${notifications.length} pairing notifications for pairing ${pairingId}`);
    return notifications;
  }

  /**
   * Queue reminder notifications
   */
  async queueReminderNotifications(pairingId, daysUntil, channels = ['email', 'teams']) {
    const pairing = await Pairing.findByPk(pairingId);
    if (!pairing || !pairing.meeting_scheduled_at) {
      return [];
    }

    const scheduledFor = new Date(pairing.meeting_scheduled_at);
    scheduledFor.setDate(scheduledFor.getDate() - daysUntil);

    const notifications = [];

    for (const channel of channels) {
      // Queue for user1
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: pairing.user1_id,
          notificationType: 'reminder',
          channel,
          scheduledFor
        })
      );

      // Queue for user2
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: pairing.user2_id,
          notificationType: 'reminder',
          channel,
          scheduledFor
        })
      );
    }

    logger.info(`Queued ${notifications.length} reminder notifications for pairing ${pairingId} (${daysUntil} days before)`);
    return notifications;
  }

  /**
   * Queue feedback request notifications
   */
  async queueFeedbackNotifications(pairingId, channels = ['email', 'teams']) {
    const pairing = await Pairing.findByPk(pairingId);
    if (!pairing || !pairing.meeting_scheduled_at) {
      return [];
    }

    // Schedule for 1 day after the meeting
    const scheduledFor = new Date(pairing.meeting_scheduled_at);
    scheduledFor.setDate(scheduledFor.getDate() + 1);

    const notifications = [];

    for (const channel of channels) {
      // Queue for user1
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: pairing.user1_id,
          notificationType: 'feedback',
          channel,
          scheduledFor
        })
      );

      // Queue for user2
      notifications.push(
        await this.queueNotification({
          pairingId,
          recipientId: pairing.user2_id,
          notificationType: 'feedback',
          channel,
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

      let result;

      // Send based on channel and type
      if (channel === 'email') {
        result = await this.sendEmailNotification(notification_type, pairing, user, partner, icebreakers);
      } else if (channel === 'teams') {
        result = await this.sendTeamsNotification(notification_type, pairing, user, partner, icebreakers);
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
}

module.exports = new NotificationService();
