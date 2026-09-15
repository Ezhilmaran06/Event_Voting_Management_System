const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const UserEvent = require('../models/UserEvent');
const Vote = require('../models/Vote');
const AuditLog = require('../models/AuditLog');

// 1. Get system-wide platform statistics
exports.getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const eventCount = await Event.countDocuments();
    const candidateCount = await UserEvent.countDocuments();
    const voteCount = await Vote.countDocuments();

    // Active events
    const activeEvents = await Event.countDocuments({
      end_date_time: { $gte: new Date() },
      status: { $nin: ['Cancelled', 'Draft'] }
    });

    // Votes per category
    const categoryStats = await Event.aggregate([
      {
        $lookup: {
          from: 'votes',
          localField: '_id',
          foreignField: 'event_id',
          as: 'eventVotes'
        }
      },
      {
        $group: {
          _id: '$type',
          events: { $sum: 1 },
          votes: { $sum: { $size: '$eventVotes' } }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          events: 1,
          votes: 1
        }
      },
      { $sort: { votes: -1 } }
    ]);

    // Turnout rate
    const totalUsers = userCount || 1;
    const distinctVoters = (await Vote.distinct('voter_id')).length;
    const turnoutRate = Math.round((distinctVoters / totalUsers) * 100);

    // Recent activity (audit logs)
    const recentActivity = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const formattedRecentActivity = recentActivity.map(a => ({
      id: a._id.toString(),
      user_email: a.user_email,
      action: a.action,
      details: a.details,
      created_at: a.createdAt
    }));

    res.status(200).json({
      totalUsers,
      totalEvents: eventCount,
      totalCandidates: candidateCount,
      totalVotes: voteCount,
      activeEvents,
      distinctVoters,
      turnoutRate: `${turnoutRate}%`,
      categoryStats,
      recentActivity: formattedRecentActivity
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ error: 'Failed to fetch platform statistics' });
  }
};

// 2. Get Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formatted = logs.map(l => ({
      id: l._id.toString(),
      user_id: l.user_id ? l.user_id.toString() : null,
      user_email: l.user_email,
      action: l.action,
      details: l.details,
      ip_address: l.ip_address,
      created_at: l.createdAt
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// 3. Export CSV Report
exports.exportReport = async (req, res) => {
  const { type, id } = req.params;

  try {
    if (type === 'results') {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Invalid event ID' });
      }

      const event = await Event.findById(id);
      const eventName = event?.name || `Event_${id}`;

      // Candidates
      const candidates = await UserEvent.find({ event_id: id }).populate('user_id');

      // Votes
      const voteCounts = await Vote.aggregate([
        { $match: { event_id: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: '$participant_id', count: { $sum: 1 } } }
      ]);
      const voteMap = new Map();
      voteCounts.forEach(vc => voteMap.set(vc._id.toString(), vc.count));

      const rows = candidates.map(c => {
        const u = c.user_id || {};
        const pId = u._id ? u._id.toString() : '';
        return {
          candidate_id: pId,
          team_name: c.team_name || u.Username || 'Candidate',
          leader_name: c.team_leader || u.Username || 'Candidate',
          email: u.email || '',
          institution: c.institution || u.clg_name || '',
          category: c.performance_category || 'General',
          total_votes: voteMap.get(pId) || 0
        };
      });

      rows.sort((a, b) => b.total_votes - a.total_votes);

      let csv = 'Rank,Team Name,Leader,Email,Institution,Category,Votes\n';
      rows.forEach((r, idx) => {
        csv += `${idx + 1},"${r.team_name}","${r.leader_name}","${r.email}","${r.institution}","${r.category}",${r.total_votes}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="results_${id}_${Date.now()}.csv"`);
      return res.status(200).send(csv);
    } else if (type === 'users') {
      const users = await User.find().sort({ createdAt: 1 }).lean();

      let csv = 'ID,Username,Email,Role,College,Phone,Registered At\n';
      users.forEach(u => {
        csv += `"${u._id.toString()}","${u.Username || ''}","${u.email}","${u.role || ''}","${u.clg_name || ''}","${u.ph_no || ''}","${u.createdAt || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users_export_${Date.now()}.csv"`);
      return res.status(200).send(csv);
    } else {
      return res.status(400).json({ error: 'Unsupported export type' });
    }
  } catch (err) {
    console.error('exportReport error:', err);
    res.status(500).json({ error: 'Failed to generate export file' });
  }
};
