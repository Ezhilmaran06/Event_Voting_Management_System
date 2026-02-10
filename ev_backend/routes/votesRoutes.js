const express = require('express');
const router = express.Router();
const votesController = require('../controllers/votesController');

// POST /votes -- cast a vote
router.post('/', votesController.castVote);

// GET /votes/:eventId/participant/:participantId -- get detailed votes for a participant
router.get('/:eventId/participant/:participantId', votesController.getVotesForParticipant);

// GET /votes/:eventId -- get votes results for event
router.get('/:eventId', votesController.getVotesByEvent);

module.exports = router;
