const express = require('express');
const router = express.Router();
const templateController = require('../../controllers/adminTemplateController');
const { ensureAuthenticated } = require('../../middleware/authentication');
const { ensureAdmin } = require('../../middleware/authorization');

// All routes require authentication and admin role
router.use(ensureAuthenticated);
router.use(ensureAdmin);

// GET /admin/templates - List all templates
router.get('/', templateController.getTemplates);

// GET /admin/templates/variables/:type - Get variables for a template type
router.get('/variables/:type', templateController.getVariables);

// GET /admin/templates/:type/:channel - Get specific template
router.get('/:type/:channel', templateController.getTemplate);

// PUT /admin/templates/:type/:channel - Update template
router.put('/:type/:channel', templateController.updateTemplate);

// POST /admin/templates/:type/:channel/preview - Preview template with sample data
router.post('/:type/:channel/preview', templateController.previewTemplate);

// POST /admin/templates/:type/:channel/restore - Restore to default
router.post('/:type/:channel/restore', templateController.restoreDefault);

module.exports = router;
