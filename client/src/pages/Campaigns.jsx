import { Target } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'name', label: 'Campaign Name', placeholder: 'Spring Fundraiser 2026' },
  { key: 'goal_amount', label: 'Goal ($)', type: 'number', placeholder: '50000' },
  { key: 'raised_amount', label: 'Amount Raised ($)', type: 'number', default: 0 },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'end_date', label: 'End Date', type: 'date' },
  { key: 'category', label: 'Category', placeholder: 'Education' },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Campaign description...' },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'goal_amount', label: 'Goal', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'raised_amount', label: 'Raised', render: v => v ? `$${Number(v).toLocaleString()}` : '$0' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'active' ? 'bg-emerald-100 text-emerald-700' :
      v === 'completed' ? 'bg-blue-100 text-blue-700' :
      v === 'paused' ? 'bg-amber-100 text-amber-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'draft'}</span>
  )},
  { key: 'end_date', label: 'End Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
];

const aiActions = [
  { action: 'strategy', label: 'Generate Strategy', global: true, getBody: (sel, items) => ({ campaignId: sel?._id || sel?.id, campaigns: items?.slice(0, 5) }) },
  { action: 'optimize', label: 'Optimize Campaign', getBody: (sel) => ({ campaignId: sel?._id || sel?.id, name: sel?.name, goal: sel?.goal, raised: sel?.raised }) },
];

export default function Campaigns() {
  return <CrudPage title="Campaigns" resource="campaigns" icon={Target}
                   gradient="from-indigo-600 to-indigo-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Campaign" />;
}
