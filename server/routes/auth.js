const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { authMiddleware } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/update-password', authMiddleware, authController.updatePassword);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
