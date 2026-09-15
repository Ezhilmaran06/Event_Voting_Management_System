const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Event = require('../models/Event');
const UserEvent = require('../models/UserEvent');
const Vote = require('../models/Vote');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

async function seed() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/event_voting_system';
  console.log(`🌱 Connecting to MongoDB: ${mongoURI}`);
  await mongoose.connect(mongoURI);

  try {
    // 1. Ensure Admin Account exists
    const adminEmail = 'admin@eventvote.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hashed = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        Username: 'System Admin',
        email: adminEmail,
        password: hashed,
        role: 'Admin',
        clg_name: 'EventVote HQ',
        ph_no: '9876543210'
      });
      console.log('👤 Seeded Admin user: admin@eventvote.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // 2. Ensure at least one active voting event exists
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let activeEvent = await Event.findOne({
      voting_start: { $lte: now },
      voting_end: { $gte: now }
    });

    if (!activeEvent) {
      activeEvent = await Event.create({
        name: 'National Innovation & Tech Summit 2026',
        description: 'A flagship annual technical symposium featuring cutting-edge project displays, coding battles, robotics design, and real-time audience voting.',
        type: 'Technical Competition',
        category: 'Innovation',
        start_date_time: oneWeekAgo,
        end_date_time: oneWeekLater,
        voting_start: oneWeekAgo,
        voting_end: oneWeekLater,
        institute_name: 'National Institute of Technology',
        location: 'Auditorium Hall A, Campus Tech Center',
        manager_name: 'Dr. Rajesh Kumar',
        ph_no: '9876543210',
        user_email: adminEmail,
        organizer: admin._id,
        status: 'Voting Open',
        max_participants: 100,
        rules: '1. One vote per attendee\n2. Real-time cryptographic receipt issued\n3. Decisions finalized by summit jury'
      });
      console.log(`🎉 Seeded active event: ${activeEvent.name}`);
    }

    // 3. Ensure candidates exist for this active event
    const existingCandidates = await UserEvent.countDocuments({ event_id: activeEvent._id });
    if (existingCandidates === 0) {
      // Find or create sample participants
      const sampleUsers = [
        { name: 'Alex Johnson', email: 'alex.tech@example.com', team: 'Team NeuralFlow', cat: 'AI Project' },
        { name: 'Maya Patel', email: 'maya.robotics@example.com', team: 'RoboDynamics', cat: 'Robotics Showcase' },
        { name: 'David Chen', email: 'david.innovate@example.com', team: 'QuantumCloud', cat: 'Cloud Innovation' },
        { name: 'Sophia Taylor', email: 'sophia.web3@example.com', team: 'BlockVault', cat: 'Web3 & Security' }
      ];

      for (const s of sampleUsers) {
        let u = await User.findOne({ email: s.email });
        if (!u) {
          const hashed = await bcrypt.hash('candidate123', 10);
          u = await User.create({
            Username: s.name,
            email: s.email,
            password: hashed,
            role: 'Participant',
            clg_name: 'MIT Tech Lab',
            ph_no: '9876500000'
          });
        }

        await UserEvent.create({
          user_id: u._id,
          event_id: activeEvent._id,
          team_name: s.team,
          team_leader: s.name,
          team_details: `High-impact technical demonstration showcasing next-generation ${s.cat} research.`,
          performance_category: s.cat,
          institution: 'MIT Tech Lab',
          status: 'approved'
        });
      }
      console.log(`🌟 Seeded 4 candidate teams for active event`);
    }

    console.log('✅ Seeding completed successfully.');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
