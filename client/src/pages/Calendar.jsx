import { Calendar as CalendarIcon } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'title', label: 'Content Title', placeholder: 'Blog: Year in Review' },
  { key: 'content_type', label: 'Content Type', type: 'select', options: ['blog-post', 'social-media', 'email', 'newsletter', 'press-release', 'video', 'infographic'] },
  { key: 'channel', label: 'Channel', type: 'select', options: ['website', 'facebook', 'twitter', 'instagram', 'linkedin', 'email', 'youtube'] },
  { key: 'campaign_name', label: 'Campaign', placeholder: 'Spring 2026' },
  { key: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
  { key: 'content_text', label: 'Content', type: 'textarea', placeholder: 'Content or notes...' },
  { key: 'status', label: 'Status', type: 'select', options: ['idea', 'drafting', 'review', 'scheduled', 'published'], default: 'idea' },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'content_type', label: 'Type', render: v => <span className="capitalize">{v?.replace('-', ' ') || '-'}</span> },
  { key: 'channel', label: 'Channel', render: v => <span className="capitalize">{v || '-'}</span> },
  { key: 'scheduled_date', label: 'Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'published' ? 'bg-emerald-100 text-emerald-700' :
      v === 'scheduled' ? 'bg-blue-100 text-blue-700' :
      v === 'review' ? 'bg-amber-100 text-amber-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'idea'}</span>
  )},
];

const aiActions = [
  { action: 'generate', label: 'AI Content Calendar', global: true, getBody: () => ({ period: 'month', channels: ['social-media', 'email', 'blog'] }) },
  { action: 'generate', label: 'Generate Content', getBody: (sel) => ({ title: sel?.title, content_type: sel?.content_type, channel: sel?.channel, campaign_name: sel?.campaign_name }) },
  { action: 'optimize', label: 'Optimize Timing', getBody: (sel) => ({ title: sel?.title, channel: sel?.channel, content_type: sel?.content_type }) },
];

export default function Calendar() {
  return <CrudPage title="Content Calendar" resource="calendar" icon={CalendarIcon}
                   gradient="from-sky-600 to-sky-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Content" />;
}
