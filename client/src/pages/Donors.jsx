import { Users } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'name', label: 'Full Name', placeholder: 'Jane Smith' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com' },
  { key: 'phone', label: 'Phone', placeholder: '(555) 123-4567' },
  { key: 'total_donated', label: 'Total Donated ($)', type: 'number', default: 0 },
  { key: 'donation_count', label: 'Donation Count', type: 'number', default: 0 },
  { key: 'segment', label: 'Segment', type: 'select', options: ['major', 'mid-level', 'small', 'recurring', 'lapsed', 'new'] },
  { key: 'last_donation_date', label: 'Last Donation Date', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'total_donated', label: 'Total Donated', render: v => v ? `$${Number(v).toLocaleString()}` : '$0' },
  { key: 'segment', label: 'Segment', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'major' ? 'bg-purple-100 text-purple-700' :
      v === 'recurring' ? 'bg-emerald-100 text-emerald-700' :
      v === 'lapsed' ? 'bg-red-100 text-red-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'new'}</span>
  )},
];

const aiActions = [
  { action: 'segment', label: 'AI Segmentation', global: true, getBody: (_, items) => ({ donors: items?.slice(0, 20) }) },
  { action: 'profile', label: 'Profile Donor', getBody: (sel) => ({ donorId: sel?._id || sel?.id, name: sel?.name, total_donated: sel?.total_donated, segment: sel?.segment }) },
];

export default function Donors() {
  return <CrudPage title="Donors" resource="donors" icon={Users}
                   gradient="from-emerald-600 to-emerald-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Donor" />;
}
