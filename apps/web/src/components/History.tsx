import {
  Search,
  Filter,
  FileText,
  ShoppingCart,
  Utensils,
  Banknote,
  Car,
  Zap,
  ShoppingBag,
  PlayCircle,
  Dumbbell,
  X,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_TRANSACTIONS } from '../constants';
import { Transaction } from '../types';
import { useOverlayAccessibility } from '../hooks/useOverlayAccessibility';
import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Shopping: ShoppingBag,
  'Dining & Drinks': Utensils,
  Salary: Banknote,
  Transport: Car,
  Utilities: Zap,
  Subscriptions: PlayCircle,
  Health: Dumbbell,
  Groceries: ShoppingCart,
};

export default function History() {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filterPanelRef = useRef<HTMLDivElement>(null);
  const txPanelRef = useRef<HTMLDivElement>(null);

  useOverlayAccessibility(showFilters, () => setShowFilters(false), filterPanelRef);
  useOverlayAccessibility(!!selectedTx, () => setSelectedTx(null), txPanelRef);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="flex justify-between items-center pt-4">
        <h1 className="text-xl font-semibold tracking-tight">Finance</h1>
        <div className="flex gap-2">
          {isSelectionMode ? (
            <button
              type="button"
              onClick={() => {
                setSelectedIds([]);
                setIsSelectionMode(false);
              }}
              className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-black transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSelectionMode(true)}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <CheckSquare size={20} strokeWidth={1.5} />
            </button>
          )}
          <button type="button" className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <FileText size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-bold tracking-tight">Transactions</h2>
        <p className="text-gray-400 font-medium">Your history with SmartSpend</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-6">
        <div className="relative group">
          <Search
            className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Search merchant, notes, tags"
            className="w-full pl-8 pr-4 py-3 border-b border-gray-100 focus:border-black outline-none transition-colors font-medium placeholder:text-gray-300"
          />
        </div>

        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-black transition-colors"
          >
            <Filter size={18} />
            Filter
          </button>
          <button type="button" className="text-sm font-semibold text-gray-400 hover:text-black transition-colors">
            This Month
          </button>
        </div>
      </div>

      {/* Selection Toolbar */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-4 rounded-2xl flex items-center gap-8 shadow-2xl z-40"
          >
            <span className="font-bold">{selectedIds.length} selected</span>
            <div className="flex gap-4">
              <button type="button" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Trash2 size={20} />
              </button>
              <button type="button" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <FileText size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activity */}
      <section className="flex flex-col gap-6">
        <h3 className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Recent Activity</h3>
        <div className="flex flex-col gap-8">
          {MOCK_TRANSACTIONS.map((tx) => {
            const Icon = CATEGORY_ICONS[tx.category] || FileText;
            const isSelected = selectedIds.includes(tx.id);

            return (
              <div
                key={tx.id}
                role="button"
                tabIndex={0}
                className="flex justify-between items-center group cursor-pointer"
                onClick={() => (isSelectionMode ? toggleSelection(tx.id) : setSelectedTx(tx))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    isSelectionMode ? toggleSelection(tx.id) : setSelectedTx(tx);
                  }
                }}
              >
                <div className="flex items-center gap-6">
                  {isSelectionMode && (
                    <div className={`transition-colors ${isSelected ? 'text-black' : 'text-gray-200'}`}>
                      {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-50 flex items-center justify-center group-hover:border-gray-200 transition-colors shadow-sm">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{tx.merchant}</h4>
                    <p className="text-sm font-medium text-gray-400">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-bold">{tx.type === 'income' ? '+' : '-'}</span>
                  <span className="text-xl font-bold">
                    ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              ref={txPanelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-tx-detail-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-8 relative z-10 flex flex-col gap-8"
            >
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
                <h2 id="history-tx-detail-title" className="text-xl font-bold">
                  Transaction Detail
                </h2>
                <button type="button" className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition-colors">
                  <Trash2 size={24} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center">
                  {(() => {
                    const Icon = CATEGORY_ICONS[selectedTx.category] || FileText;
                    return <Icon size={40} strokeWidth={1.5} />;
                  })()}
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-bold tracking-tight">{selectedTx.merchant}</h3>
                  <p className="text-lg text-gray-400 font-medium">{selectedTx.category}</p>
                </div>
                <span
                  className={`text-5xl font-bold tracking-tighter ${selectedTx.type === 'income' ? 'text-emerald-500' : 'text-black'}`}
                >
                  {selectedTx.type === 'income' ? '+' : '-'}${selectedTx.amount.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between py-4 border-b border-gray-50">
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-widest">Date</span>
                  <span className="font-bold">{new Date(selectedTx.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
                </div>
                <div className="flex justify-between py-4 border-b border-gray-50">
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-widest">Status</span>
                  <span className="font-bold text-emerald-500">Completed</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-widest">Reference</span>
                  <span className="font-bold text-gray-400">#TXN-{selectedTx.id}0024</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform mt-4"
              >
                Download Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              ref={filterPanelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="filters-drawer-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-8 relative z-10 flex flex-col gap-8"
            >
              <div className="flex justify-between items-center">
                <h2 id="filters-drawer-title" className="text-2xl font-bold tracking-tight">
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Transaction Type</h3>
                  <div className="flex gap-3">
                    {['All', 'Income', 'Expense'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`px-6 py-3 rounded-xl font-bold border-2 transition-all ${
                          t === 'All' ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Time Period</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['This Week', 'This Month', 'Last 3 Months', 'Custom Range'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`px-4 py-3 rounded-xl font-bold border-2 transition-all ${
                          p === 'This Month' ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" className="flex-1 py-5 border-2 border-gray-100 rounded-2xl font-bold text-lg">
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-5 bg-black text-white rounded-2xl font-bold text-lg"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
