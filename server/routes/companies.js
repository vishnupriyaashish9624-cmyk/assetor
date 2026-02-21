const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companies');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// All these routes should be accessible to both SUPER_ADMIN and COMPANY_ADMIN
// (Authorization checks for specific client_id ownership are done in controllers)
const sharedRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN'];

router.get('/', requireRole(sharedRoles), companyController.getCompanies);
router.get('/:id', requireRole(sharedRoles), companyController.getCompanyById);
router.post('/', requireRole(sharedRoles), companyController.createCompany);
router.put('/:id', requireRole(sharedRoles), companyController.updateCompany);
router.delete('/:id', requireRole(sharedRoles), companyController.deleteCompany);

router.post('/:id/documents', requireRole(sharedRoles), companyController.addCompanyDocument);
router.get('/:id/documents', requireRole(sharedRoles), companyController.getCompanyDocuments);

module.exports = router;
