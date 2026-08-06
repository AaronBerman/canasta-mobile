import { Stack } from 'expo-router';

export default function CampaignLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Campaign' }} />
      <Stack.Screen name="intro" options={{ title: 'Quick Start', headerBackVisible: false }} />
      <Stack.Screen
        name="[levelId]"
        options={({ route }) => ({
          title: `Level ${(route.params as { levelId?: string })?.levelId ?? ''}`,
        })}
      />
    </Stack>
  );
}
