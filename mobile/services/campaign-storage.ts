import AsyncStorage from '@react-native-async-storage/async-storage';
import { unlockCosmetic, loadCosmetics, saveCosmetics } from './cosmetics-storage';
import { getCosmeticById, ALL_COSMETICS } from '../constants/cosmetics/catalog';
import { CampaignProgress, highestCompletedLevel } from '../constants/campaign/storage-types';

export type { CampaignProgress, LevelResult } from '../constants/campaign/storage-types';

const CAMPAIGN_KEY = '@canasta/campaign';

export const DEFAULT_CAMPAIGN_PROGRESS: CampaignProgress = {
  introTutorialCompleted: false,
  highestUnlockedLevel: 1,
  levelResults: {},
};

export async function loadCampaignProgress(): Promise<CampaignProgress> {
  try {
    const raw = await AsyncStorage.getItem(CAMPAIGN_KEY);
    if (!raw) return DEFAULT_CAMPAIGN_PROGRESS;
    const parsed = { ...DEFAULT_CAMPAIGN_PROGRESS, ...JSON.parse(raw) } as CampaignProgress;
    if (
      parsed.introTutorialCompleted === false &&
      highestCompletedLevel(parsed) > 0
    ) {
      parsed.introTutorialCompleted = true;
    }
    return parsed;
  } catch {
    return DEFAULT_CAMPAIGN_PROGRESS;
  }
}

export async function saveCampaignProgress(progress: CampaignProgress): Promise<void> {
  await AsyncStorage.setItem(CAMPAIGN_KEY, JSON.stringify(progress));
}

export function isLevelUnlocked(progress: CampaignProgress, levelId: number): boolean {
  return levelId <= progress.highestUnlockedLevel;
}

export function getLevelStars(progress: CampaignProgress, levelId: number): number {
  return progress.levelResults[levelId]?.stars ?? 0;
}

export { highestCompletedLevel } from '../constants/campaign/storage-types';

export function canUnlockByCampaign(cosmeticId: string, progress: CampaignProgress): boolean {
  const cosmetic = getCosmeticById(cosmeticId);
  if (!cosmetic || cosmetic.unlock.method !== 'campaign_level') return false;
  return highestCompletedLevel(progress) >= (cosmetic.unlock.threshold ?? 0);
}

/** Record level completion, advance unlock, and grant reward cosmetic. */
export async function recordCampaignLevelComplete(
  levelId: number,
  stars: 1 | 2 | 3,
  rewardCosmeticId?: string,
): Promise<{ progress: CampaignProgress; newlyUnlocked: string[] }> {
  const progress = await loadCampaignProgress();
  const prev = progress.levelResults[levelId];
  const bestStars = Math.max(prev?.stars ?? 0, stars) as 1 | 2 | 3;

  const updated: CampaignProgress = {
    highestUnlockedLevel: Math.max(progress.highestUnlockedLevel, levelId + 1, 1),
    levelResults: {
      ...progress.levelResults,
      [levelId]: { completed: true, stars: bestStars },
    },
  };

  let cosmetics = await loadCosmetics();
  const newlyUnlocked: string[] = [];

  const toUnlock = new Set<string>();
  if (rewardCosmeticId) toUnlock.add(rewardCosmeticId);

  for (const item of ALL_COSMETICS) {
    if (item.unlock.method === 'campaign_level' && canUnlockByCampaign(item.id, updated)) {
      toUnlock.add(item.id);
    }
  }

  for (const id of toUnlock) {
    if (!cosmetics.unlockedIds.includes(id)) {
      cosmetics = unlockCosmetic(cosmetics, id);
      newlyUnlocked.push(id);
    }
  }

  await Promise.all([saveCampaignProgress(updated), saveCosmetics(cosmetics)]);
  return { progress: updated, newlyUnlocked };
}

export async function markIntroTutorialComplete(): Promise<CampaignProgress> {
  const progress = await loadCampaignProgress();
  const updated: CampaignProgress = { ...progress, introTutorialCompleted: true };
  await saveCampaignProgress(updated);
  return updated;
}

export async function resetCampaignProgress(): Promise<CampaignProgress> {
  await saveCampaignProgress(DEFAULT_CAMPAIGN_PROGRESS);
  return DEFAULT_CAMPAIGN_PROGRESS;
}
