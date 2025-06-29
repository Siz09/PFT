import React from 'react';
import { motion } from 'framer-motion';
import Card from './core/Card';

const SummaryCard = ({ title, amount, icon, color, trend }) => {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card hover className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <motion.p 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-2xl font-bold ${color}`}
          >
            {formatAmount(amount)}
          </motion.p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <svg className={`w-4 h-4 mr-1 ${trend.positive ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
              {trend.percentage}% from last month
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color === 'text-green-600' ? 'bg-green-100 dark:bg-green-900' : color === 'text-red-600' ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default SummaryCard;