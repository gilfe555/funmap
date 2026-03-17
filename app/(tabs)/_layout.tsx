import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Tab bar hidden for MVP — only one tab exists.
        // Remove this when Groups/Stats tabs are added in future iterations.
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Map' }} />
      {/* Future iterations: Groups, Stats tabs will be added here */}
    </Tabs>
  );
}
