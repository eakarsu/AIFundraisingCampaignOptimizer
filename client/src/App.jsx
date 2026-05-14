import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Target, Users, Mail, Share2, FileText,
  CalendarDays, Heart, DollarSign, UserCheck, BarChart3,
  GitBranch, MessageSquare, TrendingUp, Calendar, Sparkles,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { api, apiEvents } from './api';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Donors from './pages/Donors';
import Emails from './pages/Emails';
import Social from './pages/Social';
import Grants from './pages/Grants';
import Events from './pages/Events';
import ThankYou from './pages/ThankYou';
import Budget from './pages/Budget';
import Volunteers from './pages/Volunteers';
import Impact from './pages/Impact';
import ABTesting from './pages/ABTesting';
import Outreach from './pages/Outreach';
import Goals from './pages/Goals';
import ContentCalendar from './pages/Calendar';
import AICenter from './pages/AICenter';
import AIPredictions from './pages/AIPredictions';
import Integrations from './pages/Integrations';
import Backlog from './pages/Backlog'; // Apply pass 5
import Login from './pages/Login';

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticGrantProspectingScanningGrant from './pages/CfAgenticGrantProspectingScanningGrant';
import CfDonorEngagementScoringWithRealTime from './pages/CfDonorEngagementScoringWithRealTime';
import CfEventRoiSimulatorPredictingAttendanc from './pages/CfEventRoiSimulatorPredictingAttendanc';
import CfMultiStakeholderSurveySynthesisColle from './pages/CfMultiStakeholderSurveySynthesisColle';
import CfPeerToPeerFundraisingTeamBuilder from './pages/CfPeerToPeerFundraisingTeamBuilder';
import CfGovernmentProcurementAdvisorScanning from './pages/CfGovernmentProcurementAdvisorScanning';
import GapNoDonorLifetimeValuePredictionEndpo from './pages/GapNoDonorLifetimeValuePredictionEndpo';
import GapNoMajorDonorCultivationPlanGenerato from './pages/GapNoMajorDonorCultivationPlanGenerato';
import GapNoVolunteerSkillMatchingAiPeermatch from './pages/GapNoVolunteerSkillMatchingAiPeermatch';
import GapNoEventDemandForecasting from './pages/GapNoEventDemandForecasting';
import GapLimitedNotificationsNoDedicatedModul from './pages/GapLimitedNotificationsNoDedicatedModul';
import GapNoWebhookDispatchForDonorEvents from './pages/GapNoWebhookDispatchForDonorEvents';
import GapNoFileUploadPipelineForDonor from './pages/GapNoFileUploadPipelineForDonor';
import GapNoPaymentProcessingSurfacedBeyondSt from './pages/GapNoPaymentProcessingSurfacedBeyondSt';
import GapNoRealTimeDonorActivityFeed from './pages/GapNoRealTimeDonorActivityFeed';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { divider: true, label: 'Campaign Management' },
  { path: '/campaigns', label: 'Campaigns', icon: Target },
  { path: '/donors', label: 'Donors', icon: Users },
  { path: '/events', label: 'Events', icon: CalendarDays },
  { path: '/volunteers', label: 'Volunteers', icon: UserCheck },
  { path: '/goals', label: 'Goal Setting', icon: TrendingUp },
  { divider: true, label: 'Content & Outreach' },
  { path: '/emails', label: 'Email Generator', icon: Mail },
  { path: '/social', label: 'Social Media', icon: Share2 },
  { path: '/outreach', label: 'Donor Outreach', icon: MessageSquare },
  { path: '/thankyou', label: 'Thank You Letters', icon: Heart },
  { path: '/calendar', label: 'Content Calendar', icon: Calendar },
  { divider: true, label: 'Analytics & Optimization' },
  { path: '/grants', label: 'Grant Writer', icon: FileText },
  { path: '/budget', label: 'Budget Optimizer', icon: DollarSign },
  { path: '/impact', label: 'Impact Reports', icon: BarChart3 },
  { path: '/abtesting', label: 'A/B Testing', icon: GitBranch },
  { path: '/integrations', label: 'Integrations', icon: Sparkles },
  { path: '/backlog', label: 'Backlog Tools', icon: Sparkles }, // Apply pass 5
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe()
        .then(res => setUser(res.user || res))
        .catch(() => { localStorage.removeItem('token'); })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Global API event listeners
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    };
    const handleRateLimit = (e) => {
      setGlobalToast({ message: e.detail || 'AI rate limit reached (20/hour). Please wait before making more AI requests.', type: 'error' });
    };
    apiEvents.addEventListener('unauthorized', handleUnauthorized);
    apiEvents.addEventListener('ratelimit', handleRateLimit);
    return () => {
      apiEvents.removeEventListener('unauthorized', handleUnauthorized);
      apiEvents.removeEventListener('ratelimit', handleRateLimit);
    };
  }, [navigate]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-grant-prospecting-scanning-grant" element={<CfAgenticGrantProspectingScanningGrant />} />
          <Route path="/cf-donor-engagement-scoring-with-real-time" element={<CfDonorEngagementScoringWithRealTime />} />
          <Route path="/cf-event-roi-simulator-predicting-attendanc" element={<CfEventRoiSimulatorPredictingAttendanc />} />
          <Route path="/cf-multi-stakeholder-survey-synthesis-colle" element={<CfMultiStakeholderSurveySynthesisColle />} />
          <Route path="/cf-peer-to-peer-fundraising-team-builder" element={<CfPeerToPeerFundraisingTeamBuilder />} />
          <Route path="/cf-government-procurement-advisor-scanning-" element={<CfGovernmentProcurementAdvisorScanning />} />
          <Route path="/gap-no-donor-lifetime-value-prediction-endpo" element={<GapNoDonorLifetimeValuePredictionEndpo />} />
          <Route path="/gap-no-major-donor-cultivation-plan-generato" element={<GapNoMajorDonorCultivationPlanGenerato />} />
          <Route path="/gap-no-volunteer-skill-matching-ai-peermatch" element={<GapNoVolunteerSkillMatchingAiPeermatch />} />
          <Route path="/gap-no-event-demand-forecasting" element={<GapNoEventDemandForecasting />} />
          <Route path="/gap-limited-notifications-no-dedicated-modul" element={<GapLimitedNotificationsNoDedicatedModul />} />
          <Route path="/gap-no-webhook-dispatch-for-donor-events" element={<GapNoWebhookDispatchForDonorEvents />} />
          <Route path="/gap-no-file-upload-pipeline-for-donor" element={<GapNoFileUploadPipelineForDonor />} />
          <Route path="/gap-no-payment-processing-surfaced-beyond-st" element={<GapNoPaymentProcessingSurfacedBeyondSt />} />
          <Route path="/gap-no-real-time-donor-activity-feed" element={<GapNoRealTimeDonorActivityFeed />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {globalToast && <Toast {...globalToast} onClose={() => setGlobalToast(null)} />}
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        text-white flex flex-col transition-all duration-300 overflow-hidden
      `}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="font-bold text-sm leading-tight truncate">AI Fundraising</h1>
              <p className="text-xs text-slate-400 truncate">Campaign Optimizer</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto hidden lg:block text-slate-400 hover:text-white">
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {navItems.map((item, i) => {
            if (item.divider) {
              return sidebarOpen ? (
                <p key={i} className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
              ) : <div key={i} className="my-2 mx-3 border-t border-white/10" />;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600/30 text-indigo-300 font-medium shadow-lg shadow-indigo-500/10'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}

          {/* AI Center - special styling */}
          {sidebarOpen ? (
            <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              AI Features
            </p>
          ) : <div className="my-2 mx-3 border-t border-white/10" />}
          <NavLink
            to="/ai-center"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/40 to-emerald-600/40 text-emerald-300 font-medium'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`
            }
          >
            <div className="w-5 h-5 flex-shrink-0 relative">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            {sidebarOpen && <span className="truncate">AI Center</span>}
            {sidebarOpen && (
              <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                5 Agents
              </span>
            )}
          </NavLink>
          <NavLink
            to="/ai-predictions"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/40 to-emerald-600/40 text-emerald-300 font-medium'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`
            }
          >
            <div className="w-5 h-5 flex-shrink-0 relative">
              <TrendingUp className="w-5 h-5" />
            </div>
            {sidebarOpen && <span className="truncate">AI Predictions</span>}
          </NavLink>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-300">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            {sidebarOpen && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 bg-white border-b border-slate-200">
          <button onClick={() => setMobileOpen(true)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-slate-800">AI Fundraising Optimizer</h1>
        </div>

        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/donors" element={<Donors />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/social" element={<Social />} />
            <Route path="/grants" element={<Grants />} />
            <Route path="/events" element={<Events />} />
            <Route path="/thankyou" element={<ThankYou />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/volunteers" element={<Volunteers />} />
            <Route path="/impact" element={<Impact />} />
            <Route path="/abtesting" element={<ABTesting />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/calendar" element={<ContentCalendar />} />
            <Route path="/ai-center" element={<AICenter />} />
            <Route path="/ai-predictions" element={<AIPredictions />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/backlog" element={<Backlog />} />{/* Apply pass 5 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
