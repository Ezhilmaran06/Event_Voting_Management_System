const http = require('http');

async function runTests() {
  const base = 'http://localhost:3000';
  console.log('🧪 Starting Full-Stack End-to-End Test Suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const healthRes = await fetch(`${base}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'healthy', 'Backend Health Endpoint');

    // 2. Admin Login
    const loginRes = await fetch(`${base}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@eventvote.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && !!loginData.token, 'Admin Password Authentication');
    const token = loginData.token;

    // 3. User Me Profile
    const meRes = await fetch(`${base}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.role === 'Admin', 'JWT Profile Verification');

    // 4. Fetch Events & Check Computed Status
    const eventsRes = await fetch(`${base}/events`);
    const events = await eventsRes.json();
    assert(Array.isArray(events) && events.length > 0, 'Fetch Events List', `Count: ${events?.length}`);
    const activeEvent = events.find(e => e.computedStatus === 'Voting Open') || events[0];
    assert(!!activeEvent && !!activeEvent.computedStatus, 'Dynamic Event Status Calculation', `Status: ${activeEvent?.computedStatus}`);

    // 5. Fetch Candidates for Event
    const candRes = await fetch(`${base}/user_events/event/${activeEvent.id}`);
    const candidates = await candRes.json();
    assert(Array.isArray(candidates) && candidates.length > 0, 'Fetch Event Candidates', `Count: ${candidates?.length}`);

    // 6. Fetch Results for Event
    const resultsRes = await fetch(`${base}/votes/${activeEvent.id}`);
    const resultsData = await resultsRes.json();
    assert(resultsRes.status === 200 && Array.isArray(resultsData.results), 'Fetch Event Live Results');

    // 7. Cast Ballot with Duplicate Prevention Check
    const participantId = candidates[0].userId || candidates[0].participant_id || candidates[0].id;
    // Pick a test voter ID
    const testVoterId = 9999 + Math.floor(Math.random() * 80000);
    const voteRes = await fetch(`${base}/votes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        eventId: activeEvent.id,
        participantId: participantId,
        voterId: testVoterId
      })
    });
    const voteData = await voteRes.json();
    assert(voteRes.status === 201 && !!voteData.receiptId, 'Cast Ballot & Digital Receipt Generation', `Receipt: ${voteData.receiptId}`);

    // Duplicate Ballot Test
    const dupRes = await fetch(`${base}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: activeEvent.id,
        participantId: participantId,
        voterId: testVoterId
      })
    });
    assert(dupRes.status === 400, 'Duplicate Ballot Rejection & Protection');

    // 8. Admin Statistics
    const statsRes = await fetch(`${base}/admin/stats`);
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.totalUsers > 0, 'Admin Platform Statistics');

    // 9. Admin CSV Export
    const exportRes = await fetch(`${base}/admin/export/users/all`);
    const csvContent = await exportRes.text();
    assert(exportRes.status === 200 && csvContent.includes('ID,Username,Email'), 'Admin CSV Report Exporter');

    // 10. Notifications
    const notifRes = await fetch(`${base}/notifications?userId=${testVoterId}`);
    const notifData = await notifRes.json();
    assert(notifRes.status === 200 && Array.isArray(notifData.notifications), 'User Notification System');

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
