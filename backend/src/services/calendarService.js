const axios = require('axios');
const logger = require('../utils/logger');
const { addDays } = require('../utils/helpers');

class CalendarService {
  constructor() {
    this.graphApiUrl = 'https://graph.microsoft.com/v1.0';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Get access token for Graph API (using app-only authentication)
   */
  async getAccessToken() {
    try {
      const tenantId = process.env.AZURE_TENANT_ID;
      const clientId = process.env.AZURE_CLIENT_ID;
      const clientSecret = process.env.AZURE_CLIENT_SECRET;

      if (!tenantId || !clientId || !clientSecret) {
        throw new Error('Azure credentials not configured');
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
      logger.error('Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Get user's calendar availability (free/busy times)
   */
  async getUserAvailability(userEmail, startTime, endTime, accessToken) {
    try {
      const response = await axios.post(
        `${this.graphApiUrl}/users/${userEmail}/calendar/getSchedule`,
        {
          schedules: [userEmail],
          startTime: {
            dateTime: startTime.toISOString(),
            timeZone: 'UTC'
          },
          endTime: {
            dateTime: endTime.toISOString(),
            timeZone: 'UTC'
          },
          availabilityViewInterval: 30
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.value[0];
    } catch (error) {
      logger.error(`Error getting availability for ${userEmail}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Find common free time slots between two users
   */
  async findCommonAvailability(user1Email, user2Email, durationMinutes = 30, searchDays = 14) {
    try {
      // In development mode, return mock availability
      if (this.isDevelopment) {
        logger.info('Calendar (DEV MODE): Returning mock availability');
        const mockSlot = new Date();
        mockSlot.setDate(mockSlot.getDate() + 3);
        mockSlot.setHours(14, 0, 0, 0);
        return [
          {
            start: mockSlot,
            end: new Date(mockSlot.getTime() + durationMinutes * 60000)
          }
        ];
      }

      const accessToken = await this.getAccessToken();

      // Search for availability over the next searchDays
      const startTime = new Date();
      const endTime = addDays(startTime, searchDays);

      // Get availability for both users
      const [user1Availability, user2Availability] = await Promise.all([
        this.getUserAvailability(user1Email, startTime, endTime, accessToken),
        this.getUserAvailability(user2Email, startTime, endTime, accessToken)
      ]);

      if (!user1Availability || !user2Availability) {
        logger.warn('Could not retrieve availability for one or both users');
        return [];
      }

      // Parse busy times for both users
      const user1Busy = this.parseBusyTimes(user1Availability.scheduleItems);
      const user2Busy = this.parseBusyTimes(user2Availability.scheduleItems);

      // Find common free slots
      const commonSlots = this.findFreeSlots(
        user1Busy,
        user2Busy,
        startTime,
        endTime,
        durationMinutes
      );

      logger.info(`Found ${commonSlots.length} common availability slots for ${user1Email} and ${user2Email}`);

      return commonSlots;
    } catch (error) {
      logger.error('Error finding common availability:', error);
      return [];
    }
  }

  /**
   * Parse busy times from schedule items
   */
  parseBusyTimes(scheduleItems) {
    return scheduleItems
      .filter(item => item.status === 'busy' || item.status === 'tentative')
      .map(item => ({
        start: new Date(item.start.dateTime),
        end: new Date(item.end.dateTime)
      }));
  }

  /**
   * Find free time slots considering both users' busy times
   */
  findFreeSlots(user1Busy, user2Busy, searchStart, searchEnd, durationMinutes) {
    const freeSlots = [];
    const allBusy = [...user1Busy, ...user2Busy].sort((a, b) => a.start - b.start);

    // Define working hours (9 AM - 5 PM)
    const workStartHour = 9;
    const workEndHour = 17;

    // Iterate through each day in the search period
    let currentDay = new Date(searchStart);
    currentDay.setHours(workStartHour, 0, 0, 0);

    while (currentDay < searchEnd) {
      // Skip weekends
      if (currentDay.getDay() === 0 || currentDay.getDay() === 6) {
        currentDay = addDays(currentDay, 1);
        currentDay.setHours(workStartHour, 0, 0, 0);
        continue;
      }

      const dayEnd = new Date(currentDay);
      dayEnd.setHours(workEndHour, 0, 0, 0);

      // Find free slots in this day
      let slotStart = new Date(currentDay);

      for (const busy of allBusy) {
        if (busy.start > dayEnd) break;
        if (busy.end < slotStart) continue;

        // Check if there's a free slot before this busy period
        const slotEnd = busy.start < dayEnd ? busy.start : dayEnd;
        const slotDuration = (slotEnd - slotStart) / (1000 * 60);

        if (slotDuration >= durationMinutes && slotStart >= currentDay && slotStart < dayEnd) {
          freeSlots.push({
            start: new Date(slotStart),
            end: new Date(slotStart.getTime() + durationMinutes * 60000)
          });

          // Limit to 5 slots per search
          if (freeSlots.length >= 5) {
            return freeSlots;
          }
        }

        // Move to the end of this busy period
        slotStart = busy.end > slotStart ? new Date(busy.end) : slotStart;
      }

      // Check for free time after all busy periods until end of work day
      if (slotStart < dayEnd) {
        const slotDuration = (dayEnd - slotStart) / (1000 * 60);
        if (slotDuration >= durationMinutes) {
          freeSlots.push({
            start: new Date(slotStart),
            end: new Date(slotStart.getTime() + durationMinutes * 60000)
          });

          if (freeSlots.length >= 5) {
            return freeSlots;
          }
        }
      }

      // Move to next day
      currentDay = addDays(currentDay, 1);
      currentDay.setHours(workStartHour, 0, 0, 0);
    }

    return freeSlots;
  }

  /**
   * Create a calendar event for both users with Teams meeting link
   */
  async createMeetingEvent(user1Email, user2Email, startTime, endTime, icebreakers = []) {
    try {
      // In development mode, return mock event
      if (this.isDevelopment) {
        logger.info('Calendar (DEV MODE): Mock event created');
        return {
          id: `mock-event-${Date.now()}`,
          webLink: 'https://outlook.office.com/calendar/mock-event',
          onlineMeeting: {
            joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock-meeting'
          }
        };
      }

      const accessToken = await this.getAccessToken();

      const icebreakerText = icebreakers.length > 0
        ? `\n\nConversation starters:\n${icebreakers.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}`
        : '';

      const eventData = {
        subject: '☕ Coffee Roulette Meeting',
        body: {
          contentType: 'HTML',
          content: `
            <p>Hi there! This is your Coffee Roulette meeting.</p>
            <p>This is a great opportunity to connect with a colleague, share experiences, and build relationships across Mercator.</p>
            ${icebreakerText ? `<h3>Conversation Starters:</h3><ul>${icebreakers.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
            <p>Enjoy your coffee and conversation!</p>
          `
        },
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        },
        attendees: [
          {
            emailAddress: {
              address: user1Email
            },
            type: 'required'
          },
          {
            emailAddress: {
              address: user2Email
            },
            type: 'required'
          }
        ],
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
        allowNewTimeProposals: true
      };

      // Create event in user1's calendar
      const response = await axios.post(
        `${this.graphApiUrl}/users/${user1Email}/calendar/events`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Calendar event created:', {
        eventId: response.data.id,
        attendees: [user1Email, user2Email],
        startTime: startTime.toISOString()
      });

      return {
        id: response.data.id,
        webLink: response.data.webLink,
        onlineMeeting: response.data.onlineMeeting
      };
    } catch (error) {
      logger.error('Error creating calendar event:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Schedule meeting between two users
   * Finds common availability and creates calendar event
   */
  async scheduleMeeting(user1Email, user2Email, icebreakers = []) {
    try {
      logger.info(`Scheduling meeting between ${user1Email} and ${user2Email}`);

      // Find common availability
      const availableSlots = await this.findCommonAvailability(user1Email, user2Email);

      if (availableSlots.length === 0) {
        logger.warn('No common availability found, will require manual scheduling');
        return {
          success: false,
          reason: 'no_availability',
          message: 'No common availability found. Please schedule manually.'
        };
      }

      // Use the first available slot
      const selectedSlot = availableSlots[0];

      // Create calendar event
      const event = await this.createMeetingEvent(
        user1Email,
        user2Email,
        selectedSlot.start,
        selectedSlot.end,
        icebreakers
      );

      return {
        success: true,
        scheduledAt: selectedSlot.start,
        eventId: event.id,
        webLink: event.webLink,
        teamsLink: event.onlineMeeting?.joinUrl
      };
    } catch (error) {
      logger.error('Error scheduling meeting:', error);
      return {
        success: false,
        reason: 'error',
        message: error.message
      };
    }
  }

  /**
   * Cancel a calendar event
   */
  async cancelMeetingEvent(userEmail, eventId) {
    try {
      if (this.isDevelopment) {
        logger.info('Calendar (DEV MODE): Mock event cancelled');
        return { success: true };
      }

      const accessToken = await this.getAccessToken();

      await axios.delete(
        `${this.graphApiUrl}/users/${userEmail}/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      logger.info(`Calendar event ${eventId} cancelled`);
      return { success: true };
    } catch (error) {
      logger.error('Error cancelling calendar event:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new CalendarService();
