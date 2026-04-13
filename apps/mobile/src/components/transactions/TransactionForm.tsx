import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { CreateTransactionInput, TransactionType } from '../../types/finance';

type TransactionFormProps = {
  onSubmit: (value: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
};

const today = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidIsoLocalDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() + 1 === month && parsed.getDate() === day;
};

export function TransactionForm({ onSubmit, onCancel }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today());
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('Food');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Validation', 'Amount must be greater than 0.');
      return;
    }
    if (!isValidIsoLocalDate(date)) {
      Alert.alert('Validation', 'Date must be valid and use YYYY-MM-DD format.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        amountCents: Math.round(parsed * 100),
        type,
        categoryId,
        merchant: merchant.trim() || undefined,
        description: description.trim() || undefined,
        date,
      });
    } catch (error) {
      console.error('Transaction submit failed', error);
      const message = error instanceof Error ? error.message : 'Failed to save transaction';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="gap-8">
      <Text className="text-3xl font-bold tracking-tight text-black">Add Transaction</Text>
      <View className="flex-row gap-10 border-b border-neutral-100">
        <View className="flex-1">
          <Button label="Expense" variant={type === 'expense' ? 'primary' : 'secondary'} onPress={() => setType('expense')} />
        </View>
        <View className="flex-1">
          <Button label="Income" variant={type === 'income' ? 'primary' : 'secondary'} onPress={() => setType('income')} />
        </View>
      </View>

      <Input label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric" />
      <Input label="Category" value={categoryId} onChangeText={setCategoryId} placeholder="Food" />
      <Input label="Merchant" value={merchant} onChangeText={setMerchant} placeholder="Store name" />
      <Input label="Description" value={description} onChangeText={setDescription} placeholder="Optional note" />
      <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />

      <View className="flex-row gap-3 pt-4">
        <View className="flex-1">
          <Button label="Cancel" variant="secondary" onPress={onCancel} />
        </View>
        <View className="flex-1">
          <Button label={isSaving ? 'Saving...' : 'Save'} onPress={submit} disabled={isSaving} />
        </View>
      </View>
    </View>
  );
}
