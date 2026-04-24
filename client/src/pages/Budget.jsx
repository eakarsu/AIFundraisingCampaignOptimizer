import { DollarSign } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'campaign_name', label: 'Campaign Name', placeholder: 'Q2 2026 Campaign' },
  { key: 'category', label: 'Category', type: 'select', options: ['marketing', 'events', 'operations', 'staffing', 'technology', 'general'] },
  { key: 'allocated_amount', label: 'Allocated ($)', type: 'number', default: 0 },
  { key: 'spent_amount', label: 'Spent ($)', type: 'number', default: 0 },
  { key: 'roi_estimate', label: 'ROI Estimate', placeholder: 'Expected ROI...' },
  { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Budget notes...' },
];

const columns = [
  { key: 'campaign_name', label: 'Campaign' },
  { key: 'category', label: 'Category', render: v => <span className="capitalize">{v || '-'}</span> },
  { key: 'allocated_amount', label: 'Allocated', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'spent_amount', label: 'Spent', render: v => v ? `$${Number(v).toLocaleString()}` : '$0' },
  { key: 'roi_estimate', label: 'ROI Estimate' },
];

const aiActions = [
  { action: 'optimize', label: 'AI Optimize Budget', global: true, getBody: (_, items) => ({ budgets: items?.slice(0, 10) }) },
  { action: 'optimize', label: 'Optimize This Budget', getBody: (sel) => ({ budgetId: sel?._id || sel?.id, campaign_name: sel?.campaign_name, category: sel?.category, allocated_amount: sel?.allocated_amount, spent_amount: sel?.spent_amount }) },
  { action: 'recommend', label: 'Get Recommendations', getBody: (sel) => ({ allocated_amount: sel?.allocated_amount, category: sel?.category }) },
];

export default function Budget() {
  return <CrudPage title="Budget Optimizer" resource="budget" icon={DollarSign}
                   gradient="from-green-600 to-green-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Budget" />;
}
