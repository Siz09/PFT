import {
  X,
  Zap,
  Image as ImageIcon,
  ChevronLeft,
  ChevronDown,
  Utensils,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useState, useEffect, useRef, useId } from 'react';
import { motion } from 'motion/react';

interface ScanProps {
  onClose: () => void;
}

export default function Scan({ onClose }: ScanProps) {
  const [step, setStep] = useState<'source' | 'camera' | 'processing' | 'review' | 'success'>('source');
  const [flashOn, setFlashOn] = useState(false);
  const [merchant, setMerchant] = useState('Blue Bottle Coffee');
  const [dateStr, setDateStr] = useState('October 24, 2023');
  const merchantId = useId();
  const dateId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const scheduleTimeout = (fn: () => void, ms: number) => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fn();
      timeoutRef.current = null;
    }, ms);
  };

  const handleCapture = () => {
    setStep('processing');
    scheduleTimeout(() => {
      setStep('review');
    }, 2000);
  };

  const handleSave = () => {
    setStep('success');
    scheduleTimeout(() => {
      onClose();
    }, 1500);
  };

  const toggleFlash = () => setFlashOn((v) => !v);

  const handleImportImages = () => {
    fileInputRef.current?.click();
  };

  const handleScanAnother = () => {
    setStep('source');
    setMerchant('Blue Bottle Coffee');
    setDateStr('October 24, 2023');
  };

  if (step === 'source') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-0 bg-white z-[60] flex flex-col p-8"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={() => {
            setStep('camera');
          }}
        />
        <header className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Import Receipt</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <X size={32} strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex flex-col gap-6">
          <button
            type="button"
            onClick={() => setStep('camera')}
            className="flex items-center gap-6 p-6 bg-gray-50 rounded-[32px] hover:bg-gray-100 transition-all group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Zap size={32} className="text-black" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-xl">Camera</span>
              <span className="text-sm font-medium text-gray-400">Scan physical receipt</span>
            </div>
          </button>

          <button
            type="button"
            disabled
            aria-disabled
            title="Coming soon"
            className="flex items-center gap-6 p-6 bg-gray-50 rounded-[32px] opacity-60 cursor-not-allowed text-left"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <ImageIcon size={32} className="text-black" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-xl">Photo Library</span>
              <span className="text-sm font-medium text-gray-400">Choose from gallery — coming soon</span>
            </div>
          </button>

          <button
            type="button"
            disabled
            aria-disabled
            title="Coming soon"
            className="flex items-center gap-6 p-6 bg-gray-50 rounded-[32px] opacity-60 cursor-not-allowed text-left"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <FileText size={32} className="text-black" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-xl">PDF / Document</span>
              <span className="text-sm font-medium text-gray-400">Import digital receipt — coming soon</span>
            </div>
          </button>
        </div>
      </motion.div>
    );
  }

  if (step === 'camera') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white z-[60] flex flex-col p-6"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={() => {
            setStep('processing');
            scheduleTimeout(() => setStep('review'), 2000);
          }}
        />
        <header className="flex justify-between items-center mb-12">
          <button type="button" onClick={() => setStep('source')} className="p-2">
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>
          <h2 className="text-xl font-semibold">Scan Receipt</h2>
          <button
            type="button"
            onClick={toggleFlash}
            className="p-2"
            aria-label={flashOn ? 'Flash on' : 'Flash off'}
            aria-pressed={flashOn}
          >
            <Zap size={28} strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="w-full max-w-sm aspect-[3/4] border-2 border-black rounded-lg p-4 relative">
            <div className="absolute inset-4 border border-gray-200 rounded-sm" />
          </div>
          <p className="text-lg font-medium text-gray-800">Align receipt within the frame</p>
        </div>

        <footer className="flex justify-between items-center mb-12 px-8">
          <button type="button" onClick={handleImportImages} className="flex flex-col items-center gap-1">
            <div className="p-3 rounded-full hover:bg-gray-50 transition-colors">
              <ImageIcon size={24} strokeWidth={1.5} />
            </div>
            <span className="text-sm font-semibold">Import</span>
          </button>

          <button
            type="button"
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-black border-4 border-white shadow-lg active:scale-95 transition-transform"
            aria-label="Capture receipt"
          />

          <div className="w-12" />
        </footer>
      </motion.div>
    );
  }

  if (step === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center p-8 text-center gap-8"
      >
        <div className="relative">
          <Loader2 size={80} className="text-black animate-spin" strokeWidth={1} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Reading your receipt...</h2>
          <p className="text-lg text-gray-400 font-medium">Extracting merchant and amount</p>
        </div>
      </motion.div>
    );
  }

  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center p-8 text-center gap-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Saved Successfully</h2>
          <p className="text-lg text-gray-400 font-medium">Transaction added to your history</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed inset-0 bg-white z-[60] flex flex-col overflow-y-auto no-scrollbar"
    >
      <header className="flex justify-between items-center p-6 sticky top-0 bg-white z-10">
        <button type="button" onClick={() => setStep('camera')} className="p-2">
          <ChevronLeft size={32} strokeWidth={1.5} />
        </button>
        <h2 className="text-xl font-semibold">Review Scan</h2>
        <button type="button" onClick={() => setStep('camera')} className="text-lg font-semibold hover:text-gray-500 transition-colors">
          Retake
        </button>
      </header>

      <div className="px-6 pb-12 flex flex-col gap-10">
        <div className="w-full max-w-[240px] mx-auto aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-xl rotate-[-2deg]">
          <img
            src="https://picsum.photos/seed/receipt/400/600"
            alt="Receipt"
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
            <label htmlFor={merchantId} className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Merchant
            </label>
            <input
              id={merchantId}
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="text-2xl font-bold outline-none"
            />
          </div>

          <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">Amount</label>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-500">$ 24.50</span>
              <span className="px-2 py-0.5 bg-rose-50 text-[10px] font-bold tracking-widest text-rose-500 rounded uppercase">
                Expense
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
            <label htmlFor={dateId} className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Date
            </label>
            <input
              id={dateId}
              type="text"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="text-xl font-bold outline-none"
            />
          </div>

          <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">Category</label>
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <Utensils size={20} strokeWidth={1.5} />
                <span className="text-xl font-bold">Dining & Drinks</span>
              </div>
              <ChevronDown size={24} className="text-gray-300" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 items-center">
          <span className="text-sm font-bold text-emerald-600">High confidence</span>
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleScanAnother}
            className="text-lg font-semibold text-gray-800 hover:text-gray-500 transition-colors"
          >
            Scan another
          </button>
        </div>
      </div>
    </motion.div>
  );
}
