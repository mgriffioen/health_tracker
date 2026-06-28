import { useState, useEffect } from 'react';
import { Utensils, Scale, LayoutDashboard, LogOut, KeyRound, X } from 'lucide-react';
import FoodTracker from './components/FoodTracker';
import WeightTracker from './components/WeightTracker';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import { supabase } from './utils/supabase';

const TABS = [
  { id: 'weight', label: 'Weight Tracker', icon: Scale },
  { id: 'food', label: 'Food Tracker', icon: Utensils },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

function SetPasswordModal({ onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Set Password</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-600">Password set! You can now sign in with your email and password.</p>
            <button onClick={onClose} className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 disabled:opacity-40 transition-colors"
            >
              {loading ? 'Saving…' : 'Set Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const THEMES = [
  'rose', 'orange', 'amber', 'lime', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'red',
];

function getDailyTheme() {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return THEMES[hash % THEMES.length];
}

export default function App() {
  const [activeTab, setActiveTab] = useState('weight');
  const [session, setSession] = useState(undefined);
  const [showSetPassword, setShowSetPassword] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', getDailyTheme());
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center h-14">
            <span className="font-bold text-slate-800 text-base mr-auto">Health Tracker</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSetPassword(true)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
              >
                <KeyRound size={15} />
                <span className="hidden sm:inline">Set Password</span>
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {showSetPassword && <SetPasswordModal onClose={() => setShowSetPassword(false)} />}
      <main className="flex-1 py-4">
        {activeTab === 'food' && <FoodTracker session={session} />}
        {activeTab === 'weight' && <WeightTracker session={session} />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}
