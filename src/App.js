import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import EmailVerificationGuard from './components/EmailVerificationGuard';
import Onboarding from './components/Onboarding';

function App() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage('hasSeenOnboarding', false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding for new users
  useEffect(() => {
    if (user && user.emailVerified && !hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [user, hasSeenOnboarding]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  return (
    <ErrorBoundary>
      <div className={`${isDark ? 'dark' : ''} min-h-screen`}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Routes>
            <Route 
              path="/auth" 
              element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/" 
              element={
                user ? (
                  <EmailVerificationGuard>
                    <Layout />
                  </EmailVerificationGuard>
                ) : (
                  <Navigate to="/auth" />
                )
              }
            >
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="budget" element={<Budget />} />
              <Route path="goals" element={<Goals />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/auth"} />} />
          </Routes>

          {/* Onboarding Modal */}
          {showOnboarding && (
            <Onboarding onComplete={handleOnboardingComplete} />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;