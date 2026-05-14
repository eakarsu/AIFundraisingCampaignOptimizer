import { useState } from 'react';
import { Sparkles, TrendingUp, FileText, Calendar, Loader2, Heart, UserCheck } from 'lucide-react';
import { api } from '../api';
import AIResponse from '../components/AIResponse';

/**
 * Frontend for the 3 new AI endpoints in server/routes/ai.js:
 *   POST /api/ai/donor-ltv         — donor lifetime value predictions
 *   POST /api/ai/grant-recommend   — grant prospect recommendations
 *   POST /api/ai/event-forecast    — event attendance/revenue forecast
 *
 * Mirrors AICenter.jsx — uses the same gradient cards, AIResponse component,
 * and `api.aiCenter()` helper which posts to `/api/ai/<agent>`.
 */

const tools = [
  {
    id: 'donor-ltv',
    name: 'Donor Lifetime Value',
    description: 'Predict 5-year donor value, recommended ask amounts, preferred channel; flag high-potential and at-risk donors.',
    icon: TrendingUp,
    gradient: 'from-violet-500 to-fuchsia-600',
    fields: [
      { key: 'horizon_years', label: 'Horizon (years)', type: 'number', defaultValue: 5 },
      { key: 'top_n', label: 'Top N donors to highlight', type: 'number', defaultValue: 20 },
      { key: 'notes', label: 'Notes (optional)', type: 'textarea', placeholder: 'Recent campaign context, segments to focus on...' },
    ],
  },
  {
    id: 'grant-recommend',
    name: 'Grant Recommendations',
    description: 'Recommends grant prospects with fit score, amount range, deadline window, and an LOI outline.',
    icon: FileText,
    gradient: 'from-amber-500 to-rose-500',
    fields: [
      { key: 'mission', label: 'Org mission', type: 'textarea', placeholder: 'One-paragraph mission statement.' },
      { key: 'focus_areas', label: 'Focus areas (comma-separated)', type: 'text', placeholder: 'e.g., literacy, after-school, STEM' },
      { key: 'budget_range', label: 'Budget range', type: 'text', placeholder: 'e.g., $50k-$250k' },
      { key: 'geo', label: 'Geography', type: 'text', placeholder: 'e.g., US Mid-Atlantic, NJ counties' },
    ],
  },
  {
    id: 'event-forecast',
    name: 'Event Forecast',
    description: 'Forecasts attendance, revenue, costs, and ROI; gives low/med/high scenarios and lever recommendations.',
    icon: Calendar,
    gradient: 'from-sky-500 to-emerald-600',
    fields: [
      { key: 'event_type', label: 'Event type', type: 'text', placeholder: 'e.g., gala, walkathon, virtual auction' },
      { key: 'capacity', label: 'Capacity / seats', type: 'number' },
      { key: 'ticket_price', label: 'Ticket price ($)', type: 'number' },
      { key: 'lead_weeks', label: 'Lead time (weeks)', type: 'number' },
      { key: 'channels', label: 'Channels (comma-separated)', type: 'text', placeholder: 'e.g., email, social, board outreach' },
    ],
  },
  {
    id: 'major-donor-cultivation',
    name: 'Major Donor Cultivation',
    description: 'Multi-touch cultivation sequence (90-180 days) for major-gift prospects.',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-600',
    fields: [
      { key: 'campaign_focus', label: 'Campaign focus', type: 'text', placeholder: 'e.g., year-end giving, capital campaign' },
      { key: 'time_horizon_months', label: 'Time horizon (months)', type: 'number', defaultValue: 6 },
      { key: 'donor_id', label: 'Specific donor ID (optional)', type: 'number' },
    ],
  },
  {
    id: 'volunteer-matching',
    name: 'Volunteer Matching',
    description: 'Skill-based volunteer assignment with fit scores, role suggestions, and outreach templates.',
    icon: UserCheck,
    gradient: 'from-emerald-500 to-teal-600',
    fields: [
      { key: 'task_description', label: 'Task description', type: 'textarea', placeholder: 'Describe the task and goals.' },
      { key: 'required_skills', label: 'Required skills (comma-separated)', type: 'text', placeholder: 'e.g., phone outreach, event setup, social media' },
      { key: 'hours_needed', label: 'Hours needed', type: 'number' },
      { key: 'deadline', label: 'Deadline', type: 'text', placeholder: 'e.g., 2026-06-01 or flexible' },
    ],
  },
];

export default function AIPredictions() {
  const [activeId, setActiveId] = useState('donor-ltv');
  const [forms, setForms] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const tool = tools.find((t) => t.id === activeId) || tools[0];

  const setField = (toolId, key, value) => {
    setForms((prev) => ({ ...prev, [toolId]: { ...(prev[toolId] || {}), [key]: value } }));
  };

  const submit = async () => {
    const formValues = forms[tool.id] || {};
    setLoading((prev) => ({ ...prev, [tool.id]: true }));
    setResults((prev) => ({ ...prev, [tool.id]: null }));

    // coerce numeric fields
    const payload = {};
    tool.fields.forEach((f) => {
      const v = formValues[f.key];
      if (v == null || v === '') return;
      if (f.type === 'number') payload[f.key] = Number(v);
      else payload[f.key] = v;
    });

    try {
      const res = await api.aiCenter(tool.id, payload);
      setResults((prev) => ({ ...prev, [tool.id]: res.result || res.data || res }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [tool.id]: { error: err.message } }));
    } finally {
      setLoading((prev) => ({ ...prev, [tool.id]: false }));
    }
  };

  const renderField = (field) => {
    const value = (forms[tool.id] || {})[field.key] ?? field.defaultValue ?? '';
    if (field.type === 'textarea') {
      return (
        <textarea
          rows={3}
          value={value}
          placeholder={field.placeholder || ''}
          onChange={(e) => setField(tool.id, field.key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      );
    }
    return (
      <input
        type={field.type || 'text'}
        value={value}
        placeholder={field.placeholder || ''}
        onChange={(e) => setField(tool.id, field.key, e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
      />
    );
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-indigo-500" />
          <h1 className="text-2xl font-bold">AI Predictions</h1>
        </div>
        <p className="text-gray-500">Donor LTV, grant prospects, and event forecasts powered by the new <code>/api/ai</code> endpoints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className="text-left"
            >
              <div
                className={`rounded-xl p-4 bg-gradient-to-br ${t.gradient} text-white transition-all duration-200 ${
                  isActive ? 'ring-2 ring-offset-2 ring-indigo-400 scale-[1.02]' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} />
                  <h3 className="font-semibold">{t.name}</h3>
                </div>
                <p className="text-white/90 text-xs leading-relaxed">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{tool.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tool.fields.map((f) => (
            <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
              {renderField(f)}
            </div>
          ))}
        </div>

        <button
          onClick={submit}
          disabled={!!loading[tool.id]}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading[tool.id] ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Running...
            </>
          ) : (
            'Run Prediction'
          )}
        </button>
      </div>

      {(results[tool.id] || loading[tool.id]) && (
        <div className="mt-6">
          {results[tool.id]?.error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {results[tool.id].error}
            </div>
          ) : (
            <AIResponse
              content={
                typeof results[tool.id] === 'string'
                  ? results[tool.id]
                  : JSON.stringify(results[tool.id], null, 2)
              }
              loading={!!loading[tool.id]}
              title={tool.name}
            />
          )}
        </div>
      )}
    </div>
  );
}
