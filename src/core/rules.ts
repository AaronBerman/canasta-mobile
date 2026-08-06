import { Card, isBlackThree, isRedThree, isWild } from './cards.js';
import { drawFromStock } from './deck.js';
import { GameRules, DEFAULT_RULES, getInitialMeldRequirement as getInitialFromRules, getCanastasRequiredToGoOut } from './game-rules.js';
import { teamMeldTablePoints, countCanastas } from './game-status.js';
import { isValidMeld, Meld } from './melds.js';
import { meldPointsWithDiscardTop } from './meld-selection.js';

/** Minimum initial meld points based on team cumulative score. */
export function initialMeldRequirement(
  teamScore: number,
  rules: GameRules = DEFAULT_RULES,
): number {
  return getInitialFromRules(teamScore, rules);
}

export type DiscardPileStatus = 'open' | 'frozen' | 'blocked';

/** Wild or red 3 cannot remain the opening discard top before the first turn. */
export function isInvalidOpeningDiscardTop(card: Card): boolean {
  return isWild(card) || isRedThree(card);
}

/**
 * After the deal, turn stock cards onto the discard pile while the top is wild or red 3.
 * Stops when a natural card is on top or the stock is empty.
 */
export function resolveOpeningDiscardPile(
  stock: Card[],
  discard: Card[],
): { stock: Card[]; discard: Card[] } {
  let nextStock = stock;
  let nextDiscard = [...discard];

  while (
    nextDiscard.length > 0 &&
    isInvalidOpeningDiscardTop(nextDiscard[nextDiscard.length - 1]) &&
    nextStock.length > 0
  ) {
    const draw = drawFromStock(nextStock);
    if (!draw) break;
    nextStock = draw.stock;
    nextDiscard.push(draw.card);
  }

  return { stock: nextStock, discard: nextDiscard };
}

/** Black 3 on top permanently blocks taking the discard pile. */
export function isDiscardBlockedByBlackThree(
  discard: Card[],
  rules: GameRules = DEFAULT_RULES,
): boolean {
  if (!rules.blackThreeBlocksPile || discard.length === 0) return false;
  return isBlackThree(discard[discard.length - 1]);
}

/** Pile is frozen when it contains a wild or a red 3 (classic American Canasta). */
export function isDiscardPileFrozen(
  discard: Card[],
  rules: GameRules = DEFAULT_RULES,
): boolean {
  if (!rules.frozenPileEnabled || discard.length === 0) return false;
  return discard.some(isWild) || discard.some(isRedThree);
}

export function getDiscardPileStatus(
  discard: Card[],
  rules: GameRules = DEFAULT_RULES,
): DiscardPileStatus {
  if (discard.length === 0) return 'open';
  if (isDiscardBlockedByBlackThree(discard, rules)) return 'blocked';
  if (isDiscardPileFrozen(discard, rules)) return 'frozen';
  return 'open';
}

export function describeDiscardPileStatus(
  discard: Card[],
  rules: GameRules = DEFAULT_RULES,
): string {
  const status = getDiscardPileStatus(discard, rules);
  if (status === 'blocked') return 'Blocked — black 3 (cannot take pile)';
  if (status === 'frozen') {
    const top = discard[discard.length - 1];
    if (isWild(top)) {
      return 'Frozen — wild on top (cannot take pile)';
    }
    if (isRedThree(top)) {
      return 'Frozen — red 3 on top (cannot take pile)';
    }
    return `Frozen — need ${rules.frozenPileNaturalPair}× ${top.rank} in hand to take`;
  }
  return 'Open — pile can be taken if meld legal';
}

function naturalsMatchingTopForFrozenTake(hand: Card[], top: Card): Card[] {
  return hand.filter(
    (c) => c.rank === top.rank && !isWild(c) && !isRedThree(c) && !isBlackThree(c),
  );
}

/**
 * Points counted toward the opening meld when evaluating a discard take.
 * Only the discard top may contribute (never buried pile cards). When the pile
 * is frozen, the top card does not count toward the opening threshold.
 */
export function openingPointsIfDiscardTaken(
  hand: Card[],
  discard: Card[],
  teamMelds: Meld[],
  teamHasMelded: boolean,
  rules: GameRules = DEFAULT_RULES,
): number {
  if (discard.length === 0) return 0;

  const top = discard[discard.length - 1];
  const tablePoints = teamMeldTablePoints(teamMelds);
  const topMeldPoints = meldPointsWithDiscardTop(
    hand,
    top,
    teamMelds,
    rules.minMeldSize,
  );

  if (teamHasMelded) return topMeldPoints;

  const topCountsForOpening = !isDiscardPileFrozen(discard, rules);
  return tablePoints + (topCountsForOpening ? topMeldPoints : 0);
}

/** Can the player legally take the discard pile?
 *  @param meldPointsIfTaken — for an opening team, total opening points after the take
 *    (staged table melds plus discard top when allowed — see openingPointsIfDiscardTaken).
 *    Ignored once the team has melded.
 */
export function canTakeDiscardPile(
  hand: Card[],
  discard: Card[],
  teamHasMelded: boolean,
  meldPointsIfTaken: number,
  teamScore: number,
  rules: GameRules = DEFAULT_RULES,
): boolean {
  if (!rules.allowTakeDiscardPile || discard.length === 0) return false;

  if (isDiscardBlockedByBlackThree(discard, rules)) return false;

  const top = discard[discard.length - 1];
  if (isRedThree(top)) return false;

  const frozen = isDiscardPileFrozen(discard, rules);

  if (frozen) {
    if (isWild(top)) return false;
    const naturalsOfTop = naturalsMatchingTopForFrozenTake(hand, top);
    if (naturalsOfTop.length < rules.frozenPileNaturalPair) return false;
  }

  if (!teamHasMelded) {
    const required = initialMeldRequirement(teamScore, rules);
    if (meldPointsIfTaken < required) return false;
  }

  return true;
}

/** One-card freeze: cannot discard a single card matching the current top. */
export function isLegalDiscard(
  discard: Card[],
  card: Card,
  rules: GameRules = DEFAULT_RULES,
): boolean {
  if (discard.length === 0) return true;
  if (isBlackThree(card)) return true;
  if (!rules.oneCardFreezeRule) return true;
  const top = discard[discard.length - 1];
  if (isWild(top)) return true;
  return !(card.rank === top.rank && !isWild(card));
}

export function teamHasCanasta(melds: Meld[], rules: GameRules = DEFAULT_RULES): boolean {
  return melds.some((m) => m.cards.length >= 7);
}

export function canGoOut(
  hand: Card[],
  teamMelds: Meld[],
  partnerTookDiscard: boolean,
  rules: GameRules = DEFAULT_RULES,
): boolean {
  if (countCanastas(teamMelds) < getCanastasRequiredToGoOut(rules)) return false;
  if (rules.requirePartnerTookDiscard && !partnerTookDiscard) return false;
  return hand.length === 1;
}

export function validateMeldBatch(melds: Meld[], rules: GameRules = DEFAULT_RULES): boolean {
  return melds.every((m) => isValidMeld(m.cards) && m.cards.length >= rules.minMeldSize);
}
