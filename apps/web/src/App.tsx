/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import History from './components/History';
import Scan from './components/Scan';
import Budget from './components/Budget';
import Stats from './components/Stats';
import Settings from './components/Settings';
import AddTransaction from './components/AddTransaction';
import Onboarding, { type OnboardingData } from './components/Onboarding';
import Unlock from './components/Unlock';
import AddTransactionChooser from './components/AddTransactionChooser';
import { useMediaQuery } from './hooks/useMediaQuery';

export type Tab = 'home' | 'history' | 'scan' | 'budget' | 'stats' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showAddChooser, setShowAddChooser] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(0); // 0-2, null means finished
  const [, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLocked, setIsLocked] = useState(false); // For PIN/Biometric unlock
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Handle Lock logic (e.g. on mount or visibility change)
  useEffect(() => {
    const checkLock = () => {
      const lockEnabled = localStorage.getItem('biometric_lock') === 'true';
      if (lockEnabled && onboardingStep === null) {
        setIsLocked(true);
      }
    };

    checkLock();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkLock();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [onboardingStep]);

  if (onboardingStep !== null) {
    return (
      <Onboarding
        step={onboardingStep}
        onNext={(data) => {
          setOnboardingData(data);
          setOnboardingStep((s) => (s! < 2 ? s! + 1 : null));
        }}
      />
    );
  }

  if (isLocked) {
    return <Unlock onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex overflow-hidden">
      {isDesktop && (
        <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />
      )}

      <main
        className={`flex-1 h-screen overflow-y-auto no-scrollbar relative ${isDesktop ? 'px-12 pt-12 pb-12' : 'px-6 pt-4 pb-32'}`}
      >
        <div className={isDesktop ? 'max-w-5xl mx-auto' : 'max-w-md mx-auto'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {activeTab === 'home' && <Home />}
              {activeTab === 'history' && <History />}
              {activeTab === 'scan' && <Scan onClose={() => setActiveTab('home')} />}
              {activeTab === 'budget' && <Budget />}
              {activeTab === 'stats' && <Stats />}
              {activeTab === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Action Button for adding transaction (Mobile) */}
        {!isDesktop && activeTab !== 'scan' && (
          <motion.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddChooser(true)}
            className="fixed bottom-28 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-xl z-40"
            aria-label="Open add item menu"
          >
            <span className="text-3xl font-light">+</span>
          </motion.button>
        )}

        {!isDesktop && <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />}
      </main>

      <AnimatePresence>
        {showAddChooser && (
          <AddTransactionChooser
            onClose={() => setShowAddChooser(false)}
            onManual={() => {
              setShowAddChooser(false);
              setShowAddManual(true);
            }}
            onScan={() => {
              setShowAddChooser(false);
              setActiveTab('scan');
            }}
          />
        )}
        {showAddManual && (
          <AddTransaction
            onClose={() => setShowAddManual(false)}
            onSave={async (data) => {
              const key = 'smartspend_transactions_draft';
              const prev = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[];
              localStorage.setItem(key, JSON.stringify([...prev, { ...data, savedAt: new Date().toISOString() }]));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
