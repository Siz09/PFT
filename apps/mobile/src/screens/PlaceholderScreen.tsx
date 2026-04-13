import { Text, View } from 'react-native';

type PlaceholderScreenProps = {
  title: string;
  hint?: string;
};

export function PlaceholderScreen({ title, hint = 'Planned in next phase.' }: PlaceholderScreenProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-neutral-50 px-6">
      <Text className="text-xl font-semibold text-neutral-900">{title}</Text>
      <Text className="text-center text-sm text-neutral-600">{hint}</Text>
    </View>
  );
}
