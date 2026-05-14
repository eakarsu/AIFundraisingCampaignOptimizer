// Event ROI simulator predicting attendance/revenue/cost with venue,
// sponsorship, speaker mix recommendations.
// Audit: batch_04.md / AIFundraisingCampaignOptimizer / Custom Feature Suggestions #3
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

// POST /api/event-roi/simulate
router.post('/simulate', async (req, res) => {
  try {
    const {
      event_name, event_type = 'gala',
      venue_capacity, ticket_price_usd = 0,
      sponsorship_target_usd = 0,
      historical_avg_donation_usd,
      speakers = [], date
    } = req.body || {};

    let pastEvents = { rows: [] };
    let donors = { rows: [] };
    try {
      pastEvents = await db.query(
        `SELECT * FROM events WHERE user_id = $1 ORDER BY date DESC LIMIT 20`,
        [req.user.id]
      );
    } catch (_) {}
    try {
      donors = await db.query(
        `SELECT COUNT(*) AS total, AVG(total_donated) AS avg_total FROM donors WHERE user_id = $1`,
        [req.user.id]
      );
    } catch (_) {}

    const systemPrompt = `You are a nonprofit event ROI simulator. Predict attendance, revenue, cost, and net.
Recommend venue/sponsorship/speaker mix. Return STRICT JSON only.`;

    const userPrompt = `Event: ${event_name || 'TBD'} (${event_type})
Date: ${date || 'TBD'}
Venue capacity: ${venue_capacity || 'unspecified'}
Ticket price USD: ${ticket_price_usd}
Sponsorship target USD: ${sponsorship_target_usd}
Speakers: ${JSON.stringify(speakers)}
Historical avg donation: ${historical_avg_donation_usd || 'unspecified'}
Past events (sample): ${JSON.stringify(pastEvents.rows.slice(0, 10))}
Donor base summary: ${JSON.stringify(donors.rows[0] || {})}

Return JSON:
{
  "summary": "...",
  "projected_attendance": 0,
  "projected_revenue_usd": 0,
  "projected_cost_usd": 0,
  "projected_net_usd": 0,
  "projected_roi_pct": 0,
  "venue_recommendation": { "type": "string", "rationale": "string" },
  "sponsorship_strategy": [{ "tier": "string", "amount_usd": 0, "deliverables": ["..."] }],
  "speaker_mix_recommendation": ["..."],
  "risks": ["..."],
  "alternative_scenarios": [{ "scenario": "string", "projected_net_usd": 0 }],
  "disclaimer": "Simulation based on org history and general fundraising knowledge."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ event_name, event_type, simulation: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/event-roi/past-events
router.get('/past-events', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, name, date, attendance, revenue, cost FROM events
       WHERE user_id = $1 ORDER BY date DESC LIMIT 50`,
      [req.user.id]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
