const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callAI } = require('../openrouter');

router.use(auth);

// Helper: fetch live org stats and build context string for system prompts
async function getOrgContext() {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM donors) as donor_count,
        (SELECT COALESCE(SUM(total_donated), 0) FROM donors) as total_raised,
        (SELECT COUNT(*) FROM campaigns) as campaign_count,
        (SELECT AVG(open_rate) FROM emails WHERE open_rate IS NOT NULL) as avg_open_rate
    `);
    const r = stats.rows[0];
    const donorCount = parseInt(r.donor_count) || 0;
    const totalRaised = parseFloat(r.total_raised) || 0;
    const campaignCount = parseInt(r.campaign_count) || 0;
    const avgOpenRate = r.avg_open_rate ? parseFloat(r.avg_open_rate).toFixed(1) : 'N/A';
    return `\n\nOrganization context: ${donorCount} donors, $${totalRaised.toLocaleString()} total raised, ${campaignCount} campaigns active, ${avgOpenRate}% average email open rate.`;
  } catch {
    return '';
  }
}

// POST /strategist - Campaign strategy AI
router.post('/strategist', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const orgContext = await getOrgContext();
    const systemPrompt = `You are an expert nonprofit Campaign Strategist AI. You help organizations design winning fundraising campaigns. You understand donor psychology, campaign timing, channel selection, and goal setting. Provide detailed, actionable strategic advice. Respond in JSON format:
{
  "strategy": "string",
  "key_recommendations": ["string"],
  "action_items": [{"priority": "string", "task": "string", "timeline": "string"}],
  "expected_outcomes": ["string"],
  "risk_assessment": "string"
}${orgContext}`;
    const userPrompt = `${prompt || 'Help me create an effective fundraising strategy'}${context ? '\n\nContext: ' + context : ''}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { response: aiResponse }; }
    res.json({ success: true, agent: 'Campaign Strategist', data: parsed });
  } catch (err) {
    console.error('AI strategist error:', err);
    res.status(500).json({ error: 'Failed to generate strategy' });
  }
});

// POST /copywriter - Marketing copy AI
router.post('/copywriter', async (req, res) => {
  try {
    const { prompt, context, tone, format } = req.body;
    const orgContext = await getOrgContext();
    const systemPrompt = `You are an expert nonprofit Copy Writer AI. You craft compelling fundraising copy for emails, social media, websites, direct mail, and advertisements. You understand emotional storytelling, calls to action, and donor motivation. Respond in JSON format:
{
  "copy": "string",
  "headline_options": ["string"],
  "call_to_action_options": ["string"],
  "tone_analysis": "string",
  "word_count": number,
  "readability_level": "string",
  "emotional_triggers": ["string"]
}${orgContext}`;
    const userPrompt = `${prompt || 'Write compelling fundraising copy'}${tone ? '\nTone: ' + tone : ''}${format ? '\nFormat: ' + format : ''}${context ? '\nContext: ' + context : ''}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { response: aiResponse }; }
    res.json({ success: true, agent: 'Copy Writer', data: parsed });
  } catch (err) {
    console.error('AI copywriter error:', err);
    res.status(500).json({ error: 'Failed to generate copy' });
  }
});

// POST /analyst - Data analysis AI
router.post('/analyst', async (req, res) => {
  try {
    const { prompt, data, metrics } = req.body;
    const orgContext = await getOrgContext();
    const systemPrompt = `You are an expert nonprofit Data Analyst AI. You analyze fundraising data to identify trends, patterns, and opportunities. You provide actionable insights based on campaign performance, donor behavior, and financial metrics. Respond in JSON format:
{
  "analysis_summary": "string",
  "key_findings": [{"finding": "string", "significance": "string", "action": "string"}],
  "trends": [{"trend": "string", "direction": "string", "impact": "string"}],
  "recommendations": ["string"],
  "metrics_to_watch": [{"metric": "string", "current_value": "string", "target": "string"}],
  "data_quality_notes": "string"
}${orgContext}`;
    const userPrompt = `${prompt || 'Analyze our fundraising performance'}${data ? '\nData: ' + data : ''}${metrics ? '\nMetrics: ' + metrics : ''}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { response: aiResponse }; }
    res.json({ success: true, agent: 'Data Analyst', data: parsed });
  } catch (err) {
    console.error('AI analyst error:', err);
    res.status(500).json({ error: 'Failed to analyze data' });
  }
});

// POST /profiler - Donor profiling AI
router.post('/profiler', async (req, res) => {
  try {
    const { prompt, donor_data } = req.body;
    const orgContext = await getOrgContext();
    const systemPrompt = `You are an expert nonprofit Donor Profiler AI. You analyze donor information to create detailed profiles, predict giving capacity, identify major gift prospects, and recommend personalized engagement strategies. Respond in JSON format:
{
  "donor_profile": "string",
  "giving_capacity": "string",
  "engagement_score": number,
  "major_gift_potential": "string",
  "preferred_channels": ["string"],
  "interests_and_affinities": ["string"],
  "recommended_ask_amount": "string",
  "cultivation_plan": [{"step": number, "action": "string", "timeline": "string"}],
  "similar_donor_segments": ["string"],
  "retention_risk": "string"
}${orgContext}`;
    const userPrompt = `${prompt || 'Create a detailed donor profile'}${donor_data ? '\nDonor Data: ' + donor_data : ''}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { response: aiResponse }; }
    res.json({ success: true, agent: 'Donor Profiler', data: parsed });
  } catch (err) {
    console.error('AI profiler error:', err);
    res.status(500).json({ error: 'Failed to profile donor' });
  }
});

// POST /forecaster - Trend forecasting AI
router.post('/forecaster', async (req, res) => {
  try {
    const { prompt, historical_data, timeframe } = req.body;
    const orgContext = await getOrgContext();
    const systemPrompt = `You are an expert nonprofit Trend Forecaster AI. You predict fundraising trends, seasonal patterns, donor behavior shifts, and emerging opportunities. You help organizations stay ahead of the curve in their fundraising efforts. Respond in JSON format:
{
  "forecast_summary": "string",
  "predictions": [{"prediction": "string", "confidence": "string", "timeframe": "string", "impact": "string"}],
  "seasonal_trends": [{"season": "string", "trend": "string", "recommendation": "string"}],
  "emerging_opportunities": ["string"],
  "potential_threats": ["string"],
  "recommended_preparations": [{"action": "string", "priority": "string", "deadline": "string"}],
  "industry_benchmarks": [{"metric": "string", "benchmark": "string", "your_position": "string"}]
}${orgContext}`;
    const userPrompt = `${prompt || 'Forecast fundraising trends for the coming period'}${historical_data ? '\nHistorical Data: ' + historical_data : ''}${timeframe ? '\nTimeframe: ' + timeframe : ''}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try { parsed = JSON.parse(aiResponse); } catch { parsed = { response: aiResponse }; }
    res.json({ success: true, agent: 'Trend Forecaster', data: parsed });
  } catch (err) {
    console.error('AI forecaster error:', err);
    res.status(500).json({ error: 'Failed to forecast trends' });
  }
});

// POST /donor-ltv - Donor lifetime value prediction
router.post('/donor-ltv', async (req, res) => {
  try {
    const { donor_id, donor_ids } = req.body || {};

    let donorRows = [];
    if (donor_id) {
      const r = await pool.query('SELECT * FROM donors WHERE id = $1', [donor_id]);
      donorRows = r.rows;
    } else if (Array.isArray(donor_ids) && donor_ids.length > 0) {
      const r = await pool.query('SELECT * FROM donors WHERE id = ANY($1::int[])', [donor_ids]);
      donorRows = r.rows;
    } else {
      const r = await pool.query('SELECT * FROM donors ORDER BY total_donated DESC NULLS LAST LIMIT 50');
      donorRows = r.rows;
    }

    const orgContext = await getOrgContext();
    const systemPrompt = `You are a nonprofit donor lifetime-value modeler. Forecast each donor's expected 5-year giving trajectory and recommend tailored ask amounts. Respond in STRICT JSON.${orgContext}`;
    const userPrompt = `Donors: ${JSON.stringify(donorRows)}

Return JSON:
{
  "summary": "...",
  "donor_predictions": [
    {
      "donor_id": 0,
      "predicted_5yr_value_usd": 0,
      "confidence": "low|medium|high",
      "recommended_ask_amount_usd": 0,
      "preferred_channel": "email|phone|inperson|mail",
      "next_best_action": "string"
    }
  ],
  "high_potential_donors": [{ "donor_id": 0, "rationale": "string" }],
  "at_risk_donors": [{ "donor_id": 0, "rationale": "string", "retention_action": "string" }],
  "disclaimer": "Predictive estimate; refine with real giving history."
}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try {
      const m = aiResponse.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { response: aiResponse };
    } catch { parsed = { response: aiResponse }; }

    res.json({ success: true, agent: 'Donor LTV', data: parsed, donors_analyzed: donorRows.length });
  } catch (err) {
    console.error('AI donor-ltv error:', err);
    res.status(500).json({ error: 'Failed to predict donor LTV' });
  }
});

// POST /grant-recommend - Match grants to org mission/profile
router.post('/grant-recommend', async (req, res) => {
  try {
    const { mission, focus_areas = [], geography, budget_size_usd } = req.body || {};

    const recentGrants = await pool.query(
      `SELECT * FROM grants ORDER BY created_at DESC LIMIT 50`
    ).catch(() => ({ rows: [] }));

    const orgContext = await getOrgContext();
    const systemPrompt = `You are a grants research analyst. Recommend likely-fit grants for a nonprofit. Use any prior grants in the system as a directional signal. Respond in STRICT JSON.${orgContext}`;
    const userPrompt = `Org profile:
- Mission: ${mission || 'unspecified'}
- Focus areas: ${JSON.stringify(focus_areas)}
- Geography: ${geography || 'unspecified'}
- Annual budget USD: ${budget_size_usd || 'unspecified'}

Existing grants in CRM: ${JSON.stringify(recentGrants.rows.slice(0, 30))}

Return JSON:
{
  "summary": "string",
  "recommendations": [
    {
      "grant_name": "string",
      "funder": "string",
      "fit_score_0_100": 0,
      "amount_range_usd": "string",
      "deadline_window": "string",
      "rationale": "string",
      "loi_outline": "string"
    }
  ],
  "search_keywords": ["..."],
  "sources_to_monitor": ["grants.gov", "candid.org", "etc"],
  "disclaimer": "Verify funder eligibility and current open windows."
}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try {
      const m = aiResponse.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { response: aiResponse };
    } catch { parsed = { response: aiResponse }; }

    res.json({ success: true, agent: 'Grant Recommender', data: parsed });
  } catch (err) {
    console.error('AI grant-recommend error:', err);
    res.status(500).json({ error: 'Failed to recommend grants' });
  }
});

// POST /event-forecast - Event demand & ROI forecaster
router.post('/event-forecast', async (req, res) => {
  try {
    const { event_id, event_type, expected_audience, ticket_price, sponsorship_targets } = req.body || {};

    let event = null;
    if (event_id) {
      const r = await pool.query('SELECT * FROM events WHERE id = $1', [event_id]).catch(() => ({ rows: [] }));
      event = r.rows[0] || null;
    }

    const recentEvents = await pool.query(
      `SELECT * FROM events ORDER BY created_at DESC LIMIT 25`
    ).catch(() => ({ rows: [] }));

    const orgContext = await getOrgContext();
    const systemPrompt = `You are a nonprofit events ROI analyst. Predict attendance, gross revenue, costs, and net fundraising for the proposed event using historical comparables. Respond in STRICT JSON.${orgContext}`;
    const userPrompt = `Event request:
${JSON.stringify({ event, event_type, expected_audience, ticket_price, sponsorship_targets })}

Historical events: ${JSON.stringify(recentEvents.rows.slice(0, 20))}

Return JSON:
{
  "summary": "string",
  "predicted_attendance": 0,
  "predicted_gross_revenue_usd": 0,
  "predicted_costs_usd": 0,
  "predicted_net_fundraising_usd": 0,
  "roi_pct": 0,
  "scenario_low_med_high": [
    { "scenario": "low", "attendance": 0, "net_usd": 0 },
    { "scenario": "medium", "attendance": 0, "net_usd": 0 },
    { "scenario": "high", "attendance": 0, "net_usd": 0 }
  ],
  "venue_recommendations": ["..."],
  "speaker_or_sponsor_levers": ["..."],
  "risks": ["..."],
  "disclaimer": "string"
}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try {
      const m = aiResponse.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { response: aiResponse };
    } catch { parsed = { response: aiResponse }; }

    res.json({ success: true, agent: 'Event ROI Forecaster', data: parsed });
  } catch (err) {
    console.error('AI event-forecast error:', err);
    res.status(500).json({ error: 'Failed to forecast event' });
  }
});

// POST /major-donor-cultivation - multi-touch sequence for top prospects
router.post('/major-donor-cultivation', async (req, res) => {
  try {
    const { donor_id, donor_ids, campaign_focus, time_horizon_months } = req.body || {};

    let donorRows = [];
    if (donor_id) {
      const r = await pool.query('SELECT * FROM donors WHERE id = $1', [donor_id]).catch(() => ({ rows: [] }));
      donorRows = r.rows;
    } else if (Array.isArray(donor_ids) && donor_ids.length > 0) {
      const r = await pool.query('SELECT * FROM donors WHERE id = ANY($1::int[])', [donor_ids]).catch(() => ({ rows: [] }));
      donorRows = r.rows;
    } else {
      const r = await pool.query("SELECT * FROM donors WHERE segment = 'Major Donor' OR total_donated >= 5000 ORDER BY total_donated DESC NULLS LAST LIMIT 20").catch(() => ({ rows: [] }));
      donorRows = r.rows;
    }

    const orgContext = await getOrgContext();
    const systemPrompt = `You are a major-gift cultivation strategist. Design a multi-touch cultivation sequence (90-180 days) that moves identified prospects toward an ask. Respond in STRICT JSON.${orgContext}`;
    const userPrompt = `Top prospects: ${JSON.stringify(donorRows)}
Campaign focus: ${campaign_focus || 'general operating'}
Horizon (months): ${time_horizon_months || 6}

Return JSON:
{
  "summary": "string",
  "donor_plans": [
    {
      "donor_id": 0,
      "donor_name": "string",
      "stage": "identification|qualification|cultivation|solicitation|stewardship",
      "ask_amount_usd": 0,
      "touchpoints": [
        {"sequence": 1, "channel": "email|phone|inperson|event|mail", "purpose": "string", "owner_role": "string", "due_offset_days": 0, "talking_points": ["string"]}
      ],
      "moves_management_notes": "string"
    }
  ],
  "shared_collateral_needed": ["string"],
  "executive_briefing_summary": "string",
  "disclaimer": "Customize per donor relationship history."
}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try {
      const m = aiResponse.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { response: aiResponse };
    } catch { parsed = { response: aiResponse }; }

    res.json({ success: true, agent: 'Major Donor Cultivation', data: parsed, donors_analyzed: donorRows.length });
  } catch (err) {
    console.error('AI major-donor-cultivation error:', err);
    if (err.message && /OPENROUTER_API_KEY|api key/i.test(err.message)) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    res.status(500).json({ error: 'Failed to generate cultivation plan' });
  }
});

// POST /volunteer-matching - skill-based volunteer assignment
router.post('/volunteer-matching', async (req, res) => {
  try {
    const { task_description, required_skills = [], hours_needed, deadline, volunteer_ids } = req.body || {};

    let volunteerRows = [];
    if (Array.isArray(volunteer_ids) && volunteer_ids.length > 0) {
      const r = await pool.query('SELECT * FROM volunteers WHERE id = ANY($1::int[])', [volunteer_ids]).catch(() => ({ rows: [] }));
      volunteerRows = r.rows;
    } else {
      const r = await pool.query("SELECT * FROM volunteers WHERE status = 'active' OR status IS NULL ORDER BY hours_contributed DESC NULLS LAST LIMIT 50").catch(() => ({ rows: [] }));
      volunteerRows = r.rows;
    }

    const orgContext = await getOrgContext();
    const systemPrompt = `You are a volunteer-management coordinator. Match available volunteers to a task based on skills, availability, and engagement history. Respond in STRICT JSON.${orgContext}`;
    const userPrompt = `Task description: ${task_description || 'unspecified task'}
Required skills: ${JSON.stringify(required_skills)}
Estimated hours: ${hours_needed || 'unspecified'}
Deadline: ${deadline || 'flexible'}

Volunteer pool: ${JSON.stringify(volunteerRows)}

Return JSON:
{
  "summary": "string",
  "matches": [
    {
      "volunteer_id": 0,
      "volunteer_name": "string",
      "fit_score_0_100": 0,
      "matched_skills": ["string"],
      "skill_gaps": ["string"],
      "suggested_role": "string",
      "training_needed": "none|brief|extended",
      "rationale": "string"
    }
  ],
  "team_composition_recommendation": "string",
  "skills_still_unfilled": ["string"],
  "outreach_template": "string",
  "disclaimer": "Confirm volunteer availability before assignment."
}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    let parsed;
    try {
      const m = aiResponse.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { response: aiResponse };
    } catch { parsed = { response: aiResponse }; }

    res.json({ success: true, agent: 'Volunteer Matcher', data: parsed, volunteers_considered: volunteerRows.length });
  } catch (err) {
    console.error('AI volunteer-matching error:', err);
    if (err.message && /OPENROUTER_API_KEY|api key/i.test(err.message)) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    res.status(500).json({ error: 'Failed to match volunteers' });
  }
});

module.exports = router;
