import { UserCheck } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'name', label: 'Name', placeholder: 'John Doe' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
  { key: 'phone', label: 'Phone', placeholder: '(555) 123-4567' },
  { key: 'skills', label: 'Skills', placeholder: 'event planning, social media, design' },
  { key: 'availability', label: 'Availability', type: 'select', options: ['full-time', 'part-time', 'weekends', 'evenings', 'flexible'] },
  { key: 'assigned_task', label: 'Assigned Task', placeholder: 'Task description...' },
  { key: 'hours_contributed', label: 'Hours Contributed', type: 'number', default: 0 },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'pending'], default: 'pending' },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'skills', label: 'Skills' },
  { key: 'availability', label: 'Availability', render: v => <span className="capitalize">{v || '-'}</span> },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'active' ? 'bg-emerald-100 text-emerald-700' :
      v === 'inactive' ? 'bg-red-100 text-red-700' :
      'bg-amber-100 text-amber-700'
    }`}>{v || 'pending'}</span>
  )},
];

const aiActions = [
  { action: 'match', label: 'AI Match Volunteers', global: true, getBody: (_, items) => ({ volunteers: items?.slice(0, 20) }) },
  { action: 'match', label: 'Find Best Match', getBody: (sel) => ({ volunteerId: sel?._id || sel?.id, name: sel?.name, skills: sel?.skills, assigned_task: sel?.assigned_task, availability: sel?.availability }) },
  { action: 'engage', label: 'Engagement Ideas', getBody: (sel) => ({ name: sel?.name, skills: sel?.skills }) },
];

export default function Volunteers() {
  return <CrudPage title="Volunteers" resource="volunteers" icon={UserCheck}
                   gradient="from-teal-600 to-teal-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Volunteer" />;
}
