/**
 * Sample data for template previews
 * Used when generating template previews in the admin interface
 */

const baseUrl = process.env.FRONTEND_URL || 'https://coffee-roulette.mercator.com';

module.exports = {
  welcome: {
    userName: 'Alex',
    userEmail: 'alex.johnson@mercator.com',
    departmentName: 'Engineering',
    optOutToken: 'sample-uuid-token-12345',
    portalLink: baseUrl,
    optOutLink: `${baseUrl}/api/public/opt-out/sample-uuid-token-12345`
  },

  pairing_notification: {
    userName: 'Alex',
    partnerName: 'Jordan Smith',
    partnerEmail: 'jordan.smith@mercator.com',
    partnerDepartment: 'Marketing',
    meetingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    icebreakers: [
      'What project are you most excited about right now?',
      'If you could have any superpower at work, what would it be?',
      'What is your favorite team tradition?'
    ],
    pairingId: 12345
  },

  meeting_reminder: {
    userName: 'Alex',
    partnerName: 'Jordan Smith',
    meetingDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    daysUntil: 1,
    icebreakers: [
      'What project are you most excited about right now?',
      'If you could have any superpower at work, what would it be?'
    ],
    pairingId: 12345
  },

  feedback_request: {
    userName: 'Alex',
    partnerName: 'Jordan Smith',
    pairingId: 12345
  }
};

/**
 * Variable definitions for each template type
 * Used to show available variables in the template editor
 */
module.exports.variableDefinitions = {
  welcome: [
    { name: 'userName', description: 'Recipient\'s first name', example: 'Alex', required: true },
    { name: 'userEmail', description: 'Recipient\'s email address', example: 'alex@company.com', required: true },
    { name: 'departmentName', description: 'Name of the user\'s department', example: 'Engineering', required: false },
    { name: 'optOutToken', description: 'Unique token for one-click opt-out', example: 'uuid-token', required: true },
    { name: 'portalLink', description: 'Link to the Coffee Roulette portal', example: 'https://...', required: true },
    { name: 'optOutLink', description: 'Direct link to opt out', example: 'https://.../opt-out/token', required: true }
  ],

  pairing_notification: [
    { name: 'userName', description: 'Recipient\'s first name', example: 'Alex', required: true },
    { name: 'partnerName', description: 'Coffee partner\'s full name', example: 'Jordan Smith', required: true },
    { name: 'partnerEmail', description: 'Coffee partner\'s email', example: 'jordan@company.com', required: true },
    { name: 'partnerDepartment', description: 'Coffee partner\'s department', example: 'Marketing', required: false },
    { name: 'meetingDate', description: 'Scheduled meeting date/time', example: 'January 15, 2026', required: false },
    { name: 'icebreakers', description: 'Array of conversation starter topics', example: '["Topic 1", "Topic 2"]', required: false, type: 'array' },
    { name: 'pairingId', description: 'Unique pairing identifier', example: '12345', required: true }
  ],

  meeting_reminder: [
    { name: 'userName', description: 'Recipient\'s first name', example: 'Alex', required: true },
    { name: 'partnerName', description: 'Coffee partner\'s full name', example: 'Jordan Smith', required: true },
    { name: 'meetingDate', description: 'Scheduled meeting date/time', example: 'January 15, 2026', required: true },
    { name: 'daysUntil', description: 'Days until the meeting', example: '1', required: true },
    { name: 'icebreakers', description: 'Array of conversation starter topics', example: '["Topic 1", "Topic 2"]', required: false, type: 'array' },
    { name: 'pairingId', description: 'Unique pairing identifier', example: '12345', required: true }
  ],

  feedback_request: [
    { name: 'userName', description: 'Recipient\'s first name', example: 'Alex', required: true },
    { name: 'partnerName', description: 'Coffee partner\'s full name', example: 'Jordan Smith', required: true },
    { name: 'pairingId', description: 'Unique pairing identifier', example: '12345', required: true }
  ]
};

/**
 * Template metadata
 */
module.exports.templateMetadata = {
  welcome: {
    name: 'Welcome Email',
    description: 'Sent when a user is enrolled in Coffee Roulette (department activation or new user sync)',
    channels: ['email']
  },
  pairing_notification: {
    name: 'Pairing Notification',
    description: 'Sent when users are matched for a coffee meeting',
    channels: ['email', 'teams']
  },
  meeting_reminder: {
    name: 'Meeting Reminder',
    description: 'Sent before scheduled meetings (1 day and 7 days prior)',
    channels: ['email', 'teams']
  },
  feedback_request: {
    name: 'Feedback Request',
    description: 'Sent after meetings to collect feedback',
    channels: ['email', 'teams']
  }
};
