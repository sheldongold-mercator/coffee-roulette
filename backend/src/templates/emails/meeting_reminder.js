const { formatDate } = require('../../utils/helpers');
const { buildFrontendUrl } = require('../../config/urls');

// Raw template subject with variable placeholders (for editor display)
const rawSubject = "⏰ Reminder: Coffee meeting with \${partnerName} \${urgency}";

// Raw HTML template with variable placeholders (for editor display)
const rawHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .reminder-card { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .reminder-card h2 { margin-top: 0; color: #e65100; }
    .date-info { font-size: 18px; font-weight: bold; color: #ff9800; margin: 10px 0; }
    .icebreakers { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .icebreakers h3 { margin-top: 0; color: #2e7d32; }
    .icebreakers ul { margin: 10px 0; padding-left: 20px; }
    .icebreakers li { margin: 8px 0; }
    .tips { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .tips h3 { margin-top: 0; color: #1565c0; }
    .cta-button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Meeting Reminder</h1>
    <p>Your Coffee Roulette meeting is coming up!</p>
  </div>
  <div class="content">
    <p>Hi \${userName},</p>
    <p>Just a friendly reminder that your Coffee Roulette meeting is \${urgency}!</p>
    <div class="reminder-card">
      <h2>Meeting Details</h2>
      <div class="date-info">📅 \${meetingDate}</div>
      <p><strong>With:</strong> \${partnerName}</p>
      <p>Check your Outlook calendar for the meeting link and exact time.</p>
    </div>
    <div class="icebreakers">
      <h3>💬 Conversation Starters</h3>
      <p>Here are some topics to get the conversation flowing:</p>
      <ul>\${icebreakers}</ul>
    </div>
    <div class="tips">
      <h3>🌟 Tips for a Great Meeting</h3>
      <ul>
        <li>Be present - give your full attention to the conversation</li>
        <li>Ask open-ended questions and listen actively</li>
        <li>Share your experiences and perspectives</li>
        <li>Keep it relaxed and casual - this is about connection, not work</li>
        <li>Have fun and enjoy getting to know your colleague!</li>
      </ul>
    </div>
    <p style="margin-top: 30px;"><a href="\${pairingUrl}" class="cta-button">View Meeting Details</a></p>
  </div>
  <div class="footer">
    <p>This is an automated reminder from Coffee Roulette.</p>
    <p>We hope you have a great conversation!</p>
  </div>
</body>
</html>`;

// Raw text template with variable placeholders
const rawText = `Meeting Reminder: Coffee with \${partnerName} \${urgency}

Hi \${userName},

Just a friendly reminder that your Coffee Roulette meeting is \${urgency}!

MEETING DETAILS
Date: \${meetingDate}
With: \${partnerName}

Check your Outlook calendar for the meeting link and exact time.

CONVERSATION STARTERS
\${icebreakers}

TIPS FOR A GREAT MEETING
- Be present - give your full attention to the conversation
- Ask open-ended questions and listen actively
- Share your experiences and perspectives
- Keep it relaxed and casual - this is about connection, not work
- Have fun and enjoy getting to know your colleague!

View meeting details: \${pairingUrl}

---
This is an automated reminder from Coffee Roulette.
We hope you have a great conversation!`;

// Template function for rendering emails
module.exports = ({ userName, partnerName, meetingDate, daysUntil, icebreakers, pairingId }) => {
  const pairingUrl = buildFrontendUrl(`/pairings/${pairingId}`);
  const formattedDate = formatDate(meetingDate);
  const icebreakerList = icebreakers.map(topic => `• ${topic}`).join('\n');
  const icebreakerHTML = icebreakers.map(topic => `<li>${topic}</li>`).join('');

  const urgency = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
  const subject = `⏰ Reminder: Coffee meeting with ${partnerName} ${urgency}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .reminder-card {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .reminder-card h2 {
      margin-top: 0;
      color: #e65100;
    }
    .date-info {
      font-size: 18px;
      font-weight: bold;
      color: #ff9800;
      margin: 10px 0;
    }
    .icebreakers {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .icebreakers h3 {
      margin-top: 0;
      color: #2e7d32;
    }
    .icebreakers ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .icebreakers li {
      margin: 8px 0;
    }
    .tips {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .tips h3 {
      margin-top: 0;
      color: #1565c0;
    }
    .cta-button {
      display: inline-block;
      background: #f5576c;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-radius: 0 0 10px 10px;
      border: 1px solid #e0e0e0;
      border-top: none;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Meeting Reminder</h1>
    <p>Your Coffee Roulette meeting is coming up!</p>
  </div>

  <div class="content">
    <p>Hi ${userName},</p>

    <p>Just a friendly reminder that your Coffee Roulette meeting is ${urgency}!</p>

    <div class="reminder-card">
      <h2>Meeting Details</h2>
      <div class="date-info">📅 ${formattedDate}</div>
      <p><strong>With:</strong> ${partnerName}</p>
      <p>Check your Outlook calendar for the meeting link and exact time.</p>
    </div>

    <div class="icebreakers">
      <h3>💬 Conversation Starters</h3>
      <p>Here are some topics to get the conversation flowing:</p>
      <ul>
        ${icebreakerHTML}
      </ul>
    </div>

    <div class="tips">
      <h3>🌟 Tips for a Great Meeting</h3>
      <ul>
        <li>Be present - give your full attention to the conversation</li>
        <li>Ask open-ended questions and listen actively</li>
        <li>Share your experiences and perspectives</li>
        <li>Keep it relaxed and casual - this is about connection, not work</li>
        <li>Have fun and enjoy getting to know your colleague!</li>
      </ul>
    </div>

    <p style="margin-top: 30px;">
      <a href="${pairingUrl}" class="cta-button">
        View Meeting Details
      </a>
    </p>
  </div>

  <div class="footer">
    <p>This is an automated reminder from Coffee Roulette.</p>
    <p>We hope you have a great conversation!</p>
  </div>
</body>
</html>
`;

  const text = `
Meeting Reminder: Coffee with ${partnerName} ${urgency}

Hi ${userName},

Just a friendly reminder that your Coffee Roulette meeting is ${urgency}!

MEETING DETAILS
Date: ${formattedDate}
With: ${partnerName}

Check your Outlook calendar for the meeting link and exact time.

CONVERSATION STARTERS
${icebreakerList}

TIPS FOR A GREAT MEETING
• Be present - give your full attention to the conversation
• Ask open-ended questions and listen actively
• Share your experiences and perspectives
• Keep it relaxed and casual - this is about connection, not work
• Have fun and enjoy getting to know your colleague!

View meeting details: ${pairingUrl}

---
This is an automated reminder from Coffee Roulette.
We hope you have a great conversation!
`;

  return { subject, html, text };
};

// Export raw templates for editor display (must be after module.exports assignment)
module.exports.rawTemplates = {
  subject: rawSubject,
  html: rawHtml,
  text: rawText
};
