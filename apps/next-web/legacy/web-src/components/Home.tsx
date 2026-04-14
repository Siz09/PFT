import { User, Sparkles, ShoppingCart, Banknote, Fuel, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { MOCK_TRANSACTIONS } from '../constants';

export default function Home() {
  const recentTransactions = MOCK_TRANSACTIONS.slice(0, 3);
  const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  const amountFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Header */}
      <header className="flex justify-between items-center pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">SmartSpend</h1>
        <button aria-label="User menu" className="p-2 rounded-full border border-gray-100 hover:bg-gray-50 transition-colors">
          <User size={24} strokeWidth={1.5} />
        </button>
      </header>

      {/* Balance Section */}
      <section className="text-center py-4">
        <h2 className="text-6xl font-medium tracking-tight mb-2">$4,280.50</h2>
        <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">Available Balance</p>
      </section>

      {/* Income/Expense Summary */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium tracking-wide text-gray-500 uppercase">Total Income</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">$5,400.00</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium tracking-wide text-gray-500 uppercase">Total Expenses</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">$1,119.50</span>
            <div className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
        </div>
      </section>

      {/* AI Insight */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50/50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100"
      >
        <div className="p-2 bg-white rounded-xl shadow-sm">
          <Sparkles size={18} className="text-black" />
        </div>
        <p className="text-sm font-medium text-gray-800">
          You're spending 15% less on groceries this month
        </p>
      </motion.div>

      {/* Recent Transactions */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-semibold tracking-tight">Recent Transactions</h3>
          <button className="text-sm font-medium text-gray-500 hover:text-black transition-colors">View all</button>
        </div>
        <div className="flex flex-col gap-6">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                  {tx.category === 'Groceries' ? (
                    <ShoppingCart size={20} strokeWidth={1.5} />
                  ) : tx.category === 'Transport' ? (
                    <Fuel size={20} strokeWidth={1.5} />
                  ) : tx.type === 'income' ? (
                    <Banknote size={20} strokeWidth={1.5} />
                  ) : (
                    <ChevronRight size={20} strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-base">{tx.merchant}</h4>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    {tx.category} • {timeFormatter.format(new Date(tx.date))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {tx.type === 'income' ? '+' : '-'}{amountFormatter.format(Math.abs(tx.amount))}
                </span>
                <div className={`w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Spending Trends & Savings Goal */}
      <div className="grid grid-cols-2 gap-6">
        <section className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold tracking-tight">Spending Trends</h3>
          <div className="h-20 flex items-end justify-between px-2">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
              <path
                d="M 0 35 Q 10 35 15 25 T 30 15 T 45 30 T 60 10 T 75 25 T 90 35 T 100 35"
                fill="none"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 0 40 Q 10 40 15 30 T 30 20 T 45 35 T 60 15 T 75 30 T 90 40 T 100 40"
                fill="none"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.1"
              />
            </svg>
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold tracking-tight">Savings Goal</h3>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-semibold tracking-tight">$12,000.00</span>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '45%' }}
                className="h-full bg-black" 
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
