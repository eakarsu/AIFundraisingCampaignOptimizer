const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ab_tests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List AB tests error:', err);
    res.status(500).json({ error: 'Failed to fetch AB tests' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ab_tests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'AB test not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get AB test error:', err);
    res.status(500).json({ error: 'Failed to fetch AB test' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { campaign_name, element_tested, variant_a, variant_b, winner, improvement_pct, status } = req.body;
    const result = await pool.query(
      `INSERT INTO ab_tests (campaign_name, element_tested, variant_a, variant_b, winner, improvement_pct, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [campaign_name, element_tested, variant_a, variant_b, winner, improvement_pct, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create AB test error:', err);
    res.status(500).json({ error: 'Failed to create AB test' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { campaign_name, element_tested, variant_a, variant_b, winner, improvement_pct, status } = req.body;
    const result = await pool.query(
      `UPDATE ab_tests SET campaign_name=$1, element_tested=$2, variant_a=$3, variant_b=$4,
       winner=$5, improvement_pct=$6, status=$7 WHERE id=$8 RETURNING *`,
      [campaign_name, element_tested, variant_a, variant_b, winner, improvement_pct, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'AB test not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update AB test error:', err);
    res.status(500).json({ error: 'Failed to update AB test' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ab_tests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'AB test not found' });
    res.json({ message: 'AB test deleted', test: result.rows[0] });
  } catch (err) {
    console.error('Delete AB test error:', err);
    res.status(500).json({ error: 'Failed to delete AB test' });
  }
});

// POST /ai/suggest - AI suggests A/B test variations
router.post('/ai/suggest', async (req, res) => {
  try {
    const { element, current_version, goal } = req.body;
    const systemPrompt = `You are a conversion rate optimization expert for nonprofit fundraising. Suggest A/B test variations that can improve donations and engagement. Respond in JSON format:
{
  "test_name": "string",
  "hypothesis": "string",
  "element_tested": "string",
  "variant_a": {"name": "string", "description": "string", "content": "string"},
  "variant_b": {"name": "string", "description": "string", "content": "string"},
  "expected_improvement": "string",
  "sample_size_needed": number,
  "test_duration": "string",
  "success_metric": "string",
  "additional_variants": [{"name": "string", "description": "string", "content": "string"}],
  "testing_tips": ["string"]
}`;
    const userPrompt = `Suggest A/B test variations for:
Element: ${element || 'Donation page call-to-action button'}
Current Version: ${current_version || 'Donate Now'}
Goal: ${goal || 'Increase donation conversion rate'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { suggestions: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI AB test suggest error:', err);
    res.status(500).json({ error: 'Failed to generate AB test suggestions' });
  }
});

// POST /ai/analyze - AI analyzes A/B test results
router.post('/ai/analyze', async (req, res) => {
  try {
    const { test_name, variant_a_data, variant_b_data, metric, sample_size } = req.body;
    const systemPrompt = `You are a conversion rate optimization expert for nonprofit fundraising. Analyze A/B test results and provide statistically informed recommendations. Respond in JSON format:
{
  "test_summary": "string",
  "winner": "string",
  "confidence_level": "string",
  "statistical_significance": "string",
  "variant_a_performance": {"metric_value": "string", "conversion_rate": "string", "sample_size": "string"},
  "variant_b_performance": {"metric_value": "string", "conversion_rate": "string", "sample_size": "string"},
  "improvement_percentage": "string",
  "insights": ["string"],
  "recommendations": ["string"],
  "next_test_suggestions": [{"element": "string", "hypothesis": "string"}],
  "implementation_advice": "string",
  "caveats": ["string"]
}`;
    const userPrompt = `Analyze these A/B test results:
Test Name: ${test_name || 'Donation Page CTA Button Test'}
Variant A Data: ${variant_a_data || 'Original - 500 views, 25 conversions'}
Variant B Data: ${variant_b_data || 'New version - 500 views, 35 conversions'}
Primary Metric: ${metric || 'Donation conversion rate'}
Sample Size: ${sample_size || '1000 total visitors'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { suggestions: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI AB test analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze AB test results' });
  }
});

module.exports = router;
