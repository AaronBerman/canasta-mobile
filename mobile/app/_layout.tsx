import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { CosmeticsProvider } from '../stores/cosmetics-store';
import { ToastProvider } from '../contexts/ToastContext';
import { MULTIPLAYER_ENABLED } from '../constants/features';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <CosmeticsProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#0f172a' },
              headerTintColor: '#f8fafc',
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: '#0f172a' },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Canasta Table' }} />
            <Stack.Screen name="game" options={{ title: 'Play' }} />
            <Stack.Screen name="campaign" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen
              name="multiplayer"
              options={{
                title: 'Multiplayer',
                href: MULTIPLAYER_ENABLED ? undefined : null,
              }}
            />
            <Stack.Screen name="customize" options={{ href: null }} />
            <Stack.Screen name="rules" options={{ href: null }} />
          </Stack>
        </CosmeticsProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
