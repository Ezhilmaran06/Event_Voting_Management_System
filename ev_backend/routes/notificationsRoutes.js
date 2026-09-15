const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, notificationsController.getUserNotifications);
router.put('/:id/read', optionalAuth, notificationsController.markAsRead);
router.put('/read-all', optionalAuth, notificationsController.markAllAsRead);

module.exports = router;
