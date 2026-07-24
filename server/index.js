require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const app = express();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters');
}

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin denied'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// AI rate limiter: 20 requests per hour per user or IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    if (req.user) return `user:${req.user.id}`;
    return ipKeyGenerator(req);
  },
  message: { error: 'AI rate limit exceeded. Max 20 requests/hour.' },
});

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
app.use('/api/ai', aiRateLimiter, require('./routes/ai'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/board', require('./routes/board'));
app.use('/api/donor-scoring', require('./routes/donorScoring'));
app.use('/api/peer-matching', require('./routes/peerMatching'));
app.use('/api/agentic', aiRateLimiter, require('./routes/agenticGrants'));
app.use('/api/event-roi', aiRateLimiter, require('./routes/eventROISimulator'));
app.use('/api/donor-engagement', aiRateLimiter, require('./routes/donorEngagementScoring'));
app.use('/api/donor-fatigue-throttle', require('./routes/donorFatigueThrottle'));
app.use('/api/grant-workflow', require('./routes/governedGrants'));

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
