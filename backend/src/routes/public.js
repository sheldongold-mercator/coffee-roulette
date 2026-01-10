const express = require('express');
const router = express.Router();
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * GET /api/public/opt-out/:token
 * One-click opt-out from Coffee Roulette
 * No authentication required - uses token for verification
 */
router.get('/opt-out/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Opt-out token is required'
      });
    }

    // Find user by opt-out token
    const user = await User.findOne({
      where: { opt_out_token: token }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid or expired opt-out link'
      });
    }

    // Check if already opted out
    if (!user.is_opted_in) {
      return res.status(200).json({
        success: true,
        message: 'You have already opted out of Coffee Roulette.',
        alreadyOptedOut: true
      });
    }

    // Opt out the user
    await user.update({
      is_opted_in: false,
      opted_out_at: new Date()
    });

    logger.info(`User ${user.id} (${user.email}) opted out via token link`);

    // Return success response (could also redirect to a confirmation page)
    res.status(200).json({
      success: true,
      message: 'You have successfully opted out of Coffee Roulette. You can opt back in at any time through the Coffee Roulette portal.',
      email: user.email
    });

  } catch (error) {
    logger.error('Opt-out error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process opt-out request'
    });
  }
});

/**
 * GET /api/public/opt-in/:token
 * One-click opt-in to Coffee Roulette (for users who want to rejoin)
 * No authentication required - uses token for verification
 */
router.get('/opt-in/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token is required'
      });
    }

    // Find user by opt-out token (same token used for both)
    const user = await User.findOne({
      where: { opt_out_token: token }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid or expired link'
      });
    }

    // Check if already opted in
    if (user.is_opted_in) {
      return res.status(200).json({
        success: true,
        message: 'You are already participating in Coffee Roulette.',
        alreadyOptedIn: true
      });
    }

    // Opt in the user
    await user.update({
      is_opted_in: true,
      opted_in_at: new Date(),
      opted_out_at: null
    });

    logger.info(`User ${user.id} (${user.email}) opted in via token link`);

    res.status(200).json({
      success: true,
      message: 'You have successfully opted into Coffee Roulette. You will be included in the next matching round!',
      email: user.email
    });

  } catch (error) {
    logger.error('Opt-in error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process opt-in request'
    });
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
