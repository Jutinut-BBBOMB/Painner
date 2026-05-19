require('dotenv').config();
require('express-async-errors');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const teamRoutes    = require('./routes/teamRoutes');
const chatRoutes    = require('./routes/chatRoutes');
const errorHandler  = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams',    teamRoutes);
app.use('/api/chats',    chatRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const MONGO_URI = process.env.MONGO_URI;

  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
    })
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = app;
