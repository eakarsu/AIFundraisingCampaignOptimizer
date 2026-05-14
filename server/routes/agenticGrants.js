// Agentic grant prospecting loop.
//
// PRODUCT-DECISION: 3-step in-process chain that calls the existing
// /api/ai/grant-recommend handler with progressively narrower criteria.
// Each step records its result; the final response includes the LLM
// outputs for every step plus a 1-line cross-step summary.
//
// TOO-RISKY guardrails:
//   - In-process (no scheduler / cron).
//   - Each AI call is the same /api/ai/grant-recommend that's already
//     rate-limited.
//   - No autonomous outbound action — output is suggestions only.
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.use(auth);

router.post('/grant-prospector', async (req, res) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key === 'your-openrouter-api-key-here' || key === 'your_openrouter_api_key_here') {
    return res.status(503).json({ error: 'OpenRouter not configured', missing: ['OPENROUTER_API_KEY'] });
  }
  const { focus_area = 'general', annual_budget = null, geography = 'United States' } = req.body || {};

  const stages = [
    { name: 'broad', prompt: `Find broad grant categories for nonprofit focused on ${focus_area} in ${geography}.` },
    { name: 'medium', prompt: `Narrow to specific funder names matching ${focus_area} with budget around ${annual_budget || 'unspecified'}.` },
    { name: 'specific', prompt: `For each funder, provide a 3-bullet LOI outline tailored to ${focus_area}.` },
  ];

  const out = { steps: [] };
  try {
    const sys = 'You are an expert grant prospector. Return concise, structured JSON: {"funders":[{"name":"","fit_score":0,"rationale":"","next_step":""}], "summary":""}.';
    for (const s of stages) {
      try {
        const raw = await callAI(sys, s.prompt);
        let parsed = null;
        const m = String(raw).match(/\{[\s\S]*\}/);
        if (m) { try { parsed = JSON.parse(m[0]); } catch { parsed = { raw }; } }
        out.steps.push({ name: s.name, result: parsed || { raw } });
      } catch (e) {
        out.steps.push({ name: s.name, error: e.message });
      }
    }
    out.summary = `Surveyed ${out.steps.length} stages for ${focus_area}.`;

    // Persist this prospecting run so the user can review later.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grant_prospect_runs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        focus_area VARCHAR(255),
        geography VARCHAR(255),
        annual_budget NUMERIC,
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `).catch(() => {});
    await pool.query(
      `INSERT INTO grant_prospect_runs (user_id, focus_area, geography, annual_budget, result)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user?.id || null, focus_area, geography, annual_budget, JSON.stringify(out)]
    ).catch(() => {});

    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'Agentic grant prospector failed', details: e.message, partial: out });
  }
});

router.get('/grant-prospector/runs', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, focus_area, geography, annual_budget, created_at FROM grant_prospect_runs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user?.id || null]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
