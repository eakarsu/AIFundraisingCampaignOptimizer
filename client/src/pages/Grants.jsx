import { FileText } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'title', label: 'Grant Title', placeholder: 'Community Impact Grant 2026' },
  { key: 'funder', label: 'Funder / Foundation', placeholder: 'Gates Foundation' },
  { key: 'amount_requested', label: 'Amount Requested ($)', type: 'number', placeholder: '100000' },
  { key: 'deadline', label: 'Deadline', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['researching', 'writing', 'submitted', 'approved', 'rejected'], default: 'researching' },
  { key: 'proposal_text', label: 'Proposal Content', type: 'textarea', placeholder: 'Full proposal text...' },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'funder', label: 'Funder' },
  { key: 'amount_requested', label: 'Amount', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'approved' ? 'bg-emerald-100 text-emerald-700' :
      v === 'submitted' ? 'bg-blue-100 text-blue-700' :
      v === 'rejected' ? 'bg-red-100 text-red-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'researching'}</span>
  )},
  { key: 'deadline', label: 'Deadline', render: v => v ? new Date(v).toLocaleDateString() : '-' },
];

const aiActions = [
  { action: 'generate', label: 'Generate Proposal', global: true, getBody: () => ({ title: 'Grant Proposal', funder: 'Foundation' }) },
  { action: 'generate', label: 'AI Write Proposal', getBody: (sel) => ({ grantId: sel?._id || sel?.id, title: sel?.title, funder: sel?.funder, amount_requested: sel?.amount_requested }) },
  { action: 'review', label: 'Review Proposal', getBody: (sel) => ({ proposal_text: sel?.proposal_text, funder: sel?.funder }) },
];

export default function Grants() {
  return <CrudPage title="Grants" resource="grants" icon={FileText}
                   gradient="from-amber-600 to-amber-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Grant" />;
}
