const express = require('express');
const router = express.Router();
const votesController = require('../controllers/votesController');
const { optionalAuth } = require('../middleware/authMiddleware');

// POST /votes -- cast a vote
router.post('/', optionalAuth, votesController.castVote);

// GET /votes/user/history -- get user's vote history
router.get('/user/history', optionalAuth, votesController.getUserVoteHistory);

// GET /votes/:eventId/participant/:participantId -- get detailed votes for a participant
router.get('/:eventId/participant/:participantId', votesController.getVotesForParticipant);

// GET /votes/:eventId -- get votes results for event
router.get('/:eventId', votesController.getVotesByEvent);

module.exports = router;
