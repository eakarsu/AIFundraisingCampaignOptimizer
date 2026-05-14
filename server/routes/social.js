const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM social_posts');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM social_posts ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('List social posts error:', err);
    res.status(500).json({ error: 'Failed to fetch social posts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM social_posts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get social post error:', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { platform, content, campaign_name, hashtags, scheduled_date, status } = req.body;
    const result = await pool.query(
      `INSERT INTO social_posts (platform, content, campaign_name, hashtags, scheduled_date, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [platform, content, campaign_name, hashtags, scheduled_date, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create social post error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { platform, content, campaign_name, hashtags, scheduled_date, status } = req.body;
    const result = await pool.query(
      `UPDATE social_posts SET platform=$1, content=$2, campaign_name=$3, hashtags=$4, scheduled_date=$5, status=$6
       WHERE id=$7 RETURNING *`,
      [platform, content, campaign_name, hashtags, scheduled_date, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update social post error:', err);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM social_posts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted', post: result.rows[0] });
  } catch (err) {
    console.error('Delete social post error:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /ai/generate - AI generates social media post
router.post('/ai/generate', async (req, res) => {
  try {
    const { platform, campaign, tone } = req.body;
    const systemPrompt = `You are a nonprofit social media marketing expert. Create engaging social media posts that drive awareness and donations. Respond in JSON format:
{
  "posts": [
    {
      "platform": "string",
      "content": "string",
      "hashtags": ["string"],
      "best_time_to_post": "string",
      "visual_suggestion": "string",
      "call_to_action": "string"
    }
  ],
  "campaign_hashtag": "string",
  "content_tips": ["string"]
}`;
    const userPrompt = `Create social media posts for:
Platform: ${platform || 'All platforms (Twitter, Facebook, Instagram, LinkedIn)'}
Campaign: ${campaign || 'General Fundraising'}
Tone: ${tone || 'inspiring and engaging'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { content: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI social generate error:', err);
    res.status(500).json({ error: 'Failed to generate social media content' });
  }
});

// POST /ai/hashtags - AI suggests hashtags for social media posts
router.post('/ai/hashtags', async (req, res) => {
  try {
    const { content, platform, campaign } = req.body;
    const systemPrompt = `You are a nonprofit social media marketing expert specializing in hashtag strategy. Suggest effective hashtags that maximize reach and engagement for fundraising campaigns. Respond in JSON format:
{
  "primary_hashtags": ["string"],
  "secondary_hashtags": ["string"],
  "trending_hashtags": ["string"],
  "branded_hashtag": "string",
  "hashtag_groups": [{"theme": "string", "hashtags": ["string"]}],
  "platform_specific_tips": "string",
  "recommended_count": number,
  "avoid_hashtags": ["string"]
}`;
    const userPrompt = `Suggest hashtags for this social media post:
Content: ${content || 'General nonprofit fundraising post'}
Platform: ${platform || 'Instagram'}
Campaign: ${campaign || 'General Fundraising'}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { content: aiResponse }; }
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI social hashtags error:', err);
    res.status(500).json({ error: 'Failed to suggest hashtags' });
  }
});

module.exports = router;
