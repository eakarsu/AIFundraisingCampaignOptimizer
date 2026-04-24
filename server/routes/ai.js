const router = require('express').Router();
const { callAI } = require('../openrouter');

// POST /strategist - Campaign strategy AI
router.post('/strategist', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are an expert nonprofit Campaign Strategist AI. You help organizations design winning fundraising campaigns. You understand donor psychology, campaign timing, channel selection, and goal setting. Provide detailed, actionable strategic advice. Respond in JSON format:
{
  "strategy": "string",
  "key_recommendations": ["string"],
  "action_items": [{"priority": "string", "task": "string", "timeline": "string"}],
  "expected_outcomes": ["string"],
  "risk_assessment": "string"
}`;
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
    const systemPrompt = `You are an expert nonprofit Copy Writer AI. You craft compelling fundraising copy for emails, social media, websites, direct mail, and advertisements. You understand emotional storytelling, calls to action, and donor motivation. Respond in JSON format:
{
  "copy": "string",
  "headline_options": ["string"],
  "call_to_action_options": ["string"],
  "tone_analysis": "string",
  "word_count": number,
  "readability_level": "string",
  "emotional_triggers": ["string"]
}`;
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
    const systemPrompt = `You are an expert nonprofit Data Analyst AI. You analyze fundraising data to identify trends, patterns, and opportunities. You provide actionable insights based on campaign performance, donor behavior, and financial metrics. Respond in JSON format:
{
  "analysis_summary": "string",
  "key_findings": [{"finding": "string", "significance": "string", "action": "string"}],
  "trends": [{"trend": "string", "direction": "string", "impact": "string"}],
  "recommendations": ["string"],
  "metrics_to_watch": [{"metric": "string", "current_value": "string", "target": "string"}],
  "data_quality_notes": "string"
}`;
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
}`;
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
    const systemPrompt = `You are an expert nonprofit Trend Forecaster AI. You predict fundraising trends, seasonal patterns, donor behavior shifts, and emerging opportunities. You help organizations stay ahead of the curve in their fundraising efforts. Respond in JSON format:
{
  "forecast_summary": "string",
  "predictions": [{"prediction": "string", "confidence": "string", "timeframe": "string", "impact": "string"}],
  "seasonal_trends": [{"season": "string", "trend": "string", "recommendation": "string"}],
  "emerging_opportunities": ["string"],
  "potential_threats": ["string"],
  "recommended_preparations": [{"action": "string", "priority": "string", "deadline": "string"}],
  "industry_benchmarks": [{"metric": "string", "benchmark": "string", "your_position": "string"}]
}`;
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

module.exports = router;
