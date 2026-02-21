const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roles');
const { authMiddleware } = require('../middleware/auth');
const tenantScope = require('../middleware/tenant');

// All role routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantScope);

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
