const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budget_items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List budget items error:', err);
    res.status(500).json({ error: 'Failed to fetch budget items' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budget_items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get budget item error:', err);
    res.status(500).json({ error: 'Failed to fetch budget item' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { campaign_name, category, allocated_amount, spent_amount, roi_estimate, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO budget_items (campaign_name, category, allocated_amount, spent_amount, roi_estimate, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [campaign_name, category, allocated_amount || 0, spent_amount || 0, roi_estimate, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create budget item error:', err);
    res.status(500).json({ error: 'Failed to create budget item' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { campaign_name, category, allocated_amount, spent_amount, roi_estimate, notes } = req.body;
    const result = await pool.query(
      `UPDATE budget_items SET campaign_name=$1, category=$2, allocated_amount=$3, spent_amount=$4,
       roi_estimate=$5, notes=$6 WHERE id=$7 RETURNING *`,
      [campaign_name, category, allocated_amount, spent_amount, roi_estimate, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update budget item error:', err);
    res.status(500).json({ error: 'Failed to update budget item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM budget_items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Budget item not found' });
    res.json({ message: 'Budget item deleted', item: result.rows[0] });
  } catch (err) {
    console.error('Delete budget item error:', err);
    res.status(500).json({ error: 'Failed to delete budget item' });
  }
});

// POST /ai/optimize - AI optimizes budget allocation
router.post('/ai/optimize', async (req, res) => {
  try {
    const { total_budget, categories, priorities } = req.body;
    const systemPrompt = `You are a nonprofit financial strategist specializing in budget optimization. Analyze spending and recommend optimal budget allocation for maximum fundraising ROI. Respond in JSON format:
{
  "total_budget": number,
  "allocations": [{"category": "string", "recommended_amount": number, "percentage": number, "expected_roi": "string", "rationale": "string"}],
  "cost_saving_opportunities": ["string"],
  "high_roi_investments": ["string"],
  "budget_warnings": ["string"],
  "quarterly_breakdown": [{"quarter": "string", "focus": "string", "spending": number}],
  "optimization_score": "string"
}`;
    const userPrompt = `Optimize this fundraising budget:
Total Budget: $${total_budget || '50,000'}
Categories: ${categories || 'Marketing, Events, Staff, Technology, Direct Mail, Digital Ads'}
Priorities: ${priorities || 'Maximize donor acquisition and retention'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { optimization: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI budget optimize error:', err);
    res.status(500).json({ error: 'Failed to optimize budget' });
  }
});

// POST /ai/recommend - AI provides budget recommendations
router.post('/ai/recommend', async (req, res) => {
  try {
    const { current_budget, spending_history, goals, constraints } = req.body;
    const systemPrompt = `You are a nonprofit financial advisor specializing in fundraising budget planning. Provide actionable budget recommendations that maximize fundraising effectiveness while maintaining fiscal responsibility. Respond in JSON format:
{
  "recommendations": [{"area": "string", "current_spending": "string", "recommended_spending": "string", "rationale": "string", "priority": "string"}],
  "reallocation_suggestions": [{"from": "string", "to": "string", "amount": "string", "expected_benefit": "string"}],
  "cost_reduction_opportunities": ["string"],
  "investment_priorities": [{"priority": "string", "amount": "string", "expected_roi": "string"}],
  "risk_assessment": "string",
  "seasonal_adjustments": [{"period": "string", "adjustment": "string"}],
  "benchmarks": [{"metric": "string", "current": "string", "recommended": "string"}],
  "action_items": ["string"]
}`;
    const userPrompt = `Provide budget recommendations:
Current Budget: $${current_budget || '50,000'}
Spending History: ${spending_history || 'Roughly even distribution across categories'}
Fundraising Goals: ${goals || 'Increase overall donations by 20%'}
Constraints: ${constraints || 'Limited staff, small team'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { optimization: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI budget recommend error:', err);
    res.status(500).json({ error: 'Failed to generate budget recommendations' });
  }
});

module.exports = router;
