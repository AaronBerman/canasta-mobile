/**
 * Feature flags for release builds.
 *
 * Play Store / App Store v1: leave EXPO_PUBLIC_MULTIPLAYER_ENABLED unset or "false".
 * Internal dev: set EXPO_PUBLIC_MULTIPLAYER_ENABLED=true in .env or EAS profile.
 */
export const MULTIPLAYER_ENABLED =
  process.env.EXPO_PUBLIC_MULTIPLAYER_ENABLED === 'true';
