import { Card, cardRankValue, isRedThree } from './cards.js';
import { GameRules, DEFAULT_RULES } from './game-rules.js';
import { isMixedCanasta, isNaturalCanasta, Meld, meldPointValue } from './melds.js';

export interface HandScore {
  meldPoints: number;
  canastaBonus: number;
  redThreeBonus: number;
  goingOutBonus: number;
  handPenalty: number;
  total: number;
}

export type CanastaType = 'natural' | 'mixed';

export function getCanastaType(meld: Meld): CanastaType | null {
  if (meld.cards.length < 7) return null;
  if (isNaturalCanasta(meld)) return 'natural';
  if (isMixedCanasta(meld)) return 'mixed';
  return null;
}

/** Live label for a canasta pile (natural = red, mixed = black). */
export function canastaTypeLabel(type: CanastaType): string {
  return type === 'natural' ? 'Red Canasta' : 'Black Canasta';
}

/**
 * Score red threes laid on the table for a team.
 * +100 each if the team has melded; -100 each if not.
 * All four red threes on one team doubles the positive total (800 classic).
 */
export function scoreRedThrees(
  redThrees: Card[],
  teamHasMelded: boolean,
  rules: GameRules = DEFAULT_RULES,
): number {
  if (redThrees.length === 0) return 0;

  const penaltyEach = rules.redThreePenaltyNoMeld ?? rules.redThreeValue;

  if (!teamHasMelded) {
    return -redThrees.length * penaltyEach;
  }

  if (redThrees.length === 4) {
    return rules.allFourRedThreesBonus;
  }

  return redThrees.length * rules.redThreeValue;
}

/** Human-readable red three score for UI. */
export function describeRedThreeScore(
  redThrees: Card[],
  teamHasMelded: boolean,
  rules: GameRules = DEFAULT_RULES,
): string {
  if (redThrees.length === 0) return '';
  const total = scoreRedThrees(redThrees, teamHasMelded, rules);
  if (!teamHasMelded) {
    return `${total} pts (no meld on table)`;
  }
  if (redThrees.length === 4) {
    return `+${total} pts (all 4 — double)`;
  }
  return `+${total} pts`;
}

export function scoreHand(
  teamMelds: Meld[],
  redThrees: Card[],
  cardsLeftInHand: Card[],
  wentOut: boolean,
  teamHasMelded: boolean,
  rules: GameRules = DEFAULT_RULES,
): HandScore {
  const meldPoints = teamMelds.reduce((s, m) => s + meldPointValue(m), 0);

  let canastaBonus = 0;
  for (const m of teamMelds) {
    const type = getCanastaType(m);
    if (type === 'natural') canastaBonus += rules.naturalCanastaBonus;
    else if (type === 'mixed') canastaBonus += rules.mixedCanastaBonus;
  }

  const redThreeBonus = scoreRedThrees(redThrees, teamHasMelded, rules);

  const goingOutBonus = wentOut ? rules.goingOutBonus : 0;

  let handPenalty = 0;
  for (const c of cardsLeftInHand) {
    if (isRedThree(c)) {
      handPenalty += rules.redThreePenaltyInHand;
    } else {
      handPenalty += cardRankValue(c);
    }
  }

  const total = meldPoints + canastaBonus + redThreeBonus + goingOutBonus - handPenalty;

  return { meldPoints, canastaBonus, redThreeBonus, goingOutBonus, handPenalty, total };
}

export function scoreOpponentHands(opponentHands: Card[][]): number {
  return opponentHands.reduce(
    (teamPenalty, hand) => teamPenalty + hand.reduce((s, c) => s + cardRankValue(c), 0),
    0,
  );
}
