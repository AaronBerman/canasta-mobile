import { Card, Rank, Suit } from './cards.js';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let cardCounter = 0;

function makeCard(suit: Suit, rank: Rank): Card {
  return { id: `c${++cardCounter}`, suit, rank };
}

/** Build two full decks plus four jokers (108 cards). */
export function createCanastaDeck(): Card[] {
  cardCounter = 0;
  const deck: Card[] = [];
  for (let d = 0; d < 2; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push(makeCard(suit, rank));
      }
    }
  }
  for (let j = 0; j < 4; j++) {
    deck.push(makeCard('joker', 'JOKER'));
  }
  return deck;
}

/** Fisher–Yates shuffle (in-place). */
export function shuffle(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export interface DealResult {
  hands: Card[][];
  stock: Card[];
  discard: Card[];
  redThrees: Map<number, Card[]>;
}

/** Deal 11 cards to each of 4 players; handle red threes. */
export function deal(handsCount: number, cardsPerHand = 11): DealResult {
  const deck = shuffle(createCanastaDeck());
  const hands: Card[][] = Array.from({ length: handsCount }, () => []);
  const redThrees = new Map<number, Card[]>();

  let idx = 0;
  for (let round = 0; round < cardsPerHand; round++) {
    for (let p = 0; p < handsCount; p++) {
      hands[p].push(deck[idx++]);
    }
  }

  // Replace red threes and collect them
  for (let p = 0; p < handsCount; p++) {
    const playerReds: Card[] = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < hands[p].length; i++) {
        const card = hands[p][i];
        if (card.rank === '3' && (card.suit === 'hearts' || card.suit === 'diamonds')) {
          playerReds.push(card);
          hands[p].splice(i, 1);
          hands[p].push(deck[idx++]);
          changed = true;
          break;
        }
      }
    }
    if (playerReds.length > 0) redThrees.set(p, playerReds);
  }

  const discard: Card[] = [deck[idx++]];
  const stock = deck.slice(idx);

  return { hands, stock, discard, redThrees };
}

export function drawFromStock(stock: Card[]): { card: Card; stock: Card[] } | null {
  if (stock.length === 0) return null;
  return { card: stock[0], stock: stock.slice(1) };
}

/** Pick cards from a deck by rank/suit spec (used for campaign scenarios). */
export interface CardPick {
  rank: Rank;
  suit?: Suit;
}

function pickCard(deck: Card[], pick: CardPick): Card {
  const idx = deck.findIndex((c) => {
    if (pick.rank === 'JOKER') return c.rank === 'JOKER';
    if (c.rank !== pick.rank) return false;
    if (pick.suit && c.suit !== pick.suit) return false;
    return true;
  });
  if (idx < 0) {
    throw new Error(`Campaign deal missing card: ${pick.rank}${pick.suit ? ` ${pick.suit}` : ''}`);
  }
  return deck.splice(idx, 1)[0];
}

function pickMany(deck: Card[], picks: CardPick[]): Card[] {
  return picks.map((p) => pickCard(deck, p));
}

export interface CampaignDealSpec {
  /** Four hands — only human (seat 0) needs detail; empty slots get random fill. */
  hands: CardPick[][];
  discard?: CardPick[];
  /** Cards placed on top of stock (first drawn). Remaining deck fills stock below. */
  stockTop?: CardPick[];
  redThrees?: Map<number, Card[]>;
}

/** Build a fixed deal for campaign levels from card picks. */
export function buildCampaignDeal(spec: CampaignDealSpec): DealResult {
  const deck = createCanastaDeck();
  const hands: Card[][] = [[], [], [], []];

  for (let p = 0; p < 4; p++) {
    const picks = spec.hands[p] ?? [];
    hands[p] = pickMany(deck, picks);
  }

  const cardsPerHand = Math.max(...hands.map((h) => h.length), 11);
  for (let p = 0; p < 4; p++) {
    while (hands[p].length < cardsPerHand && deck.length > 0) {
      hands[p].push(deck.shift()!);
    }
  }

  const redThrees = new Map<number, Card[]>(spec.redThrees ?? []);
  for (let p = 0; p < 4; p++) {
    if (redThrees.has(p)) continue;
    const playerReds: Card[] = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < hands[p].length; i++) {
        const card = hands[p][i];
        if (card.rank === '3' && (card.suit === 'hearts' || card.suit === 'diamonds')) {
          playerReds.push(card);
          hands[p].splice(i, 1);
          if (deck.length > 0) hands[p].push(deck.shift()!);
          changed = true;
          break;
        }
      }
    }
    if (playerReds.length > 0) redThrees.set(p, playerReds);
  }

  const discard = spec.discard?.length ? pickMany(deck, spec.discard) : deck.length ? [deck.shift()!] : [];
  const stockTop = spec.stockTop?.length ? pickMany(deck, spec.stockTop) : [];
  const stock = [...stockTop, ...deck];

  return { hands, stock, discard, redThrees };
}
