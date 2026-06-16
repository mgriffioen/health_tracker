import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Search, Clock } from 'lucide-react';
import { searchFoods, FOOD_GROUPS } from '../utils/foodApi';
import { searchLocal } from '../utils/foodDatabase';
import { fetchFoodEntries, insertFoodEntry, removeFoodEntry } from '../utils/db';

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

const EMPTY_FORM = {
  date: today(),
  time: nowTime(),
  name: '',
  calories: '',
  servingSize: 100,
  foodGroup: 'Other',
};

export default function FoodTracker({ session }) {
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [filterDate, setFilterDate] = useState(today());
  const debounceRef = useRef(null);
  const suggestRef = useRef(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    fetchFoodEntries()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoadingEntries(false));
  }, []);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const results = await searchFoods(q);
    setSuggestions(results);
    setLoading(false);
    setShowSuggestions(true);
  }, []);

  useEffect(() => {
    if (skipSearchRef.current) { skipSearchRef.current = false; return; }
    if (query.length < 2) { setSuggestions([]); return; }
    const local = searchLocal(query);
    if (local.length) { setSuggestions(local); setShowSuggestions(true); }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 500);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    function handleClick(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectSuggestion(food) {
    skipSearchRef.current = true;
    setSelectedFood(food);
    setQuery(food.name);
    setSuggestions([]);
    setShowSuggestions(false);
    const defaultServing = food.servings?.[0]?.g ?? 100;
    const cals = food.caloriesPer100g
      ? Math.round((food.caloriesPer100g * defaultServing) / 100)
      : '';
    setForm(f => ({ ...f, name: food.name, calories: cals, servingSize: defaultServing, foodGroup: food.category || 'Other' }));
  }

  function handleServingChange(size) {
    const s = Number(size);
    setForm(f => ({
      ...f,
      servingSize: s,
      calories: selectedFood?.caloriesPer100g
        ? Math.round((selectedFood.caloriesPer100g * s) / 100)
        : f.calories,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.calories) return;
    try {
      const saved = await insertFoodEntry(form, session.user.id);
      setEntries(prev => [saved, ...prev]);
      setForm({ ...EMPTY_FORM, date: form.date });
      setQuery('');
      setSelectedFood(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    try {
      await removeFoodEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = entries.filter(e => e.date === filterDate);
  const totalCals = filtered.reduce((sum, e) => sum + Number(e.calories || 0), 0);
  const grouped = filtered.reduce((acc, e) => {
    const g = e.foodGroup || 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(e);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Log Food</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative" ref={suggestRef}>
            <label className="block text-sm font-medium text-slate-600 mb-1">Food Item</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setForm(f => ({ ...f, name: e.target.value })); }}
                onFocus={() => suggestions.length && setShowSuggestions(true)}
                placeholder="Search food or enter manually…"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{ touchAction: 'manipulation' }}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onMouseDown={() => selectSuggestion(s)}
                    className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-800">{s.name}</span>
                      {s.source === 'local' && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1 rounded">common</span>}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {s.brand && `${s.brand} · `}{s.caloriesPer100g} kcal/100g · {s.category}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedFood?.servings?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Quick Serving</label>
              <div className="flex flex-wrap gap-1.5">
                {selectedFood.servings.map(s => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleServingChange(s.g)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.servingSize === s.g
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    {s.label} <span className="opacity-60">({s.g}g)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Calories (kcal)</label>
            <input
              type="number"
              min="0"
              value={form.calories}
              onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
              placeholder="Auto or manual"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Food Group</label>
            <select
              value={form.foodGroup}
              onChange={e => setForm(f => ({ ...f, foodGroup: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {FOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!form.name || !form.calories}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={16} /> Add Food Entry
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Daily Log</h2>
            <p className="text-sm text-slate-500 mt-0.5">{totalCals} kcal total</p>
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {loadingEntries ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No entries for this day.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{group}</div>
                <div className="space-y-1">
                  {items.map(entry => (
                    <div key={entry.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-800 truncate">{entry.name}</div>
                        <div className="text-xs text-slate-400">{entry.time}</div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                        {entry.calories} kcal
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
