import { Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { TransactionForm } from '../components/transactions/TransactionForm';
import { transactionService } from '../services/transactionServiceInstance';

export function AddTransactionScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <TransactionForm
        onCancel={() => navigation.goBack()}
        onSubmit={async (payload) => {
          try {
            await transactionService.create(payload);
            Alert.alert('Saved', 'Transaction stored locally.');
            navigation.goBack();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Save failed', message);
          }
        }}
      />
    </ScrollView>
  );
}
