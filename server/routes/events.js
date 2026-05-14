const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM events');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM events ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('List events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, date, location, budget, expected_attendees, goal_amount, status, description } = req.body;
    const result = await pool.query(
      `INSERT INTO events (name, type, date, location, budget, expected_attendees, goal_amount, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, type, date, location, budget || 0, expected_attendees || 0, goal_amount || 0, status || 'planning', description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, type, date, location, budget, expected_attendees, goal_amount, status, description } = req.body;
    const result = await pool.query(
      `UPDATE events SET name=$1, type=$2, date=$3, location=$4, budget=$5, expected_attendees=$6,
       goal_amount=$7, status=$8, description=$9 WHERE id=$10 RETURNING *`,
      [name, type, date, location, budget, expected_attendees, goal_amount, status, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted', event: result.rows[0] });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// POST /ai/plan - AI plans fundraising event
router.post('/ai/plan', async (req, res) => {
  try {
    const { type, budget, audience_size, goal } = req.body;
    const systemPrompt = `You are an expert nonprofit event planner. Create detailed fundraising event plans. Respond in JSON format:
{
  "event_name": "string",
  "event_type": "string",
  "theme": "string",
  "timeline": [{"time": "string", "activity": "string"}],
  "venue_suggestions": ["string"],
  "budget_breakdown": [{"item": "string", "cost": number}],
  "marketing_plan": ["string"],
  "sponsorship_tiers": [{"name": "string", "amount": number, "benefits": ["string"]}],
  "volunteer_roles": [{"role": "string", "count": number, "responsibilities": ["string"]}],
  "fundraising_activities": ["string"],
  "success_metrics": ["string"],
  "contingency_plans": ["string"]
}`;
    const userPrompt = `Plan a fundraising event:
Type: ${type || 'Gala Dinner'}
Budget: $${budget || '10,000'}
Expected Audience: ${audience_size || '100'} people
Fundraising Goal: $${goal || '50,000'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { plan: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI event plan error:', err);
    res.status(500).json({ error: 'Failed to generate event plan' });
  }
});

// POST /ai/promote - AI generates promotion ideas for events
router.post('/ai/promote', async (req, res) => {
  try {
    const { event_name, event_type, date, audience, budget } = req.body;
    const systemPrompt = `You are a nonprofit event promotion specialist. Generate creative and effective promotion ideas for fundraising events that maximize attendance and donations. Respond in JSON format:
{
  "promotion_plan": "string",
  "channels": [{"channel": "string", "strategy": "string", "timeline": "string"}],
  "social_media_posts": [{"platform": "string", "content": "string", "timing": "string"}],
  "email_campaign": {"subject": "string", "preview": "string", "key_message": "string"},
  "partnership_ideas": ["string"],
  "press_release_outline": "string",
  "promotional_timeline": [{"week": "string", "activities": ["string"]}],
  "budget_friendly_ideas": ["string"],
  "engagement_hooks": ["string"]
}`;
    const userPrompt = `Generate promotion ideas for this fundraising event:
Event Name: ${event_name || 'Fundraising Gala'}
Event Type: ${event_type || 'Gala Dinner'}
Date: ${date || 'Upcoming'}
Target Audience: ${audience || 'Donors and community members'}
Promotion Budget: $${budget || '2,000'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { plan: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI event promote error:', err);
    res.status(500).json({ error: 'Failed to generate promotion ideas' });
  }
});

module.exports = router;
