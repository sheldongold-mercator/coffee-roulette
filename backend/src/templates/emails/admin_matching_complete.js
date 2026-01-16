const { formatDate } = require('../../utils/helpers');
const { buildFrontendUrl } = require('../../config/urls');

// Template function for rendering admin matching notification emails
module.exports = ({ adminName, roundName, roundId, scheduledDate, totalParticipants, totalPairings, unpairedUser, source }) => {
  const roundUrl = buildFrontendUrl(`/matching?round=${roundId}`);
  const formattedDate = formatDate(scheduledDate);
  const sourceLabel = source === 'scheduled' ? 'Scheduled' : 'Manual';

  const subject = `Coffee Roulette: ${roundName} - ${totalPairings} Pairings Created`;

  const unpairedSection = unpairedUser
    ? `<div class="unpaired-card">
        <h3>User Not Matched</h3>
        <p>The following user could not be paired this round (odd number of participants):</p>
        <p><strong>${unpairedUser.firstName} ${unpairedUser.lastName}</strong> (${unpairedUser.email})</p>
        <p>They will be prioritized in the next matching round.</p>
      </div>`
    : '';

  const unpairedText = unpairedUser
    ? `\n\nUSER NOT MATCHED\nThe following user could not be paired (odd number of participants):\n${unpairedUser.firstName} ${unpairedUser.lastName} (${unpairedUser.email})\nThey will be prioritized in the next matching round.`
    : '';

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
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
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
    .summary-card {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .summary-card h2 {
      margin-top: 0;
      color: #2e7d32;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #c8e6c9;
    }
    .stat-row:last-child {
      border-bottom: none;
    }
    .stat-label {
      color: #555;
      font-weight: 500;
    }
    .stat-value {
      font-weight: bold;
      color: #2e7d32;
    }
    .unpaired-card {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .unpaired-card h3 {
      margin-top: 0;
      color: #e65100;
    }
    .cta-button {
      display: inline-block;
      background: #4caf50;
      background-color: #4caf50;
      color: #ffffff !important;
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
    <h1>Matching Complete</h1>
    <p>${roundName}</p>
  </div>

  <div class="content">
    <p>Hi ${adminName},</p>

    <p>A ${sourceLabel.toLowerCase()} matching round has completed successfully. Here's a summary of the results:</p>

    <div class="summary-card">
      <h2>Round Summary</h2>
      <div class="stat-row">
        <span class="stat-label">Round Name</span>
        <span class="stat-value">${roundName}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Executed</span>
        <span class="stat-value">${formattedDate}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Source</span>
        <span class="stat-value">${sourceLabel}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total Participants</span>
        <span class="stat-value">${totalParticipants}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Pairings Created</span>
        <span class="stat-value">${totalPairings}</span>
      </div>
    </div>

    ${unpairedSection}

    <p>Notification emails and Teams messages have been queued for all matched participants.</p>

    <p style="margin-top: 30px;">
      <a href="${roundUrl}" class="cta-button" style="color: #ffffff !important; text-decoration: none;">
        View Round Details
      </a>
    </p>
  </div>

  <div class="footer">
    <p>This is an automated admin notification from Coffee Roulette.</p>
    <p>You're receiving this because you're an admin user.</p>
  </div>
</body>
</html>
`;

  const text = `
Coffee Roulette: ${roundName} - Matching Complete

Hi ${adminName},

A ${sourceLabel.toLowerCase()} matching round has completed successfully.

ROUND SUMMARY
Round Name: ${roundName}
Executed: ${formattedDate}
Source: ${sourceLabel}
Total Participants: ${totalParticipants}
Pairings Created: ${totalPairings}
${unpairedText}

Notification emails and Teams messages have been queued for all matched participants.

View round details: ${roundUrl}

---
This is an automated admin notification from Coffee Roulette.
`;

  return { subject, html, text };
};
