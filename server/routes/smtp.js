const express = require('express');
const router = express.Router();
const smtpController = require('../controllers/smtp');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Note: requireRole expects an ARRAY of roles
router.get('/', authMiddleware, requireRole(['SUPER_ADMIN']), smtpController.getAllConfigs);
router.post('/', authMiddleware, requireRole(['SUPER_ADMIN']), smtpController.createConfig);
router.get('/:id', authMiddleware, requireRole(['SUPER_ADMIN']), smtpController.getConfig);
router.put('/:id', authMiddleware, requireRole(['SUPER_ADMIN']), smtpController.updateConfig);
router.delete('/:id', authMiddleware, requireRole(['SUPER_ADMIN']), smtpController.deleteConfig);

module.exports = router;
