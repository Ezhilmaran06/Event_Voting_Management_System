const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.post('/', usersController.createUser);
router.get('/', usersController.getUsers); // <-- add this
router.post('/send-otp', usersController.sendOtp); // <-- add this
router.post('/verify-otp', usersController.verifyOtp); // <-- add this

module.exports = router;
