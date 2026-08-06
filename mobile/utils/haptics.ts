import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type GameHapticAction =
  | 'draw'
  | 'takeDiscard'
  | 'meld'
  | 'skip'
  | 'discard'
  | 'error';

async function run(fn: () => Promise<void>): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await fn();
  } catch {
    // Haptics unavailable on some devices/simulators
  }
}

export function hapticForAction(action: GameHapticAction): void {
  switch (action) {
    case 'draw':
    case 'skip':
      void run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      break;
    case 'meld':
    case 'discard':
      void run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
      break;
    case 'takeDiscard':
      void run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
      break;
    case 'error':
      void run(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      );
      break;
  }
}
