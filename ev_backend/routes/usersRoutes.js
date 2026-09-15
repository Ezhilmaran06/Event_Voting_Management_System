const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', usersController.createUser);
router.post('/register', usersController.createUser);
router.post('/login', usersController.loginUser);
router.get('/me', authenticateToken, usersController.getMe);
router.put('/me', authenticateToken, usersController.updateProfile);
router.get('/', usersController.getUsers);
router.put('/:id/role', authenticateToken, requireAdmin, usersController.updateUserRole);
router.post('/send-otp', usersController.sendOtp);
router.post('/verify-otp', usersController.verifyOtp);
router.post('/forgot-password', usersController.forgotPassword);
router.post('/reset-password', usersController.resetPassword);

module.exports = router;
