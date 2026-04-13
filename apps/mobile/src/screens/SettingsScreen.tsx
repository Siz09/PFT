import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { type ThemePreference, useSettingsStore } from '../stores/settingsStore';

const parseTheme = (value: string): ThemePreference => {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
};

export function SettingsScreen() {
  const profileName = useSettingsStore((state) => state.profileName);
  const currency = useSettingsStore((state) => state.currency);
  const theme = useSettingsStore((state) => state.theme);
  const setProfileName = useSettingsStore((state) => state.setProfileName);
  const setCurrency = useSettingsStore((state) => state.setCurrency);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const [localThemeInput, setLocalThemeInput] = useState<string>(theme);

  useEffect(() => {
    setLocalThemeInput(theme);
  }, [theme]);

  return (
    <View className="flex-1 gap-8 bg-white p-4">
      <Text className="text-4xl font-bold tracking-tight text-black">Settings</Text>
      <Card className="gap-4">
        <Text className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Profile</Text>
        <Input label="Display name" value={profileName} onChangeText={setProfileName} />
      </Card>
      <Card className="gap-4">
        <Text className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Preferences</Text>
        <Input label="Currency (ISO)" value={currency} onChangeText={(value) => setCurrency(value.toUpperCase())} />
        <Input
          label="Theme (light|dark|system)"
          value={localThemeInput}
          onChangeText={setLocalThemeInput}
          onBlur={() => setTheme(parseTheme(localThemeInput.trim().toLowerCase()))}
        />
      </Card>
    </View>
  );
}
