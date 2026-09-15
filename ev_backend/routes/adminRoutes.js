const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { optionalAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/stats', adminController.getStats);
router.get('/audit-logs', optionalAuth, adminController.getAuditLogs);
router.get('/export/:type/:id', adminController.exportReport);

module.exports = router;
