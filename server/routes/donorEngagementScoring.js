// Donor engagement scoring with real-time propensity for optimal ask
// timing and channel.
// Audit: batch_04.md / AIFundraisingCampaignOptimizer / Custom Feature Suggestions #2
const express = require('express');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');
const db = require('../db');

const router = express.Router();
router.use(auth);

function parseJSON(text) {
  try { const m = text.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {}
  return { notes: text };
}

// POST /api/donor-engagement/score
// Body: { donor_id? }  — score one donor; if absent, score top 20 active
router.post('/score', async (req, res) => {
  try {
    const { donor_id } = req.body || {};
    let donors = { rows: [] };
    if (donor_id) {
      try {
        donors = await db.query(
          `SELECT * FROM donors WHERE id = $1 AND user_id = $2`,
          [donor_id, req.user.id]
        );
      } catch (_) {}
    } else {
      try {
        donors = await db.query(
          `SELECT * FROM donors WHERE user_id = $1 ORDER BY total_donated DESC NULLS LAST LIMIT 20`,
          [req.user.id]
        );
      } catch (_) {}
    }

    // Pull recent interactions per donor (best-effort)
    const enriched = await Promise.all((donors.rows || []).map(async d => {
      let interactions = [];
      try {
        const r = await db.query(
          `SELECT * FROM crm_interactions WHERE donor_id = $1 ORDER BY occurred_at DESC LIMIT 5`,
          [d.id]
        );
        interactions = r.rows;
      } catch (_) {}
      return { donor: d, recent_interactions: interactions };
    }));

    const systemPrompt = `You are a donor engagement scoring engine. For each donor, compute an engagement score
(0-100), propensity tier, optimal channel (email|phone|in_person|event|letter), and an ask amount band.
Return STRICT JSON only.`;

    const userPrompt = `Donors with recent interactions: ${JSON.stringify(enriched.slice(0, 20))}

Return JSON:
{
  "summary": "...",
  "scored_donors": [
    {
      "donor_id": "string",
      "donor_name": "string",
      "engagement_score_0_100": 0,
      "propensity_tier": "cold|warm|hot",
      "optimal_channel": "email|phone|in_person|event|letter",
      "ask_amount_band_usd": { "low": 0, "mid": 0, "high": 0 },
      "next_ask_window_days": 0,
      "rationale": "string"
    }
  ],
  "portfolio_actions": ["..."],
  "disclaimer": "Engagement scoring is heuristic; pair with major-gift officer review."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ donor_count: enriched.length, scoring: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/donor-engagement/at-risk
router.get('/at-risk', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, name, last_donation_date, total_donated FROM donors
       WHERE user_id = $1 AND last_donation_date < NOW() - INTERVAL '180 days'
       ORDER BY total_donated DESC NULLS LAST LIMIT 50`,
      [req.user.id]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
