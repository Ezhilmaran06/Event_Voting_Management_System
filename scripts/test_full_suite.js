async function runTests() {
  const base = 'http://localhost:3000';
  console.log('🧪 Starting Full-Stack MongoDB End-to-End Test Suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  };

  try {
    // 1. Health check & MongoDB Engine Verification
    const healthRes = await fetch(`${base}/api/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 &&
      healthData.status === 'healthy' &&
      healthData.database === 'connected' &&
      healthData.databaseEngine === 'MongoDB + Mongoose',
      'Backend Health & MongoDB Connection',
      `Engine: ${healthData.databaseEngine}, Status: ${healthData.status}`
    );

    // 2. Admin Password Authentication
    const loginRes = await fetch(`${base}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@eventvote.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && !!loginData.token, 'Admin Password Authentication', `Token received`);
    const token = loginData.token;

    // 3. User Me Profile Verification
    const meRes = await fetch(`${base}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.role === 'Admin', 'JWT Profile Verification', `Role: ${meData.role}`);

    // 4. Register a New Test Voter (generates valid MongoDB ObjectId)
    const testEmail = `voter_${Date.now()}@test.com`;
    const regRes = await fetch(`${base}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `TestVoter_${Date.now().toString().slice(-4)}`,
        email: testEmail,
        password: 'password123',
        collegeName: 'Test University',
        role: 'Participant'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && !!regData.userId, 'New User Registration (MongoDB ObjectId generated)', `UserId: ${regData.userId}`);
    const voterId = regData.userId;
    const voterToken = regData.token;

    // 5. Fetch Events & Check Computed Status
    const eventsRes = await fetch(`${base}/events`);
    const events = await eventsRes.json();
    assert(Array.isArray(events) && events.length > 0, 'Fetch Events List', `Count: ${events?.length}`);
    const activeEvent = events.find(e => e.computedStatus === 'Voting Open') || events[0];
    assert(!!activeEvent && !!activeEvent.computedStatus, 'Dynamic Event Status Calculation', `Event: ${activeEvent.eventName}, Status: ${activeEvent?.computedStatus}`);

    // 6. Fetch Candidates for Event
    const candRes = await fetch(`${base}/user_events/event/${activeEvent.id}`);
    const candidates = await candRes.json();
    assert(Array.isArray(candidates) && candidates.length > 0, 'Fetch Event Candidates', `Count: ${candidates?.length}`);

    // 7. Fetch Results for Event
    const resultsRes = await fetch(`${base}/votes/${activeEvent.id}`);
    const resultsData = await resultsRes.json();
    assert(resultsRes.status === 200 && Array.isArray(resultsData.results), 'Fetch Event Live Results', `Results Count: ${resultsData.results?.length}`);

    // 8. Cast Ballot with Digital Receipt Generation
    const candidateToVote = candidates[0];
    const candidateUserId = candidateToVote.userId || candidateToVote.participant_id;

    const voteRes = await fetch(`${base}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${voterToken}`
      },
      body: JSON.stringify({
        eventId: activeEvent.id,
        participantId: candidateUserId,
        voterId: voterId
      })
    });
    const voteData = await voteRes.json();
    assert(voteRes.status === 201 && !!voteData.receiptId, 'Cast Ballot & Digital Receipt Generation', `Receipt: ${voteData.receiptId}`);

    // 9. Duplicate Ballot Rejection Test (Database Level Protection)
    const dupRes = await fetch(`${base}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${voterToken}`
      },
      body: JSON.stringify({
        eventId: activeEvent.id,
        participantId: candidateUserId,
        voterId: voterId
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400, 'Duplicate Ballot Rejection & Protection', `Rejected with: ${dupData.error}`);

    // 10. User Vote History Verification
    const historyRes = await fetch(`${base}/votes/user/history`, {
      headers: { 'Authorization': `Bearer ${voterToken}` }
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200 && historyData.length >= 1, 'User Vote History Recorded', `History Count: ${historyData.length}`);

    // 11. Admin Statistics Verification
    const statsRes = await fetch(`${base}/admin/stats`);
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.totalUsers > 0, 'Admin Platform Statistics', `Total Users: ${statsData.totalUsers}, Votes: ${statsData.totalVotes}`);

    // 12. Admin CSV Export Verification
    const exportRes = await fetch(`${base}/admin/export/users/all`);
    const csvContent = await exportRes.text();
    assert(exportRes.status === 200 && csvContent.includes('Username,Email'), 'Admin CSV Report Exporter', `CSV Length: ${csvContent.length}`);

    // 13. Notifications for Voter
    const notifRes = await fetch(`${base}/notifications?userId=${voterId}`, {
      headers: { 'Authorization': `Bearer ${voterToken}` }
    });
    const notifData = await notifRes.json();
    assert(notifRes.status === 200 && Array.isArray(notifData.notifications) && notifData.notifications.length >= 1, 'User Notification Delivery', `Unread: ${notifData.unreadCount}`);

    console.log(`\n========================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
    else process.exit(0);

  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
