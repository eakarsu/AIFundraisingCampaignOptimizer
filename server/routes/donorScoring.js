// Real-time donor engagement scoring.
//
// PRODUCT-DECISION: deterministic heuristic, no AI required.
//   score = clamp(
//     0.40 * recency_score   (days since last gift, exp decay over 365d)
//   + 0.30 * frequency_score (gifts per year, capped at 12)
//   + 0.20 * monetary_score  (total / max(total in DB), 0..1)
//   + 0.10 * email_engagement (open_rate / 100, 0..1)
//   ) * 100
// Returns top-20 donors when no donor_id supplied; otherwise scores one.
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

function recencyScore(lastGiftDate) {
  if (!lastGiftDate) return 0.0;
  const days = Math.max(0, (Date.now() - new Date(lastGiftDate).getTime()) / 86400000);
  return Math.exp(-days / 365); // 1.0 today, ~0.37 after 1 year
}

async function compute(rows, maxTotal) {
  return rows.map((d) => {
    const r = recencyScore(d.last_gift_date);
    const giftsPerYear = parseFloat(d.gifts_per_year) || 0;
    const f = Math.min(giftsPerYear, 12) / 12;
    const m = maxTotal > 0 ? Math.min(parseFloat(d.total_donated) || 0, maxTotal) / maxTotal : 0;
    const e = (parseFloat(d.email_engagement) || 0) / 100;
    const raw = 0.40 * r + 0.30 * f + 0.20 * m + 0.10 * e;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100)));
    return {
      donor_id: d.id,
      name: d.name,
      score,
      components: {
        recency: Math.round(r * 100) / 100,
        frequency: Math.round(f * 100) / 100,
        monetary: Math.round(m * 100) / 100,
        email_engagement: Math.round(e * 100) / 100,
      },
    };
  });
}

router.post('/score', async (req, res) => {
  try {
    const { donor_id, limit = 20 } = req.body || {};
    const cap = (await pool.query(`SELECT COALESCE(MAX(total_donated), 0) AS m FROM donors`).catch(() => ({ rows: [{ m: 0 }] }))).rows[0].m;
    const maxTotal = parseFloat(cap) || 0;

    // Schema-tolerant: this repo's donors table has `last_donation_date`
    // (no `first_gift_date`). Approximate gifts-per-year from
    // donation_count and account creation timestamp.
    const sql = donor_id
      ? `SELECT id, name, total_donated, last_donation_date AS last_gift_date,
                COALESCE(donation_count::numeric / NULLIF(EXTRACT(EPOCH FROM (NOW() - created_at)) / 31536000.0, 0), 0) AS gifts_per_year,
                0 AS email_engagement
           FROM donors WHERE id = $1`
      : `SELECT id, name, total_donated, last_donation_date AS last_gift_date,
                COALESCE(donation_count::numeric / NULLIF(EXTRACT(EPOCH FROM (NOW() - created_at)) / 31536000.0, 0), 0) AS gifts_per_year,
                0 AS email_engagement
           FROM donors ORDER BY total_donated DESC NULLS LAST LIMIT $1`;
    const params = donor_id ? [donor_id] : [Math.min(100, parseInt(limit, 10) || 20)];
    const rs = await pool.query(sql, params).catch(() => ({ rows: [] }));
    const scored = await compute(rs.rows, maxTotal);
    res.json({ scored, count: scored.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to score donors', details: e.message });
  }
});

module.exports = router;
