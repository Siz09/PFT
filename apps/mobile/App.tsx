import './global.css';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const Tab = createBottomTabNavigator();

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderHint}>SmartSpend · Phase 1 shell</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
  },
  placeholderHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#737373',
  },
});

function HomeScreen() {
  return <PlaceholderScreen title="Home" />;
}
function HistoryScreen() {
  return <PlaceholderScreen title="History" />;
}
function ScanScreen() {
  return <PlaceholderScreen title="Scan" />;
}
function BudgetScreen() {
  return <PlaceholderScreen title="Budget" />;
}
function SettingsScreen() {
  return <PlaceholderScreen title="Settings" />;
}

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerTitleAlign: 'center',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Scan" component={ScanScreen} />
          <Tab.Screen name="Budget" component={BudgetScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </>
  );
}
