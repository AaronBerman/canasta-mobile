import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIDifficulty, getPartnerIndex } from '../engine/index';

const STORAGE_KEY = '@canasta/ai-difficulty';

export interface AIDifficultySettings {
  partner: AIDifficulty;
  opponent: AIDifficulty;
}

export const AI_DIFFICULTY_OPTIONS: AIDifficulty[] = ['easy', 'medium', 'hard'];

export const DEFAULT_AI_DIFFICULTY: AIDifficultySettings = {
  partner: 'medium',
  opponent: 'medium',
};

export async function loadAIDifficultySettings(): Promise<AIDifficultySettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_DIFFICULTY;
    const parsed = JSON.parse(raw) as Partial<AIDifficultySettings>;
    return {
      partner: isDifficulty(parsed.partner) ? parsed.partner : DEFAULT_AI_DIFFICULTY.partner,
      opponent: isDifficulty(parsed.opponent) ? parsed.opponent : DEFAULT_AI_DIFFICULTY.opponent,
    };
  } catch {
    return DEFAULT_AI_DIFFICULTY;
  }
}

export async function saveAIDifficultySettings(
  settings: AIDifficultySettings,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Map partner / opponent settings to the 3 AI seat difficulties. */
export function buildAiDifficultiesForMatch(
  humanSeat: number,
  settings: AIDifficultySettings,
  playerCount = 4,
): [AIDifficulty, AIDifficulty, AIDifficulty] {
  const difficulties: AIDifficulty[] = [];

  for (let seat = 0; seat < playerCount; seat++) {
    if (seat === humanSeat) continue;
    const isPartner = seat === getPartnerIndex(humanSeat, playerCount);
    difficulties.push(isPartner ? settings.partner : settings.opponent);
  }

  return difficulties as [AIDifficulty, AIDifficulty, AIDifficulty];
}

export function difficultyLabel(level: AIDifficulty): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function isDifficulty(value: unknown): value is AIDifficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}
