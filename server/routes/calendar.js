const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM content_calendar ORDER BY scheduled_date ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List calendar error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar items' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM content_calendar WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Calendar item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get calendar item error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar item' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content_type, channel, scheduled_date, campaign_name, content_text, status } = req.body;
    const result = await pool.query(
      `INSERT INTO content_calendar (title, content_type, channel, scheduled_date, campaign_name, content_text, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, content_type, channel, scheduled_date, campaign_name, content_text, status || 'planned']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create calendar item error:', err);
    res.status(500).json({ error: 'Failed to create calendar item' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content_type, channel, scheduled_date, campaign_name, content_text, status } = req.body;
    const result = await pool.query(
      `UPDATE content_calendar SET title=$1, content_type=$2, channel=$3, scheduled_date=$4,
       campaign_name=$5, content_text=$6, status=$7 WHERE id=$8 RETURNING *`,
      [title, content_type, channel, scheduled_date, campaign_name, content_text, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Calendar item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update calendar item error:', err);
    res.status(500).json({ error: 'Failed to update calendar item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM content_calendar WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Calendar item not found' });
    res.json({ message: 'Calendar item deleted', item: result.rows[0] });
  } catch (err) {
    console.error('Delete calendar item error:', err);
    res.status(500).json({ error: 'Failed to delete calendar item' });
  }
});

// POST /ai/plan - AI plans content calendar
router.post('/ai/plan', async (req, res) => {
  try {
    const { campaign, duration, channels, frequency } = req.body;
    const systemPrompt = `You are a nonprofit content marketing strategist. Create comprehensive content calendars that drive engagement and donations. Respond in JSON format:
{
  "calendar_name": "string",
  "duration": "string",
  "content_items": [
    {
      "week": number,
      "day": "string",
      "title": "string",
      "content_type": "string",
      "channel": "string",
      "content_brief": "string",
      "call_to_action": "string",
      "hashtags": ["string"]
    }
  ],
  "themes": [{"week": number, "theme": "string"}],
  "key_dates": ["string"],
  "content_mix": [{"type": "string", "percentage": number}],
  "tips": ["string"]
}`;
    const userPrompt = `Plan a content calendar:
Campaign: ${campaign || 'Year-End Giving Campaign'}
Duration: ${duration || '4 weeks'}
Channels: ${channels || 'Email, Social Media, Blog, Website'}
Frequency: ${frequency || '3-5 posts per week'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { calendar: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI calendar plan error:', err);
    res.status(500).json({ error: 'Failed to plan content calendar' });
  }
});

// POST /ai/generate - AI generates content for the calendar
router.post('/ai/generate', async (req, res) => {
  try {
    const { content_type, channel, campaign, topic } = req.body;
    const systemPrompt = `You are a nonprofit content creator specializing in fundraising communications. Generate ready-to-use content pieces for content calendars across multiple channels. Respond in JSON format:
{
  "title": "string",
  "content_type": "string",
  "channel": "string",
  "content": "string",
  "headline": "string",
  "body_text": "string",
  "call_to_action": "string",
  "visual_description": "string",
  "hashtags": ["string"],
  "optimal_post_time": "string",
  "variations": [{"version": "string", "content": "string"}],
  "content_notes": ["string"]
}`;
    const userPrompt = `Generate content for the calendar:
Content Type: ${content_type || 'Social media post'}
Channel: ${channel || 'Instagram'}
Campaign: ${campaign || 'General Fundraising'}
Topic: ${topic || 'Donor appreciation and impact storytelling'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { calendar: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI calendar generate error:', err);
    res.status(500).json({ error: 'Failed to generate calendar content' });
  }
});

// POST /ai/optimize - AI optimizes content timing
router.post('/ai/optimize', async (req, res) => {
  try {
    const { content_items, audience, goals, current_schedule } = req.body;
    const systemPrompt = `You are a nonprofit content strategy expert specializing in timing optimization. Analyze content schedules and recommend optimal posting times and content distribution for maximum engagement and donations. Respond in JSON format:
{
  "optimized_schedule": [{"content": "string", "original_time": "string", "recommended_time": "string", "reason": "string"}],
  "best_posting_times": [{"day": "string", "time": "string", "channel": "string", "engagement_prediction": "string"}],
  "content_gaps": ["string"],
  "content_overlaps": ["string"],
  "frequency_recommendations": [{"channel": "string", "current_frequency": "string", "recommended_frequency": "string"}],
  "seasonal_considerations": ["string"],
  "audience_insights": ["string"],
  "optimization_score": "string"
}`;
    const userPrompt = `Optimize the content calendar timing:
Content Items: ${content_items || 'Mix of social posts, emails, and blog articles'}
Target Audience: ${audience || 'Donors and supporters'}
Goals: ${goals || 'Maximize engagement and donation conversions'}
Current Schedule: ${current_schedule || 'Posting at random times throughout the week'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { calendar: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI calendar optimize error:', err);
    res.status(500).json({ error: 'Failed to optimize content timing' });
  }
});

module.exports = router;
