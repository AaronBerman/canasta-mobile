import { createLobby, fillEmptySeatsWithAI } from './multiplayer/lobby.js';
import { AIDifficulty } from './core/game-state.js';

export * from './core/cards.js';
export * from './core/deck.js';
export * from './core/melds.js';
export * from './core/rules.js';
export * from './core/scoring.js';
export * from './core/game-state.js';
export * from './core/game-rules.js';
export * from './core/meld-selection.js';
export * from './core/hand-grouping.js';
export * from './core/game-status.js';
export * from './core/turn-manager.js';
export * from './ai/ai-player.js';
export * from './ai/ai-executor.js';
export * from './multiplayer/friends.js';
export * from './multiplayer/lobby.js';
export * from './multiplayer/session.js';
export {
  createSinglePlayerMatch,
  createSinglePlayerGame,
  createCampaignMatch,
  dealNextHand,
  type SinglePlayerConfig,
  type CampaignMatchConfig,
} from './match-factory.js';

/** Create a multiplayer lobby pre-filled with AI for empty seats. */
export function createMultiplayerLobby(
  hostUserId: string,
  playerCount: number,
  aiDifficulty: AIDifficulty = 'medium',
) {
  const lobby = createLobby(hostUserId, playerCount);
  return fillEmptySeatsWithAI(lobby, aiDifficulty);
}
