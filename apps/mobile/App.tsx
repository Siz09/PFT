import './global.css';

import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { databaseManager } from './src/db/DatabaseManager';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    databaseManager
      .getDatabase()
      .then(() => setIsReady(true))
      .catch((dbError) => {
        const message = dbError instanceof Error ? dbError.message : 'Unknown database error';
        setError(message);
      });
  }, []);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-6">
        <Text className="text-lg font-semibold text-red-600">Database init failed</Text>
        <Text className="mt-2 text-center text-sm text-neutral-700">{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <Text className="text-base font-medium text-neutral-700">Preparing local database...</Text>
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
