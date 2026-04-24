const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM impact_reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List impact reports error:', err);
    res.status(500).json({ error: 'Failed to fetch impact reports' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM impact_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get impact report error:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, campaign_name, period, metrics_summary, report_text } = req.body;
    const result = await pool.query(
      `INSERT INTO impact_reports (title, campaign_name, period, metrics_summary, report_text)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, campaign_name, period, metrics_summary, report_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create impact report error:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, campaign_name, period, metrics_summary, report_text } = req.body;
    const result = await pool.query(
      `UPDATE impact_reports SET title=$1, campaign_name=$2, period=$3, metrics_summary=$4, report_text=$5
       WHERE id=$6 RETURNING *`,
      [title, campaign_name, period, metrics_summary, report_text, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update impact report error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM impact_reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted', report: result.rows[0] });
  } catch (err) {
    console.error('Delete impact report error:', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// POST /ai/generate - AI generates impact report
router.post('/ai/generate', async (req, res) => {
  try {
    const { campaign_data, metrics, period } = req.body;
    const systemPrompt = `You are a nonprofit impact reporting specialist. Create compelling impact reports that showcase the organization's achievements. Respond in JSON format:
{
  "title": "string",
  "executive_summary": "string",
  "key_metrics": [{"metric": "string", "value": "string", "trend": "string"}],
  "impact_stories": [{"title": "string", "narrative": "string"}],
  "financial_summary": {"total_raised": "string", "total_spent": "string", "overhead_ratio": "string"},
  "beneficiary_impact": {"people_served": "string", "programs_delivered": "string", "outcomes": ["string"]},
  "donor_acknowledgments": "string",
  "future_outlook": "string",
  "visual_suggestions": ["string"]
}`;
    const userPrompt = `Generate an impact report:
Campaign Data: ${campaign_data || 'Annual fundraising campaign with multiple programs'}
Key Metrics: ${metrics || 'Donations received, donors engaged, programs funded, beneficiaries served'}
Period: ${period || 'Annual 2025'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { report: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI impact report error:', err);
    res.status(500).json({ error: 'Failed to generate impact report' });
  }
});

// POST /ai/analyze - AI analyzes impact data
router.post('/ai/analyze', async (req, res) => {
  try {
    const { impact_data, metrics, period, goals } = req.body;
    const systemPrompt = `You are a nonprofit impact measurement specialist. Analyze impact data and provide insights that help organizations understand their effectiveness and communicate their value to stakeholders. Respond in JSON format:
{
  "analysis_summary": "string",
  "key_findings": [{"finding": "string", "significance": "string"}],
  "metric_analysis": [{"metric": "string", "value": "string", "trend": "string", "benchmark": "string", "assessment": "string"}],
  "impact_score": "string",
  "strengths": ["string"],
  "areas_for_improvement": ["string"],
  "roi_analysis": {"investment": "string", "social_return": "string", "ratio": "string"},
  "stakeholder_talking_points": ["string"],
  "data_gaps": ["string"],
  "recommendations": ["string"],
  "visualization_suggestions": [{"chart_type": "string", "data_to_show": "string", "insight": "string"}]
}`;
    const userPrompt = `Analyze this impact data:
Impact Data: ${impact_data || 'Program served 500 beneficiaries across 3 programs with $200,000 budget'}
Key Metrics: ${metrics || 'Beneficiaries served, program outcomes, donor retention, cost per impact'}
Period: ${period || 'Last 12 months'}
Goals: ${goals || 'Demonstrate program effectiveness and maximize social return on investment'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { report: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI impact analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze impact data' });
  }
});

module.exports = router;
