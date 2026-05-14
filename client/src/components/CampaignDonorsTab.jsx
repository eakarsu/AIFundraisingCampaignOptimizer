import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, DollarSign } from 'lucide-react';
import { api } from '../api';

export default function CampaignDonorsTab({ campaign }) {
  const [donors, setDonors] = useState([]);
  const [allDonors, setAllDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [amount, setAmount] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  const loadDonors = async () => {
    setLoading(true);
    try {
      const res = await api.getCampaignDonors(campaign.id);
      setDonors(Array.isArray(res) ? res : res.data || []);
    } catch {
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllDonors = async () => {
    try {
      const res = await api.getAll('donors', { limit: 100 });
      const arr = res.data || res || [];
      setAllDonors(Array.isArray(arr) ? arr : []);
    } catch {
      setAllDonors([]);
    }
  };

  useEffect(() => {
    loadDonors();
    loadAllDonors();
  }, [campaign.id]);

  const handleLink = async () => {
    if (!selectedDonorId) return;
    setLinking(true);
    setError('');
    try {
      await api.linkDonorToCampaign(campaign.id, {
        donor_id: parseInt(selectedDonorId),
        amount: amount ? parseFloat(amount) : null,
      });
      setSelectedDonorId('');
      setAmount('');
      setShowAdd(false);
      await loadDonors();
    } catch (err) {
      setError(err.message);
    } finally {
      setLinking(false);
    }
  };

  const linkedIds = new Set(donors.map(d => d.id));
  const availableDonors = allDonors.filter(d => !linkedIds.has(d.id));

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Users size={16} className="text-indigo-500" />
          Linked Donors ({donors.length})
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-xs btn-primary py-1.5"
        >
          <Plus size={13} /> Add Donor
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Select Donor</label>
            <select
              value={selectedDonorId}
              onChange={e => setSelectedDonorId(e.target.value)}
              className="input-field text-sm py-1.5"
            >
              <option value="">Choose a donor...</option>
              {availableDonors.map(d => (
                <option key={d.id} value={d.id}>{d.name} {d.email ? `(${d.email})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-slate-600 mb-1">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Optional"
              className="input-field text-sm py-1.5"
            />
          </div>
          <button
            onClick={handleLink}
            disabled={!selectedDonorId || linking}
            className="btn-primary text-xs py-1.5 flex items-center gap-1"
          >
            {linking ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Link
          </button>
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={22} className="animate-spin text-indigo-400" />
        </div>
      ) : donors.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No donors linked to this campaign yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {donors.map((d, i) => (
                <tr key={d.id || i} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{d.name}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-500">{d.email || '-'}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {d.campaign_amount ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <DollarSign size={13} />{Number(d.campaign_amount).toLocaleString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-500">
                    {d.donated_at ? new Date(d.donated_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
