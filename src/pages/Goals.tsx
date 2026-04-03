import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import GoalCard from '../components/GoalCard';
import Modal from '../components/core/Modal';
import GoalForm from '../components/GoalForm';
import ProgressModal from '../components/ProgressModal';
import Button from '../components/core/Button';
import EmptyState from '../components/EmptyState';
import { Goal } from '../types';

const Goals: React.FC = () => {
  const { goals, updateGoal, deleteGoal, loading } = useFinance();
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const handleEdit = (goal: Goal): void => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  const handleDelete = (id: string): void => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(id);
    }
  };

  const handleAddProgress = (goal: Goal): void => {
    setSelectedGoal(goal);
    setShowProgressModal(true);
  };

  const handleCloseModal = (): void => {
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  const handleCloseProgressModal = (): void => {
    setShowProgressModal(false);
    setSelectedGoal(null);
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter((goal) => goal.currentAmount >= goal.targetAmount).length;
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Goals</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your progress towards financial goals
          </p>
        </div>
        <Button onClick={() => setShowGoalModal(true)}>Add Goal</Button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Goals', value: totalGoals, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900', iconColor: 'text-blue-600' },
          { label: 'Completed', value: completedGoals, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900', iconColor: 'text-green-600' },
          { label: 'Total Saved', value: `$${totalCurrentAmount.toLocaleString()}`, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900', iconColor: 'text-purple-600' },
          { label: 'Target Amount', value: `$${totalTargetAmount.toLocaleString()}`, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900', iconColor: 'text-orange-600' }
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
              <div className={`p-3 rounded-full ${bg}`} />
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants}>
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => (
              <motion.div key={goal.id} variants={itemVariants} custom={index}>
                <GoalCard
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddProgress={handleAddProgress}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
            title="No goals yet"
            description="Create your first savings goal to start tracking your progress"
            actionLabel="Add Goal"
            onAction={() => setShowGoalModal(true)}
          />
        )}
      </motion.div>

      <Modal isOpen={showGoalModal} onClose={handleCloseModal} title={editingGoal ? 'Edit Goal' : 'Create New Goal'}>
        <GoalForm goal={editingGoal} onClose={handleCloseModal} />
      </Modal>

      <Modal isOpen={showProgressModal} onClose={handleCloseProgressModal} title="Add Progress">
        {selectedGoal && (
          <ProgressModal goal={selectedGoal} onClose={handleCloseProgressModal} onUpdate={updateGoal} />
        )}
      </Modal>
    </motion.div>
  );
};

export default Goals;
