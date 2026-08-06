import { AIDifficulty } from '../core/game-state.js';
import { Friend } from './friends.js';

export type LobbyStatus = 'waiting' | 'ready' | 'starting' | 'inProgress' | 'closed';

export interface LobbySeat {
  seatId: number;
  userId: string | null;
  displayName: string | null;
  teamId: number;
  ready: boolean;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

export interface LobbyConfig {
  minPlayers: 2;
  maxPlayers: 8;
  playerCount: number;
  turnTimeoutSec: number;
  allowSpectators: boolean;
}

export interface Lobby {
  id: string;
  hostUserId: string;
  status: LobbyStatus;
  config: LobbyConfig;
  seats: LobbySeat[];
  invitedFriendIds: string[];
  createdAt: Date;
}

export function createLobby(hostUserId: string, playerCount: number): Lobby {
  if (playerCount < 2 || playerCount > 8) {
    throw new Error('Player count must be between 2 and 8');
  }

  const seats: LobbySeat[] = Array.from({ length: playerCount }, (_, i) => ({
    seatId: i,
    userId: i === 0 ? hostUserId : null,
    displayName: i === 0 ? hostUserId : null,
    teamId: i % 2,
    ready: i === 0,
    isAI: false,
  }));

  return {
    id: `lobby_${Date.now()}`,
    hostUserId,
    status: 'waiting',
    config: {
      minPlayers: 2,
      maxPlayers: 8,
      playerCount,
      turnTimeoutSec: 60,
      allowSpectators: false,
    },
    seats,
    invitedFriendIds: [],
    createdAt: new Date(),
  };
}

export function inviteFriendsToLobby(lobby: Lobby, friends: Friend[]): Lobby {
  return {
    ...lobby,
    invitedFriendIds: friends.map((f) => f.userId),
  };
}

export function joinSeat(lobby: Lobby, seatId: number, userId: string, displayName: string): Lobby {
  const seats = lobby.seats.map((s) =>
    s.seatId === seatId
      ? { ...s, userId, displayName, ready: false, isAI: false }
      : s,
  );
  return { ...lobby, seats };
}

export function fillEmptySeatsWithAI(lobby: Lobby, difficulty: AIDifficulty = 'medium'): Lobby {
  const seats = lobby.seats.map((s) =>
    s.userId === null
      ? {
          ...s,
          userId: `ai_${s.seatId}`,
          displayName: `AI (${difficulty})`,
          ready: true,
          isAI: true,
          aiDifficulty: difficulty,
        }
      : s,
  );
  return { ...lobby, seats, status: 'ready' };
}

export function isLobbyReady(lobby: Lobby): boolean {
  return lobby.seats.every((s) => s.userId !== null && s.ready);
}

export function selectFriendsForInvite(
  friends: Friend[],
  count: number,
): Friend[] {
  return friends.filter((f) => f.online).slice(0, count);
}
