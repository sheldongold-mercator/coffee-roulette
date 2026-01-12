const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../middleware/authentication');
const { ensureAdmin } = require('../../middleware/authorization');
const {
  getMatchingRounds,
  getMatchingRoundById,
  previewMatching,
  runMatching,
  getMatchingSettings,
  updateMatchingSettings,
  getEligibleParticipantsCount,
  getScheduleConfig,
  updateSchedule,
  toggleAutoSchedule,
  runManualMatching,
  previewMatchingWithFilters,
  sendRoundReminders,
  sendAllPendingReminders
} = require('../../controllers/adminMatchingController');

// Apply authentication and admin authorization to all routes
router.use(ensureAuthenticated);
router.use(ensureAdmin);

// Matching rounds
router.get('/rounds', getMatchingRounds);
router.get('/rounds/:roundId', getMatchingRoundById);

// Preview and execute matching
router.get('/preview', previewMatching);
router.post('/run', runMatching);

// Settings
router.get('/settings', getMatchingSettings);
router.put('/settings', updateMatchingSettings);

// Eligible participants
router.get('/eligible', getEligibleParticipantsCount);

// Schedule management
router.get('/schedule', getScheduleConfig);
router.put('/schedule', updateSchedule);
router.post('/schedule/toggle', toggleAutoSchedule);

// Manual matching with filters
router.post('/run-manual', runManualMatching);
router.post('/preview-filtered', previewMatchingWithFilters);

// Reminder notifications
router.post('/rounds/:roundId/send-reminders', sendRoundReminders);
router.post('/send-all-reminders', sendAllPendingReminders);

module.exports = router;
