import { useState, useEffect, useMemo, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { fetchFoodEntries, fetchWeightEntries } from '../utils/db';
import { TrendingDown, Flame, Scale, Calendar, Maximize2, X } from 'lucide-react';

function shortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function avgWeight(entries) {
  if (!entries.length) return null;
  return entries.reduce((s, e) => s + e.weight, 0) / entries.length;
}

export default function Dashboard() {
  const [foodEntries, setFoodEntries] = useState([]);
  const [weightEntries, setWeightEntries] = useState([]);
  const weightScrollRef = useRef(null);
  const calorieScrollRef = useRef(null);

  useEffect(() => {
    fetchFoodEntries().then(setFoodEntries).catch(console.error);
    fetchWeightEntries().then(setWeightEntries).catch(console.error);
  }, []);

  const weightData = useMemo(() => {
    return [...weightEntries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => ({ date: e.date, label: shortDate(e.date), weight: e.weight, unit: e.unit }));
  }, [weightEntries]);

  const calorieData = useMemo(() => {
    const byDay = {};
    foodEntries.forEach(e => {
      if (!byDay[e.date]) byDay[e.date] = 0;
      byDay[e.date] += Number(e.calories || 0);
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, calories]) => ({ date, label: shortDate(date), calories }));
  }, [foodEntries]);

  useEffect(() => {
    if (weightScrollRef.current) weightScrollRef.current.scrollLeft = weightScrollRef.current.scrollWidth;
  }, [weightData]);

  useEffect(() => {
    if (calorieScrollRef.current) calorieScrollRef.current.scrollLeft = calorieScrollRef.current.scrollWidth;
  }, [calorieData]);

  const latestWeight = weightData.at(-1);
  const firstWeight = weightData[0];
  const weightChange = latestWeight && firstWeight && latestWeight !== firstWeight
    ? latestWeight.weight - firstWeight.weight
    : null;

  const avgCals = calorieData.length
    ? Math.round(calorieData.reduce((s, d) => s + d.calories, 0) / calorieData.length)
    : null;

  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const todayCals = calorieData.find(d => d.date === todayStr)?.calories ?? null;

  const weightUnit = latestWeight?.unit || 'lbs';
  const avgW = avgWeight(weightEntries);
  const [weightFullscreen, setWeightFullscreen] = useState(false);
  const [weightRange, setWeightRange] = useState('month');

  const weightRanges = { week: 7, month: 30, '3month': 90 };
  const weightRangeLabels = { week: 'Week', month: 'Month', '3month': '3 Mo' };

  const filteredWeightData = useMemo(() => {
    const days = weightRanges[weightRange];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return weightData.filter(e => e.date >= cutoffStr);
  }, [weightData, weightRange]);

  const rangeWeightChange = filteredWeightData.length >= 2
    ? filteredWeightData.at(-1).weight - filteredWeightData[0].weight
    : null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Scale size={18} className="text-blue-500" />}
          label="Current Weight"
          value={latestWeight ? `${latestWeight.weight} ${weightUnit}` : '—'}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<TrendingDown size={18} className="text-emerald-500" />}
          label={`Change (${weightRangeLabels[weightRange]})`}
          value={rangeWeightChange !== null ? `${rangeWeightChange > 0 ? '+' : ''}${rangeWeightChange.toFixed(1)} ${weightUnit}` : '—'}
          bg="bg-emerald-50"
          valueColor={rangeWeightChange !== null ? (rangeWeightChange < 0 ? 'text-emerald-600' : 'text-red-500') : undefined}
        />
      </div>

      <ChartCard
        title="Weight Over Time"
        empty={filteredWeightData.length < 2}
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs">
              {Object.keys(weightRanges).map(r => (
                <button
                  key={r}
                  onClick={() => setWeightRange(r)}
                  className={`px-2 py-1 transition-colors ${weightRange === r ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {weightRangeLabels[r]}
                </button>
              ))}
            </div>
            <button onClick={() => setWeightFullscreen(true)} className="text-slate-400 hover:text-slate-600 transition-colors"><Maximize2 size={15} /></button>
          </div>
        }
      >
        <div className="overflow-x-auto" ref={weightScrollRef}>
          <div style={{ minWidth: Math.max(filteredWeightData.length * 48, 300) }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={filteredWeightData} margin={{ top: 5, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis
                  domain={[dataMin => Math.min(190, dataMin), 'auto']}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  unit={` ${weightUnit}`}
                  width={68}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                  formatter={v => [`${v} ${weightUnit}`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartCard>

      {weightFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-slate-800">Weight Over Time</span>
            <button onClick={() => setWeightFullscreen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-3">Rotate your phone to landscape for a wider view</p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredWeightData} margin={{ top: 5, right: 20, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis
                  domain={[dataMin => Math.min(190, dataMin), 'auto']}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  unit={` ${weightUnit}`}
                  width={68}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                  formatter={v => [`${v} ${weightUnit}`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame size={18} className="text-orange-500" />}
          label="Today's Calories"
          value={todayCals !== null ? `${todayCals} kcal` : '—'}
          bg="bg-orange-50"
        />
        <StatCard
          icon={<Calendar size={18} className="text-purple-500" />}
          label="Avg Daily Cals"
          value={avgCals !== null ? `${avgCals} kcal` : '—'}
          bg="bg-purple-50"
        />
      </div>

      <ChartCard title="Daily Calorie Intake" empty={calorieData.length === 0}>
        <div className="overflow-x-auto" ref={calorieScrollRef}>
          <div style={{ minWidth: Math.max(calorieData.length * 48, 300) }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={calorieData} margin={{ top: 5, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  unit=" kcal"
                  width={75}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                  formatter={v => [`${v} kcal`, 'Calories']}
                />
                <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartCard>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Calorie Log</h3>
        {calorieData.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No food entries yet.</p>
        ) : (
          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: calorieData.length > 14 ? '560px' : 'none' }}>
            {[...calorieData].reverse().map(d => (
              <div key={d.date} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600">{d.label}</span>
                <span className="text-sm font-semibold text-orange-500">{d.calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, valueColor = 'text-slate-800' }) {
  return (
    <div className={`rounded-2xl p-4 ${bg || 'bg-slate-50'}`}>
      <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <div className={`text-lg font-bold ${valueColor}`}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children, empty, action }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      {empty ? (
        <p className="text-slate-400 text-sm text-center py-10">Not enough data yet.</p>
      ) : children}
    </div>
  );
}
