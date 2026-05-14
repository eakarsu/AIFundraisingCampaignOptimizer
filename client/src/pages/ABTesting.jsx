import { FlaskConical } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'campaign_name', label: 'Campaign Name', placeholder: 'Spring 2026' },
  { key: 'element_tested', label: 'Element Tested', type: 'select', options: ['email', 'landing-page', 'donation-form', 'social-post', 'cta-button'] },
  { key: 'variant_a', label: 'Variant A', type: 'textarea', placeholder: 'Control version...' },
  { key: 'variant_b', label: 'Variant B', type: 'textarea', placeholder: 'Test version...' },
  { key: 'winner', label: 'Winner', type: 'select', options: ['variant_a', 'variant_b', 'inconclusive', ''], default: '' },
  { key: 'improvement_pct', label: 'Improvement %', type: 'number', placeholder: '15' },
  { key: 'status', label: 'Status', type: 'select', options: ['planned', 'running', 'completed', 'cancelled'], default: 'planned' },
];

const columns = [
  { key: 'campaign_name', label: 'Campaign' },
  { key: 'element_tested', label: 'Element', render: v => <span className="capitalize">{v?.replace('-', ' ') || '-'}</span> },
  { key: 'winner', label: 'Winner', render: v => <span className="capitalize">{v?.replace('_', ' ') || '-'}</span> },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'running' ? 'bg-emerald-100 text-emerald-700' :
      v === 'completed' ? 'bg-blue-100 text-blue-700' :
      v === 'cancelled' ? 'bg-red-100 text-red-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'planned'}</span>
  )},
  { key: 'auto_rolled_out', label: 'Auto-Rollout', render: (v) =>
    v ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Auto-rolled out
      </span>
    ) : null
  },
];

const aiActions = [
  { action: 'suggest', label: 'AI Test Ideas', global: true, getBody: () => ({ element_tested: 'email', campaign_name: 'fundraising campaign' }) },
  { action: 'suggest', label: 'Suggest Variants', getBody: (sel) => ({ testId: sel?._id || sel?.id, campaign_name: sel?.campaign_name, element_tested: sel?.element_tested, variant_a: sel?.variant_a }) },
  { action: 'analyze', label: 'Analyze Results', getBody: (sel) => ({ testId: sel?._id || sel?.id, variant_a: sel?.variant_a, variant_b: sel?.variant_b, improvement_pct: sel?.improvement_pct }) },
];

export default function ABTesting() {
  return <CrudPage title="A/B Testing" resource="abtesting" icon={FlaskConical}
                   gradient="from-orange-600 to-orange-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="A/B Test" />;
}
