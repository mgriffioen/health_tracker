import { useState, useEffect } from 'react';
import { Scale, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { fetchWeightEntries, upsertWeightEntry, removeWeightEntry } from '../utils/db';

const UNIT = 'lbs';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function WeightTracker({ session }) {
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [date, setDate] = useState(today());
  const [weight, setWeight] = useState('');

  useEffect(() => {
    fetchWeightEntries()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoadingEntries(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!weight) return;
    try {
      const saved = await upsertWeightEntry({ date, weight: Number(weight), unit: UNIT }, session.user.id);
      setEntries(prev => {
        const filtered = prev.filter(e => e.date !== date);
        return [...filtered, saved].sort((a, b) => a.date.localeCompare(b.date));
      });
      setWeight('');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    try {
      await removeWeightEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  function getTrend(i) {
    const curr = sorted[i];
    const prev = sorted[i + 1];
    if (!prev) return null;
    return curr.weight - prev.weight;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-800">Log Weight</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Weight (lbs)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="Enter weight in lbs"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={!weight}
            className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Weight
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Weight History</h2>
        {loadingEntries ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No entries yet. Log your first weight above.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((entry, i) => {
              const diff = getTrend(i);
              return (
                <div key={entry.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">
                      {entry.weight} <span className="text-sm font-normal text-slate-500">lbs</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {diff !== null && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${diff < 0 ? 'text-emerald-500' : diff > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {diff < 0 ? <TrendingDown size={14} /> : diff > 0 ? <TrendingUp size={14} /> : <Minus size={14} />}
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
