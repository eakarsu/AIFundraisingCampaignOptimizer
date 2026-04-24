import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target, Users, Mail, Share2, FileText, CalendarDays, Heart, DollarSign,
  UserCheck, BarChart3, FlaskConical, Phone, Flag, Calendar, Sparkles, TrendingUp
} from 'lucide-react';
import { api } from '../api';

const features = [
  { path: '/campaigns', icon: Target, title: 'Campaigns', desc: 'Manage fundraising campaigns', resource: 'campaigns', color: 'from-indigo-500 to-indigo-600' },
  { path: '/donors', icon: Users, title: 'Donors', desc: 'Donor management & segmentation', resource: 'donors', color: 'from-emerald-500 to-emerald-600' },
  { path: '/emails', icon: Mail, title: 'Emails', desc: 'AI email generation', resource: 'emails', color: 'from-blue-500 to-blue-600' },
  { path: '/social', icon: Share2, title: 'Social Media', desc: 'AI social media posts', resource: 'social', color: 'from-pink-500 to-pink-600' },
  { path: '/grants', icon: FileText, title: 'Grants', desc: 'AI grant proposals', resource: 'grants', color: 'from-amber-500 to-amber-600' },
  { path: '/events', icon: CalendarDays, title: 'Events', desc: 'AI event planning', resource: 'events', color: 'from-violet-500 to-violet-600' },
  { path: '/thankyou', icon: Heart, title: 'Thank You Letters', desc: 'AI thank you letters', resource: 'thankyou', color: 'from-rose-500 to-rose-600' },
  { path: '/budget', icon: DollarSign, title: 'Budget Optimizer', desc: 'AI budget optimization', resource: 'budget', color: 'from-green-500 to-green-600' },
  { path: '/volunteers', icon: UserCheck, title: 'Volunteers', desc: 'AI volunteer matching', resource: 'volunteers', color: 'from-teal-500 to-teal-600' },
  { path: '/impact', icon: BarChart3, title: 'Impact Reports', desc: 'AI impact reports', resource: 'impact', color: 'from-cyan-500 to-cyan-600' },
  { path: '/abtesting', icon: FlaskConical, title: 'A/B Testing', desc: 'AI A/B test suggestions', resource: 'abtesting', color: 'from-orange-500 to-orange-600' },
  { path: '/outreach', icon: Phone, title: 'Donor Outreach', desc: 'AI personalized outreach', resource: 'outreach', color: 'from-lime-600 to-lime-700' },
  { path: '/goals', icon: Flag, title: 'Goal Setting', desc: 'AI goal suggestions', resource: 'goals', color: 'from-fuchsia-500 to-fuchsia-600' },
  { path: '/calendar', icon: Calendar, title: 'Content Calendar', desc: 'AI content calendar', resource: 'calendar', color: 'from-sky-500 to-sky-600' },
  { path: '/ai-center', icon: Sparkles, title: 'AI Center', desc: 'Central AI hub', resource: null, color: 'from-primary-600 to-emerald-600' },
];

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ campaigns: 0, donors: 0, raised: 0, events: 0 });
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [camps, donors, events] = await Promise.allSettled([
          api.getAll('campaigns'),
          api.getAll('donors'),
          api.getAll('events'),
        ]);
        const c = camps.status === 'fulfilled' ? (camps.value.data || camps.value || []) : [];
        const d = donors.status === 'fulfilled' ? (donors.value.data || donors.value || []) : [];
        const ev = events.status === 'fulfilled' ? (events.value.data || events.value || []) : [];
        const raised = Array.isArray(c) ? c.reduce((s, x) => s + (Number(x.raised_amount) || 0), 0) : 0;
        setStats({
          campaigns: Array.isArray(c) ? c.length : 0,
          donors: Array.isArray(d) ? d.length : 0,
          raised,
          events: Array.isArray(ev) ? ev.length : 0,
        });
      } catch {}
    };
    load();

    // Load counts for each feature
    features.forEach(async (f) => {
      if (!f.resource) return;
      try {
        const res = await api.getAll(f.resource);
        const arr = res.data || res || [];
        setCounts(p => ({ ...p, [f.resource]: Array.isArray(arr) ? arr.length : 0 }));
      } catch {
        setCounts(p => ({ ...p, [f.resource]: 0 }));
      }
    });
  }, []);

  const statCards = [
    { label: 'Campaigns', value: stats.campaigns, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Donors', value: stats.donors, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Raised', value: `$${stats.raised.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Events', value: stats.events, icon: CalendarDays, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="page-header">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'User'}</h1>
        <p className="text-primary-200 mt-1">Your AI-powered fundraising command center</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon size={24} className={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <h2 className="text-lg font-semibold text-slate-800 mb-4">AI-Powered Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => (
          <button key={f.path} onClick={() => navigate(f.path)}
                  className="card p-5 text-left hover:scale-[1.02] transition-all duration-200 group">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-sm`}>
                <f.icon size={22} className="text-white" />
              </div>
              {f.resource && counts[f.resource] !== undefined && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                  {counts[f.resource]} items
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-800 mt-3 group-hover:text-primary-600 transition-colors">{f.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{f.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
