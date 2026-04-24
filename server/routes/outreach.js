const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outreach_messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List outreach error:', err);
    res.status(500).json({ error: 'Failed to fetch outreach messages' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outreach_messages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get outreach error:', err);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { donor_name, channel, message, campaign_name, status, sent_date, response } = req.body;
    const result = await pool.query(
      `INSERT INTO outreach_messages (donor_name, channel, message, campaign_name, status, sent_date, response)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [donor_name, channel, message, campaign_name, status || 'draft', sent_date, response]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create outreach error:', err);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { donor_name, channel, message, campaign_name, status, sent_date, response } = req.body;
    const result = await pool.query(
      `UPDATE outreach_messages SET donor_name=$1, channel=$2, message=$3, campaign_name=$4,
       status=$5, sent_date=$6, response=$7 WHERE id=$8 RETURNING *`,
      [donor_name, channel, message, campaign_name, status, sent_date, response, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update outreach error:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM outreach_messages WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted', outreach: result.rows[0] });
  } catch (err) {
    console.error('Delete outreach error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// POST /ai/personalize - AI personalizes outreach message
router.post('/ai/personalize', async (req, res) => {
  try {
    const { donor_info, campaign, channel } = req.body;
    const systemPrompt = `You are a donor relations expert specializing in personalized outreach. Create highly personalized messages that resonate with individual donors. Respond in JSON format:
{
  "messages": [
    {
      "channel": "string",
      "subject": "string",
      "message": "string",
      "personalization_elements": ["string"],
      "best_send_time": "string",
      "follow_up_plan": "string"
    }
  ],
  "talking_points": ["string"],
  "donor_interests_to_reference": ["string"],
  "tone_guidance": "string"
}`;
    const userPrompt = `Create a personalized outreach message:
Donor Info: ${donor_info || 'Regular donor, $500 average gift, interested in education programs'}
Campaign: ${campaign || 'Annual Fund'}
Channel: ${channel || 'Email'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { outreach: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI outreach personalize error:', err);
    res.status(500).json({ error: 'Failed to personalize outreach' });
  }
});

// POST /ai/sequence - AI creates outreach message sequences
router.post('/ai/sequence', async (req, res) => {
  try {
    const { donor_segment, campaign, channel, num_messages } = req.body;
    const systemPrompt = `You are a donor relations expert specializing in multi-touch outreach sequences. Create strategic message sequences that nurture donor relationships and drive conversions over time. Respond in JSON format:
{
  "sequence_name": "string",
  "total_messages": number,
  "sequence_duration": "string",
  "messages": [
    {
      "step": number,
      "day": number,
      "channel": "string",
      "subject": "string",
      "message": "string",
      "goal": "string",
      "call_to_action": "string"
    }
  ],
  "branching_logic": [{"condition": "string", "action": "string"}],
  "key_principles": ["string"],
  "expected_conversion_rate": "string",
  "optimization_tips": ["string"]
}`;
    const userPrompt = `Create an outreach message sequence:
Donor Segment: ${donor_segment || 'Lapsed donors who gave last year but not this year'}
Campaign: ${campaign || 'Re-engagement Campaign'}
Channel: ${channel || 'Email and Phone'}
Number of Messages: ${num_messages || '5'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { outreach: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI outreach sequence error:', err);
    res.status(500).json({ error: 'Failed to create outreach sequence' });
  }
});

module.exports = router;
