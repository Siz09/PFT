import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { categories } from '../data/mockData';
import Button from './core/Button';

const BudgetForm = ({ budget, onClose }) => {
  const { addBudget, updateBudget } = useFinance();
  const [formData, setFormData] = useState({
    category: budget?.category || '',
    amount: budget?.amount || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) {
      return;
    }

    const budgetData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (budget) {
      updateBudget(budget.id, budgetData);
    } else {
      addBudget(budgetData);
    }
    
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Budget Amount
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          placeholder="0.00"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {budget ? 'Update' : 'Add'} Budget
        </Button>
      </div>
    </form>
  );
};

export default BudgetForm;