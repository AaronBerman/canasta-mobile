import { Card, Rank, isNatural, isWild } from '../core/cards.js';
import { allSeenCards, GameState } from '../core/game-state.js';

const ALL_RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'JOKER'];
const COPIES_PER_RANK: Record<Rank, number> = {
  A: 8, '2': 8, '3': 8, '4': 8, '5': 8, '6': 8, '7': 8, '8': 8,
  '9': 8, '10': 8, J: 8, Q: 8, K: 8, JOKER: 4,
};

/**
 * Tracks seen cards and estimates remaining copies of each rank.
 * Used by Hard AI (and partially by Medium) for inference.
 */
export class CardCounter {
  private seen = new Map<Rank, number>();

  observe(cards: Card[]): void {
    for (const card of cards) {
      const rank = card.rank;
      this.seen.set(rank, (this.seen.get(rank) ?? 0) + 1);
    }
  }

  observeState(state: GameState): void {
    this.seen.clear();
    this.observe(allSeenCards(state));
    for (const player of state.players) {
      // Only count own hand as seen for the acting AI
      if (player.isHuman) continue;
    }
  }

  remaining(rank: Rank): number {
    const total = COPIES_PER_RANK[rank] ?? 0;
    return Math.max(0, total - (this.seen.get(rank) ?? 0));
  }

  /** Estimate probability an opponent can use the top discard rank. */
  opponentNeedsRank(state: GameState, rank: Rank, opponentTeamId: number): number {
    const team = state.teams[opponentTeamId];
    const existingMeld = team.melds.find((m) => m.rank === rank);
    const meldSize = existingMeld?.cards.length ?? 0;
    const remaining = this.remaining(rank);
    if (meldSize >= 6) return 0.9; // likely wants 7th for canasta
    if (meldSize >= 3) return 0.6;
    if (remaining <= 2) return 0.2;
    return 0.4;
  }

  /** Best discard rank to avoid helping opponents (higher = safer). */
  discardSafety(state: GameState, card: Card, myTeamId: number): number {
    if (isWild(card)) return 0; // never discard wilds in hard mode unless forced
    const oppTeamId = myTeamId === 0 ? 1 : 0;
    const danger = this.opponentNeedsRank(state, card.rank, oppTeamId);
    const partnerMeld = state.teams[myTeamId].melds.find((m) => m.rank === card.rank);
    if (partnerMeld && partnerMeld.cards.length >= 5) return 0.1; // might help partner
    return 1 - danger;
  }

  wildsRemaining(): number {
    return this.remaining('2') + this.remaining('JOKER');
  }
}

export function inferOpponentMelds(state: GameState, counter: CardCounter): Rank[] {
  const likely: Rank[] = [];
  for (const rank of ALL_RANKS) {
    if (rank === 'JOKER' || rank === '2') continue;
    for (const team of state.teams) {
      const meld = team.melds.find((m) => m.rank === rank);
      if (meld && meld.cards.length >= 5 && counter.remaining(rank) <= 3) {
        likely.push(rank);
      }
    }
  }
  return likely;
}

export function shouldFreezePile(state: GameState, counter: CardCounter, myTeamId: number): boolean {
  const top = state.discard[state.discard.length - 1];
  if (!top || isWild(top)) return false;
  const oppTeamId = myTeamId === 0 ? 1 : 0;
  return counter.opponentNeedsRank(state, top.rank, oppTeamId) > 0.7;
}

export function pickSafestDiscard(hand: Card[], state: GameState, counter: CardCounter, teamId: number): Card {
  const naturals = hand.filter(isNatural);
  const candidates = naturals.length > 0 ? naturals : hand;
  return candidates.reduce((best, card) =>
    counter.discardSafety(state, card, teamId) >= counter.discardSafety(state, best, teamId)
      ? card
      : best,
  );
}
