const logger = require('../utils/logger');
const { NotificationTemplate } = require('../models');
const { interpolate, prepareVariables } = require('../utils/templateInterpolation');
const microsoftGraphService = require('./microsoftGraphService');

class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_SENDER_ADDRESS || process.env.EMAIL_FROM || 'noreply@mercator.com';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Get template from database or fall back to file-based template
   * @param {string} templateType - Type of template (welcome, pairing_notification, etc.)
   * @param {object} variables - Variables to interpolate
   * @returns {object} - { subject, html, text }
   */
  async getTemplate(templateType, variables) {
    try {
      // Check for custom template in database
      const dbTemplate = await NotificationTemplate.findOne({
        where: {
          template_type: templateType,
          channel: 'email',
          is_active: true
        }
      });

      if (dbTemplate) {
        // Use database template with variable interpolation
        const preparedVars = prepareVariables(variables, templateType);
        return {
          subject: interpolate(dbTemplate.subject, preparedVars),
          html: interpolate(dbTemplate.html_content, preparedVars),
          text: interpolate(dbTemplate.text_content, preparedVars)
        };
      }
    } catch (error) {
      logger.warn('Error loading template from database, falling back to file:', {
        templateType,
        error: error.message
      });
    }

    // Fall back to file-based template
    const fileTemplate = require(`../templates/emails/${templateType}`);
    return fileTemplate(variables);
  }

  /**
   * Send email via Microsoft Graph API
   */
  async sendEmail({ to, subject, htmlBody, textBody }) {
    try {
      // In development, log instead of sending
      if (this.isDevelopment) {
        logger.info('Email (DEV MODE - Not Sent):', {
          to,
          subject,
          textBody: textBody || 'See HTML body'
        });
        return { messageId: `dev-${Date.now()}`, success: true };
      }

      // Send via Microsoft Graph
      const result = await microsoftGraphService.sendEmail({
        to,
        subject,
        htmlBody,
        textBody
      });

      return result;
    } catch (error) {
      logger.error('Error sending email:', {
        error: error.message,
        to,
        subject
      });
      throw error;
    }
  }

  /**
   * Send pairing notification email
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

    const { subject, html, text } = await this.getTemplate('pairing_notification', variables);

    return this.sendEmail({
      to: user.email,
      subject,
      htmlBody: html,
      textBody: text
    });
  }

  /**
   * Send meeting reminder email
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

    const { subject, html, text } = await this.getTemplate('meeting_reminder', variables);

    return this.sendEmail({
      to: user.email,
      subject,
      htmlBody: html,
      textBody: text
    });
  }

  /**
   * Send feedback request email
   */
  async sendFeedbackRequest(pairing, user, partner) {
    const variables = {
      userName: user.first_name,
      partnerName: `${partner.first_name} ${partner.last_name}`,
      pairingId: pairing.id
    };

    const { subject, html, text } = await this.getTemplate('feedback_request', variables);

    return this.sendEmail({
      to: user.email,
      subject,
      htmlBody: html,
      textBody: text
    });
  }

  /**
   * Send welcome email to new Coffee Roulette participant
   */
  async sendWelcomeEmail(user, departmentName = null) {
    const variables = {
      userName: user.first_name,
      userEmail: user.email,
      departmentName,
      optOutToken: user.opt_out_token,
      portalLink: process.env.FRONTEND_URL || 'http://localhost',
      optOutLink: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/public/opt-out/${user.opt_out_token}`
    };

    const { subject, html, text } = await this.getTemplate('welcome', variables);

    return this.sendEmail({
      to: user.email,
      subject,
      htmlBody: html,
      textBody: text
    });
  }

  /**
   * Send welcome emails to multiple users (batch)
   * Returns results and updates welcome_sent_at for successful sends
   */
  async sendBulkWelcomeEmails(users, departmentName = null) {
    const results = [];

    for (const user of users) {
      try {
        const variables = {
          userName: user.first_name,
          userEmail: user.email,
          departmentName,
          optOutToken: user.opt_out_token,
          portalLink: process.env.FRONTEND_URL || 'http://localhost',
          optOutLink: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/public/opt-out/${user.opt_out_token}`
        };

        const { subject, html, text } = await this.getTemplate('welcome', variables);

        const result = await this.sendEmail({
          to: user.email,
          subject,
          htmlBody: html,
          textBody: text
        });

        // Update welcome_sent_at
        await user.update({ welcome_sent_at: new Date() });

        results.push({ success: true, userId: user.id, email: user.email, ...result });
      } catch (error) {
        results.push({
          success: false,
          userId: user.id,
          email: user.email,
          error: error.message
        });
      }
    }

    logger.info('Bulk welcome email send completed:', {
      total: users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Send bulk emails (for notifications to all pairings)
   */
  async sendBulkEmails(emails) {
    const results = [];

    for (const emailData of emails) {
      try {
        const result = await this.sendEmail(emailData);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          to: emailData.to
        });
      }
    }

    logger.info('Bulk email send completed:', {
      total: emails.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }
}

module.exports = new EmailService();
