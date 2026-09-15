const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { optionalAuth, authenticateToken } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, eventsController.createEvent);
router.get('/', eventsController.getEvents);
router.get('/:id', eventsController.getEventById);
router.put('/:id', optionalAuth, eventsController.updateEvent);
router.delete('/:id', optionalAuth, eventsController.deleteEvent);

module.exports = router;
