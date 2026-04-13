import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';

import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import type { RootStackParamList } from './types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontSize: 18, fontWeight: '700' },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F5F5F5',
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={({ navigation }) => ({
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('AddTransaction' as never)}>
              <Text className="text-sm font-bold text-black">Add</Text>
            </Pressable>
          ),
        })}
      />
      <Tab.Screen name="Scan" children={() => <PlaceholderScreen title="Scan" hint="OCR in Phase 2." />} />
      <Tab.Screen name="Budget" children={() => <PlaceholderScreen title="Budget" hint="Budgets in Phase 3." />} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ presentation: 'modal', title: 'New transaction' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
