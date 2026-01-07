const express = require('express');
const router = express.Router();
const adminDepartmentController = require('../../controllers/adminDepartmentController');
const { ensureAuthenticated } = require('../../middleware/authentication');
const { ensureAdmin } = require('../../middleware/authorization');

// All routes require authentication and admin role
router.use(ensureAuthenticated);
router.use(ensureAdmin);

/**
 * @route   GET /api/admin/departments
 * @desc    Get all departments
 * @access  Admin
 */
router.get('/', adminDepartmentController.getDepartments);

/**
 * @route   POST /api/admin/departments
 * @desc    Create new department
 * @access  Admin
 */
router.post('/', adminDepartmentController.createDepartment);

/**
 * @route   GET /api/admin/departments/:departmentId
 * @desc    Get specific department by ID
 * @access  Admin
 */
router.get('/:departmentId', adminDepartmentController.getDepartmentById);

/**
 * @route   PUT /api/admin/departments/:departmentId
 * @desc    Update department
 * @access  Admin
 */
router.put('/:departmentId', adminDepartmentController.updateDepartment);

/**
 * @route   POST /api/admin/departments/:departmentId/enable
 * @desc    Enable department for Coffee Roulette
 * @access  Admin
 */
router.post('/:departmentId/enable', adminDepartmentController.enableDepartment);

/**
 * @route   POST /api/admin/departments/:departmentId/disable
 * @desc    Disable department from Coffee Roulette
 * @access  Admin
 */
router.post('/:departmentId/disable', adminDepartmentController.disableDepartment);

/**
 * @route   GET /api/admin/departments/:departmentId/stats
 * @desc    Get department statistics
 * @access  Admin
 */
router.get('/:departmentId/stats', adminDepartmentController.getDepartmentStats);

module.exports = router;
