import { useId, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Bell, ArrowRight, Globe, User } from 'lucide-react';

export interface OnboardingData {
  currency: string;
  fullName: string;
  scanReceipts: boolean;
  weeklySummaries: boolean;
}

interface OnboardingProps {
  step: number;
  onNext: (data: OnboardingData) => void;
}

export default function Onboarding({ step, onNext }: OnboardingProps) {
  const fullNameId = useId();
  const scanId = useId();
  const notifyId = useId();
  const [currency, setCurrency] = useState('USD');
  const [fullName, setFullName] = useState('');
  const [scanReceipts, setScanReceipts] = useState(true);
  const [weeklySummaries, setWeeklySummaries] = useState(false);

  const collect = (): OnboardingData => ({
    currency,
    fullName: fullName.trim(),
    scanReceipts,
    weeklySummaries,
  });

  const advance = () => onNext(collect());

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col justify-center gap-12"
          >
            <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center">
              <Globe size={40} className="text-white" />
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl font-bold tracking-tight leading-tight">Master your money.</h1>
              <p className="text-xl text-gray-500 font-medium leading-relaxed">
                SmartSpend helps you track every dollar, scan receipts, and get AI-powered insights to save more.
              </p>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col justify-center gap-12"
          >
            <h1 className="text-4xl font-bold tracking-tight">Permissions</h1>

            <div className="flex flex-col gap-8">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <Camera size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 id={`${scanId}-label`} className="font-bold text-lg">
                      Scan receipts
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">Auto-track expenses</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" htmlFor={scanId}>
                  <input
                    id={scanId}
                    type="checkbox"
                    className="sr-only peer"
                    checked={scanReceipts}
                    onChange={(e) => setScanReceipts(e.target.checked)}
                    aria-labelledby={`${scanId}-label`}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>

              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <Bell size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 id={`${notifyId}-label`} className="font-bold text-lg">
                      Weekly summaries
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">Stay on top of goals</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" htmlFor={notifyId}>
                  <input
                    id={notifyId}
                    type="checkbox"
                    className="sr-only peer"
                    checked={weeklySummaries}
                    onChange={(e) => setWeeklySummaries(e.target.checked)}
                    aria-labelledby={`${notifyId}-label`}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col justify-center gap-12"
          >
            <h1 className="text-4xl font-bold tracking-tight">Setup Profile</h1>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">Preferred Currency</label>
                <div className="grid grid-cols-3 gap-3">
                  {['USD', 'EUR', 'GBP'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`py-3 rounded-xl font-bold border-2 transition-all ${
                        currency === c ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={fullNameId} className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    id={fullNameId}
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 ring-black/5 transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center gap-2 mb-12">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-black' : 'w-2 bg-gray-100'}`} />
        ))}
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <button
          type="button"
          onClick={advance}
          className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          {step === 2 ? 'Get Started' : 'Continue'}
          <ArrowRight size={20} />
        </button>
        <button
          type="button"
          onClick={advance}
          className="w-full py-2 text-lg font-bold text-gray-400 hover:text-black transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
