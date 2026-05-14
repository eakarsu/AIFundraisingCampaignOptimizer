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
    const countResult = await pool.query('SELECT COUNT(*) FROM goals');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM goals ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('List goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM goals WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get goal error:', err);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { campaign_name, target_amount, suggested_amount, rationale, timeline, status } = req.body;
    const result = await pool.query(
      `INSERT INTO goals (campaign_name, target_amount, suggested_amount, rationale, timeline, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [campaign_name, target_amount || 0, suggested_amount || 0, rationale, timeline, status || 'proposed']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { campaign_name, target_amount, suggested_amount, rationale, timeline, status } = req.body;
    const result = await pool.query(
      `UPDATE goals SET campaign_name=$1, target_amount=$2, suggested_amount=$3, rationale=$4,
       timeline=$5, status=$6 WHERE id=$7 RETURNING *`,
      [campaign_name, target_amount, suggested_amount, rationale, timeline, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM goals WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json({ message: 'Goal deleted', goal: result.rows[0] });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// POST /ai/suggest - AI suggests fundraising goals
router.post('/ai/suggest', async (req, res) => {
  try {
    const { historical_data, campaign_type, duration } = req.body;
    const systemPrompt = `You are a nonprofit fundraising analytics expert. Suggest realistic yet ambitious fundraising goals based on data and best practices. Respond in JSON format:
{
  "recommended_goal": number,
  "stretch_goal": number,
  "minimum_goal": number,
  "rationale": "string",
  "milestones": [{"name": "string", "amount": number, "timeline": "string"}],
  "revenue_streams": [{"source": "string", "projected_amount": number, "confidence": "string"}],
  "key_assumptions": ["string"],
  "risk_factors": ["string"],
  "growth_rate": "string",
  "benchmarks": [{"metric": "string", "industry_avg": "string", "your_target": "string"}]
}`;
    const userPrompt = `Suggest fundraising goals:
Historical Data: ${historical_data || 'Last year raised $75,000 from 200 donors'}
Campaign Type: ${campaign_type || 'Annual Fund'}
Duration: ${duration || '12 months'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { suggestions: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI goal suggest error:', err);
    res.status(500).json({ error: 'Failed to suggest goals' });
  }
});

// POST /ai/assess - AI assesses goal progress
router.post('/ai/assess', async (req, res) => {
  try {
    const { goal_amount, raised_amount, timeline, days_remaining, donor_count } = req.body;
    const systemPrompt = `You are a nonprofit fundraising analytics expert. Assess goal progress and provide actionable insights to help organizations stay on track or course-correct their fundraising efforts. Respond in JSON format:
{
  "progress_percentage": number,
  "status": "string",
  "pace_assessment": "string",
  "projected_outcome": "string",
  "daily_target_needed": "string",
  "strengths": ["string"],
  "concerns": ["string"],
  "course_corrections": [{"action": "string", "expected_impact": "string", "priority": "string"}],
  "milestone_check": [{"milestone": "string", "status": "string"}],
  "donor_engagement_insights": "string",
  "recommended_next_steps": ["string"],
  "motivational_message": "string"
}`;
    const userPrompt = `Assess fundraising goal progress:
Goal Amount: $${goal_amount || '50,000'}
Amount Raised So Far: $${raised_amount || '20,000'}
Timeline: ${timeline || '6 months'}
Days Remaining: ${days_remaining || '90'}
Number of Donors: ${donor_count || '150'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { suggestions: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI goal assess error:', err);
    res.status(500).json({ error: 'Failed to assess goal progress' });
  }
});

module.exports = router;
