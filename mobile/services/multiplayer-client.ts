import { Rank } from '../shared-src/core/cards';

/** Client-side multiplayer action payloads (mirrors server wire format). */
export type MultiplayerAction =
  | { type: 'drawStock' }
  | { type: 'takeDiscardPile' }
  | { type: 'layMelds'; cardIds: string[]; targetRank?: Rank | null }
  | { type: 'skipMeld' }
  | { type: 'discard'; cardId: string };

export type LobbyStatus = 'waiting' | 'ready' | 'starting' | 'inProgress' | 'closed';

export interface LobbySeat {
  seatId: number;
  userId: string | null;
  displayName: string | null;
  teamId: number;
  ready: boolean;
  isAI: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface Lobby {
  id: string;
  hostUserId: string;
  status: LobbyStatus;
  config: {
    minPlayers: 2;
    maxPlayers: 8;
    playerCount: number;
    turnTimeoutSec: number;
    allowSpectators: boolean;
  };
  seats: LobbySeat[];
  invitedFriendIds: string[];
  createdAt: string;
}

export type ClientMessage =
  | { type: 'createRoom'; displayName: string; playerCount?: number }
  | { type: 'joinRoom'; code: string; displayName: string }
  | { type: 'setReady'; ready: boolean }
  | { type: 'startGame' }
  | { type: 'action'; payload: MultiplayerAction };

export type ServerMessage =
  | { type: 'roomCreated'; code: string; playerId: string; seatId: number }
  | { type: 'roomJoined'; code: string; playerId: string; seatId: number }
  | { type: 'lobbyUpdate'; lobby: Lobby }
  | { type: 'gameStarted'; code: string }
  | { type: 'stateSync'; state: import('../engine/index').MatchState }
  | { type: 'playerLeft'; seatId: number }
  | { type: 'error'; message: string };

export type ServerEventHandler = (message: ServerMessage) => void;

/** Default dev URL — set EXPO_PUBLIC_MULTIPLAYER_URL to your LAN IP for device testing. */
export const DEFAULT_MULTIPLAYER_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_MULTIPLAYER_URL) ||
  'ws://localhost:3847';

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private handler: ServerEventHandler | null = null;

  connect(url: string, onEvent: ServerEventHandler): Promise<void> {
    return new Promise((resolve, reject) => {
      this.handler = onEvent;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('Could not connect to multiplayer server'));
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as ServerMessage;
          this.handler?.(msg);
        } catch {
          this.handler?.({ type: 'error', message: 'Invalid server message' });
        }
      };
      ws.onclose = () => {
        this.ws = null;
      };
    });
  }

  send(message: ClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handler = null;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
