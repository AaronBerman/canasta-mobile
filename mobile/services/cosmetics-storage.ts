import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_COSMETICS,
  PlayerCosmetics,
  STORAGE_KEY,
  UnlockAttemptResult,
} from '../constants/cosmetics/types';
import { getCosmeticById } from '../constants/cosmetics/catalog';
import type { CampaignProgress } from '../constants/campaign/storage-types';
import { highestCompletedLevel } from '../constants/campaign/storage-types';

export interface PlayerProgress {
  singlePlayerWins: number;
  singlePlayerPoints: number;
}

const DEFAULT_PROGRESS: PlayerProgress = {
  singlePlayerWins: 0,
  singlePlayerPoints: 0,
};

const PROGRESS_KEY = '@canasta/progress';

export async function loadCosmetics(): Promise<PlayerCosmetics> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COSMETICS;
    return { ...DEFAULT_COSMETICS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_COSMETICS;
  }
}

export async function saveCosmetics(cosmetics: PlayerCosmetics): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cosmetics));
}

export async function loadProgress(): Promise<PlayerProgress> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function saveProgress(progress: PlayerProgress): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function isUnlocked(cosmetics: PlayerCosmetics, cosmeticId: string): boolean {
  return cosmetics.unlockedIds.includes(cosmeticId);
}

export function canUnlockByProgress(
  cosmeticId: string,
  progress: PlayerProgress,
  campaignProgress?: CampaignProgress,
): boolean {
  const cosmetic = getCosmeticById(cosmeticId);
  if (!cosmetic) return false;

  const { unlock } = cosmetic;
  if (unlock.method === 'default') return true;
  if (unlock.method === 'rewarded_ad') return false;

  const threshold = unlock.threshold ?? 0;
  if (unlock.method === 'single_player_win') {
    return progress.singlePlayerWins >= threshold;
  }
  if (unlock.method === 'single_player_milestone') {
    return progress.singlePlayerPoints >= threshold;
  }
  if (unlock.method === 'campaign_level') {
    if (!campaignProgress) return false;
    return highestCompletedLevel(campaignProgress) >= threshold;
  }
  return false;
}

export function unlockCosmetic(
  cosmetics: PlayerCosmetics,
  cosmeticId: string,
): PlayerCosmetics {
  if (cosmetics.unlockedIds.includes(cosmeticId)) return cosmetics;
  return {
    ...cosmetics,
    unlockedIds: [...cosmetics.unlockedIds, cosmeticId],
  };
}

export function selectCosmetic(
  cosmetics: PlayerCosmetics,
  category: 'cardBack' | 'fontStyle' | 'tableSkin',
  cosmeticId: string,
): PlayerCosmetics {
  switch (category) {
    case 'cardBack':
      return { ...cosmetics, selectedCardBackId: cosmeticId };
    case 'fontStyle':
      return { ...cosmetics, selectedFontStyleId: cosmeticId };
    case 'tableSkin':
      return { ...cosmetics, selectedTableSkinId: cosmeticId };
  }
}

/** Record a single-player hand result and auto-unlock eligible cosmetics. */
export async function recordSinglePlayerResult(
  won: boolean,
  pointsScored: number,
): Promise<{ cosmetics: PlayerCosmetics; newlyUnlocked: string[] }> {
  const [cosmetics, progress] = await Promise.all([loadCosmetics(), loadProgress()]);

  const updatedProgress: PlayerProgress = {
    singlePlayerWins: progress.singlePlayerWins + (won ? 1 : 0),
    singlePlayerPoints: progress.singlePlayerPoints + pointsScored,
  };

  let updated = cosmetics;
  const newlyUnlocked: string[] = [];

  const { ALL_COSMETICS } = await import('../constants/cosmetics/catalog');
  for (const item of ALL_COSMETICS) {
    if (
      !updated.unlockedIds.includes(item.id) &&
      canUnlockByProgress(item.id, updatedProgress)
    ) {
      updated = unlockCosmetic(updated, item.id);
      newlyUnlocked.push(item.id);
    }
  }

  await Promise.all([saveCosmetics(updated), saveProgress(updatedProgress)]);
  return { cosmetics: updated, newlyUnlocked };
}

export function buildUnlockResult(cosmeticId: string, success: boolean): UnlockAttemptResult {
  const cosmetic = getCosmeticById(cosmeticId);
  return {
    success,
    cosmeticId,
    message: success
      ? `${cosmetic?.name ?? 'Item'} unlocked!`
      : 'Unlock failed. Please try again.',
  };
}
