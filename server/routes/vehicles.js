const express = require('express');
const router = express.Router();
console.log('[VehiclesRouter] Initializing vehicle routes...');
const controller = require('../controllers/vehiclesController');
const { authMiddleware } = require('../middleware/auth');
const tenantScope = require('../middleware/tenant');

// Routes
router.get('/test-ping', (req, res) => res.json({ success: true, message: 'Vehicles router is reachable!' }));

// Middleware
router.use(authMiddleware);
router.use(tenantScope);

// Main Routes
router.get('/', controller.getVehicles);
router.post('/', controller.createVehicle);
router.get('/:id', controller.getVehicleById);
router.put('/:id', controller.updateVehicle);
router.delete('/:id', controller.deleteVehicle);

module.exports = router;
