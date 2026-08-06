import { Rank } from '../core/cards.js';
import {
  MatchState,
  drawStock,
  takeDiscardPile,
  layMeldsFromSelection,
  skipMeldPhase,
  discardCard,
  GameActionResult,
} from '../core/turn-manager.js';
import { Card } from '../core/cards.js';

/** Wire format for player actions sent to the authoritative server. */
export type MultiplayerAction =
  | { type: 'drawStock' }
  | { type: 'takeDiscardPile' }
  | { type: 'layMelds'; cardIds: string[]; targetRank?: Rank | null }
  | { type: 'skipMeld' }
  | { type: 'discard'; cardId: string };

export type ClientMessage =
  | { type: 'createRoom'; displayName: string; playerCount?: number }
  | { type: 'joinRoom'; code: string; displayName: string }
  | { type: 'setReady'; ready: boolean }
  | { type: 'startGame' }
  | { type: 'action'; payload: MultiplayerAction };

export type ServerMessage =
  | { type: 'roomCreated'; code: string; playerId: string; seatId: number }
  | { type: 'roomJoined'; code: string; playerId: string; seatId: number }
  | { type: 'lobbyUpdate'; lobby: import('./lobby.js').Lobby }
  | { type: 'gameStarted'; code: string }
  | { type: 'stateSync'; state: MatchState }
  | { type: 'playerLeft'; seatId: number }
  | { type: 'error'; message: string };

function cardsByIds(hand: Card[], ids: string[]): Card[] {
  const map = new Map(hand.map((c) => [c.id, c]));
  return ids.map((id) => map.get(id)).filter((c): c is Card => c != null);
}

/** Apply a validated multiplayer action on the authoritative match state. */
export function applyMultiplayerAction(
  state: MatchState,
  seatId: number,
  action: MultiplayerAction,
): GameActionResult {
  if (state.phase !== 'playing') {
    return { ok: false, error: 'Hand is not in progress', state };
  }
  if (state.currentPlayer !== seatId) {
    return { ok: false, error: 'Not your turn', state };
  }
  if (!state.players[seatId].isHuman) {
    return { ok: false, error: 'Seat is not human-controlled', state };
  }

  const hand = state.players[seatId].hand;

  switch (action.type) {
    case 'drawStock':
      return drawStock(state);
    case 'takeDiscardPile':
      return takeDiscardPile(state);
    case 'layMelds': {
      const cards = cardsByIds(hand, action.cardIds);
      if (cards.length !== action.cardIds.length) {
        return { ok: false, error: 'Invalid card selection', state };
      }
      return layMeldsFromSelection(state, cards, action.targetRank ?? null);
    }
    case 'skipMeld':
      return skipMeldPhase(state);
    case 'discard': {
      const card = hand.find((c) => c.id === action.cardId);
      if (!card) return { ok: false, error: 'Card not in hand', state };
      return discardCard(state, card);
    }
    default:
      return { ok: false, error: 'Unknown action', state };
  }
}
