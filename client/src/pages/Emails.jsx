import { Mail } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'subject', label: 'Subject', placeholder: 'Year-End Giving Campaign' },
  { key: 'target_audience', label: 'Target Audience', type: 'select', options: ['all', 'major', 'mid-level', 'small', 'recurring', 'lapsed', 'new'] },
  { key: 'campaign_name', label: 'Campaign Name', placeholder: 'Spring 2026' },
  { key: 'tone', label: 'Tone', type: 'select', options: ['professional', 'warm', 'urgent', 'grateful', 'inspiring'], default: 'professional' },
  { key: 'body', label: 'Email Body', type: 'textarea', placeholder: 'Email content or leave blank for AI generation...' },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'scheduled', 'sent'], default: 'draft' },
];

const columns = [
  { key: 'subject', label: 'Subject' },
  { key: 'target_audience', label: 'Segment' },
  { key: 'tone', label: 'Tone' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'sent' ? 'bg-emerald-100 text-emerald-700' :
      v === 'scheduled' ? 'bg-blue-100 text-blue-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'draft'}</span>
  )},
];

const aiActions = [
  { action: 'generate', label: 'Generate Email', global: true, getBody: (sel, items) => ({ campaign_name: 'Fundraiser', tone: 'professional', target_audience: 'all' }) },
  { action: 'generate', label: 'AI Write Email', getBody: (sel) => ({ subject: sel?.subject, tone: sel?.tone, target_audience: sel?.target_audience, campaign_name: sel?.campaign_name }) },
  { action: 'improve', label: 'Improve Email', getBody: (sel) => ({ emailId: sel?._id || sel?.id, body: sel?.body, subject: sel?.subject }) },
];

export default function Emails() {
  return <CrudPage title="Emails" resource="emails" icon={Mail}
                   gradient="from-blue-600 to-blue-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Email" />;
}
