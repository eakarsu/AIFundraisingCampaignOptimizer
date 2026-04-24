require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/social', require('./routes/social'));
app.use('/api/grants', require('./routes/grants'));
app.use('/api/events', require('./routes/events'));
app.use('/api/thankyou', require('./routes/thankyou'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/impact', require('./routes/impact'));
app.use('/api/abtesting', require('./routes/abtesting'));
app.use('/api/outreach', require('./routes/outreach'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
