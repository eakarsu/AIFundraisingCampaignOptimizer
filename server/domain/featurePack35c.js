'use strict';
// FP wave 35C — pure helpers: tasks validation/filter, CSV/JSON export, deterministic AI fallback.
function validateTask(input = {}) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('title is required');
  const status = ['open','todo','in_progress','done','blocked'].includes(input.status) ? input.status : 'open';
  return { title, status, assignee: input.assignee ?? null, due_date: input.due_date ?? null, notes: input.notes ?? null };
}
function filterRecords(records, filters = {}) {
  const list = Array.isArray(records) ? records : [];
  const q = String(filters.search || filters.q || '').trim().toLowerCase();
  const status = String(filters.status || '').trim().toLowerCase();
  return list.filter((r) => {
    if (status && String(r.status ?? '').toLowerCase() !== status) return false;
    if (q && !Object.values(r || {}).join(' ').toLowerCase().includes(q)) return false;
    return true;
  });
}
function csvEscape(v) { if (v === null || v === undefined) return ''; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function toCSV(records, columns) {
  const rows = Array.isArray(records) ? records : [];
  const cols = (columns && columns.length) ? columns : (rows[0] ? Object.keys(rows[0]) : ['id','title','status']);
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvEscape(r ? r[c] : '')).join(','))].join('\n');
}
function buildExport(records, format = 'json', columns) {
  const rows = Array.isArray(records) ? records : [];
  if (String(format).toLowerCase() === 'csv') return { format: 'csv', contentType: 'text/csv', body: toCSV(rows, columns), count: rows.length };
  return { format: 'json', contentType: 'application/json', body: JSON.stringify({ count: rows.length, data: rows }, null, 2), count: rows.length };
}
function hasProvider(env = process.env) { return Boolean(env.OPENROUTER_API_KEY || env.OPENAI_API_KEY); }
function fallback(sections) {
  return { aiGenerated: false, provider: null, mode: 'deterministic-fallback',
    label: 'Deterministic fallback — no AI provider configured (set OPENROUTER_API_KEY or OPENAI_API_KEY)', sections };
}

function campaignMomentum(campaigns = []) {
  const rows = Array.isArray(campaigns) ? campaigns : [];
  const goal = rows.reduce((s,x)=>s+(Number(x.goal_amount)||0),0), raised = rows.reduce((s,x)=>s+(Number(x.raised_amount)||0),0);
  return fallback({ summary: `Raised ${raised} of ${goal} goal across ${rows.length} campaign(s)`, metrics: { campaignCount: rows.length, goalAmount: goal, raisedAmount: raised, pctOfGoal: goal ? Math.round((raised/goal)*100) : 0 }, recommendations: goal && raised/goal < 0.5 ? ['Campaigns are below 50% of goal; consider a mid-campaign appeal'] : [] });
}
function donorSegmentInsight(donors = []) {
  const rows = Array.isArray(donors) ? donors : [];
  const total = rows.reduce((s,x)=>s+(Number(x.total_donated)||0),0);
  return fallback({ summary: `${rows.length} donor(s) with total donated ${total}`, metrics: { donorCount: rows.length, totalDonated: total, avgDonation: rows.length ? Math.round((total/rows.length)*100)/100 : 0 }, recommendations: [] });
}
function goalForecast(campaigns = []) {
  const rows = Array.isArray(campaigns) ? campaigns : [];
  const active = rows.filter((x)=>String(x.status||'').toLowerCase()==='active').length;
  return fallback({ summary: `${active} active campaign(s) of ${rows.length}`, metrics: { activeCount: active, totalCampaigns: rows.length }, recommendations: active === 0 && rows.length ? ['No active campaigns; launching one reactivates donor engagement'] : [] });
}
module.exports = { validateTask, filterRecords, toCSV, buildExport, hasProvider, fallback, campaignMomentum, donorSegmentInsight, goalForecast };
