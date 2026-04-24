import { Flag } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'campaign_name', label: 'Campaign Name', placeholder: 'Spring 2026' },
  { key: 'target_amount', label: 'Target Amount', type: 'number', placeholder: '50000' },
  { key: 'suggested_amount', label: 'Suggested Amount', type: 'number', default: 0 },
  { key: 'rationale', label: 'Rationale', type: 'textarea', placeholder: 'Why this goal...' },
  { key: 'timeline', label: 'Timeline', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['not-started', 'in-progress', 'on-track', 'at-risk', 'completed'], default: 'not-started' },
];

const columns = [
  { key: 'campaign_name', label: 'Campaign' },
  { key: 'target_amount', label: 'Target', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'suggested_amount', label: 'Suggested', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'completed' ? 'bg-emerald-100 text-emerald-700' :
      v === 'on-track' ? 'bg-blue-100 text-blue-700' :
      v === 'at-risk' ? 'bg-red-100 text-red-700' :
      v === 'in-progress' ? 'bg-amber-100 text-amber-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v?.replace('-', ' ') || 'not started'}</span>
  )},
  { key: 'timeline', label: 'Timeline', render: v => v ? new Date(v).toLocaleDateString() : '-' },
];

const aiActions = [
  { action: 'suggest', label: 'AI Goal Suggestions', global: true, getBody: () => ({ campaign_name: 'nonprofit fundraising' }) },
  { action: 'suggest', label: 'Suggest Milestones', getBody: (sel) => ({ goalId: sel?._id || sel?.id, campaign_name: sel?.campaign_name, target_amount: sel?.target_amount, suggested_amount: sel?.suggested_amount, timeline: sel?.timeline }) },
  { action: 'assess', label: 'Assess Progress', getBody: (sel) => ({ campaign_name: sel?.campaign_name, target_amount: sel?.target_amount, suggested_amount: sel?.suggested_amount, timeline: sel?.timeline }) },
];

export default function Goals() {
  return <CrudPage title="Goal Setting" resource="goals" icon={Flag}
                   gradient="from-fuchsia-600 to-fuchsia-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Goal" />;
}
