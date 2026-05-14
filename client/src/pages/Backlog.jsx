import { useEffect, useState } from 'react';
import { api } from '../api';

/**
 * Apply pass 5 (FE) — surfaces the backlog endpoints added in Apply pass 5:
 *   - /api/crm           (PRODUCT-DECISION)
 *   - /api/board         (PRODUCT-DECISION)
 *   - /api/donor-scoring (custom feature, deterministic)
 *   - /api/peer-matching (custom feature, greedy match)
 *   - /api/agentic       (custom feature, in-process loop over /api/ai/grant-recommend)
 *
 * JWT bearer is auto-injected by api.js (token from localStorage).
 */

const TABS = [
  { id: 'crm', label: 'CRM' },
  { id: 'board', label: 'Board' },
  { id: 'donor-scoring', label: 'Donor Scoring' },
  { id: 'peer-matching', label: 'Peer Matching' },
  { id: 'agentic', label: 'Agentic Grants' },
];

function Result({ value }) {
  if (!value) return null;
  return (
    <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function Backlog() {
  const [tab, setTab] = useState('crm');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Inline forms
  const [crmDonor, setCrmDonor] = useState('1');
  const [crmText, setCrmText] = useState('Called donor to thank them.');
  const [boardName, setBoardName] = useState('Jane Director');
  const [boardRole, setBoardRole] = useState('chair');
  const [scoreDonor, setScoreDonor] = useState('1');
  const [agenticQuery, setAgenticQuery] = useState('arts education for under-served youth');

  const refresh = async () => {
    setBusy(true);
    setError('');
    setData(null);
    try {
      if (tab === 'crm') setData(await api.getAll('crm'));
      else if (tab === 'board') {
        const m = await api.getAll('board/members');
        const c = await api.getAll('board/committees');
        setData({ members: m, committees: c });
      } else if (tab === 'donor-scoring') setData({ note: 'POST /api/donor-scoring/score with { donor_id }' });
      else if (tab === 'peer-matching') setData({ note: 'POST /api/peer-matching/match' });
      else if (tab === 'agentic') {
        const runs = await api.getAll('agentic/grant-prospector/runs').catch(() => null);
        setData({ runs, hint: 'POST /api/agentic/grant-prospector to run' });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [tab]);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (tab === 'crm') {
        const created = await api.create('crm', {
          donor_id: Number(crmDonor) || null,
          channel: 'phone',
          notes: crmText,
        });
        setData(created);
      } else if (tab === 'board') {
        const created = await api.create('board/members', { name: boardName, role: boardRole });
        setData(created);
      } else if (tab === 'donor-scoring') {
        const r = await fetch('/api/donor-scoring/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
          body: JSON.stringify({ donor_id: Number(scoreDonor) || 1 }),
        }).then((x) => x.json());
        setData(r);
      } else if (tab === 'peer-matching') {
        const r = await fetch('/api/peer-matching/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
          body: JSON.stringify({ top: 5 }),
        }).then((x) => x.json());
        setData(r);
      } else if (tab === 'agentic') {
        const r = await fetch('/api/agentic/grant-prospector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
          body: JSON.stringify({ mission: agenticQuery }),
        }).then((x) => x.json());
        setData(r);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Backlog Tools</h1>
      <p style={{ color: '#64748b' }}>
        Apply pass 5 backlog: CRM communications, board management, donor engagement scoring,
        peer-to-peer matching, agentic grant prospector. JWT auto-injected.
      </p>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: tab === t.id ? '#0f172a' : 'white',
              color: tab === t.id ? 'white' : '#0f172a',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12 }}>
        {tab === 'crm' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Donor ID</div>
              <input value={crmDonor} onChange={(e) => setCrmDonor(e.target.value)} style={{ padding: 6, border: '1px solid #cbd5e1', borderRadius: 6, width: 80 }} />
            </label>
            <label style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Note</div>
              <input value={crmText} onChange={(e) => setCrmText(e.target.value)} style={{ width: '100%', padding: 6, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            </label>
            <button onClick={submit} disabled={busy} style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 0, borderRadius: 6 }}>Log</button>
          </div>
        )}
        {tab === 'board' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Name</div>
              <input value={boardName} onChange={(e) => setBoardName(e.target.value)} style={{ padding: 6, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Role</div>
              <select value={boardRole} onChange={(e) => setBoardRole(e.target.value)} style={{ padding: 6, border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <option value="chair">chair</option>
                <option value="vice-chair">vice-chair</option>
                <option value="treasurer">treasurer</option>
                <option value="secretary">secretary</option>
                <option value="member">member</option>
              </select>
            </label>
            <button onClick={submit} disabled={busy} style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 0, borderRadius: 6 }}>Add Member</button>
          </div>
        )}
        {tab === 'donor-scoring' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <label>
              <div style={{ fontSize: 12, color: '#64748b' }}>Donor ID</div>
              <input value={scoreDonor} onChange={(e) => setScoreDonor(e.target.value)} style={{ padding: 6, border: '1px solid #cbd5e1', borderRadius: 6, width: 100 }} />
            </label>
            <button onClick={submit} disabled={busy} style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 0, borderRadius: 6 }}>Score</button>
          </div>
        )}
        {tab === 'peer-matching' && (
          <button onClick={submit} disabled={busy} style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 0, borderRadius: 6 }}>Run Match</button>
        )}
        {tab === 'agentic' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <label style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Mission focus</div>
              <input value={agenticQuery} onChange={(e) => setAgenticQuery(e.target.value)} style={{ width: '100%', padding: 6, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            </label>
            <button onClick={submit} disabled={busy} style={{ padding: '8px 14px', background: '#7c3aed', color: 'white', border: 0, borderRadius: 6 }}>Run Loop</button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8, marginBottom: 12 }}>
          Error: {error}
        </div>
      )}

      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Result / list</div>
      <Result value={data} />
    </div>
  );
}
