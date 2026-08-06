/**
 * Configurable house rules for Canasta.
 * Use presets or build a custom ruleset — see docs/CUSTOM_RULES.md.
 */

export interface InitialMeldThreshold {
  /** Team score must be at or below this value for the threshold to apply. */
  upToScore: number;
  minPoints: number;
}

export interface GameRules {
  id: string;
  name: string;
  description: string;
  cardsPerHand: number;
  targetScore: number;
  requirePartnerTookDiscard: boolean;
  /** How many canastas (7+ card melds) the team must have to go out. 0 = not required. */
  canastasRequiredToGoOut: number;
  allowTakeDiscardPile: boolean;
  frozenPileEnabled: boolean;
  /** Black 3 on discard top blocks the pile from being taken. */
  blackThreeBlocksPile: boolean;
  oneCardFreezeRule: boolean;
  initialMeldThresholds: InitialMeldThreshold[];
  naturalCanastaBonus: number;
  mixedCanastaBonus: number;
  goingOutBonus: number;
  redThreeValue: number;
  /** Penalty per red three on table when team never melded (-100 classic). */
  redThreePenaltyNoMeld: number;
  redThreePenaltyInHand: number;
  allFourRedThreesBonus: number;
  minMeldSize: number;
  frozenPileNaturalPair: number;
}

export const CLASSIC_RULES: GameRules = {
  id: 'classic',
  name: 'Classic American',
  description: 'Standard American Canasta rules with partnership play.',
  cardsPerHand: 11,
  targetScore: 5000,
  requirePartnerTookDiscard: true,
  canastasRequiredToGoOut: 1,
  allowTakeDiscardPile: true,
  frozenPileEnabled: true,
  blackThreeBlocksPile: true,
  oneCardFreezeRule: false,
  initialMeldThresholds: [
    { upToScore: 1495, minPoints: 50 },
    { upToScore: 2995, minPoints: 90 },
    { upToScore: Infinity, minPoints: 120 },
  ],
  naturalCanastaBonus: 500,
  mixedCanastaBonus: 300,
  goingOutBonus: 100,
  redThreeValue: 100,
  redThreePenaltyNoMeld: 100,
  redThreePenaltyInHand: 500,
  allFourRedThreesBonus: 800,
  minMeldSize: 3,
  frozenPileNaturalPair: 2,
};

export const RELAXED_RULES: GameRules = {
  id: 'relaxed',
  name: 'Relaxed',
  description: 'Lower initial meld, no partner discard requirement, faster games.',
  cardsPerHand: 11,
  targetScore: 3500,
  requirePartnerTookDiscard: false,
  canastasRequiredToGoOut: 1,
  allowTakeDiscardPile: true,
  frozenPileEnabled: true,
  blackThreeBlocksPile: true,
  oneCardFreezeRule: false,
  initialMeldThresholds: [{ upToScore: Infinity, minPoints: 50 }],
  naturalCanastaBonus: 500,
  mixedCanastaBonus: 300,
  goingOutBonus: 100,
  redThreeValue: 100,
  redThreePenaltyNoMeld: 100,
  redThreePenaltyInHand: 300,
  allFourRedThreesBonus: 800,
  minMeldSize: 3,
  frozenPileNaturalPair: 2,
};

export const SPEED_RULES: GameRules = {
  id: 'speed',
  name: 'Speed Canasta',
  description: 'Quick hands — lower target score, canasta not required to go out.',
  cardsPerHand: 11,
  targetScore: 2500,
  requirePartnerTookDiscard: false,
  canastasRequiredToGoOut: 0,
  allowTakeDiscardPile: true,
  frozenPileEnabled: false,
  blackThreeBlocksPile: true,
  oneCardFreezeRule: false,
  initialMeldThresholds: [{ upToScore: Infinity, minPoints: 40 }],
  naturalCanastaBonus: 300,
  mixedCanastaBonus: 200,
  goingOutBonus: 50,
  redThreeValue: 100,
  redThreePenaltyNoMeld: 100,
  redThreePenaltyInHand: 200,
  allFourRedThreesBonus: 600,
  minMeldSize: 3,
  frozenPileNaturalPair: 2,
};

export const TUTORIAL_RULES: GameRules = {
  ...RELAXED_RULES,
  id: 'tutorial',
  name: 'Tutorial',
  description: 'Guided learning mode with relaxed go-out rules.',
  targetScore: 500,
  requirePartnerTookDiscard: false,
  canastasRequiredToGoOut: 0,
  initialMeldThresholds: [{ upToScore: Infinity, minPoints: 15 }],
  /** Keep single-hand tutorial levels on handOver, not gameOver. */
  naturalCanastaBonus: 200,
  mixedCanastaBonus: 100,
  goingOutBonus: 50,
};

export const RULE_PRESETS: Record<string, GameRules> = {
  classic: CLASSIC_RULES,
  relaxed: RELAXED_RULES,
  speed: SPEED_RULES,
  tutorial: TUTORIAL_RULES,
};

export const DEFAULT_RULES = CLASSIC_RULES;

export function getInitialMeldRequirement(teamScore: number, rules: GameRules): number {
  for (const t of rules.initialMeldThresholds) {
    if (teamScore <= t.upToScore) return t.minPoints;
  }
  return rules.initialMeldThresholds[rules.initialMeldThresholds.length - 1].minPoints;
}

export function buildCustomRules(
  baseId: keyof typeof RULE_PRESETS,
  overrides: Partial<Omit<GameRules, 'id' | 'name' | 'description'>> & {
    id?: string;
    name?: string;
    description?: string;
    /** @deprecated use canastasRequiredToGoOut */
    requireCanastaToGoOut?: boolean;
  },
): GameRules {
  const base = RULE_PRESETS[baseId] ?? CLASSIC_RULES;
  const normalized = { ...overrides };
  if (
    normalized.requireCanastaToGoOut !== undefined &&
    normalized.canastasRequiredToGoOut === undefined
  ) {
    normalized.canastasRequiredToGoOut = normalized.requireCanastaToGoOut ? 1 : 0;
  }
  delete normalized.requireCanastaToGoOut;
  return {
    ...base,
    ...normalized,
    id: normalized.id ?? `custom-${baseId}`,
    name: normalized.name ?? `Custom (${base.name})`,
    description: normalized.description ?? base.description,
    initialMeldThresholds: normalized.initialMeldThresholds ?? base.initialMeldThresholds,
  };
}

export function getCanastasRequiredToGoOut(rules: GameRules): number {
  return Math.max(0, rules.canastasRequiredToGoOut ?? 0);
}

export function validateRules(rules: GameRules): string[] {
  const errors: string[] = [];
  if (rules.cardsPerHand < 7 || rules.cardsPerHand > 15) {
    errors.push('cardsPerHand must be between 7 and 15');
  }
  if (rules.targetScore < 500) errors.push('targetScore must be at least 500');
  if (rules.minMeldSize < 3) errors.push('minMeldSize must be at least 3');
  if (rules.canastasRequiredToGoOut < 0 || rules.canastasRequiredToGoOut > 4) {
    errors.push('canastasRequiredToGoOut must be between 0 and 4');
  }
  if (rules.initialMeldThresholds.length === 0) {
    errors.push('At least one initial meld threshold is required');
  }
  return errors;
}
