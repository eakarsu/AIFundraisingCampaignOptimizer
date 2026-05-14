import { useState } from 'react';
import { api } from '../api';

// Apply-pass-5 backlog page: exercises new BE endpoints.
//   - Stripe / SendGrid / Mailchimp / grants.gov / Candid / SAM.gov stubs
//   - Donor scoring (deterministic)
//   - Peer matching (volunteer<->donor interest overlap)
//   - Agentic grant prospector (3-stage AI chain)
//   - CRM communications log
//   - Board / committees
async function call(method, path, body) {
  try {
    const init = { method };
    if (body) init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) init.headers.Authorization = `Bearer ${token}`;
    const r = await fetch(`/api${path}`, init);
    const data = await r.json().catch(() => ({}));
    return { status: r.status, data };
  } catch (e) {
    return { status: 0, data: { error: e.message } };
  }
}

function Section({ title, children }) {
  return (
    <section className="mb-6 p-4 bg-white border border-slate-200 rounded-lg">
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      {children}
    </section>
  );
}

function Out({ data }) {
  if (!data) return null;
  return <pre className="bg-slate-50 p-3 mt-2 text-xs overflow-x-auto rounded">{JSON.stringify(data, null, 2)}</pre>;
}

export default function Integrations() {
  const [stripe, setStripe] = useState(null);
  const [sg, setSg] = useState(null);
  const [mc, setMc] = useState(null);
  const [gg, setGg] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [peer, setPeer] = useState(null);
  const [agentic, setAgentic] = useState(null);
  const [crm, setCrm] = useState(null);
  const [board, setBoard] = useState(null);
  const [busy, setBusy] = useState('');

  const run = async (key, fn) => { setBusy(key); const r = await fn(); setBusy(''); return r; };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Integrations &amp; Backlog</h1>
      <Section title="Payment / ESP / Funder feeds">
        <div className="flex gap-2 flex-wrap">
          <button disabled={busy==='stripe'} onClick={async () => setStripe((await run('stripe', () => call('POST', '/integrations/stripe/checkout-session', { amount_cents: 5000 }))).data)} className="px-3 py-1.5 bg-indigo-600 text-white rounded">Stripe checkout</button>
          <button disabled={busy==='sg'} onClick={async () => setSg((await run('sg', () => call('POST', '/integrations/sendgrid/send', { to: 'a@b.c', subject: 'x', body: 'y' }))).data)} className="px-3 py-1.5 bg-indigo-600 text-white rounded">SendGrid send</button>
          <button disabled={busy==='mc'} onClick={async () => setMc((await run('mc', () => call('POST', '/integrations/mailchimp/subscribe', { email: 'a@b.c' }))).data)} className="px-3 py-1.5 bg-indigo-600 text-white rounded">Mailchimp subscribe</button>
          <button disabled={busy==='gg'} onClick={async () => setGg((await run('gg', () => call('GET', '/integrations/grants-gov/search?q=education'))).data)} className="px-3 py-1.5 bg-indigo-600 text-white rounded">grants.gov</button>
        </div>
        <Out data={stripe} /><Out data={sg} /><Out data={mc} /><Out data={gg} />
      </Section>
      <Section title="Donor scoring (deterministic)">
        <button onClick={async () => setScoring((await run('s', () => call('POST', '/donor-scoring/score', {}))).data)} className="px-3 py-1.5 bg-emerald-600 text-white rounded">Top 20</button>
        <Out data={scoring} />
      </Section>
      <Section title="Peer-to-peer matching">
        <button onClick={async () => setPeer((await run('p', () => call('POST', '/peer-matching/match', {}))).data)} className="px-3 py-1.5 bg-emerald-600 text-white rounded">Match</button>
        <Out data={peer} />
      </Section>
      <Section title="Agentic grant prospector (AI; 3-stage chain)">
        <button onClick={async () => setAgentic((await run('a', () => call('POST', '/agentic/grant-prospector', { focus_area: 'education' }))).data)} className="px-3 py-1.5 bg-violet-600 text-white rounded">Run prospector</button>
        <Out data={agentic} />
      </Section>
      <Section title="CRM communications log">
        <button onClick={async () => setCrm((await run('c', () => call('GET', '/crm'))).data)} className="px-3 py-1.5 bg-slate-700 text-white rounded">List</button>
        <Out data={crm} />
      </Section>
      <Section title="Board / committees">
        <button onClick={async () => setBoard((await run('b', () => call('GET', '/board/committees'))).data)} className="px-3 py-1.5 bg-slate-700 text-white rounded">List committees</button>
        <Out data={board} />
      </Section>
    </div>
  );
}
