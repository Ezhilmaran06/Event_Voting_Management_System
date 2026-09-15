const db = require('./db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🔄 Checking database schema and running non-destructive migrations...');

    // Helper to check if column exists
    const columnExists = async (table, column) => {
      const [rows] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows.length > 0;
    };

    // Helper to check if index exists
    const indexExists = async (table, indexName) => {
      const [rows] = await db.query(
        `SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`,
        [indexName]
      );
      return rows.length > 0;
    };

    // 1. Migrate `users` table
    if (!(await columnExists('users', 'password'))) {
      await db.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER email`);
      console.log('  ➕ Added `password` to users');
    }
    if (!(await columnExists('users', 'avatar'))) {
      await db.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(500) NULL AFTER password`);
      console.log('  ➕ Added `avatar` to users');
    }
    if (!(await columnExists('users', 'created_at'))) {
      await db.query(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
      console.log('  ➕ Added `created_at` to users');
    }

    // 2. Migrate `events` table
    if (!(await columnExists('events', 'description'))) {
      await db.query(`ALTER TABLE events ADD COLUMN description TEXT NULL AFTER name`);
      console.log('  ➕ Added `description` to events');
    }
    if (!(await columnExists('events', 'banner_url'))) {
      await db.query(`ALTER TABLE events ADD COLUMN banner_url TEXT NULL AFTER description`);
      console.log('  ➕ Added `banner_url` to events');
    }
    if (!(await columnExists('events', 'category'))) {
      await db.query(`ALTER TABLE events ADD COLUMN category VARCHAR(100) NULL AFTER type`);
      console.log('  ➕ Added `category` to events');
    }
    if (!(await columnExists('events', 'voting_start'))) {
      await db.query(`ALTER TABLE events ADD COLUMN voting_start DATETIME NULL AFTER end_date_time`);
      console.log('  ➕ Added `voting_start` to events');
    }
    if (!(await columnExists('events', 'voting_end'))) {
      await db.query(`ALTER TABLE events ADD COLUMN voting_end DATETIME NULL AFTER voting_start`);
      console.log('  ➕ Added `voting_end` to events');
    }
    if (!(await columnExists('events', 'rules'))) {
      await db.query(`ALTER TABLE events ADD COLUMN rules TEXT NULL AFTER voting_end`);
      console.log('  ➕ Added `rules` to events');
    }
    if (!(await columnExists('events', 'max_participants'))) {
      await db.query(`ALTER TABLE events ADD COLUMN max_participants INT DEFAULT 50 AFTER rules`);
      console.log('  ➕ Added `max_participants` to events');
    }
    if (!(await columnExists('events', 'status'))) {
      await db.query(`ALTER TABLE events ADD COLUMN status VARCHAR(50) DEFAULT 'Upcoming' AFTER max_participants`);
      console.log('  ➕ Added `status` to events');
    }

    // 3. Migrate `user_events` table (candidates / participants)
    // Modify team_picture to LONGTEXT to avoid length truncation with base64/data URLs
    try {
      await db.query(`ALTER TABLE user_events MODIFY COLUMN team_picture LONGTEXT NULL`);
      console.log('  ➕ Expanded `team_picture` to LONGTEXT in user_events');
    } catch (e) {
      console.log('  ⚠️ Note modifying team_picture:', e.message);
    }
    if (!(await columnExists('user_events', 'team_leader'))) {
      await db.query(`ALTER TABLE user_events ADD COLUMN team_leader VARCHAR(255) NULL AFTER team_name`);
      console.log('  ➕ Added `team_leader` to user_events');
    }
    if (!(await columnExists('user_events', 'team_details'))) {
      await db.query(`ALTER TABLE user_events ADD COLUMN team_details TEXT NULL AFTER team_leader`);
      console.log('  ➕ Added `team_details` to user_events');
    }
    if (!(await columnExists('user_events', 'performance_category'))) {
      await db.query(`ALTER TABLE user_events ADD COLUMN performance_category VARCHAR(100) NULL AFTER team_details`);
      console.log('  ➕ Added `performance_category` to user_events');
    }
    if (!(await columnExists('user_events', 'institution'))) {
      await db.query(`ALTER TABLE user_events ADD COLUMN institution VARCHAR(255) NULL AFTER performance_category`);
      console.log('  ➕ Added `institution` to user_events');
    }
    if (!(await columnExists('user_events', 'status'))) {
      await db.query(`ALTER TABLE user_events ADD COLUMN status VARCHAR(50) DEFAULT 'approved' AFTER registered_at`);
      console.log('  ➕ Added `status` to user_events');
    }

    // 4. Migrate `votes` table
    if (!(await columnExists('votes', 'receipt_id'))) {
      await db.query(`ALTER TABLE votes ADD COLUMN receipt_id VARCHAR(64) NULL AFTER vote_time`);
      console.log('  ➕ Added `receipt_id` to votes');
    }
    if (!(await columnExists('votes', 'ip_address'))) {
      await db.query(`ALTER TABLE votes ADD COLUMN ip_address VARCHAR(45) NULL AFTER receipt_id`);
      console.log('  ➕ Added `ip_address` to votes');
    }
    // Unique index on (event_id, voter_id)
    if (!(await indexExists('votes', 'uc_event_voter'))) {
      try {
        await db.query(`ALTER TABLE votes ADD CONSTRAINT uc_event_voter UNIQUE (event_id, voter_id)`);
        console.log('  ➕ Added unique constraint `uc_event_voter` on votes(event_id, voter_id)');
      } catch (err) {
        console.log('  ⚠️ Unique constraint skipped (may already exist or duplicates present):', err.message);
      }
    }

    // 5. Create `notifications` table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✅ Table `notifications` verified');

    // 6. Create `audit_logs` table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        user_email VARCHAR(255) NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT NULL,
        ip_address VARCHAR(45) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✅ Table `audit_logs` verified');

    // 7. Seed Admin account if none exists
    const [adminRows] = await db.query(`SELECT id FROM users WHERE role = 'Admin' OR email = 'admin@eventvote.com'`);
    if (adminRows.length === 0) {
      const hashed = await bcrypt.hash('admin123', 10);
      await db.query(
        `INSERT INTO users (Username, clg_name, role, email, password, ph_no) VALUES (?, ?, ?, ?, ?, ?)`,
        ['System Admin', 'EventVote HQ', 'Admin', 'admin@eventvote.com', hashed, '9876543210']
      );
      console.log('  👤 Default Admin seeded: admin@eventvote.com / admin123');
    }

    // 8. Ensure at least one ongoing, active event exists for today so voting is immediately testable
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    const [activeEvents] = await db.query(`SELECT id FROM events WHERE end_date_time >= NOW()`);
    if (activeEvents.length === 0) {
      const [newEvent] = await db.query(`
        INSERT INTO events (
          name, description, type, start_date_time, end_date_time,
          voting_start, voting_end, institute_name, location,
          manager_name, ph_no, user_email, status, max_participants
        ) VALUES (
          'National Innovation & Tech Summit 2026',
          'A flagship annual technical symposium featuring cutting-edge project displays, coding battles, robotics design, and real-time audience voting.',
          'Technical Competition',
          ?, ?, ?, ?,
          'National Institute of Technology', 'Auditorium Hall A, Campus Tech Center',
          'Dr. Rajesh Kumar', '9876543210', 'admin@eventvote.com', 'Voting Open', 100
        )
      `, [oneWeekAgo, oneWeekLater, oneWeekAgo, oneWeekLater]);

      const eventId = newEvent.insertId;
      console.log(`  🎉 Seeded active event ID ${eventId}: 'National Innovation & Tech Summit 2026'`);

      // Seed candidate participants for this event
      const [users] = await db.query(`SELECT id, Username, clg_name FROM users WHERE email != 'admin@eventvote.com' LIMIT 4`);
      if (users.length > 0) {
        const categories = ['Technical Presentation', 'AI Project', 'Web Innovation', 'Robotics Showcase'];
        for (let i = 0; i < users.length; i++) {
          const u = users[i];
          await db.query(`
            INSERT IGNORE INTO user_events (
              user_id, event_id, team_name, team_leader, team_details, performance_category, institution, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
          `, [
            u.id, eventId,
            `Team ${u.Username || 'Alpha'}`,
            u.Username || 'Candidate Lead',
            `Pioneering next-gen automated systems and modern architecture demonstrations for the summit.`,
            categories[i % categories.length],
            u.clg_name || 'Tech University'
          ]);
        }
        console.log(`  🌟 Seeded ${users.length} candidate teams for active event ID ${eventId}`);
      }
    }

    console.log('✅ Database schema initialization completed successfully.');
  } catch (err) {
    console.error('❌ Database schema initialization error:', err);
  }
}

module.exports = initializeDatabase;
