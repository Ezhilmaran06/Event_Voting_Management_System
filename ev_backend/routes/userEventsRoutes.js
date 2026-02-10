const express = require('express');
const router = express.Router();
const {
  registerUserToEvent,
  getUserEvents,
  getEventUsers,
  getAllUserEvents
  , updateUserEvent
} = require('../controllers/userEventsController');

// POST /api/user-events/register
router.post('/', registerUserToEvent);

// GET /api/user-events/user/:id
router.get('/user/:id', getUserEvents);

// GET /api/user-events/event/:id
router.get('/event/:id', getEventUsers);

router.get('/', getAllUserEvents);

// PUT /user_events/:id
router.put('/:id', updateUserEvent);

module.exports = router;
