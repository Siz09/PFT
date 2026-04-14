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

const getStorageItem = (key: string): string | null => {
  try {
    const localValue = localStorage.getItem(key);
    if (localValue !== null) {
      return localValue;
    }
  } catch (error) {
    console.error('Failed to read from localStorage', error);
  }

  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.error('Failed to read from sessionStorage fallback', error);
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear sessionStorage fallback after localStorage write', error);
    }
    return;
  } catch (error) {
    console.error('Failed to save to localStorage, using sessionStorage fallback', error);
  }

  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.error('Failed to save to sessionStorage fallback', error);
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showAddChooser, setShowAddChooser] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(0); // 0-2, null means finished
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
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
          try {
            localStorage.setItem('smartspend_onboarding_data', JSON.stringify(data));
          } catch (error) {
            console.error('Failed to persist onboarding data', error);
          }
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
            onSave={(data) => {
              const key = 'smartspend_transactions_draft';
              let previousDrafts: unknown[] = [];

              try {
                const raw = getStorageItem(key);
                const parsed = raw ? JSON.parse(raw) : [];
                previousDrafts = Array.isArray(parsed) ? parsed : [];
              } catch (error) {
                console.error('Failed to parse existing draft transactions', error);
                previousDrafts = [];
              }

              const nextDrafts = [...previousDrafts, { ...data, savedAt: new Date().toISOString(), onboardingData }];
              const payload = JSON.stringify(nextDrafts);
              setStorageItem(key, payload);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
