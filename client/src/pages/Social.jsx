import { Share2 } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'platform', label: 'Platform', type: 'select', options: ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok'] },
  { key: 'campaign_name', label: 'Campaign Name', placeholder: 'Spring Gala 2026' },
  { key: 'content', label: 'Post Content', type: 'textarea', placeholder: 'Post content...' },
  { key: 'hashtags', label: 'Hashtags', placeholder: '#fundraising #charity' },
  { key: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'scheduled', 'published'], default: 'draft' },
];

const columns = [
  { key: 'platform', label: 'Platform', render: v => (
    <span className="capitalize font-medium">{v || '-'}</span>
  )},
  { key: 'campaign_name', label: 'Campaign' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'published' ? 'bg-emerald-100 text-emerald-700' :
      v === 'scheduled' ? 'bg-blue-100 text-blue-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'draft'}</span>
  )},
  { key: 'scheduled_date', label: 'Scheduled', render: v => v ? new Date(v).toLocaleDateString() : '-' },
];

const aiActions = [
  { action: 'generate', label: 'Generate Posts', global: true, getBody: () => ({ platform: 'twitter', campaign_name: 'fundraising campaign' }) },
  { action: 'generate', label: 'AI Write Post', getBody: (sel) => ({ platform: sel?.platform, content: sel?.content, campaign_name: sel?.campaign_name }) },
  { action: 'hashtags', label: 'Suggest Hashtags', getBody: (sel) => ({ platform: sel?.platform, content: sel?.content, campaign_name: sel?.campaign_name }) },
];

export default function Social() {
  return <CrudPage title="Social Media" resource="social" icon={Share2}
                   gradient="from-pink-600 to-pink-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Social Post" />;
}
