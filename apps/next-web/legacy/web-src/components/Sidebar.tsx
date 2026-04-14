import { Home, History, Scan, Wallet, BarChart3, Settings, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { Tab } from '../App';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'history', label: 'Transactions', icon: History },
    { id: 'scan', label: 'Scan Receipt', icon: Scan },
    { id: 'budget', label: 'Budget & Goals', icon: Wallet },
    { id: 'stats', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
    } catch (error) {
      console.error('Server sign-out failed, clearing local auth state anyway', error);
    } finally {
      sessionStorage.clear();
      localStorage.removeItem('biometric_lock');
      localStorage.removeItem('auth_token');
      window.location.assign('/login');
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <h1 className="text-2xl font-bold tracking-tight">SmartSpend</h1>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as Tab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                isActive ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-semibold">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebarActive"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                  initial={false}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex items-center gap-3 px-4 py-3 w-full text-rose-500 font-semibold hover:bg-rose-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
