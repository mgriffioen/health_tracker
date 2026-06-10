import { useState } from 'react';
import { Utensils, Scale, LayoutDashboard } from 'lucide-react';
import FoodTracker from './components/FoodTracker';
import WeightTracker from './components/WeightTracker';
import Dashboard from './components/Dashboard';

const TABS = [
  { id: 'food', label: 'Food Tracker', icon: Utensils },
  { id: 'weight', label: 'Weight Tracker', icon: Scale },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('food');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-14">
            <span className="font-bold text-slate-800 text-base mr-auto">Health Tracker</span>
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

      <main className="flex-1 py-4">
        {activeTab === 'food' && <FoodTracker />}
        {activeTab === 'weight' && <WeightTracker />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}
