import { UnlockAttemptResult } from '../constants/cosmetics/types';
import {
  buildUnlockResult,
  loadCosmetics,
  saveCosmetics,
  unlockCosmetic,
} from './cosmetics-storage';

/**
 * Rewarded-ad unlock flow.
 * Replace showRewardedAd() with expo-ads-admob or react-native-google-mobile-ads
 * when you integrate a real ad SDK.
 */
export async function unlockViaRewardedAd(cosmeticId: string): Promise<UnlockAttemptResult> {
  const adCompleted = await showRewardedAd();

  if (!adCompleted) {
    return buildUnlockResult(cosmeticId, false);
  }

  const cosmetics = await loadCosmetics();
  const updated = unlockCosmetic(cosmetics, cosmeticId);
  await saveCosmetics(updated);
  return buildUnlockResult(cosmeticId, true);
}

/** Stub — swap for real ad SDK integration. */
async function showRewardedAd(): Promise<boolean> {
  // Simulates a successful ad view during development.
  // In production, resolve true only after the ad SDK fires onRewarded.
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 800);
  });
}

export interface AdServiceConfig {
  /** AdMob rewarded unit id — set in app config when integrating ads. */
  rewardedUnitId?: string;
}

export const adServiceConfig: AdServiceConfig = {
  rewardedUnitId: undefined,
};
