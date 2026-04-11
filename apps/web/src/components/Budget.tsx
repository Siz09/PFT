import { Plus, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { MOCK_BUDGETS, MOCK_GOALS } from '../constants';

export default function Budget() {
  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="flex justify-between items-center pt-4">
        <h1 className="text-4xl font-light tracking-tight text-gray-800">Minimalist Budgeting</h1>
        <button type="button" className="p-2 rounded-full hover:bg-gray-50 transition-colors" aria-label="Add budget">
          <Plus size={28} strokeWidth={1} />
        </button>
      </header>

      <div className="border-b border-gray-100 pb-2">
        <h2 className="text-2xl font-medium text-gray-400">April 2026</h2>
      </div>

      {/* Category Budgets */}
      <section className="flex flex-col gap-6">
        <h3 className="text-sm font-medium text-gray-400">Category Budgets</h3>
        <div className="flex flex-col gap-10">
          {MOCK_BUDGETS.map((budget) => {
            const rawPct =
              !budget.limit || budget.limit <= 0 ? 0 : (budget.spent / budget.limit) * 100;
            const percent = Math.min(100, Math.max(0, rawPct));
            const color = budget.status === 'Healthy' ? 'bg-emerald-600' : budget.status === 'Watch out' ? 'bg-amber-500' : 'bg-rose-500';
            
            return (
              <div key={budget.category} className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-medium text-gray-800">{budget.category}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">${budget.spent}</span>
                    <span className="text-sm font-medium text-gray-400">/ ${budget.limit}</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={`h-full ${color}`} 
                  />
                </div>
                <p className="text-xs font-medium text-gray-400 text-right">
                  {Math.round(percent)}% spent – {budget.status}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Savings Goals */}
      <section className="flex flex-col gap-6 mt-4">
        <h3 className="text-sm font-medium text-gray-400">Savings Goals</h3>
        <div className="flex flex-col gap-10">
          {MOCK_GOALS.map((goal) => {
            const rawPct =
              !goal.target || goal.target <= 0 ? 0 : (goal.current / goal.target) * 100;
            const percent = Math.min(100, Math.max(0, rawPct));
            
            return (
              <div key={goal.id} className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <h4 className="text-3xl font-medium text-gray-800">{goal.name}</h4>
                  <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">{goal.category}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${goal.current.toLocaleString()}</span>
                    <span className="text-sm font-medium text-gray-400">/ ${goal.target.toLocaleString()}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">{goal.daysLeft} days left</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className="h-full bg-slate-800" 
                  />
                </div>
                <button className="text-sm font-semibold text-gray-400 hover:text-black transition-colors text-left">
                  Update progress
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
