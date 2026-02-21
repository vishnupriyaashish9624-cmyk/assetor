const express = require('express');
const router = express.Router();
const controller = require('../controllers/companyModulesController');
const { authMiddleware } = require('../middleware/auth');
const tenantScope = require('../middleware/tenant');

// GET /api/module-master
// Accessible by authenticated users to populate dropdowns
router.get('/', authMiddleware, tenantScope, controller.getModuleMaster);

module.exports = router;
