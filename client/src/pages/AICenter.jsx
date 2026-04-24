import { useState } from 'react';
import { Sparkles, Target, PenTool, BarChart3, Users, TrendingUp, Send, Loader2, Copy, Check } from 'lucide-react';
import { api } from '../api';
import AIResponse from '../components/AIResponse';

const agents = [
  {
    id: 'strategist',
    name: 'Campaign Strategist',
    description: 'Get AI-powered campaign strategies, fundraising plans, and tactical recommendations for your nonprofit.',
    icon: Target,
    gradient: 'from-indigo-500 to-blue-600',
    placeholder: 'e.g., "Create a strategy for a year-end giving campaign targeting millennials with a $100K goal"',
    examples: [
      'Plan a peer-to-peer fundraising campaign',
      'Strategy for major donor cultivation',
      'Year-end giving campaign playbook',
    ],
  },
  {
    id: 'copywriter',
    name: 'AI Copywriter',
    description: 'Generate compelling fundraising copy for emails, social media, landing pages, and marketing materials.',
    icon: PenTool,
    gradient: 'from-emerald-500 to-teal-600',
    placeholder: 'e.g., "Write an emotional appeal email for clean water initiative"',
    examples: [
      'Donation page headline and subtext',
      'Monthly giving program pitch',
      'Crisis appeal social media posts',
    ],
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    description: 'Analyze fundraising data, identify trends, and get actionable insights to improve campaign performance.',
    icon: BarChart3,
    gradient: 'from-amber-500 to-orange-600',
    placeholder: 'e.g., "Analyze why Q3 donations dropped 15% and suggest recovery strategies"',
    examples: [
      'Benchmark our donor retention rate',
      'Analyze seasonal giving patterns',
      'ROI analysis of email vs social campaigns',
    ],
  },
  {
    id: 'profiler',
    name: 'Donor Profiler',
    description: 'Build detailed donor profiles, predict giving capacity, and identify major gift prospects.',
    icon: Users,
    gradient: 'from-purple-500 to-pink-600',
    placeholder: 'e.g., "Profile a donor who gives $500 annually for 3 years and attended 2 galas"',
    examples: [
      'Identify major gift prospect indicators',
      'Create donor persona for tech professionals',
      'Predict upgrade potential for mid-level donors',
    ],
  },
  {
    id: 'forecaster',
    name: 'Trend Forecaster',
    description: 'Forecast fundraising trends, predict future giving patterns, and plan for upcoming opportunities.',
    icon: TrendingUp,
    gradient: 'from-rose-500 to-red-600',
    placeholder: 'e.g., "Forecast giving trends for education nonprofits in 2026"',
    examples: [
      'Predict impact of economic downturn on giving',
      'Emerging fundraising channels for 2026',
      'Forecast monthly recurring giving growth',
    ],
  },
];

export default function AICenter() {
  const [activeAgent, setActiveAgent] = useState(null);
  const [prompts, setPrompts] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [copied, setCopied] = useState({});

  const handleSubmit = async (agentId) => {
    const prompt = prompts[agentId];
    if (!prompt?.trim()) return;

    setLoading(prev => ({ ...prev, [agentId]: true }));
    setResults(prev => ({ ...prev, [agentId]: null }));

    try {
      const res = await api.aiCenter(agentId, { prompt });
      setResults(prev => ({ ...prev, [agentId]: res.result || res.data || res }));
    } catch (err) {
      setResults(prev => ({ ...prev, [agentId]: { error: err.message } }));
    } finally {
      setLoading(prev => ({ ...prev, [agentId]: false }));
    }
  };

  const handleCopy = (agentId) => {
    const result = results[agentId];
    if (!result) return;
    const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [agentId]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [agentId]: false })), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">AI Center</h1>
            <p className="text-slate-500 text-sm">5 specialized AI agents to supercharge your fundraising</p>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {agents.map(agent => {
          const Icon = agent.icon;
          const isActive = activeAgent === agent.id;
          const isLoading = loading[agent.id];
          const result = results[agent.id];

          return (
            <div
              key={agent.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isActive
                  ? 'border-indigo-200 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-100'
                  : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
              }`}
            >
              {/* Agent Header */}
              <div
                className={`bg-gradient-to-r ${agent.gradient} p-5 cursor-pointer`}
                onClick={() => setActiveAgent(isActive ? null : agent.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg">{agent.name}</h3>
                    <p className="text-white/80 text-sm">{agent.description}</p>
                  </div>
                </div>
              </div>

              {/* Agent Body */}
              <div className="bg-white p-5">
                {/* Quick examples */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrompts(prev => ({ ...prev, [agent.id]: ex }));
                        setActiveAgent(agent.id);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <textarea
                    value={prompts[agent.id] || ''}
                    onChange={e => setPrompts(prev => ({ ...prev, [agent.id]: e.target.value }))}
                    onFocus={() => setActiveAgent(agent.id)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(agent.id); } }}
                    placeholder={agent.placeholder}
                    rows={2}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
                  />
                  <button
                    onClick={() => handleSubmit(agent.id)}
                    disabled={isLoading || !prompts[agent.id]?.trim()}
                    className={`px-4 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${agent.gradient} hover:shadow-lg active:scale-95`}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>

                {/* Result */}
                {isLoading && (
                  <div className="mt-4 flex items-center gap-3 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                )}

                {result && !isLoading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Response</span>
                      <button
                        onClick={() => handleCopy(agent.id)}
                        className="text-xs flex items-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {copied[agent.id] ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied[agent.id] ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    {result.error ? (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                        {result.error}
                      </div>
                    ) : (
                      <AIResponse content={result} />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
