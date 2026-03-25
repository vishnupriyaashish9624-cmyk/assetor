const express = require('express');
const router = express.Router();
const controller = require('../controllers/assetCategoriesController');
const { authMiddleware } = require('../middleware/auth');
const tenantScope = require('../middleware/tenant');

// All category routes require authentication and tenant context
router.use(authMiddleware, tenantScope);

router.get('/', controller.listCategories);
router.post('/', controller.createCategory);
router.put('/:id', controller.updateCategory);
router.delete('/:id', controller.deleteCategory);

module.exports = router;
