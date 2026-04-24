import { BarChart3 } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'title', label: 'Report Title', placeholder: 'Q1 2026 Impact Report' },
  { key: 'period', label: 'Reporting Period', type: 'select', options: ['monthly', 'quarterly', 'annual', 'custom'] },
  { key: 'campaign_name', label: 'Campaign', placeholder: 'Spring Fundraiser' },
  { key: 'metrics_summary', label: 'Metrics Summary', type: 'textarea', placeholder: 'Key metrics and achievements...' },
  { key: 'report_text', label: 'Report Text', type: 'textarea', placeholder: 'Full report content...' },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'period', label: 'Period', render: v => <span className="capitalize">{v || '-'}</span> },
  { key: 'campaign_name', label: 'Campaign' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'published' ? 'bg-emerald-100 text-emerald-700' :
      v === 'review' ? 'bg-blue-100 text-blue-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'draft'}</span>
  )},
];

const aiActions = [
  { action: 'generate', label: 'Generate Report', global: true, getBody: () => ({ period: 'quarterly', campaign_name: 'Fundraiser' }) },
  { action: 'generate', label: 'AI Write Report', getBody: (sel) => ({ title: sel?.title, period: sel?.period, campaign_name: sel?.campaign_name, metrics_summary: sel?.metrics_summary }) },
  { action: 'analyze', label: 'Analyze Impact', getBody: (sel) => ({ reportId: sel?._id || sel?.id }) },
];

export default function Impact() {
  return <CrudPage title="Impact Reports" resource="impact" icon={BarChart3}
                   gradient="from-cyan-600 to-cyan-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Report" />;
}
