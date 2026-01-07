const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@mercator.com';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Send email via AWS SES
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

      const params = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to]
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8'
            },
            ...(textBody && {
              Text: {
                Data: textBody,
                Charset: 'UTF-8'
              }
            })
          }
        }
      };

      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);

      logger.info('Email sent successfully:', {
        to,
        subject,
        messageId: response.MessageId
      });

      return {
        messageId: response.MessageId,
        success: true
      };
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
    const pairingTemplate = require('../templates/emails/pairingNotification');

    const { subject, html, text } = pairingTemplate({
      userName: user.first_name,
      partnerName: `${partner.first_name} ${partner.last_name}`,
      partnerEmail: partner.email,
      partnerDepartment: partner.department?.name || 'Unknown',
      meetingDate: pairing.meeting_scheduled_at,
      icebreakers: icebreakers.map(ib => ib.topic),
      pairingId: pairing.id
    });

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
    const reminderTemplate = require('../templates/emails/meetingReminder');

    const { subject, html, text } = reminderTemplate({
      userName: user.first_name,
      partnerName: `${partner.first_name} ${partner.last_name}`,
      meetingDate: pairing.meeting_scheduled_at,
      daysUntil,
      icebreakers: icebreakers.map(ib => ib.topic),
      pairingId: pairing.id
    });

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
    const feedbackTemplate = require('../templates/emails/feedbackRequest');

    const { subject, html, text } = feedbackTemplate({
      userName: user.first_name,
      partnerName: `${partner.first_name} ${partner.last_name}`,
      pairingId: pairing.id
    });

    return this.sendEmail({
      to: user.email,
      subject,
      htmlBody: html,
      textBody: text
    });
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
