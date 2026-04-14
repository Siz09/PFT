import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { TransactionForm } from '../components/transactions/TransactionForm';
import { createTransactionService } from '../services/transactionServiceInstance';

export function AddTransactionScreen() {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const transactionService = createTransactionService();

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <TransactionForm
        isSubmitting={isSubmitting}
        onCancel={() => navigation.goBack()}
        onSubmit={async (payload) => {
          if (isSubmitting) {
            return;
          }
          setIsSubmitting(true);
          try {
            await transactionService.create(payload);
            Alert.alert('Saved', 'Transaction stored locally.');
            navigation.goBack();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Save failed', message);
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </ScrollView>
  );
}
