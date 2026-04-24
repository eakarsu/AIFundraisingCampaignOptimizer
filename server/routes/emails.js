const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

// GET /
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emails ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List emails error:', err);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emails WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get email error:', err);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { subject, body, campaign_name, target_audience, tone, status } = req.body;
    const result = await pool.query(
      `INSERT INTO emails (subject, body, campaign_name, target_audience, tone, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [subject, body, campaign_name, target_audience, tone, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create email error:', err);
    res.status(500).json({ error: 'Failed to create email' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { subject, body, campaign_name, target_audience, tone, status } = req.body;
    const result = await pool.query(
      `UPDATE emails SET subject=$1, body=$2, campaign_name=$3, target_audience=$4, tone=$5, status=$6
       WHERE id=$7 RETURNING *`,
      [subject, body, campaign_name, target_audience, tone, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update email error:', err);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM emails WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found' });
    res.json({ message: 'Email deleted', email: result.rows[0] });
  } catch (err) {
    console.error('Delete email error:', err);
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

// POST /ai/generate - AI generates fundraising email
router.post('/ai/generate', async (req, res) => {
  try {
    const { campaign_name, target_audience, tone, purpose } = req.body;
    const systemPrompt = `You are an expert nonprofit email copywriter. Generate compelling fundraising emails that drive donations and engagement. Respond in JSON format:
{
  "subject_line": "string",
  "preview_text": "string",
  "greeting": "string",
  "body": "string",
  "call_to_action": "string",
  "closing": "string",
  "ps_line": "string",
  "alternative_subject_lines": ["string", "string"]
}`;
    const userPrompt = `Write a fundraising email for:
Campaign: ${campaign_name || 'General Fundraising'}
Target Audience: ${target_audience || 'All donors'}
Tone: ${tone || 'warm and compelling'}
Purpose: ${purpose || 'Solicit donations'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { email: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI email generate error:', err);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

// POST /ai/improve - AI improves existing email content
router.post('/ai/improve', async (req, res) => {
  try {
    const { subject, body, tone, goal } = req.body;
    const systemPrompt = `You are an expert nonprofit email copywriter specializing in improving fundraising emails. Analyze and enhance existing email content for better engagement, clarity, and conversion. Respond in JSON format:
{
  "improved_subject": "string",
  "improved_body": "string",
  "improved_call_to_action": "string",
  "changes_made": [{"area": "string", "original": "string", "improved": "string", "reason": "string"}],
  "readability_score": "string",
  "emotional_appeal_rating": "string",
  "suggestions": ["string"],
  "alternative_subject_lines": ["string"]
}`;
    const userPrompt = `Improve this fundraising email:
Subject: ${subject || 'Please donate to our cause'}
Body: ${body || 'We need your help to make a difference. Please consider donating today.'}
Desired Tone: ${tone || 'warm and compelling'}
Goal: ${goal || 'Increase donation conversions'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { email: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI email improve error:', err);
    res.status(500).json({ error: 'Failed to improve email' });
  }
});

module.exports = router;
