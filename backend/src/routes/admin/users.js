const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/adminUserController');
const { ensureAuthenticated } = require('../../middleware/authentication');
const { ensureAdmin } = require('../../middleware/authorization');

// All routes require authentication and admin role
router.use(ensureAuthenticated);
router.use(ensureAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Admin
 */
router.get('/', adminUserController.getUsers);

/**
 * @route   GET /api/admin/users/stats
 * @desc    Get user statistics
 * @access  Admin
 */
router.get('/stats', adminUserController.getUserStats);

/**
 * @route   POST /api/admin/users/sync
 * @desc    Sync users from Microsoft Graph API
 * @access  Admin
 */
router.post('/sync', adminUserController.syncUsers);

/**
 * @route   POST /api/admin/users/bulk
 * @desc    Perform bulk actions on multiple users
 * @access  Admin
 */
router.post('/bulk', adminUserController.bulkAction);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get specific user by ID
 * @access  Admin
 */
router.get('/:userId', adminUserController.getUserById);

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user (admin override)
 * @access  Admin
 */
router.put('/:userId', adminUserController.updateUser);

module.exports = router;
