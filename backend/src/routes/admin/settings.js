const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../middleware/authentication');
const { ensureAdmin } = require('../../middleware/authorization');
const {
  getAllSettings,
  getSettingsByCategory,
  updateSetting,
  updateMultipleSettings,
  getJobStatus,
  triggerJob
} = require('../../controllers/adminSettingsController');

// Apply authentication and admin authorization to all routes
router.use(ensureAuthenticated);
router.use(ensureAdmin);

// Settings endpoints
router.get('/', getAllSettings);
router.get('/category/:category', getSettingsByCategory);
router.put('/:key', updateSetting);
router.put('/', updateMultipleSettings);

// Job management endpoints
router.get('/jobs/status', getJobStatus);
router.post('/jobs/:jobKey/trigger', triggerJob);

module.exports = router;
