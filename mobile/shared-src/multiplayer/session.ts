import { GameState } from '../core/game-state.js';
import { Lobby } from './lobby.js';

export type SessionEvent =
  | { type: 'stateSync'; state: GameState }
  | { type: 'playerJoined'; seatId: number; userId: string }
  | { type: 'playerLeft'; seatId: number }
  | { type: 'action'; seatId: number; payload: unknown }
  | { type: 'chat'; userId: string; message: string }
  | { type: 'error'; message: string };

export interface GameSession {
  id: string;
  lobbyId: string;
  state: GameState;
  startedAt: Date;
  connectedUserIds: string[];
}

export function createSession(lobby: Lobby, initialState: GameState): GameSession {
  return {
    id: `session_${Date.now()}`,
    lobbyId: lobby.id,
    state: initialState,
    startedAt: new Date(),
    connectedUserIds: lobby.seats
      .filter((s) => s.userId && !s.isAI)
      .map((s) => s.userId!),
  };
}

/** Client-side handler signature for realtime updates. */
export type SessionEventHandler = (event: SessionEvent) => void;

export interface SessionClient {
  connect(sessionId: string, userId: string, onEvent: SessionEventHandler): Promise<void>;
  sendAction(sessionId: string, payload: unknown): Promise<void>;
  disconnect(): void;
}
