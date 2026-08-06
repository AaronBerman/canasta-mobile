export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'JOKER';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export const RED_THREE_RANKS: Rank[] = ['3'];
export const WILD_RANKS: Rank[] = ['2', 'JOKER'];

export function isRedThree(card: Card): boolean {
  return card.rank === '3' && (card.suit === 'hearts' || card.suit === 'diamonds');
}

export function isBlackThree(card: Card): boolean {
  return card.rank === '3' && (card.suit === 'clubs' || card.suit === 'spades');
}

export function isWild(card: Card): boolean {
  return card.rank === 'JOKER' || card.rank === '2';
}

export function isNatural(card: Card): boolean {
  return !isWild(card) && !isRedThree(card);
}

/** Meld / hand penalty point value for a single card. */
export function cardRankValue(card: Card): number {
  if (card.rank === 'JOKER') return 50;
  if (isRedThree(card)) return 100;
  if (card.rank === 'A' || card.rank === '2') return 20;
  if (['8', '9', '10', 'J', 'Q', 'K'].includes(card.rank)) return 10;
  if (['3', '4', '5', '6', '7'].includes(card.rank)) return 5;
  return 0;
}

/** Short label for displaying point value on a card face. */
export function cardPointLabel(card: Card): string {
  return String(cardRankValue(card));
}

export function meldRank(cards: Card[]): Rank | null {
  const naturals = cards.filter(isNatural);
  if (naturals.length === 0) return null;
  const ranks = new Set(naturals.map((c) => c.rank));
  return ranks.size === 1 ? naturals[0].rank : null;
}

export function cardsOfRank(cards: Card[], rank: Rank): Card[] {
  return cards.filter((c) => c.rank === rank || (rank !== 'JOKER' && isWild(c)));
}
