import { Heart } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'donor_name', label: 'Donor Name', placeholder: 'Jane Smith' },
  { key: 'donation_amount', label: 'Donation Amount ($)', type: 'number', placeholder: '5000' },
  { key: 'campaign_name', label: 'Campaign', placeholder: 'Spring 2026' },
  { key: 'letter_text', label: 'Letter Content', type: 'textarea', placeholder: 'Thank you letter content...' },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'sent'], default: 'draft' },
];

const columns = [
  { key: 'donor_name', label: 'Donor' },
  { key: 'donation_amount', label: 'Amount', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'campaign_name', label: 'Campaign' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
    }`}>{v || 'draft'}</span>
  )},
];

const aiActions = [
  { action: 'generate', label: 'Generate Letters', global: true, getBody: () => ({ donor_name: 'Valued Donor', donation_amount: 1000 }) },
  { action: 'generate', label: 'AI Write Letter', getBody: (sel) => ({ donor_name: sel?.donor_name, donation_amount: sel?.donation_amount, campaign_name: sel?.campaign_name }) },
];

export default function ThankYou() {
  return <CrudPage title="Thank You Letters" resource="thankyou" icon={Heart}
                   gradient="from-rose-600 to-rose-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Letter" />;
}
