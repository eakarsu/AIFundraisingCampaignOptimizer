import { useState } from 'react';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { api } from '../api';

export default function Login({ onLogin: onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = isRegister ? api.register : api.login;
      const body = isRegister ? form : { email: form.email, password: form.password };
      const data = await fn(body);
      localStorage.setItem('token', data.token);
      onAuth(data.user || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = () => {
    setForm({ name: '', email: 'admin@fundraiser.org', password: 'password123' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #059669 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">AI Fundraising</h1>
          <p className="text-primary-200 mt-1">Campaign Optimizer</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                       className="input-field" placeholder="Your name" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                     className="input-field" placeholder="email@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                     className="input-field" placeholder="Your password" required />
            </div>

            <button type="submit" disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <div className="loading-dots text-white"><span /><span /><span /></div>
              ) : (
                <>
                  {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
                  {isRegister ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-3">
            <button onClick={quickLogin}
                    className="btn-success w-full flex items-center justify-center gap-2 py-2.5 text-sm">
              <Sparkles size={16} />
              Quick Demo Login
            </button>

            <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium text-center">
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
