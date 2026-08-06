import { AIDifficulty, GameRules } from '../../engine/index';
import { DealResult } from '../../engine/index';

export type CampaignChapter = 'tutorial' | 'challenge';

export type CampaignObjectiveType =
  | 'intro_first_hand'
  | 'draw_and_discard'
  | 'lay_meld'
  | 'lay_initial_meld'
  | 'add_to_meld'
  | 'pre_draw_meld'
  | 'take_discard_pile'
  | 'meld_discard_top'
  | 'use_wild_in_meld'
  | 'complete_canasta'
  | 'go_out'
  | 'go_out_within_turns'
  | 'make_two_canastas'
  | 'score_hand_points';

export interface CampaignObjective {
  type: CampaignObjectiveType;
  /** Rank for rank-specific objectives (e.g. complete canasta of 7s). */
  rank?: string;
  /** Max human turns for timed scenarios. */
  maxTurns?: number;
  /** Minimum hand score when going out. */
  minHandPoints?: number;
}

export interface CampaignLevel {
  id: number;
  chapter: CampaignChapter;
  title: string;
  description: string;
  hint: string;
  objective: CampaignObjective;
  rulesPreset: 'tutorial' | 'relaxed' | 'classic' | 'speed';
  rulesOverrides?: GameRules;
  aiDifficulties: [AIDifficulty, AIDifficulty, AIDifficulty];
  openingMessage?: string;
  /** Cosmetic unlocked when this level is completed (milestones: 10, 20, 30, 40, 50). */
  rewardCosmeticId?: string;
  /** Build the scripted deal for this level. */
  buildDeal: () => DealResult;
  /** Optional melds already on the table at start. */
  initialMelds?: Array<{
    teamId: number;
    rank: string;
    cardCount: number;
    natural?: boolean;
  }>;
  /** Mark partner as having taken discard (for go-out tutorials). */
  partnerTookDiscard?: boolean;
}

/** Level metadata without deal builders — safe for list screens (no deals module). */
export type CampaignLevelDefinition = Omit<CampaignLevel, 'buildDeal'>;

export interface CampaignRunStats {
  humanTurns: number;
  hasDrawn: boolean;
  hasDiscarded: boolean;
  hasMelded: boolean;
  hasInitialMelded: boolean;
  hasAddedToMeld: boolean;
  hasPreDrawMelded: boolean;
  hasTakenDiscard: boolean;
  hasMeldRequiredTop: boolean;
  hasUsedWild: boolean;
  canastasCompleted: number;
}

export function createEmptyRunStats(): CampaignRunStats {
  return {
    humanTurns: 0,
    hasDrawn: false,
    hasDiscarded: false,
    hasMelded: false,
    hasInitialMelded: false,
    hasAddedToMeld: false,
    hasPreDrawMelded: false,
    hasTakenDiscard: false,
    hasMeldRequiredTop: false,
    hasUsedWild: false,
    canastasCompleted: 0,
  };
}

export interface LevelCompletionResult {
  stars: 1 | 2 | 3;
  newlyUnlockedCosmetic?: string;
  unlockedNextLevel: boolean;
}
