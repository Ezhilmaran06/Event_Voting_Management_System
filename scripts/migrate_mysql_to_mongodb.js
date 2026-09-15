const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../ev_backend/.env') });

const User = require('../ev_backend/models/User');
const Event = require('../ev_backend/models/Event');
const UserEvent = require('../ev_backend/models/UserEvent');
const Vote = require('../ev_backend/models/Vote');
const Notification = require('../ev_backend/models/Notification');
const AuditLog = require('../ev_backend/models/AuditLog');

async function migrate() {
  console.log('🚀 Starting MySQL to MongoDB Data Migration...\n');

  // 1. MySQL Connection
  const mysqlConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '@ma02#$@',
    database: process.env.DB_NAME || 'voting',
    port: process.env.DB_PORT || 3306,
  });
  console.log('✅ Connected to source MySQL database');

  // 2. MongoDB Connection
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/event_voting_system';
  await mongoose.connect(mongoURI);
  console.log(`✅ Connected to destination MongoDB: ${mongoURI}`);

  // Clear existing collections if desired
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    UserEvent.deleteMany({}),
    Vote.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({})
  ]);
  console.log('🧹 Cleaned existing destination collections');

  const userIdMap = new Map();
  const eventIdMap = new Map();

  // 3. Migrate Users
  const [users] = await mysqlConn.query('SELECT * FROM users ORDER BY id ASC');
  console.log(`\n📦 Migrating ${users.length} users...`);
  for (const u of users) {
    const mongoId = new mongoose.Types.ObjectId();
    userIdMap.set(u.id, mongoId);

    await User.create({
      _id: mongoId,
      Username: u.Username || u.username || 'User',
      email: (u.email || '').toLowerCase().trim(),
      password: u.password || null,
      role: u.role || 'Participant',
      clg_name: u.clg_name || null,
      ph_no: u.ph_no ? String(u.ph_no) : null,
      avatar: u.avatar || null,
      createdAt: u.created_at || new Date(),
      updatedAt: u.created_at || new Date()
    });
  }
  console.log(`✅ ${users.length} users migrated successfully`);

  // 4. Migrate Events
  const [events] = await mysqlConn.query('SELECT * FROM events ORDER BY id ASC');
  console.log(`\n📦 Migrating ${events.length} events...`);
  for (const e of events) {
    const mongoId = new mongoose.Types.ObjectId();
    eventIdMap.set(e.id, mongoId);

    // Find organizer if matches email
    let organizerId = null;
    if (e.user_email) {
      const orgUser = await User.findOne({ email: e.user_email.toLowerCase().trim() });
      if (orgUser) organizerId = orgUser._id;
    }

    await Event.create({
      _id: mongoId,
      name: e.name,
      description: e.description || '',
      banner_url: e.banner_url || null,
      type: e.type || 'Competition',
      category: e.category || 'General',
      start_date_time: e.start_date_time || new Date(),
      end_date_time: e.end_date_time || new Date(Date.now() + 3 * 86400000),
      voting_start: e.voting_start || null,
      voting_end: e.voting_end || null,
      institute_name: e.institute_name || '',
      location: e.location || '',
      manager_name: e.manager_name || '',
      ph_no: e.ph_no ? String(e.ph_no) : '',
      user_email: (e.user_email || 'admin@eventvote.com').toLowerCase().trim(),
      organizer: organizerId,
      max_participants: e.max_participants || 50,
      rules: e.rules || '',
      status: e.status || 'Upcoming',
      createdAt: e.created_at || new Date(),
      updatedAt: e.created_at || new Date()
    });
  }
  console.log(`✅ ${events.length} events migrated successfully`);

  // 5. Migrate UserEvents (Candidates / Participants)
  const [userEvents] = await mysqlConn.query('SELECT * FROM user_events ORDER BY id ASC');
  console.log(`\n📦 Migrating ${userEvents.length} candidates/registrations...`);
  let ueMigrated = 0;
  for (const ue of userEvents) {
    const mappedUserId = userIdMap.get(ue.user_id);
    const mappedEventId = eventIdMap.get(ue.event_id);

    if (!mappedUserId || !mappedEventId) {
      console.warn(`  ⚠️ Skipping orphaned user_event ID ${ue.id} (user: ${ue.user_id}, event: ${ue.event_id})`);
      continue;
    }

    try {
      await UserEvent.create({
        user_id: mappedUserId,
        event_id: mappedEventId,
        team_name: ue.team_name || 'Participant Team',
        team_leader: ue.team_leader || null,
        team_details: ue.team_details || '',
        performance_category: ue.performance_category || 'General',
        institution: ue.institution || null,
        team_picture: ue.team_picture || null,
        status: ue.status || 'approved',
        registered_at: ue.registered_at || new Date(),
        createdAt: ue.registered_at || new Date(),
        updatedAt: ue.registered_at || new Date()
      });
      ueMigrated++;
    } catch (err) {
      console.warn(`  ⚠️ Could not migrate user_event ${ue.id}: ${err.message}`);
    }
  }
  console.log(`✅ ${ueMigrated} of ${userEvents.length} candidate registrations migrated successfully`);

  // 6. Migrate Votes
  const [votes] = await mysqlConn.query('SELECT * FROM votes ORDER BY id ASC');
  console.log(`\n📦 Migrating ${votes.length} votes...`);
  let votesMigrated = 0;
  for (const v of votes) {
    const mappedEventId = eventIdMap.get(v.event_id);
    const mappedParticipantId = userIdMap.get(v.participant_id);
    const mappedVoterId = userIdMap.get(v.voter_id);

    if (!mappedEventId || !mappedParticipantId || !mappedVoterId) {
      console.warn(`  ⚠️ Skipping orphaned vote ID ${v.id}`);
      continue;
    }

    try {
      await Vote.create({
        event_id: mappedEventId,
        participant_id: mappedParticipantId,
        voter_id: mappedVoterId,
        receipt_id: v.receipt_id || `VOTE-LEGACY-${v.id}-${Date.now().toString(36)}`,
        ip_address: v.ip_address || null,
        vote_time: v.vote_time || new Date(),
        createdAt: v.vote_time || new Date()
      });
      votesMigrated++;
    } catch (err) {
      console.warn(`  ⚠️ Could not migrate vote ${v.id}: ${err.message}`);
    }
  }
  console.log(`✅ ${votesMigrated} of ${votes.length} votes migrated successfully`);

  // 7. Migrate Notifications
  const [notifs] = await mysqlConn.query('SELECT * FROM notifications ORDER BY id ASC');
  console.log(`\n📦 Migrating ${notifs.length} notifications...`);
  for (const n of notifs) {
    const mappedUserId = userIdMap.get(n.user_id);
    if (!mappedUserId) continue;

    await Notification.create({
      user_id: mappedUserId,
      title: n.title,
      message: n.message,
      type: n.type || 'info',
      is_read: Boolean(n.is_read),
      createdAt: n.created_at || new Date()
    });
  }
  console.log(`✅ ${notifs.length} notifications migrated successfully`);

  // 8. Migrate Audit Logs
  const [auditLogs] = await mysqlConn.query('SELECT * FROM audit_logs ORDER BY id ASC');
  console.log(`\n📦 Migrating ${auditLogs.length} audit logs...`);
  for (const a of auditLogs) {
    const mappedUserId = a.user_id ? userIdMap.get(a.user_id) : null;

    await AuditLog.create({
      user_id: mappedUserId,
      user_email: a.user_email || null,
      action: a.action,
      details: a.details || '',
      ip_address: a.ip_address || null,
      createdAt: a.created_at || new Date()
    });
  }
  console.log(`✅ ${auditLogs.length} audit logs migrated successfully`);

  // Verification Summary
  console.log('\n========================================');
  console.log('🎉 MIGRATION INTEGRITY SUMMARY:');
  console.log('----------------------------------------');
  console.log(`Users in MongoDB:         ${await User.countDocuments()}`);
  console.log(`Events in MongoDB:        ${await Event.countDocuments()}`);
  console.log(`UserEvents in MongoDB:    ${await UserEvent.countDocuments()}`);
  console.log(`Votes in MongoDB:         ${await Vote.countDocuments()}`);
  console.log(`Notifications in MongoDB: ${await Notification.countDocuments()}`);
  console.log(`AuditLogs in MongoDB:     ${await AuditLog.countDocuments()}`);
  console.log('========================================\n');

  await mysqlConn.end();
  await mongoose.disconnect();
  console.log('🏁 Migration process completed cleanly.');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
