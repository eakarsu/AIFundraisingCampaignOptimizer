require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_donor_lifetime_value_prediction_endpo = require('./routes/gap-no-donor-lifetime-value-prediction-endpo');
const route_gap_no_major_donor_cultivation_plan_generato = require('./routes/gap-no-major-donor-cultivation-plan-generato');
const route_gap_no_volunteer_skill_matching_ai_peermatch = require('./routes/gap-no-volunteer-skill-matching-ai-peermatch');
const route_gap_no_event_demand_forecasting = require('./routes/gap-no-event-demand-forecasting');
const route_gap_limited_notifications_no_dedicated_modul = require('./routes/gap-limited-notifications-no-dedicated-modul');
const route_gap_no_webhook_dispatch_for_donor_events = require('./routes/gap-no-webhook-dispatch-for-donor-events');
const route_gap_no_file_upload_pipeline_for_donor = require('./routes/gap-no-file-upload-pipeline-for-donor');
const route_gap_no_payment_processing_surfaced_beyond_st = require('./routes/gap-no-payment-processing-surfaced-beyond-st');
const route_gap_no_real_time_donor_activity_feed = require('./routes/gap-no-real-time-donor-activity-feed');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

app.use('/api/gap-no-donor-lifetime-value-prediction-endpo', route_gap_no_donor_lifetime_value_prediction_endpo);
app.use('/api/gap-no-major-donor-cultivation-plan-generato', route_gap_no_major_donor_cultivation_plan_generato);
app.use('/api/gap-no-volunteer-skill-matching-ai-peermatch', route_gap_no_volunteer_skill_matching_ai_peermatch);
app.use('/api/gap-no-event-demand-forecasting', route_gap_no_event_demand_forecasting);
app.use('/api/gap-limited-notifications-no-dedicated-modul', route_gap_limited_notifications_no_dedicated_modul);
app.use('/api/gap-no-webhook-dispatch-for-donor-events', route_gap_no_webhook_dispatch_for_donor_events);
app.use('/api/gap-no-file-upload-pipeline-for-donor', route_gap_no_file_upload_pipeline_for_donor);
app.use('/api/gap-no-payment-processing-surfaced-beyond-st', route_gap_no_payment_processing_surfaced_beyond_st);
app.use('/api/gap-no-real-time-donor-activity-feed', route_gap_no_real_time_donor_activity_feed);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
