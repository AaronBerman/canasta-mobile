import { Card, isBlackThree, isNatural, isWild, isRedThree, meldRank, Rank, cardRankValue } from './cards.js';

export interface Meld {
  rank: Rank;
  cards: Card[];
}

export function isValidMeld(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  if (cards.some(isBlackThree)) return false;
  const rank = meldRank(cards);
  if (!rank) return false;

  const wilds = cards.filter(isWild);
  const naturals = cards.filter(isNatural);
  if (wilds.length > naturals.length) return false;

  return naturals.every((c) => c.rank === rank);
}

export function isCanasta(meld: Meld): boolean {
  return meld.cards.length >= 7;
}

export function isNaturalCanasta(meld: Meld): boolean {
  return isCanasta(meld) && meld.cards.every(isNatural);
}

export function isMixedCanasta(meld: Meld): boolean {
  return isCanasta(meld) && meld.cards.some(isWild);
}

export function canAddToMeld(meld: Meld, card: Card): boolean {
  return isValidMeld([...meld.cards, card]);
}

export function mergeMelds(a: Meld, b: Meld): Meld | null {
  if (a.rank !== b.rank) return null;
  const combined = [...a.cards, ...b.cards];
  return isValidMeld(combined) ? { rank: a.rank, cards: combined } : null;
}

export function findMeldsInHand(hand: Card[], minMeldSize = 3): Meld[] {
  const melds: Meld[] = [];
  const byRank = new Map<Rank, Card[]>();
  const wilds = hand.filter(isWild);

  for (const card of hand) {
    if (isWild(card) || isBlackThree(card) || isRedThree(card)) continue;
    const group = byRank.get(card.rank) ?? [];
    group.push(card);
    byRank.set(card.rank, group);
  }

  for (const [rank, naturals] of byRank) {
    if (naturals.length >= minMeldSize && isValidMeld(naturals)) {
      melds.push({ rank, cards: [...naturals] });
      continue;
    }
    if (naturals.length >= 1 && naturals.length < minMeldSize) {
      const wildsNeeded = minMeldSize - naturals.length;
      if (wildsNeeded > 0 && wildsNeeded <= wilds.length && wildsNeeded <= naturals.length) {
        const mixed = [...naturals, ...wilds.slice(0, wildsNeeded)];
        if (isValidMeld(mixed)) {
          melds.push({ rank, cards: mixed });
        }
      }
    }
  }

  return melds;
}

export function meldPointValue(meld: Meld): number {
  return meld.cards.reduce((sum, c) => sum + cardRankValue(c), 0);
}
