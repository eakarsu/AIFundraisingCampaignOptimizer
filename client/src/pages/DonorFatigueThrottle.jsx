import { useEffect, useState } from 'react';

export default function DonorFatigueThrottle() {
  const [form, setForm] = useState({ emails_30d: 9, texts_30d: 3, gifts_12m: 2, days_since_last_gift: 46 });
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/donor-fatigue-throttle').then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  async function score(event) {
    event.preventDefault();
    const res = await fetch('/api/donor-fatigue-throttle/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setData(await res.json());
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Donor Fatigue Throttle</h1>
      <form onSubmit={score} className="grid gap-3 max-w-xl bg-white border border-slate-200 rounded-xl p-4">
        {Object.keys(form).map((key) => (
          <label key={key} className="grid gap-1 text-sm font-medium text-slate-700">
            {key.replaceAll('_', ' ')}
            <input className="border border-slate-300 rounded-lg px-3 py-2" type="number" value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
          </label>
        ))}
        <button className="bg-indigo-600 text-white rounded-lg px-4 py-2" type="submit">Score fatigue</button>
      </form>
      {data && <div className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="font-semibold">{data.throttle}</h2><p>Fatigue score: {data.fatigue_score}. Next touch: {data.next_best_touch}.</p><ul className="list-disc ml-5">{data.cadence_rules.map((r) => <li key={r}>{r}</li>)}</ul></div>}
    </div>
  );
}
