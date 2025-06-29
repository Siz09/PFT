import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useFinance } from './context/FinanceContext';
import { useTheme } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated } = useFinance();
  const { isDark } = useTheme();

  return (
    <div className={`${isDark ? 'dark' : ''} min-h-screen`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Routes>
          <Route 
            path="/auth" 
            element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/" 
            element={isAuthenticated ? <Layout /> : <Navigate to="/auth" />}
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="budget" element={<Budget />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;