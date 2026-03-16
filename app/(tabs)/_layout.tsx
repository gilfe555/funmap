import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.funGreen,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            // Placeholder — replace with an icon library in future iterations
            <MapTabIcon color={color} />
          ),
        }}
      />
      {/* Future iterations: Groups, Stats tabs will be added here */}
    </Tabs>
  );
}

function MapTabIcon({ color }: { color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, color }}>🗺️</Text>;
}
