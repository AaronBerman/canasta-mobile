import { AIDifficulty } from '../engine/index';

const BASE_DELAY_MS: Record<AIDifficulty, number> = {
  easy: 1400,
  medium: 2000,
  hard: 2600,
};

/** Pause before the AI acts so turns feel deliberate, with slight randomness. */
export function getAIThinkDelayMs(difficulty: AIDifficulty = 'medium'): number {
  const jitter = Math.floor(Math.random() * 450);
  return BASE_DELAY_MS[difficulty] + jitter;
}
