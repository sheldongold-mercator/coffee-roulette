const express = require('express');
const router = express.Router();
const { User } = require('../models');
const logger = require('../utils/logger');
const { getFrontendUrl } = require('../config/urls');

/**
 * Helper to generate HTML confirmation page
 * This prevents email security scanners from triggering opt-out
 */
const generateOptOutPage = (user, token, alreadyOptedOut = false, justOptedOut = false) => {
  const portalUrl = getFrontendUrl();

  let content;
  if (alreadyOptedOut) {
    content = `
      <div class="status-box info">
        <h2>Already Opted Out</h2>
        <p>You have already opted out of Coffee Roulette.</p>
        <p>If you'd like to rejoin, you can opt back in anytime.</p>
      </div>
      <a href="${portalUrl}" class="btn btn-primary">Visit Coffee Roulette Portal</a>
    `;
  } else if (justOptedOut) {
    content = `
      <div class="status-box success">
        <h2>Successfully Opted Out</h2>
        <p>You have been removed from Coffee Roulette matching.</p>
        <p>Changed your mind? You can opt back in anytime through the portal.</p>
      </div>
      <a href="${portalUrl}" class="btn btn-primary">Visit Coffee Roulette Portal</a>
    `;
  } else {
    content = `
      <div class="status-box warning">
        <h2>Opt Out of Coffee Roulette?</h2>
        <p>Hi <strong>${user.first_name}</strong>, are you sure you want to opt out?</p>
        <p>You won't be matched with colleagues for coffee chats until you opt back in.</p>
      </div>
      <form method="POST" action="/api/public/opt-out/${token}">
        <button type="submit" class="btn btn-danger">Yes, Opt Me Out</button>
        <a href="${portalUrl}" class="btn btn-secondary">Cancel - Keep Me In</a>
      </form>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coffee Roulette - Opt Out</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .logo { font-size: 48px; margin-bottom: 20px; }
    h1 { color: #333; margin-bottom: 30px; font-size: 24px; }
    .status-box {
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .status-box h2 { margin-bottom: 10px; font-size: 20px; }
    .status-box p { color: #666; margin: 8px 0; }
    .status-box.warning { background: #fef3c7; border: 2px solid #f59e0b; }
    .status-box.warning h2 { color: #b45309; }
    .status-box.success { background: #d1fae5; border: 2px solid #10b981; }
    .status-box.success h2 { color: #047857; }
    .status-box.info { background: #e0e7ff; border: 2px solid #6366f1; }
    .status-box.info h2 { color: #4338ca; }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      margin: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-primary { background: #f59e0b; color: white; }
    .btn-secondary { background: #e5e7eb; color: #374151; }
    .btn-danger { background: #ef4444; color: white; }
    form { display: flex; flex-direction: column; gap: 10px; align-items: center; }
    @media (min-width: 400px) { form { flex-direction: row; justify-content: center; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">&#9749;</div>
    <h1>Coffee Roulette</h1>
    ${content}
  </div>
</body>
</html>
  `;
};

/**
 * GET /api/public/opt-out/:token
 * Shows confirmation page - does NOT opt out (prevents email scanner triggers)
 * No authentication required - uses token for verification
 */
router.get('/opt-out/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send('<h1>Invalid request</h1>');
    }

    // Find user by opt-out token
    const user = await User.findOne({
      where: { opt_out_token: token }
    });

    if (!user) {
      return res.status(404).send('<h1>Invalid or expired link</h1>');
    }

    // Show confirmation page (don't opt out yet - this prevents email scanner triggers)
    const alreadyOptedOut = !user.is_opted_in;
    res.status(200).send(generateOptOutPage(user, token, alreadyOptedOut, false));

  } catch (error) {
    logger.error('Opt-out page error:', error);
    res.status(500).send('<h1>Something went wrong</h1>');
  }
});

/**
 * POST /api/public/opt-out/:token
 * Actually performs the opt-out action (requires form submission)
 * No authentication required - uses token for verification
 */
router.post('/opt-out/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send('<h1>Invalid request</h1>');
    }

    // Find user by opt-out token
    const user = await User.findOne({
      where: { opt_out_token: token }
    });

    if (!user) {
      return res.status(404).send('<h1>Invalid or expired link</h1>');
    }

    // Check if already opted out
    if (!user.is_opted_in) {
      return res.status(200).send(generateOptOutPage(user, token, true, false));
    }

    // Opt out the user
    await user.update({
      is_opted_in: false,
      opted_out_at: new Date()
    });

    logger.info(`User ${user.id} (${user.email}) opted out via token link (confirmed)`);

    // Show success page
    res.status(200).send(generateOptOutPage(user, token, false, true));

  } catch (error) {
    logger.error('Opt-out error:', error);
    res.status(500).send('<h1>Something went wrong</h1>');
  }
});

/**
 * Helper to generate HTML opt-in confirmation page
 */
const generateOptInPage = (user, token, alreadyOptedIn = false, justOptedIn = false) => {
  const portalUrl = getFrontendUrl();

  let content;
  if (alreadyOptedIn) {
    content = `
      <div class="status-box info">
        <h2>Already Participating</h2>
        <p>You are already participating in Coffee Roulette!</p>
        <p>You'll be matched with a colleague in the next round.</p>
      </div>
      <a href="${portalUrl}" class="btn btn-primary">Visit Coffee Roulette Portal</a>
    `;
  } else if (justOptedIn) {
    content = `
      <div class="status-box success">
        <h2>Welcome Back!</h2>
        <p>You have successfully opted back into Coffee Roulette.</p>
        <p>You'll be matched with a colleague in the next round.</p>
      </div>
      <a href="${portalUrl}" class="btn btn-primary">Visit Coffee Roulette Portal</a>
    `;
  } else {
    content = `
      <div class="status-box warning">
        <h2>Rejoin Coffee Roulette?</h2>
        <p>Hi <strong>${user.first_name}</strong>, would you like to opt back in?</p>
        <p>You'll be matched with colleagues for casual coffee chats.</p>
      </div>
      <form method="POST" action="/api/public/opt-in/${token}">
        <button type="submit" class="btn btn-success">Yes, Count Me In!</button>
        <a href="${portalUrl}" class="btn btn-secondary">Not Now</a>
      </form>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coffee Roulette - Opt In</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .logo { font-size: 48px; margin-bottom: 20px; }
    h1 { color: #333; margin-bottom: 30px; font-size: 24px; }
    .status-box {
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .status-box h2 { margin-bottom: 10px; font-size: 20px; }
    .status-box p { color: #666; margin: 8px 0; }
    .status-box.warning { background: #fef3c7; border: 2px solid #f59e0b; }
    .status-box.warning h2 { color: #b45309; }
    .status-box.success { background: #d1fae5; border: 2px solid #10b981; }
    .status-box.success h2 { color: #047857; }
    .status-box.info { background: #e0e7ff; border: 2px solid #6366f1; }
    .status-box.info h2 { color: #4338ca; }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      margin: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-primary { background: #f59e0b; color: white; }
    .btn-secondary { background: #e5e7eb; color: #374151; }
    .btn-success { background: #10b981; color: white; }
    form { display: flex; flex-direction: column; gap: 10px; align-items: center; }
    @media (min-width: 400px) { form { flex-direction: row; justify-content: center; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">&#9749;</div>
    <h1>Coffee Roulette</h1>
    ${content}
  </div>
</body>
</html>
  `;
};

/**
 * GET /api/public/opt-in/:token
 * Shows confirmation page - does NOT opt in (prevents email scanner triggers)
 * No authentication required - uses token for verification
 */
router.get('/opt-in/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send('<h1>Invalid request</h1>');
    }

    // Find user by opt-out token (same token used for both)
    const user = await User.findOne({
      where: { opt_out_token: token }
    });

    if (!user) {
      return res.status(404).send('<h1>Invalid or expired link</h1>');
    }

    // Show confirmation page (don't opt in yet - prevents email scanner triggers)
    const alreadyOptedIn = user.is_opted_in;
    res.status(200).send(generateOptInPage(user, token, alreadyOptedIn, false));

  } catch (error) {
    logger.error('Opt-in page error:', error);
    res.status(500).send('<h1>Something went wrong</h1>');
  }
});

/**
 * POST /api/public/opt-in/:token
 * Actually performs the opt-in action (requires form submission)
 * No authentication required - uses token for verification
 */
router.post('/opt-in/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send('<h1>Invalid request</h1>');
    }

    // Find user by opt-out token (same token used for both)
    const user = await User.findOne({
      where: { opt_out_token: token }
    });

    if (!user) {
      return res.status(404).send('<h1>Invalid or expired link</h1>');
    }

    // Check if already opted in
    if (user.is_opted_in) {
      return res.status(200).send(generateOptInPage(user, token, true, false));
    }

    // Opt in the user
    await user.update({
      is_opted_in: true,
      opted_in_at: new Date(),
      opted_out_at: null,
      skip_grace_period: true // Skip grace period when opting in via link
    });

    logger.info(`User ${user.id} (${user.email}) opted in via token link (confirmed)`);

    // Show success page
    res.status(200).send(generateOptInPage(user, token, false, true));

  } catch (error) {
    logger.error('Opt-in error:', error);
    res.status(500).send('<h1>Something went wrong</h1>');
  }
});

/**
 * GET /api/public/status/:token
 * Check participation status
 */
router.get('/status/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: { opt_out_token: token },
      include: [{ association: 'department', attributes: ['name', 'is_active'] }]
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid link'
      });
    }

    res.status(200).json({
      email: user.email,
      firstName: user.first_name,
      isOptedIn: user.is_opted_in,
      department: user.department ? user.department.name : null,
      departmentActive: user.department ? user.department.is_active : false
    });

  } catch (error) {
    logger.error('Status check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check status'
    });
  }
});

module.exports = router;
