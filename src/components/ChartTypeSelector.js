import React from 'react';
import { motion } from 'framer-motion';

const ChartTypeSelector = ({ activeType, onTypeChange, types }) => {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      {types.map((type) => (
        <button
          key={type.value}
          onClick={() => onTypeChange(type.value)}
          className={`relative flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors duration-200 ${
            activeType === type.value
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {activeType === type.value && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white dark:bg-gray-600 rounded-md shadow-sm"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center justify-center">
            {type.icon}
            <span className="ml-2">{type.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default ChartTypeSelector;