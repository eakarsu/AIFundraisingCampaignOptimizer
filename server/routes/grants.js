const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grants ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List grants error:', err);
    res.status(500).json({ error: 'Failed to fetch grants' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Grant not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get grant error:', err);
    res.status(500).json({ error: 'Failed to fetch grant' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, funder, amount_requested, status, deadline, proposal_text } = req.body;
    const result = await pool.query(
      `INSERT INTO grants (title, funder, amount_requested, status, deadline, proposal_text)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, funder, amount_requested || 0, status || 'draft', deadline, proposal_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create grant error:', err);
    res.status(500).json({ error: 'Failed to create grant' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, funder, amount_requested, status, deadline, proposal_text } = req.body;
    const result = await pool.query(
      `UPDATE grants SET title=$1, funder=$2, amount_requested=$3, status=$4, deadline=$5, proposal_text=$6
       WHERE id=$7 RETURNING *`,
      [title, funder, amount_requested, status, deadline, proposal_text, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Grant not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update grant error:', err);
    res.status(500).json({ error: 'Failed to update grant' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM grants WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Grant not found' });
    res.json({ message: 'Grant deleted', grant: result.rows[0] });
  } catch (err) {
    console.error('Delete grant error:', err);
    res.status(500).json({ error: 'Failed to delete grant' });
  }
});

// POST /ai/generate - AI writes grant proposal section
router.post('/ai/generate', async (req, res) => {
  try {
    const { organization, project, funder, amount } = req.body;
    const systemPrompt = `You are an expert grant writer for nonprofits. Write compelling, professional grant proposal sections. Respond in JSON format:
{
  "title": "string",
  "executive_summary": "string",
  "statement_of_need": "string",
  "project_description": "string",
  "goals_and_objectives": ["string"],
  "methodology": "string",
  "evaluation_plan": "string",
  "budget_narrative": "string",
  "sustainability_plan": "string",
  "organizational_capacity": "string"
}`;
    const userPrompt = `Write a grant proposal for:
Organization: ${organization || 'Our Nonprofit Organization'}
Project: ${project || 'Community Impact Project'}
Funder: ${funder || 'Foundation'}
Amount Requested: $${amount || '25,000'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { proposal: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI grant generate error:', err);
    res.status(500).json({ error: 'Failed to generate grant proposal' });
  }
});

// POST /ai/review - AI reviews and provides feedback on grant proposals
router.post('/ai/review', async (req, res) => {
  try {
    const { proposal_text, funder, amount, guidelines } = req.body;
    const systemPrompt = `You are an experienced grant reviewer and nonprofit funding expert. Review grant proposals and provide constructive, actionable feedback to strengthen them. Respond in JSON format:
{
  "overall_score": number,
  "overall_assessment": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "section_feedback": [{"section": "string", "score": number, "feedback": "string", "suggestion": "string"}],
  "alignment_with_funder": "string",
  "budget_assessment": "string",
  "competitiveness_rating": "string",
  "critical_improvements": ["string"],
  "minor_suggestions": ["string"],
  "rewrite_recommendations": ["string"]
}`;
    const userPrompt = `Review this grant proposal and provide feedback:
Proposal Text: ${proposal_text || 'Draft grant proposal for community development project'}
Target Funder: ${funder || 'General foundation'}
Amount Requested: $${amount || '25,000'}
Funder Guidelines: ${guidelines || 'Standard foundation grant guidelines'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { proposal: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI grant review error:', err);
    res.status(500).json({ error: 'Failed to review grant proposal' });
  }
});

module.exports = router;
