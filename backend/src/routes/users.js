const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/authentication');

// All routes require authentication
router.use(ensureAuthenticated);

/**
 * @route   GET /api/users/profile
 * @desc    Get user's own profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user's own profile
 * @access  Private
 */
router.put('/profile', userController.updateProfile);

/**
 * @route   POST /api/users/opt-in
 * @desc    Opt in to Coffee Roulette
 * @access  Private
 */
router.post('/opt-in', userController.optIn);

/**
 * @route   POST /api/users/opt-out
 * @desc    Opt out of Coffee Roulette
 * @access  Private
 */
router.post('/opt-out', userController.optOut);

/**
 * @route   GET /api/users/pairings
 * @desc    Get user's pairing history
 * @access  Private
 */
router.get('/pairings', userController.getPairings);

/**
 * @route   GET /api/users/pairings/current
 * @desc    Get user's current/upcoming pairing
 * @access  Private
 */
router.get('/pairings/current', userController.getCurrentPairing);

/**
 * @route   POST /api/users/pairings/:pairingId/confirm
 * @desc    Confirm meeting completion
 * @access  Private
 */
router.post('/pairings/:pairingId/confirm', userController.confirmMeeting);

/**
 * @route   POST /api/users/pairings/:pairingId/feedback
 * @desc    Submit meeting feedback
 * @access  Private
 */
router.post('/pairings/:pairingId/feedback', userController.submitFeedback);

module.exports = router;
