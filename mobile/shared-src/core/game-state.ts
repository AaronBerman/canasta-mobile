import { Card } from './cards.js';
import { Meld } from './melds.js';

export type GamePhase = 'dealing' | 'playing' | 'handOver' | 'gameOver';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface PlayerState {
  id: number;
  name: string;
  hand: Card[];
  isHuman: boolean;
  aiDifficulty?: AIDifficulty;
  teamId: number;
  partnerTookDiscard: boolean;
}

export interface TeamState {
  id: number;
  melds: Meld[];
  score: number;
  redThrees: Card[];
  hasMelded: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: PlayerState[];
  teams: TeamState[];
  stock: Card[];
  discard: Card[];
  currentPlayer: number;
  winnerTeamId: number | null;
}

export function getPartnerIndex(playerIndex: number, playerCount: number): number {
  return (playerIndex + 2) % playerCount;
}

/** Team 0: seats 0 & 2 · Team 1: seats 1 & 3 (partners sit opposite in turn order). */
export function getTeamId(playerIndex: number): number {
  return playerIndex % 2;
}

/** Other seats in clockwise turn order after the given player. */
export function getSeatsInTurnOrderAfter(
  fromSeat: number,
  playerCount: number,
): number[] {
  const seats: number[] = [];
  for (let step = 1; step < playerCount; step++) {
    seats.push((fromSeat + step) % playerCount);
  }
  return seats;
}

/** Default names with You on humanSeat and Partner opposite (2 steps in turn order). */
export function getDefaultPlayerNames(humanSeat: number): [string, string, string, string] {
  const partnerIdx = getPartnerIndex(humanSeat, 4);
  const names: [string, string, string, string] = ['', '', '', ''];
  names[humanSeat] = 'You';
  names[partnerIdx] = 'Partner';
  const opponents = getSeatsInTurnOrderAfter(humanSeat, 4).filter((s) => s !== partnerIdx);
  names[opponents[0]] = 'AI West';
  names[opponents[1]] = 'AI East';
  return names;
}

export function createInitialTeams(): TeamState[] {
  return [
    { id: 0, melds: [], score: 0, redThrees: [], hasMelded: false },
    { id: 1, melds: [], score: 0, redThrees: [], hasMelded: false },
  ];
}

export function activePlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayer];
}

export function activeTeam(state: GameState): TeamState {
  const teamId = getTeamId(state.currentPlayer);
  return state.teams[teamId];
}

export function advanceTurn(state: GameState): GameState {
  return {
    ...state,
    currentPlayer: (state.currentPlayer + 1) % state.players.length,
  };
}

export function allSeenCards(state: GameState): Card[] {
  const seen: Card[] = [...state.discard];
  for (const team of state.teams) {
    for (const meld of team.melds) seen.push(...meld.cards);
    seen.push(...team.redThrees);
  }
  return seen;
}
