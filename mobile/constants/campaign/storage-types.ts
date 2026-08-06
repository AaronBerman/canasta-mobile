export interface LevelResult {
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
}

export interface CampaignProgress {
  /** One guided hand (draw → meld → discard) before the campaign map. */
  introTutorialCompleted: boolean;
  /** Next level available to play (1-based). */
  highestUnlockedLevel: number;
  levelResults: Record<number, LevelResult>;
}

export function highestCompletedLevel(progress: CampaignProgress): number {
  let max = 0;
  for (const [id, result] of Object.entries(progress.levelResults)) {
    if (result.completed) max = Math.max(max, Number(id));
  }
  return max;
}
