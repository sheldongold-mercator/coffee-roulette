module.exports = ({ userName, partnerName, pairingId }) => {
  const subject = `📝 How was your coffee with ${partnerName}?`;

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
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
    .feedback-card {
      background: #f1f8ff;
      border-left: 4px solid #2196f3;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .feedback-card h2 {
      margin-top: 0;
      color: #1976d2;
    }
    .why-feedback {
      background: #fff9e6;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .why-feedback h3 {
      margin-top: 0;
      color: #f57c00;
    }
    .cta-button {
      display: inline-block;
      background: #2196f3;
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
      font-size: 16px;
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
    .stars {
      font-size: 24px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📝 We'd Love Your Feedback</h1>
    <p>How was your Coffee Roulette meeting?</p>
  </div>

  <div class="content">
    <p>Hi ${userName},</p>

    <p>We hope you had a great time connecting with ${partnerName} during your Coffee Roulette meeting!</p>

    <div class="feedback-card">
      <h2>Share Your Experience</h2>
      <p>Your feedback helps us improve the Coffee Roulette program and ensure everyone has meaningful connections.</p>
      <div class="stars">⭐⭐⭐⭐⭐</div>
      <p>It only takes a minute to share:</p>
      <ul>
        <li>How was the overall experience?</li>
        <li>Did the conversation flow well?</li>
        <li>What topics did you discuss?</li>
        <li>Any suggestions for improvement?</li>
      </ul>
    </div>

    <div class="why-feedback">
      <h3>Why Your Feedback Matters</h3>
      <p>Your input helps us:</p>
      <ul>
        <li>Improve the matching algorithm</li>
        <li>Curate better icebreaker topics</li>
        <li>Enhance the overall experience</li>
        <li>Demonstrate program value to leadership</li>
      </ul>
    </div>

    <p style="text-align: center; margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost'}/pairings/${pairingId}/feedback" class="cta-button">
        Share Your Feedback
      </a>
    </p>

    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      <em>Didn't meet yet? No problem! You can submit feedback whenever you're ready.</em>
    </p>
  </div>

  <div class="footer">
    <p>This is an automated message from Coffee Roulette.</p>
    <p>Thank you for being part of building connections at Mercator!</p>
  </div>
</body>
</html>
`;

  const text = `
How was your coffee with ${partnerName}?

Hi ${userName},

We hope you had a great time connecting with ${partnerName} during your Coffee Roulette meeting!

SHARE YOUR EXPERIENCE
Your feedback helps us improve the Coffee Roulette program and ensure everyone has meaningful connections.

It only takes a minute to share:
• How was the overall experience?
• Did the conversation flow well?
• What topics did you discuss?
• Any suggestions for improvement?

WHY YOUR FEEDBACK MATTERS
Your input helps us:
• Improve the matching algorithm
• Curate better icebreaker topics
• Enhance the overall experience
• Demonstrate program value to leadership

Share your feedback: ${process.env.FRONTEND_URL || 'http://localhost'}/pairings/${pairingId}/feedback

Didn't meet yet? No problem! You can submit feedback whenever you're ready.

---
This is an automated message from Coffee Roulette.
Thank you for being part of building connections at Mercator!
`;

  return { subject, html, text };
};
