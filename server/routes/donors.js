const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.use(auth);

// GET / - list donors with pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM donors');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM donors ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('List donors error:', err);
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
});

// GET /:id - get donor
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM donors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Donor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get donor error:', err);
    res.status(500).json({ error: 'Failed to fetch donor' });
  }
});

// POST / - create donor (with deduplication by email)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, total_donated, donation_count, last_donation_date, segment, notes } = req.body;
    if (email) {
      const existing = await pool.query('SELECT id FROM donors WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Donor with this email already exists', existing_id: existing.rows[0].id });
      }
    }
    const result = await pool.query(
      `INSERT INTO donors (name, email, phone, total_donated, donation_count, last_donation_date, segment, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, email, phone, total_donated || 0, donation_count || 0, last_donation_date, segment, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create donor error:', err);
    res.status(500).json({ error: 'Failed to create donor' });
  }
});

// PUT /:id - update donor
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, total_donated, donation_count, last_donation_date, segment, notes } = req.body;
    const result = await pool.query(
      `UPDATE donors SET name=$1, email=$2, phone=$3, total_donated=$4, donation_count=$5,
       last_donation_date=$6, segment=$7, notes=$8 WHERE id=$9 RETURNING *`,
      [name, email, phone, total_donated, donation_count, last_donation_date, segment, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Donor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update donor error:', err);
    res.status(500).json({ error: 'Failed to update donor' });
  }
});

// DELETE /:id - delete donor
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM donors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Donor not found' });
    res.json({ message: 'Donor deleted', donor: result.rows[0] });
  } catch (err) {
    console.error('Delete donor error:', err);
    res.status(500).json({ error: 'Failed to delete donor' });
  }
});

// POST /ai/segment - AI segments donors
router.post('/ai/segment', async (req, res) => {
  try {
    const { donors_data } = req.body;
    let donorsSummary = donors_data;
    if (!donorsSummary) {
      const result = await pool.query('SELECT name, total_donated, donation_count, last_donation_date, segment FROM donors LIMIT 50');
      donorsSummary = JSON.stringify(result.rows);
    }
    const systemPrompt = `You are a nonprofit donor segmentation expert. Analyze donor data and create meaningful segments. Respond in JSON format:
{
  "segments": [
    {"name": "string", "criteria": "string", "donor_count": number, "avg_donation": number, "recommended_strategy": "string", "donors": ["string"]}
  ],
  "insights": ["string"],
  "recommendations": ["string"]
}`;
    const userPrompt = `Analyze and segment these donors based on their giving patterns:\n${donorsSummary}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { analysis: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI segment error:', err);
    res.status(500).json({ error: 'Failed to segment donors' });
  }
});

// POST /ai/profile - AI generates donor profile analysis
router.post('/ai/profile', async (req, res) => {
  try {
    const { donor_name, total_donated, donation_count, last_donation_date, segment, notes } = req.body;
    const systemPrompt = `You are an expert donor relationship manager. Create a detailed donor profile analysis. Respond in JSON format:
{
  "donor_summary": "string",
  "giving_pattern": "string",
  "engagement_level": "string",
  "lifetime_value_estimate": "string",
  "recommended_ask_amount": "string",
  "best_communication_channels": ["string"],
  "cultivation_strategy": "string",
  "stewardship_plan": ["string"],
  "risk_of_lapsing": "string",
  "personalization_tips": ["string"]
}`;
    const userPrompt = `Create a donor profile analysis for:
Name: ${donor_name}
Total Donated: $${total_donated || 0}
Donation Count: ${donation_count || 0}
Last Donation: ${last_donation_date || 'Unknown'}
Current Segment: ${segment || 'Unassigned'}
Notes: ${notes || 'None'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { profile: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI profile error:', err);
    res.status(500).json({ error: 'Failed to generate donor profile' });
  }
});

module.exports = router;
