import { X, Calendar, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useId, useState } from 'react';

export interface AddTransactionSavePayload {
  type: 'income' | 'expense';
  amount: number;
  merchant: string;
}

interface AddTransactionProps {
  onClose: () => void;
  onSave: (data: AddTransactionSavePayload) => Promise<void>;
}

export default function AddTransaction({ onClose, onSave }: AddTransactionProps) {
  const amountId = useId();
  const merchantId = useId();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('0.00');
  const [merchant, setMerchant] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    const parsed = Number.parseFloat(amount.replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    if (!merchant.trim()) {
      setError('Merchant is required.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ type, amount: parsed, merchant: merchant.trim() });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-0 bg-white z-[70] flex flex-col p-6"
    >
      <header className="flex justify-between items-center mb-12">
        <h2 className="text-2xl font-semibold tracking-tight">Minimalist Add Transaction</h2>
        <button type="button" onClick={onClose} className="p-2" aria-label="Close">
          <X size={32} strokeWidth={1.5} />
        </button>
      </header>

      <div className="flex gap-12 mb-12 border-b border-gray-50">
        <button
          type="button"
          onClick={() => setType('income')}
          className={`pb-4 text-xl font-bold transition-colors relative ${type === 'income' ? 'text-black' : 'text-gray-300'}`}
        >
          Income
          {type === 'income' && (
            <motion.div layoutId="typeUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`pb-4 text-xl font-bold transition-colors relative ${type === 'expense' ? 'text-black' : 'text-gray-300'}`}
        >
          Expense
          {type === 'expense' && (
            <motion.div layoutId="typeUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-black" />
          )}
        </button>
      </div>

      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
          <label htmlFor={amountId} className="text-xs font-bold tracking-widest text-gray-400 uppercase">
            Amount
          </label>
          <input
            id={amountId}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-5xl font-bold outline-none"
          />
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
          <label htmlFor={merchantId} className="text-xs font-bold tracking-widest text-gray-400 uppercase">
            Merchant
          </label>
          <input
            id={merchantId}
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Where did you spend?"
            className="text-xl font-bold outline-none placeholder:text-gray-300"
          />
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
          <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">Category</label>
          <div className="flex justify-between items-center py-2">
            <span className="text-xl font-bold text-gray-300">Select Category</span>
            <ChevronDown size={24} className="text-gray-300" />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
          <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">Date</label>
          <div className="flex justify-between items-center py-2">
            <span className="text-xl font-bold">Today</span>
            <Calendar size={24} className="text-black" />
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-rose-600 mt-4">{error}</p>}

      <div className="mt-auto mb-8">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </motion.div>
  );
}
