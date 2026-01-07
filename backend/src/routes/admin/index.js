const express = require('express');
const router = express.Router();

// Admin sub-routes
router.use('/users', require('./users'));
router.use('/departments', require('./departments'));
router.use('/matching', require('./matching')); // Phase 3
// router.use('/pairings', require('./pairings')); // Future
router.use('/analytics', require('./analytics')); // Phase 7
router.use('/settings', require('./settings')); // Phase 7

module.exports = router;
