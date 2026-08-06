import { Card } from '../core/cards.js';
import { MatchState } from '../core/turn-manager.js';

/** Placeholder cards so opponent hand counts render without revealing ranks. */
function hiddenHand(seatId: number, count: number): Card[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `hidden-${seatId}-${i}`,
    rank: '7',
    suit: 'spades',
  }));
}

/** Strip hidden information before sending match state to a client. */
export function filterMatchStateForSeat(state: MatchState, seatId: number): MatchState {
  return {
    ...state,
    humanSeat: seatId,
    players: state.players.map((p, i) => ({
      ...p,
      isHuman: i === seatId,
      hand: i === seatId ? p.hand : hiddenHand(i, p.hand.length),
    })),
  };
}
