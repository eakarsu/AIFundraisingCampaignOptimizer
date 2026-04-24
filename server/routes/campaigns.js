const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

// GET / - list all campaigns
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM campaigns ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List campaigns error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /:id - get single campaign
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST / - create campaign
router.post('/', async (req, res) => {
  try {
    const { name, description, goal_amount, raised_amount, start_date, end_date, status, category } = req.body;
    const result = await pool.query(
      `INSERT INTO campaigns (name, description, goal_amount, raised_amount, start_date, end_date, status, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description, goal_amount || 0, raised_amount || 0, start_date, end_date, status || 'draft', category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT /:id - update campaign
router.put('/:id', async (req, res) => {
  try {
    const { name, description, goal_amount, raised_amount, start_date, end_date, status, category } = req.body;
    const result = await pool.query(
      `UPDATE campaigns SET name = $1, description = $2, goal_amount = $3, raised_amount = $4,
       start_date = $5, end_date = $6, status = $7, category = $8 WHERE id = $9 RETURNING *`,
      [name, description, goal_amount, raised_amount, start_date, end_date, status, category, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update campaign error:', err);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE /:id - delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM campaigns WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted', campaign: result.rows[0] });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// POST /ai/strategy - AI generates campaign strategy
router.post('/ai/strategy', async (req, res) => {
  try {
    const { campaign_name, goal_amount, target_audience, duration, category } = req.body;
    const systemPrompt = `You are an expert nonprofit fundraising strategist. Generate detailed, actionable campaign strategies. Respond in JSON format with the following structure:
{
  "strategy_name": "string",
  "executive_summary": "string",
  "target_demographics": ["string"],
  "channels": ["string"],
  "phases": [{"name": "string", "duration": "string", "activities": ["string"], "goals": ["string"]}],
  "key_messages": ["string"],
  "budget_allocation": [{"category": "string", "percentage": number}],
  "success_metrics": ["string"],
  "risks_and_mitigations": [{"risk": "string", "mitigation": "string"}]
}`;
    const userPrompt = `Create a comprehensive fundraising campaign strategy for:
Campaign: ${campaign_name || 'General Fundraising Campaign'}
Goal Amount: $${goal_amount || '50,000'}
Target Audience: ${target_audience || 'General donors'}
Duration: ${duration || '3 months'}
Category: ${category || 'General'}`;

    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = { strategy: aiResponse };
    }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI strategy error:', err);
    res.status(500).json({ error: 'Failed to generate campaign strategy' });
  }
});

// POST /ai/optimize - AI optimizes campaign performance
router.post('/ai/optimize', async (req, res) => {
  try {
    const { campaign_name, current_performance, goal_amount, raised_amount, channels } = req.body;
    const systemPrompt = `You are an expert nonprofit fundraising strategist specializing in campaign optimization. Analyze current campaign performance and provide actionable recommendations to improve results. Respond in JSON format:
{
  "optimization_summary": "string",
  "performance_assessment": "string",
  "channel_optimizations": [{"channel": "string", "current_performance": "string", "recommendation": "string", "expected_improvement": "string"}],
  "messaging_improvements": [{"area": "string", "current": "string", "suggested": "string"}],
  "audience_targeting": [{"segment": "string", "strategy": "string", "priority": "string"}],
  "quick_wins": ["string"],
  "long_term_strategies": ["string"],
  "budget_reallocation": [{"from": "string", "to": "string", "rationale": "string"}],
  "testing_recommendations": ["string"],
  "projected_improvement": "string"
}`;
    const userPrompt = `Optimize this fundraising campaign:
Campaign: ${campaign_name || 'Annual Fundraising Campaign'}
Current Performance: ${current_performance || 'Below target pace'}
Goal Amount: $${goal_amount || '100,000'}
Amount Raised: $${raised_amount || '35,000'}
Active Channels: ${channels || 'Email, Social Media, Direct Mail, Events'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = { strategy: aiResponse };
    }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI campaign optimize error:', err);
    res.status(500).json({ error: 'Failed to optimize campaign' });
  }
});

module.exports = router;
