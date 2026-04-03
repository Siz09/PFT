import React, { useState } from 'react';
import Button from './core/Button';
import { Goal } from '../types';

interface ProgressModalProps {
  goal: Goal;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Goal>) => void;
}

const ProgressModal: React.FC<ProgressModalProps> = ({ goal, onClose, onUpdate }) => {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const newAmount = goal.currentAmount + parseFloat(amount);
    onUpdate(goal.id, { currentAmount: newAmount });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Add Progress to "{goal.name}"
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Current: ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Amount to Add
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          step="0.01"
          min="0.01"
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          placeholder="e.g., Monthly savings deposit"
        />
      </div>

      {amount && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            New total: ${(goal.currentAmount + parseFloat(amount || '0')).toLocaleString()}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Add Progress</Button>
      </div>
    </form>
  );
};

export default ProgressModal;
