const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Microsoft Graph API Service
 * Handles authentication and data fetching from Microsoft Graph API
 */
class MicrosoftGraphService {
  constructor() {
    this.graphApiUrl = 'https://graph.microsoft.com/v1.0';
    this.tenantId = process.env.MICROSOFT_TENANT_ID;
  }

  /**
   * Verify Microsoft access token by fetching user profile
   * @param {string} accessToken - Microsoft access token from frontend
   * @returns {Object} User profile from Microsoft
   */
  async verifyTokenAndGetProfile(accessToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error verifying Microsoft token:', {
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message
      });
      throw new Error('Invalid Microsoft access token');
    }
  }

  /**
   * Get user's profile including department and job title
   * @param {string} accessToken - Microsoft access token
   * @returns {Object} Extended user profile
   */
  async getUserProfile(accessToken) {
    try {
      const [profile, photo] = await Promise.allSettled([
        axios.get(`${this.graphApiUrl}/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }),
        axios.get(`${this.graphApiUrl}/me/photo/$value`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          responseType: 'arraybuffer'
        })
      ]);

      const userData = {
        id: profile.value?.data?.id,
        email: profile.value?.data?.mail || profile.value?.data?.userPrincipalName,
        firstName: profile.value?.data?.givenName,
        lastName: profile.value?.data?.surname,
        displayName: profile.value?.data?.displayName,
        jobTitle: profile.value?.data?.jobTitle,
        department: profile.value?.data?.department,
        officeLocation: profile.value?.data?.officeLocation,
        mobilePhone: profile.value?.data?.mobilePhone
      };

      if (photo.status === 'fulfilled' && photo.value?.data) {
        userData.photo = Buffer.from(photo.value.data, 'binary').toString('base64');
      }

      return userData;
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get user's manager information
   * @param {string} accessToken - Microsoft access token
   * @returns {Object} Manager information
   */
  async getUserManager(accessToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me/manager`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        id: response.data.id,
        displayName: response.data.displayName,
        email: response.data.mail || response.data.userPrincipalName
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // User has no manager
      }
      logger.error('Error fetching user manager:', error);
      throw error;
    }
  }

  /**
   * Get user's calendar events
   * @param {string} accessToken - Microsoft access token
   * @param {Date} startDate - Start date for calendar query
   * @param {Date} endDate - End date for calendar query
   * @returns {Array} Calendar events
   */
  async getUserCalendar(accessToken, startDate, endDate) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me/calendar/calendarView`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          $select: 'subject,start,end,location,isAllDay',
          $orderby: 'start/dateTime'
        }
      });

      return response.data.value;
    } catch (error) {
      logger.error('Error fetching user calendar:', error);
      throw error;
    }
  }

  /**
   * Get app-only access token using client credentials
   * @returns {string} Access token
   */
  async getAppAccessToken() {
    try {
      const tenantId = process.env.MICROSOFT_TENANT_ID;
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

      if (!tenantId || !clientId || !clientSecret) {
        throw new Error('Microsoft credentials not configured');
      }

      const response = await axios.post(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      logger.error('Error getting app access token:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Get all users in the organization (admin only)
   * Uses app-only authentication with client credentials
   * @returns {Array} List of users
   */
  async getAllUsers() {
    try {
      const accessToken = await this.getAppAccessToken();

      const response = await axios.get(`${this.graphApiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          $select: 'id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation',
          $top: 999
        }
      });

      return response.data.value;
    } catch (error) {
      logger.error('Error fetching all users:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Create a calendar event
   * @param {string} accessToken - Microsoft access token
   * @param {Object} eventData - Event details
   * @returns {Object} Created event
   */
  async createCalendarEvent(accessToken, eventData) {
    try {
      const response = await axios.post(
        `${this.graphApiUrl}/me/events`,
        eventData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Send email via Microsoft Graph API
   * Uses app-only authentication to send on behalf of a configured sender
   * Requires Mail.Send application permission in Azure AD
   *
   * @param {Object} options - Email options
   * @param {string|string[]} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.htmlBody - HTML content
   * @param {string} [options.textBody] - Plain text content (optional)
   * @returns {Object} Send result with success status
   */
  async sendEmail({ to, subject, htmlBody, textBody }) {
    try {
      const accessToken = await this.getAppAccessToken();

      // The sender user ID or email - must be a valid mailbox in the tenant
      const senderEmail = process.env.EMAIL_SENDER_ADDRESS || process.env.EMAIL_FROM;

      if (!senderEmail) {
        throw new Error('EMAIL_SENDER_ADDRESS or EMAIL_FROM not configured');
      }

      // Format recipients
      const toRecipients = (Array.isArray(to) ? to : [to]).map(email => ({
        emailAddress: { address: email }
      }));

      // Build the message payload
      const message = {
        subject,
        body: {
          contentType: 'HTML',
          content: htmlBody
        },
        toRecipients
      };

      // Send the email using the sender's mailbox
      // Note: The sender must be a valid user/shared mailbox in the tenant
      const response = await axios.post(
        `${this.graphApiUrl}/users/${senderEmail}/sendMail`,
        {
          message,
          saveToSentItems: false // Don't clutter the sent folder
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Email sent successfully via Microsoft Graph', {
        to: Array.isArray(to) ? to : [to],
        subject
      });

      return {
        success: true,
        messageId: `msgraph-${Date.now()}`,
        provider: 'microsoft-graph'
      };
    } catch (error) {
      logger.error('Error sending email via Microsoft Graph:', {
        status: error.response?.status,
        error: error.response?.data?.error || error.message,
        to: Array.isArray(to) ? to : [to],
        subject
      });
      throw error;
    }
  }
}

module.exports = new MicrosoftGraphService();
