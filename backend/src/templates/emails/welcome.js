/**
 * Welcome email template for new Coffee Roulette participants
 * Sent when a department is activated or a new user joins an active department
 */
module.exports = ({ userName, userEmail, departmentName, optOutToken }) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://ec2-100-52-223-104.compute-1.amazonaws.com';
  const optOutLink = `${baseUrl}/api/public/opt-out/${optOutToken}`;
  const portalLink = baseUrl;

  const subject = `☕ Welcome to Coffee Roulette!`;

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
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .highlight-box {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .highlight-box h3 {
      margin-top: 0;
      color: #667eea;
    }
    .benefits-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    .benefits-list li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .benefits-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
    .how-it-works {
      background: #f8f9fa;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .how-it-works h3 {
      margin-top: 0;
      color: #333;
    }
    .how-it-works ol {
      margin: 15px 0;
      padding-left: 20px;
    }
    .how-it-works li {
      margin: 10px 0;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 5px 10px 0;
      font-weight: bold;
    }
    .cta-button.secondary {
      background: #6b7280;
    }
    .opt-out-section {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 5px;
    }
    .opt-out-section p {
      margin: 0;
    }
    .opt-out-section a {
      color: #b45309;
      font-weight: 500;
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
    <h1>☕ Welcome to Coffee Roulette!</h1>
    <p>Building connections, one coffee at a time</p>
  </div>

  <div class="content">
    <p>Hi ${userName},</p>

    <p>Great news! Your department${departmentName ? ` (${departmentName})` : ''} has joined <strong>Coffee Roulette</strong> - our initiative to help colleagues connect, share experiences, and build relationships across the company.</p>

    <div class="highlight-box">
      <h3>🎉 You're Automatically Enrolled!</h3>
      <p>You've been signed up to participate in Coffee Roulette. Each month, you'll be randomly matched with a colleague for a casual 30-minute coffee chat.</p>
    </div>

    <h3>Why Coffee Roulette?</h3>
    <ul class="benefits-list">
      <li><strong>Build your network:</strong> Meet colleagues you might not otherwise cross paths with</li>
      <li><strong>Learn from others:</strong> Gain insights from different departments and roles</li>
      <li><strong>Strengthen culture:</strong> Foster a sense of community across the organization</li>
      <li><strong>It's just 30 minutes:</strong> A small time investment with lasting benefits</li>
    </ul>

    <div class="how-it-works">
      <h3>📋 How It Works</h3>
      <ol>
        <li><strong>Monthly matching:</strong> On the 1st of each month, you'll be paired with a random colleague</li>
        <li><strong>You'll receive an email:</strong> We'll introduce you and your coffee partner</li>
        <li><strong>Schedule your chat:</strong> Reach out to your partner and find a time that works</li>
        <li><strong>Have a coffee:</strong> In-person, virtual, or however works best for you</li>
        <li><strong>Share feedback:</strong> Let us know how it went (optional but appreciated!)</li>
      </ol>
    </div>

    <p>
      <a href="${portalLink}" class="cta-button">Visit Coffee Roulette Portal</a>
    </p>

    <div class="opt-out-section">
      <p><strong>Not interested?</strong> No problem! You can opt out at any time. <a href="${optOutLink}">Click here to opt out</a> - it's just one click, no login required.</p>
    </div>

    <p>We hope you enjoy connecting with your colleagues through Coffee Roulette!</p>

    <p>Cheers,<br>The Coffee Roulette Team</p>
  </div>

  <div class="footer">
    <p>This is an automated message from Coffee Roulette.</p>
    <p>You can manage your preferences at any time in the <a href="${portalLink}">Coffee Roulette portal</a>.</p>
  </div>
</body>
</html>
`;

  const text = `
Welcome to Coffee Roulette!

Hi ${userName},

Great news! Your department${departmentName ? ` (${departmentName})` : ''} has joined Coffee Roulette - our initiative to help colleagues connect, share experiences, and build relationships across the company.

YOU'RE AUTOMATICALLY ENROLLED!
You've been signed up to participate in Coffee Roulette. Each month, you'll be randomly matched with a colleague for a casual 30-minute coffee chat.

WHY COFFEE ROULETTE?
- Build your network: Meet colleagues you might not otherwise cross paths with
- Learn from others: Gain insights from different departments and roles
- Strengthen culture: Foster a sense of community across the organization
- It's just 30 minutes: A small time investment with lasting benefits

HOW IT WORKS
1. Monthly matching: On the 1st of each month, you'll be paired with a random colleague
2. You'll receive an email: We'll introduce you and your coffee partner
3. Schedule your chat: Reach out to your partner and find a time that works
4. Have a coffee: In-person, virtual, or however works best for you
5. Share feedback: Let us know how it went (optional but appreciated!)

Visit the Coffee Roulette Portal: ${portalLink}

NOT INTERESTED?
No problem! You can opt out at any time.
Click here to opt out (one click, no login required): ${optOutLink}

We hope you enjoy connecting with your colleagues through Coffee Roulette!

Cheers,
The Coffee Roulette Team

---
This is an automated message from Coffee Roulette.
You can manage your preferences at any time in the Coffee Roulette portal.
`;

  return { subject, html, text };
};
