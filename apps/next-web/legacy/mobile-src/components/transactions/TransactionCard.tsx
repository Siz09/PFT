import { Text, View } from 'react-native';

import { AmountDisplay } from '../ui/AmountDisplay';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import type { TransactionRecord } from '../../types/finance';

type TransactionCardProps = {
  item: TransactionRecord;
  currency: string;
};

export function TransactionCard({ item, currency }: TransactionCardProps) {
  return (
    <Card className="mb-4">
      <View className="flex-row items-center justify-between">
        <View className="mr-3 flex-1 gap-1">
          <Text className="text-lg font-bold tracking-tight text-black">{item.merchant || 'Manual entry'}</Text>
          <Text className="text-sm font-medium text-neutral-400">{item.description || 'No description'}</Text>
          <View className="flex-row items-center gap-2">
            <Badge label={item.type} />
            <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{item.date}</Text>
          </View>
        </View>
        <AmountDisplay amountCents={item.amountCents} type={item.type} currency={currency} />
      </View>
    </Card>
  );
}
