const express = require('express');
const router = express.Router();
const {
  registerUserToEvent,
  getUserEvents,
  getEventUsers,
  getAllUserEvents,
  updateUserEvent,
  deleteUserEvent
} = require('../controllers/userEventsController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, registerUserToEvent);
router.get('/user/:id', getUserEvents);
router.get('/event/:id', getEventUsers);
router.get('/', getAllUserEvents);
router.put('/:id', optionalAuth, updateUserEvent);
router.delete('/:id', optionalAuth, deleteUserEvent);

module.exports = router;
