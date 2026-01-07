const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/authentication');

/**
 * @route   POST /api/auth/login
 * @desc    Login with Microsoft access token
 * @access  Public
 */
router.post('/login', authController.loginWithMicrosoft);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private (requires JWT)
 */
router.get('/me', ensureAuthenticated, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (logs the event, token removal is client-side)
 * @access  Private (requires JWT)
 */
router.post('/logout', ensureAuthenticated, authController.logout);

module.exports = router;
