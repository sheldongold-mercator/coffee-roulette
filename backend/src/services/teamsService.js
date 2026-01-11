const axios = require('axios');
const logger = require('../utils/logger');
const { NotificationTemplate } = require('../models');
const { interpolateJson, prepareVariables } = require('../utils/templateInterpolation');

class TeamsService {
  constructor() {
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL || '';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Get Teams card template from database or fall back to built-in card method
   * @param {string} templateType - Type of template (pairing_notification, etc.)
   * @param {object} variables - Variables to interpolate
   * @param {function} fallbackCreator - Fallback method to create card if no DB template
   * @returns {object} - Adaptive card object
   */
  async getTeamsCard(templateType, variables, fallbackCreator) {
    try {
      // Check for custom template in database
      const dbTemplate = await NotificationTemplate.findOne({
        where: {
          template_type: templateType,
          channel: 'teams',
          is_active: true
        }
      });

      if (dbTemplate && dbTemplate.json_content) {
        // Use database template with variable interpolation
        const preparedVars = prepareVariables(variables, templateType);
        const cardTemplate = JSON.parse(dbTemplate.json_content);
        return interpolateJson(cardTemplate, preparedVars);
      }
    } catch (error) {
      logger.warn('Error loading Teams template from database, falling back to built-in:', {
        templateType,
        error: error.message
      });
    }

    // Fall back to built-in card creator
    return fallbackCreator(variables);
  }

  /**
   * Send adaptive card to Teams channel
   */
  async sendAdaptiveCard(card) {
    try {
      // In development, log instead of sending
      if (this.isDevelopment || !this.webhookUrl) {
        logger.info('Teams message (DEV MODE - Not Sent):', {
          title: card.attachments?.[0]?.content?.body?.[0]?.text || 'No title',
          type: card.type || 'message'
        });
        return { success: true, dev: true };
      }

      const response = await axios.post(this.webhookUrl, card, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('Teams message sent successfully:', {
        status: response.status
      });

      return {
        success: true,
        status: response.status
      };
    } catch (error) {
      logger.error('Error sending Teams message:', {
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Create pairing notification adaptive card
   */
  createPairingCard({ userName, partnerName, partnerEmail, partnerDepartment, meetingDate, icebreakers, pairingId }) {
    const meetingInfo = meetingDate
      ? `**Scheduled:** ${new Date(meetingDate).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}`
      : '**Scheduled:** To be arranged';

    const icebreakerFacts = icebreakers.map((topic, index) => ({
      title: `💬 Topic ${index + 1}:`,
      value: topic
    }));

    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: '☕ Coffee Roulette Match',
                weight: 'Bolder',
                size: 'Large',
                color: 'Accent'
              },
              {
                type: 'TextBlock',
                text: `Hi ${userName}! You've been matched for this month's Coffee Roulette.`,
                wrap: true,
                spacing: 'Medium'
              },
              {
                type: 'FactSet',
                facts: [
                  {
                    title: '👤 Partner:',
                    value: partnerName
                  },
                  {
                    title: '📧 Email:',
                    value: partnerEmail
                  },
                  {
                    title: '🏢 Department:',
                    value: partnerDepartment
                  }
                ],
                spacing: 'Medium'
              },
              {
                type: 'TextBlock',
                text: meetingInfo,
                wrap: true,
                spacing: 'Small'
              },
              {
                type: 'TextBlock',
                text: '💬 **Conversation Starters**',
                weight: 'Bolder',
                spacing: 'Medium'
              },
              {
                type: 'FactSet',
                facts: icebreakerFacts
              },
              {
                type: 'TextBlock',
                text: "Reach out to your partner, schedule a time if needed, and enjoy getting to know each other!",
                wrap: true,
                spacing: 'Medium',
                isSubtle: true
              }
            ],
            actions: [
              {
                type: 'Action.OpenUrl',
                title: 'View Pairing Details',
                url: `${process.env.FRONTEND_URL || 'http://localhost'}/pairings/${pairingId}`
              },
              {
                type: 'Action.OpenUrl',
                title: 'Email Partner',
                url: `mailto:${partnerEmail}`
              }
            ],
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
          }
        }
      ]
    };
  }

  /**
   * Create meeting reminder adaptive card
   */
  createReminderCard({ userName, partnerName, meetingDate, daysUntil, icebreakers, pairingId }) {
    const urgency = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
    const formattedDate = new Date(meetingDate).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });

    const icebreakerList = icebreakers.map((topic, index) => `${index + 1}. ${topic}`).join('\n\n');

    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: '⏰ Meeting Reminder',
                weight: 'Bolder',
                size: 'Large',
                color: 'Attention'
              },
              {
                type: 'TextBlock',
                text: `Hi ${userName}! Your Coffee Roulette meeting is ${urgency}.`,
                wrap: true,
                spacing: 'Medium'
              },
              {
                type: 'FactSet',
                facts: [
                  {
                    title: '👤 With:',
                    value: partnerName
                  },
                  {
                    title: '📅 When:',
                    value: formattedDate
                  }
                ],
                spacing: 'Medium'
              },
              {
                type: 'TextBlock',
                text: 'Check your Outlook calendar for the meeting link.',
                wrap: true,
                spacing: 'Small',
                isSubtle: true
              },
              {
                type: 'TextBlock',
                text: '💬 **Conversation Starters**',
                weight: 'Bolder',
                spacing: 'Medium'
              },
              {
                type: 'TextBlock',
                text: icebreakerList,
                wrap: true
              }
            ],
            actions: [
              {
                type: 'Action.OpenUrl',
                title: 'View Meeting Details',
                url: `${process.env.FRONTEND_URL || 'http://localhost'}/pairings/${pairingId}`
              }
            ],
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
          }
        }
      ]
    };
  }

  /**
   * Create feedback request adaptive card
   */
  createFeedbackCard({ userName, partnerName, pairingId }) {
    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: '📝 Feedback Request',
                weight: 'Bolder',
                size: 'Large',
                color: 'Good'
              },
              {
                type: 'TextBlock',
                text: `Hi ${userName}! How was your coffee with ${partnerName}?`,
                wrap: true,
                spacing: 'Medium'
              },
              {
                type: 'TextBlock',
                text: 'We would love to hear about your experience! Your feedback helps us improve the Coffee Roulette program.',
                wrap: true,
                spacing: 'Small'
              },
              {
                type: 'TextBlock',
                text: 'It only takes a minute to share:',
                spacing: 'Medium'
              },
              {
                type: 'TextBlock',
                text: '• How was the overall experience?\n• Did the conversation flow well?\n• What topics did you discuss?\n• Any suggestions for improvement?',
                wrap: true
              }
            ],
            actions: [
              {
                type: 'Action.OpenUrl',
                title: 'Share Feedback',
                url: `${process.env.FRONTEND_URL || 'http://localhost'}/pairings/${pairingId}/feedback`
              }
            ],
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
          }
        }
      ]
    };
  }

  /**
   * Send pairing notification to Teams
   */
  async sendPairingNotification(pairing, user, partner, icebreakers) {
    const variables = {
      userName: user.first_name,
      partnerName: `${partner.first_name} ${partner.last_name}`,
      partnerEmail: partner.email,
      partnerDepartment: partner.department?.name || 'Unknown',
      meetingDate: pairing.meeting_scheduled_at,
      icebreakers: icebreakers.map(ib => ib.topic),
      pairingId: pairing.id
    };

    const card = await this.getTeamsCard(
      'pairing_notification',
      variables,
      (vars) => this.createPairingCard(vars)
    );

    return this.sendAdaptiveCard(card);
  }

  /**
   * Send meeting reminder to Teams
   */
  async sendMeetingReminder(pairing, user, partner, icebreakers, daysUntil) {
    const variables = {
      userName: user.first_name,
      partnerName: `${partner.first_name} ${partner.last_name}`,
      meetingDate: pairing.meeting_scheduled_at,
      daysUntil,
      icebreakers: icebreakers.map(ib => ib.topic),
      pairingId: pairing.id
    };

    const card = await this.getTeamsCard(
      'meeting_reminder',
      variables,
      (vars) => this.createReminderCard(vars)
    );

    return this.sendAdaptiveCard(card);
  }

  /**
   * Send feedback request to Teams
   */
  async sendFeedbackRequest(pairing, user, partner) {
    const variables = {
      userName: user.first_name,
      partnerName: `${partner.first_name} ${partner.last_name}`,
      pairingId: pairing.id
    };

    const card = await this.getTeamsCard(
      'feedback_request',
      variables,
      (vars) => this.createFeedbackCard(vars)
    );

    return this.sendAdaptiveCard(card);
  }
}

module.exports = new TeamsService();
