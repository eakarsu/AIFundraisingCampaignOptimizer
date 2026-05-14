// Peer-to-peer fundraiser matching.
//
// PRODUCT-DECISION: greedy match by overlap of `interests` array between
// volunteers and donors. Volunteers are seeded with skills; treat skills
// as proxy for interest tags. Returns top N matches per volunteer.
// No external services required.
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

function overlap(a, b) {
  const sa = new Set((a || []).map((x) => String(x).toLowerCase().trim()));
  const sb = new Set((b || []).map((x) => String(x).toLowerCase().trim()));
  let count = 0;
  for (const x of sa) if (sb.has(x)) count++;
  return count;
}

router.post('/match', async (req, res) => {
  try {
    const { top = 3 } = req.body || {};
    const vRes = await pool.query(`SELECT id, name, skills FROM volunteers WHERE status = 'active' LIMIT 50`).catch(() => ({ rows: [] }));
    const dRes = await pool.query(`SELECT id, name, interests FROM donors LIMIT 200`).catch(() => ({ rows: [] }));
    const matches = vRes.rows.map((v) => {
      const scored = dRes.rows.map((d) => ({ donor_id: d.id, donor_name: d.name, score: overlap(v.skills, d.interests) }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(10, parseInt(top, 10) || 3));
      return { volunteer_id: v.id, volunteer_name: v.name, matches: scored };
    });
    res.json({ matches, total_volunteers: vRes.rows.length, total_donors: dRes.rows.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to match peers', details: e.message });
  }
});

module.exports = router;
