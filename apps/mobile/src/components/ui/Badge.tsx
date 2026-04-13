import { Text, View } from 'react-native';

type BadgeProps = {
  label: string;
};

export function Badge({ label }: BadgeProps) {
  return (
    <View className="rounded-full bg-neutral-100 px-3 py-1">
      <Text className="text-xs font-medium uppercase tracking-wide text-neutral-700">{label}</Text>
    </View>
  );
}
