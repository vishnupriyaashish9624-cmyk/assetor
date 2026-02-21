const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employees');
console.log('[Routes:Employees] updateEmployee exists:', !!employeeController.updateEmployee);
const { authMiddleware } = require('../middleware/auth');

// router.use(authMiddleware); // TEMPORARILY DISABLED FOR TESTING

router.get('/', employeeController.getEmployees);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
