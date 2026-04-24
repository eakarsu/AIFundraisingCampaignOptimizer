import { CalendarDays } from 'lucide-react';
import CrudPage from '../components/CrudPage';

const fields = [
  { key: 'name', label: 'Event Name', placeholder: 'Annual Gala 2026' },
  { key: 'type', label: 'Event Type', type: 'select', options: ['gala', 'auction', 'walkathon', 'concert', 'dinner', 'virtual', 'community', 'other'] },
  { key: 'date', label: 'Event Date', type: 'date' },
  { key: 'location', label: 'Location', placeholder: 'Grand Ballroom, City Center' },
  { key: 'budget', label: 'Budget ($)', type: 'number', placeholder: '25000' },
  { key: 'expected_attendees', label: 'Expected Attendees', type: 'number', placeholder: '200' },
  { key: 'goal_amount', label: 'Goal Amount ($)', type: 'number', placeholder: '100000' },
  { key: 'status', label: 'Status', type: 'select', options: ['planning', 'confirmed', 'in-progress', 'completed', 'cancelled'], default: 'planning' },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Event details...' },
];

const columns = [
  { key: 'name', label: 'Event' },
  { key: 'type', label: 'Type', render: v => <span className="capitalize">{v || '-'}</span> },
  { key: 'date', label: 'Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'goal_amount', label: 'Goal', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'status', label: 'Status', render: v => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      v === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
      v === 'completed' ? 'bg-blue-100 text-blue-700' :
      v === 'cancelled' ? 'bg-red-100 text-red-700' :
      'bg-slate-100 text-slate-600'
    }`}>{v || 'planning'}</span>
  )},
];

const aiActions = [
  { action: 'plan', label: 'AI Event Plan', global: true, getBody: () => ({ type: 'gala', budget: 25000, expected_attendees: 200 }) },
  { action: 'plan', label: 'Plan This Event', getBody: (sel) => ({ eventId: sel?._id || sel?.id, name: sel?.name, type: sel?.type, budget: sel?.budget, expected_attendees: sel?.expected_attendees }) },
  { action: 'promote', label: 'Promotion Ideas', getBody: (sel) => ({ name: sel?.name, type: sel?.type, date: sel?.date }) },
];

export default function Events() {
  return <CrudPage title="Events" resource="events" icon={CalendarDays}
                   gradient="from-violet-600 to-violet-800" fields={fields} columns={columns}
                   aiActions={aiActions} itemLabel="Event" />;
}
