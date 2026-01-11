const { formatDate } = require('../../utils/helpers');
const { buildFrontendUrl } = require('../../config/urls');

module.exports = ({ userName, partnerName, partnerEmail, partnerDepartment, meetingDate, icebreakers, pairingId }) => {
  const pairingUrl = buildFrontendUrl(`/pairings/${pairingId}`);
  const formattedDate = meetingDate ? formatDate(meetingDate) : 'To be scheduled';
  const icebreakerList = icebreakers.map(topic => `• ${topic}`).join('\n');
  const icebreakerHTML = icebreakers.map(topic => `<li>${topic}</li>`).join('');

  const subject = `☕ Coffee Roulette: You've been matched with ${partnerName}!`;

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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    .partner-card {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .partner-card h2 {
      margin-top: 0;
      color: #667eea;
    }
    .partner-info {
      margin: 10px 0;
    }
    .partner-info strong {
      color: #555;
    }
    .icebreakers {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .icebreakers h3 {
      margin-top: 0;
      color: #856404;
    }
    .icebreakers ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .icebreakers li {
      margin: 8px 0;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
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
    <h1>☕ Coffee Roulette</h1>
    <p>You've been matched for coffee!</p>
  </div>

  <div class="content">
    <p>Hi ${userName},</p>

    <p>Great news! You've been matched with a colleague for this month's Coffee Roulette. This is a fantastic opportunity to connect, share experiences, and build relationships across Mercator.</p>

    <div class="partner-card">
      <h2>Your Coffee Partner</h2>
      <div class="partner-info">
        <strong>Name:</strong> ${partnerName}
      </div>
      <div class="partner-info">
        <strong>Email:</strong> <a href="mailto:${partnerEmail}">${partnerEmail}</a>
      </div>
      <div class="partner-info">
        <strong>Department:</strong> ${partnerDepartment}
      </div>
      ${meetingDate ? `<div class="partner-info">
        <strong>Scheduled:</strong> ${formattedDate}
      </div>` : ''}
    </div>

    <div class="icebreakers">
      <h3>💬 Conversation Starters</h3>
      <p>Not sure what to talk about? Try these icebreaker topics:</p>
      <ul>
        ${icebreakerHTML}
      </ul>
    </div>

    <h3>What's Next?</h3>
    <ol>
      <li><strong>Reach out:</strong> Send a quick email to ${partnerName} to introduce yourself</li>
      <li><strong>Schedule a time:</strong> ${meetingDate ? 'Your meeting is already scheduled!' : 'Find a 30-minute slot that works for both of you'}</li>
      <li><strong>Meet up:</strong> Grab a coffee and enjoy the conversation</li>
      <li><strong>Share feedback:</strong> Let us know how it went</li>
    </ol>

    <p style="margin-top: 30px;">
      <a href="${pairingUrl}" class="cta-button">
        View My Pairing
      </a>
    </p>
  </div>

  <div class="footer">
    <p>This is an automated message from Coffee Roulette.</p>
    <p>If you'd like to opt out of future matches, please update your preferences in the app.</p>
  </div>
</body>
</html>
`;

  const text = `
Coffee Roulette: You've been matched with ${partnerName}!

Hi ${userName},

Great news! You've been matched with a colleague for this month's Coffee Roulette.

YOUR COFFEE PARTNER
Name: ${partnerName}
Email: ${partnerEmail}
Department: ${partnerDepartment}
${meetingDate ? `Scheduled: ${formattedDate}` : ''}

CONVERSATION STARTERS
${icebreakerList}

WHAT'S NEXT?
1. Reach out: Send a quick email to ${partnerName} to introduce yourself
2. Schedule a time: ${meetingDate ? 'Your meeting is already scheduled!' : 'Find a 30-minute slot that works for both of you'}
3. Meet up: Grab a coffee and enjoy the conversation
4. Share feedback: Let us know how it went

View your pairing: ${pairingUrl}

---
This is an automated message from Coffee Roulette.
If you'd like to opt out of future matches, please update your preferences in the app.
`;

  return { subject, html, text };
};
