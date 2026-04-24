import { Phone } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'donor_name', label: 'Donor Name', placeholder: 'Jane Smith' },
  { key: 'channel', label: 'Channel', type: 'select', options: ['email', 'phone', 'social-media', 'direct-mail', 'in-person'], default: 'email' },
  { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Outreach message...' },
  { key: 'campaign_name', label: 'Campaign', placeholder: 'Spring 2026' },
  { key: 'sent_date', label: 'Sent Date', type: 'date' },
  { key: 'response', label: 'Response', type: 'textarea', placeholder: 'Donor response...' },
  { key: 'status', label: 'Status', type: 'select', options: ['planned', 'sent', 'responded', 'converted'], default: 'planned' },
];

const columns = [
  { key: 'donor_name', label: 'Donor' },
  { key: 'channel', label: 'Channel', render: v => <span className="capitalize">{v?.replace('-', ' ') || '-'}</span> },
  { key: 'campaign_name', label: 'Campaign' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'converted' ? 'bg-emerald-100 text-emerald-700' :
      v === 'responded' ? 'bg-blue-100 text-blue-700' :
      v === 'sent' ? 'bg-amber-100 text-amber-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'planned'}</span>
  )},
  { key: 'sent_date', label: 'Sent Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
];

const aiActions = [
  { action: 'personalize', label: 'AI Personalize', global: true, getBody: () => ({ channel: 'email', campaign_name: 'cultivation' }) },
  { action: 'personalize', label: 'Personalize Outreach', getBody: (sel) => ({ donor_name: sel?.donor_name, channel: sel?.channel, campaign_name: sel?.campaign_name, message: sel?.message }) },
  { action: 'sequence', label: 'Create Sequence', getBody: (sel) => ({ donor_name: sel?.donor_name, channel: sel?.channel, campaign_name: sel?.campaign_name }) },
];

export default function Outreach() {
  return <CrudPage title="Donor Outreach" resource="outreach" icon={Phone}
                   gradient="from-lime-700 to-lime-900" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Outreach" />;
}
