const express = require('express');
const cors = require('cors');
require('dotenv').config();

const initializeDatabase = require('./db_init');
const usersRoutes = require('./routes/usersRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const userEventsRoutes = require('./routes/userEventsRoutes');
const votesRoutes = require('./routes/votesRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

const app = express();

// Increase body limit to support team pictures / base64 images without failing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Run schema initialization and migrations on startup
initializeDatabase().catch(err => {
  console.error('Database migration warning:', err.message);
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Core Routes (both standard and /api prefixed to prevent mismatches)
app.use('/users', usersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', usersRoutes);

app.use('/events', eventsRoutes);
app.use('/api/events', eventsRoutes);

app.use('/user_events', userEventsRoutes);
app.use('/api/user_events', userEventsRoutes);
app.use('/api/candidates', userEventsRoutes);

app.use('/votes', votesRoutes);
app.use('/api/votes', votesRoutes);

app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

app.use('/notifications', notificationsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Event Organization & Voting Server running on http://localhost:${PORT}`);
});

module.exports = app;
