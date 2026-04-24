const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM thank_you_letters ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List thank you letters error:', err);
    res.status(500).json({ error: 'Failed to fetch letters' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM thank_you_letters WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Letter not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get letter error:', err);
    res.status(500).json({ error: 'Failed to fetch letter' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { donor_name, donation_amount, campaign_name, letter_text, status } = req.body;
    const result = await pool.query(
      `INSERT INTO thank_you_letters (donor_name, donation_amount, campaign_name, letter_text, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [donor_name, donation_amount || 0, campaign_name, letter_text, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create letter error:', err);
    res.status(500).json({ error: 'Failed to create letter' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { donor_name, donation_amount, campaign_name, letter_text, status } = req.body;
    const result = await pool.query(
      `UPDATE thank_you_letters SET donor_name=$1, donation_amount=$2, campaign_name=$3, letter_text=$4, status=$5
       WHERE id=$6 RETURNING *`,
      [donor_name, donation_amount, campaign_name, letter_text, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Letter not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update letter error:', err);
    res.status(500).json({ error: 'Failed to update letter' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM thank_you_letters WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Letter not found' });
    res.json({ message: 'Letter deleted', letter: result.rows[0] });
  } catch (err) {
    console.error('Delete letter error:', err);
    res.status(500).json({ error: 'Failed to delete letter' });
  }
});

// POST /ai/generate - AI generates thank you letter
router.post('/ai/generate', async (req, res) => {
  try {
    const { donor_name, amount, campaign } = req.body;
    const systemPrompt = `You are an expert at writing heartfelt, personalized thank you letters for nonprofits. Create warm, sincere letters that make donors feel appreciated and connected to the mission. Respond in JSON format:
{
  "letter_text": "string",
  "subject_line": "string",
  "tone": "string",
  "personalization_notes": ["string"],
  "follow_up_suggestions": ["string"]
}`;
    const userPrompt = `Write a thank you letter for:
Donor Name: ${donor_name || 'Valued Donor'}
Donation Amount: $${amount || '100'}
Campaign: ${campaign || 'General Fund'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { letter: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI thank you generate error:', err);
    res.status(500).json({ error: 'Failed to generate thank you letter' });
  }
});

module.exports = router;
