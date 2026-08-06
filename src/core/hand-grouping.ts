import { Card, isRedThree, isBlackThree, isWild, Rank } from './cards.js';
import { Meld } from './melds.js';

const RANK_ORDER: Rank[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'JOKER',
];

function rankIndex(rank: Rank): number {
  const i = RANK_ORDER.indexOf(rank);
  return i >= 0 ? i : RANK_ORDER.length;
}

export interface HandGroupOptions {
  teamMelds?: Meld[];
  minMeldSize?: number;
}

function rankPriority(
  rank: Rank,
  count: number,
  meldedRanks: Set<Rank>,
  minMeldSize: number,
): number {
  let score = 0;
  if (meldedRanks.has(rank)) score += 1000;
  if (count >= minMeldSize) score += 500;
  if (count === minMeldSize - 1) score += 200;
  if (count === minMeldSize - 2) score += 50;
  return score;
}

/** Organize hand cards into logical meld groups — wilds always stay separate. */
export function groupHandIntoSets(
  hand: Card[],
  options: HandGroupOptions = {},
): Card[][] {
  const { teamMelds = [], minMeldSize = 3 } = options;
  const meldedRanks = new Set(teamMelds.map((m) => m.rank));

  const redThrees: Card[] = [];
  const blackThrees: Card[] = [];
  const wilds: Card[] = [];
  const byRank = new Map<Rank, Card[]>();

  for (const card of hand) {
    if (isRedThree(card)) {
      redThrees.push(card);
      continue;
    }
    if (isBlackThree(card)) {
      blackThrees.push(card);
      continue;
    }
    if (isWild(card)) {
      wilds.push(card);
      continue;
    }
    const group = byRank.get(card.rank) ?? [];
    group.push(card);
    byRank.set(card.rank, group);
  }

  const groups: Card[][] = [];
  if (redThrees.length > 0) groups.push([...redThrees]);

  const ranks = [...byRank.keys()].sort((a, b) => {
    const diff =
      rankPriority(b, byRank.get(b)!.length, meldedRanks, minMeldSize) -
      rankPriority(a, byRank.get(a)!.length, meldedRanks, minMeldSize);
    if (diff !== 0) return diff;
    return rankIndex(a) - rankIndex(b);
  });

  for (const rank of ranks) {
    groups.push([...byRank.get(rank)!]);
  }

  if (wilds.length > 0) {
    groups.push([...wilds].sort((a, b) => rankIndex(a.rank) - rankIndex(b.rank)));
  }

  if (blackThrees.length > 0) {
    groups.push([...blackThrees]);
  }

  return groups;
}

/** Split manually ordered cards into contiguous same-rank/wild groups. */
export function groupHandByManualOrder(cards: Card[]): Card[][] {
  if (cards.length === 0) return [];

  const groups: Card[][] = [[cards[0]]];

  for (let i = 1; i < cards.length; i++) {
    const card = cards[i];
    const lastGroup = groups[groups.length - 1];
    const groupRank = lastGroup.find((c) => !isWild(c) && !isRedThree(c) && !isBlackThree(c))?.rank;
    const lastIsWildGroup = lastGroup.every(isWild);
    const lastIsRedThreeGroup = lastGroup.every(isRedThree);
    const lastIsBlackThreeGroup = lastGroup.every(isBlackThree);

    if (isRedThree(card)) {
      if (lastIsRedThreeGroup) lastGroup.push(card);
      else groups.push([card]);
    } else if (isBlackThree(card)) {
      if (lastIsBlackThreeGroup) lastGroup.push(card);
      else groups.push([card]);
    } else if (isWild(card)) {
      if (lastIsWildGroup) lastGroup.push(card);
      else groups.push([card]);
    } else if (groupRank && card.rank === groupRank && !lastIsWildGroup) {
      lastGroup.push(card);
    } else {
      groups.push([card]);
    }
  }

  return groups;
}

/** Flat list of hand cards sorted into auto-groups. */
export function groupHandCards(hand: Card[], options: HandGroupOptions = {}): Card[] {
  return groupHandIntoSets(hand, options).flat();
}

/** Card ids in auto-grouped order. */
export function groupHandOrder(
  hand: Card[],
  options: HandGroupOptions = {},
): string[] {
  return groupHandCards(hand, options).map((c) => c.id);
}

/** Resolve a flat id order back to cards (drops missing ids). */
export function orderHandByIds(hand: Card[], order: string[]): Card[] {
  const byId = new Map(hand.map((c) => [c.id, c]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean) as Card[];
  for (const c of hand) {
    if (!order.includes(c.id)) ordered.push(c);
  }
  return ordered;
}

/** Re-group only cards that were newly added to the hand. */
export function syncGroupedHandOrder(
  hand: Card[],
  previousOrder: string[],
  options: HandGroupOptions = {},
): string[] {
  const handIds = new Set(hand.map((c) => c.id));
  const keptIds = previousOrder.filter((id) => handIds.has(id));
  if (keptIds.length === hand.length) return keptIds;

  const keptSet = new Set(keptIds);
  const newCards = hand.filter((c) => !keptSet.has(c.id));
  if (newCards.length === 0) return keptIds;

  const groupedNew = groupHandIntoSets(newCards, options);
  const newOrder = groupedNew.flat().map((c) => c.id);
  return [...keptIds, ...newOrder];
}

export function handSignature(hand: Card[]): string {
  return hand
    .map((c) => c.id)
    .sort()
    .join('|');
}
