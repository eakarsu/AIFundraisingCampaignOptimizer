const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /overview - live org stats for AI context display
router.get('/overview', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM donors) as donor_count,
        (SELECT COALESCE(SUM(total_donated), 0) FROM donors) as total_raised,
        (SELECT COUNT(*) FROM campaigns) as campaign_count,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'active') as active_campaigns,
        (SELECT AVG(open_rate) FROM emails WHERE open_rate IS NOT NULL) as avg_open_rate
    `);
    const r = result.rows[0];
    res.json({
      donor_count: parseInt(r.donor_count) || 0,
      total_raised: parseFloat(r.total_raised) || 0,
      campaign_count: parseInt(r.campaign_count) || 0,
      active_campaigns: parseInt(r.active_campaigns) || 0,
      avg_open_rate: r.avg_open_rate ? parseFloat(r.avg_open_rate).toFixed(1) : null,
    });
  } catch (err) {
    console.error('Stats overview error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
