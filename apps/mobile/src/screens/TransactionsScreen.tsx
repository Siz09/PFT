import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';

import { TransactionCard } from '../components/transactions/TransactionCard';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { useTransactions } from './hooks/useTransactions';
import { TextInput } from 'react-native';

export function TransactionsScreen() {
  const currency = useSettingsStore((state) => state.currency);
  const query = useUIStore((state) => state.transactionSearchQuery);
  const setQuery = useUIStore((state) => state.setTransactionSearchQuery);
  const { transactions, isLoading } = useTransactions();

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return transactions;
    }

    const q = query.toLowerCase();
    return transactions.filter((item) =>
      [item.merchant ?? '', item.description ?? '', item.categoryName ?? item.categoryId ?? ''].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [query, transactions]);
  const hasActiveSearch = query.trim().length > 0;

  return (
    <View className="flex-1 bg-white p-4">
      <View className="mb-6 gap-2">
        <Text className="text-4xl font-bold tracking-tight text-black">Transactions</Text>
        <Text className="text-sm font-medium text-neutral-400">Your history with SmartSpend</Text>
      </View>

      <View className="mb-4 border-b border-neutral-100 pb-2">
        <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">Search</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="merchant, notes, category"
          placeholderTextColor="#D4D4D4"
          className="pt-1 text-xl font-bold text-black"
        />
      </View>

      <Text className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
        {isLoading ? 'Loading' : `${filtered.length} transaction(s)`}
      </Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionCard item={item} currency={currency} />}
        ListEmptyComponent={
          <Text className="py-8 text-center text-sm font-medium text-neutral-400">
            {hasActiveSearch ? 'No transactions match your search.' : 'No transactions yet.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}
