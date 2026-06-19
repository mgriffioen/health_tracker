import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { fetchFoodEntries, fetchWeightEntries } from '../utils/db';
import { TrendingDown, Flame, Scale, Calendar } from 'lucide-react';

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
          label="Total Change"
          value={weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} ${weightUnit}` : '—'}
          bg="bg-emerald-50"
          valueColor={weightChange !== null ? (weightChange < 0 ? 'text-emerald-600' : 'text-red-500') : undefined}
        />
      </div>

      <ChartCard title="Weight Over Time" empty={weightData.length < 2}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weightData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
            <YAxis
              domain={[dataMin => Math.min(190, dataMin), 'auto']}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              unit={` ${weightUnit}`}
              width={55}
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
      </ChartCard>

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
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={calorieData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              unit=" kcal"
              width={65}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
              formatter={v => [`${v} kcal`, 'Calories']}
            />
            <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Calorie Log</h3>
        {calorieData.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No food entries yet.</p>
        ) : (
          <div className="space-y-1">
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

function ChartCard({ title, children, empty }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-base font-semibold text-slate-800 mb-4">{title}</h3>
      {empty ? (
        <p className="text-slate-400 text-sm text-center py-10">Not enough data yet.</p>
      ) : children}
    </div>
  );
}
