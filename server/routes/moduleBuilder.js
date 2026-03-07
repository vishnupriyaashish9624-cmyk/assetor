const express = require('express');
const router = express.Router();
const controller = require('../controllers/moduleBuilderController');
const { authMiddleware, requireRole } = require('../middleware/auth');

console.log('[ModuleBuilder] Routes loading...');

// 1.1 Fetch Unique Section Names (Templates) - PUBLIC for Debug
// TEST ROUTE (Public)
router.get('/test-ping', (req, res) => res.json({ success: true, message: 'Router is reachable!' }));

// 1.1 Fetch Unique Section Names (Templates) - PUBLIC for Debug
router.get('/section-templates', controller.getSectionTemplates);
router.get('/preview-id', authMiddleware, controller.previewAutoID);

router.use(authMiddleware);
router.use(requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']));

// 1. Fetch Module Sections
router.get('/module-sections', controller.getModuleSections);
router.post('/module-sections', controller.createSection);
router.get('/:id/sections', controller.getModuleSections);

// 2. Fields CRUD
router.get('/fields', controller.getSectionFields);
router.post('/fields', controller.createField);
router.put('/fields/:id', controller.updateField);
router.delete('/fields/:id', (req, res, next) => {
    console.log(`[ModuleBuilder] DELETE request for id: ${req.params.id}`);
    controller.deleteField(req, res, next);
});

// --- Module Listing for Builder Context ---
router.get('/', controller.getModules);

module.exports = router;
