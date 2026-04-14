import { motion } from 'motion/react';
import { Scan, Keyboard, X } from 'lucide-react';

interface AddTransactionChooserProps {
  onClose: () => void;
  onManual: () => void;
  onScan: () => void;
}

export default function AddTransactionChooser({ onClose, onManual, onScan }: AddTransactionChooserProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-6 sm:p-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-transaction-title"
        className="w-full max-w-md bg-white rounded-t-[40px] p-8 relative z-10 flex flex-col gap-8"
      >
        <div className="flex justify-between items-center">
          <h2 id="add-transaction-title" className="text-2xl font-bold tracking-tight">Add Transaction</h2>
          <button onClick={onClose} aria-label="Close Add Transaction" className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onScan}
            className="flex flex-col items-center gap-4 p-8 bg-gray-50 rounded-[32px] hover:bg-gray-100 transition-all group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Scan size={32} className="text-black" strokeWidth={1.5} />
            </div>
            <span className="font-bold text-lg">Scan Receipt</span>
          </button>

          <button
            onClick={onManual}
            className="flex flex-col items-center gap-4 p-8 bg-gray-50 rounded-[32px] hover:bg-gray-100 transition-all group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Keyboard size={32} className="text-black" strokeWidth={1.5} />
            </div>
            <span className="font-bold text-lg">Manual Entry</span>
          </button>
        </div>

        <p className="text-center text-sm font-medium text-gray-400 pb-4">
          Choose how you'd like to record your spending
        </p>
      </motion.div>
    </div>
  );
}
