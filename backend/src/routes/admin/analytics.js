const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../middleware/authentication');
const { ensureAdmin } = require('../../middleware/authorization');
const {
  getOverview,
  getParticipationTrends,
  getCompletionTrends,
  getDepartmentStats,
  getFeedbackStats,
  getCrossDepartmentStats,
  getCrossSeniorityStats,
  getEngagementLeaderboard,
  getRecentActivity,
  exportUsers,
  exportPairings,
  exportFeedback,
  exportAnalyticsSummary
} = require('../../controllers/adminAnalyticsController');

// Apply authentication and admin authorization to all routes
router.use(ensureAuthenticated);
router.use(ensureAdmin);

// Analytics endpoints
router.get('/overview', getOverview);
router.get('/trends/participation', getParticipationTrends);
router.get('/trends/completion', getCompletionTrends);
router.get('/departments', getDepartmentStats);
router.get('/feedback', getFeedbackStats);
router.get('/cross-department', getCrossDepartmentStats);
router.get('/cross-seniority', getCrossSeniorityStats);
router.get('/leaderboard', getEngagementLeaderboard);
router.get('/activity', getRecentActivity);

// Export endpoints
router.get('/export/users', exportUsers);
router.get('/export/pairings', exportPairings);
router.get('/export/feedback', exportFeedback);
router.get('/export/summary', exportAnalyticsSummary);

module.exports = router;
