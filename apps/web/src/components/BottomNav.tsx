import { Home, History, Scan, Wallet, BarChart3, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'history', label: 'HISTORY', icon: History },
    { id: 'scan', label: 'SCAN', icon: Scan },
    { id: 'budget', label: 'WALLET', icon: Wallet },
    { id: 'stats', label: 'STATS', icon: BarChart3 },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pb-8 pt-3 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 group relative"
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium tracking-wider transition-colors ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
