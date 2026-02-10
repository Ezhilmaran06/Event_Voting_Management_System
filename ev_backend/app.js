const express = require('express');
const cors = require('cors');
require('dotenv').config();

const usersRoutes = require('./routes/usersRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const userEventsRoutes = require('./routes/userEventsRoutes');
const votesRoutes = require('./routes/votesRoutes');

const app = express();
app.use(express.json());

// Enable CORS for all origins (development)
app.use(cors());

// Or, restrict to your React app origin:
app.use(cors({ origin: '*' }));

// Routes
app.use('/users', usersRoutes);
app.use('/events', eventsRoutes);
app.use('/user_events', userEventsRoutes);
app.use('/votes', votesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
