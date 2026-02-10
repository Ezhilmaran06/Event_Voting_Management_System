(async () => {
  try {
    const base = 'http://localhost:3000';

    console.log('Fetching events...');
    const evRes = await fetch(`${base}/events`);
    const events = await evRes.json();
    console.log('events:', events.length);
    if (!events || events.length === 0) return console.error('No events found');
    const eventId = events[0].id;

    console.log('Fetching users...');
    const usersRes = await fetch(`${base}/users`);
    const users = await usersRes.json();
    if (!users || users.length === 0) return console.error('No users found');

    console.log('Fetching user_events...');
    const uevRes = await fetch(`${base}/user_events`);
    const uev = await uevRes.json();
    if (!uev || uev.length === 0) return console.error('No user_events found');

    // find a participant registered in this event
    const participantRow = uev.find(r => Number(r.event_id) === Number(eventId) || Number(r.eventId) === Number(eventId) );
    if (!participantRow) return console.error('No participant found for event', eventId);

    const participantId = participantRow.user_id ?? participantRow.userId ?? participantRow.participant_id ?? participantRow.userId;

    // pick a voter user id different from participantId
    let voter = users.find(u => String(u.id) !== String(participantId));
    if (!voter) voter = users[0];

    const voterId = voter.id;

    const payload = {
      eventId: Number(eventId),
      participantId: Number(participantId),
      voterId: Number(voterId)
    };

    console.log('Simulating vote with payload:', payload);

    const voteRes = await fetch(`${base}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const voteJson = await voteRes.json();
    console.log('vote response status:', voteRes.status);
    console.log('vote response body:', voteJson);
  } catch (err) {
    console.error('simulateVote error:', err);
  }
})();
