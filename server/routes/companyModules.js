const express = require('express');
const router = express.Router();
const controller = require('../controllers/companyModulesController');
const { authMiddleware } = require('../middleware/auth');
const tenantScope = require('../middleware/tenant');

// Support for the catalog dropdown (Global - No Tenant Scope needed as they are read-only catalogs)
router.get('/module-master', authMiddleware, controller.getModuleMaster);
router.get('/countries', authMiddleware, controller.getCountries);
router.get('/premises-types', authMiddleware, controller.getPremisesTypes);
router.get('/areas', authMiddleware, controller.getAreas);
router.get('/property-types', authMiddleware, controller.getPropertyTypes);

// Middleware for all module routes
router.use(authMiddleware);
router.use(tenantScope);

// GET /api/company-modules
router.get('/company-modules', controller.listCompanyModules);

// GET /api/company-modules/selected-fields (must be before /:id route)
router.get('/company-modules/selected-fields', controller.getSelectedFieldsByConditions);

// POST /api/company-modules
router.post('/company-modules', controller.addCompanyModule);

// PUT /api/company-modules/:id
router.put('/company-modules/:id', controller.updateCompanyModule);



module.exports = router;
