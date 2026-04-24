const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM volunteers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('List volunteers error:', err);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM volunteers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get volunteer error:', err);
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, skills, availability, assigned_task, hours_contributed, status } = req.body;
    const result = await pool.query(
      `INSERT INTO volunteers (name, email, skills, availability, assigned_task, hours_contributed, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, email, skills, availability, assigned_task, hours_contributed || 0, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create volunteer error:', err);
    res.status(500).json({ error: 'Failed to create volunteer' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, skills, availability, assigned_task, hours_contributed, status } = req.body;
    const result = await pool.query(
      `UPDATE volunteers SET name=$1, email=$2, skills=$3, availability=$4, assigned_task=$5,
       hours_contributed=$6, status=$7 WHERE id=$8 RETURNING *`,
      [name, email, skills, availability, assigned_task, hours_contributed, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update volunteer error:', err);
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM volunteers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Volunteer not found' });
    res.json({ message: 'Volunteer deleted', volunteer: result.rows[0] });
  } catch (err) {
    console.error('Delete volunteer error:', err);
    res.status(500).json({ error: 'Failed to delete volunteer' });
  }
});

// POST /ai/match - AI matches volunteers to tasks
router.post('/ai/match', async (req, res) => {
  try {
    const { volunteer_skills, available_tasks } = req.body;
    let volunteersData = volunteer_skills;
    let tasksData = available_tasks;
    if (!volunteersData) {
      const result = await pool.query('SELECT name, skills, availability, status FROM volunteers WHERE status = $1 LIMIT 50', ['active']);
      volunteersData = JSON.stringify(result.rows);
    }
    const systemPrompt = `You are a volunteer coordinator expert. Match volunteers to tasks based on their skills, availability, and interests. Respond in JSON format:
{
  "matches": [{"volunteer": "string", "task": "string", "fit_score": number, "reasoning": "string"}],
  "unmatched_volunteers": ["string"],
  "unmatched_tasks": ["string"],
  "team_suggestions": [{"team_name": "string", "members": ["string"], "task": "string"}],
  "recommendations": ["string"]
}`;
    const userPrompt = `Match these volunteers to tasks:
Volunteers: ${volunteersData || 'General volunteers with various skills'}
Available Tasks: ${tasksData || 'Event setup, Phone banking, Social media, Data entry, Donor outreach, Event registration'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { matches: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI volunteer match error:', err);
    res.status(500).json({ error: 'Failed to match volunteers' });
  }
});

// POST /ai/engage - AI generates volunteer engagement ideas
router.post('/ai/engage', async (req, res) => {
  try {
    const { volunteer_count, current_retention, activities, challenges } = req.body;
    const systemPrompt = `You are a nonprofit volunteer management expert specializing in engagement and retention strategies. Generate creative and practical ideas to keep volunteers motivated, engaged, and committed. Respond in JSON format:
{
  "engagement_strategies": [{"strategy": "string", "description": "string", "effort_level": "string", "impact": "string"}],
  "recognition_ideas": [{"idea": "string", "frequency": "string", "cost": "string"}],
  "communication_plan": {"frequency": "string", "channels": ["string"], "content_ideas": ["string"]},
  "team_building_activities": ["string"],
  "skill_development_opportunities": ["string"],
  "retention_tactics": ["string"],
  "feedback_mechanisms": ["string"],
  "milestone_celebrations": [{"milestone": "string", "celebration": "string"}],
  "digital_engagement_ideas": ["string"]
}`;
    const userPrompt = `Generate volunteer engagement ideas:
Volunteer Count: ${volunteer_count || '50 active volunteers'}
Current Retention Rate: ${current_retention || 'Moderate - some volunteers dropping off'}
Current Activities: ${activities || 'Event support, phone banking, admin tasks'}
Challenges: ${challenges || 'Keeping volunteers motivated long-term'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { matches: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI volunteer engage error:', err);
    res.status(500).json({ error: 'Failed to generate engagement ideas' });
  }
});

module.exports = router;
