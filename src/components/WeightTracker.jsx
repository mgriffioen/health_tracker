import { useState } from 'react';
import { Scale, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { getWeightEntries, saveWeightEntry, deleteWeightEntry } from '../utils/storage';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function WeightTracker() {
  const [entries, setEntries] = useState(getWeightEntries);
  const [date, setDate] = useState(today());
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('lbs');

  function handleSubmit(e) {
    e.preventDefault();
    if (!weight) return;
    const updated = saveWeightEntry({ date, weight: Number(weight), unit });
    setEntries(updated);
    setWeight('');
  }

  function handleDelete(id) {
    setEntries(deleteWeightEntry(id));
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  function getTrend(i) {
    const curr = sorted[i];
    const prev = sorted[i + 1];
    if (!prev || curr.unit !== prev.unit) return null;
    const diff = curr.weight - prev.weight;
    return diff;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-800">Log Weight</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-sm font-medium text-slate-600 mb-1">Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Weight ({unit})
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder={`Enter weight in ${unit}`}
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

      {/* Log */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Weight History</h2>
        {sorted.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No entries yet. Log your first weight above.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((entry, i) => {
              const diff = getTrend(i);
              return (
                <div key={entry.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">
                      {entry.weight} <span className="text-sm font-normal text-slate-500">{entry.unit}</span>
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
