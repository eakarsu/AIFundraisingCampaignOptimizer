import { useState } from 'react';
import { Target, Users, Info } from 'lucide-react';
import CrudPage from '../components/CrudPage';
import CampaignDonorsTab from '../components/CampaignDonorsTab';

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

function CampaignDetail(selected) {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Info size={14} /> Details
        </button>
        <button
          onClick={() => setActiveTab('donors')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'donors'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={14} /> Donors
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{f.label}</label>
              <p className="mt-1 text-slate-800 whitespace-pre-wrap">
                {selected[f.key] !== undefined && selected[f.key] !== null ? String(selected[f.key]) : '-'}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'donors' && <CampaignDonorsTab campaign={selected} />}
    </div>
  );
}

export default function Campaigns() {
  return <CrudPage title="Campaigns" resource="campaigns" icon={Target}
                   gradient="from-indigo-600 to-indigo-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Campaign"
                   renderDetail={(sel) => <CampaignDetail {...sel} id={sel.id} />} />;
}
