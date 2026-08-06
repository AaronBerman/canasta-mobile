import { AIDifficulty, GameState } from './core/game-state.js';
import { deal, DealResult } from './core/deck.js';
import { GameRules, DEFAULT_RULES } from './core/game-rules.js';
import {
  createMatchFromDeal,
  MatchState,
  startNextHand,
  CreateMatchConfig,
} from './core/turn-manager.js';
import { Lobby, LobbySeat } from './multiplayer/lobby.js';

export interface SinglePlayerConfig {
  humanSeat: number;
  aiDifficulties: [AIDifficulty, AIDifficulty, AIDifficulty];
  playerNames?: [string, string, string, string];
  rules?: GameRules;
}

/** Bootstrap a 4-player single-player match with turn management. */
export function createSinglePlayerMatch(config: SinglePlayerConfig): MatchState {
  const rules = config.rules ?? DEFAULT_RULES;
  const dealResult = deal(4, rules.cardsPerHand);
  return createMatchFromDeal(dealResult, {
    humanSeat: config.humanSeat,
    rules,
    playerNames: config.playerNames,
    aiDifficulties: config.aiDifficulties,
  });
}

export interface CampaignMatchConfig extends SinglePlayerConfig {
  dealResult: DealResult;
  startingPlayer?: number;
  openingMessage?: string;
  initialTeams?: CreateMatchConfig['initialTeams'];
}

/** Bootstrap a campaign level with a scripted deal and optional table setup. */
export function createCampaignMatch(config: CampaignMatchConfig): MatchState {
  const rules = config.rules ?? DEFAULT_RULES;
  return createMatchFromDeal(config.dealResult, {
    humanSeat: config.humanSeat,
    rules,
    playerNames: config.playerNames ?? ['You', 'West', 'Partner', 'East'],
    aiDifficulties: config.aiDifficulties ?? ['easy', 'easy', 'easy'],
    startingPlayer: config.startingPlayer,
    openingMessage: config.openingMessage,
    initialTeams: config.initialTeams,
  });
}

/** @deprecated Use createSinglePlayerMatch */
export function createSinglePlayerGame(config: SinglePlayerConfig): GameState {
  return createSinglePlayerMatch(config);
}

/** Deal and begin the next hand, preserving match scores. */
export function dealNextHand(state: MatchState): MatchState {
  const dealResult = deal(4, state.rules.cardsPerHand);
  return startNextHand(state, dealResult);
}

function seatNames(seats: LobbySeat[]): [string, string, string, string] {
  const names: [string, string, string, string] = ['', '', '', ''];
  for (const seat of seats) {
    if (seat.seatId < 4) {
      names[seat.seatId] = seat.displayName ?? `Player ${seat.seatId + 1}`;
    }
  }
  return names;
}

function seatAiDifficulties(seats: LobbySeat[]): [AIDifficulty, AIDifficulty, AIDifficulty] {
  const ai = seats.filter((s) => s.isAI).map((s) => s.aiDifficulty ?? 'medium');
  while (ai.length < 3) ai.push('medium');
  return [ai[0], ai[1], ai[2]];
}

/** Bootstrap a 4-player online match from a ready lobby (humans + AI seats). */
export function createMultiplayerMatch(lobby: Lobby, rules: GameRules = DEFAULT_RULES): MatchState {
  const playerCount = Math.min(4, lobby.config.playerCount);
  const seats = lobby.seats.slice(0, playerCount);
  const dealResult = deal(playerCount, rules.cardsPerHand);
  const humanSeat = seats.find((s) => !s.isAI)?.seatId ?? 0;

  const match = createMatchFromDeal(dealResult, {
    humanSeat,
    rules,
    playerNames: seatNames(seats),
    aiDifficulties: seatAiDifficulties(seats),
    openingMessage: 'Multiplayer match — good luck!',
  });

  return {
    ...match,
    players: match.players.map((p, i) => {
      const seat = seats[i];
      if (!seat) return p;
      return {
        ...p,
        name: seat.displayName ?? p.name,
        isHuman: !seat.isAI,
        aiDifficulty: seat.isAI ? (seat.aiDifficulty ?? 'medium') : undefined,
      };
    }),
  };
}
