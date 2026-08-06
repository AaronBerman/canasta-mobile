import { Card } from '../core/cards.js';
import { createAIStrategy } from './ai-player.js';
import { AIAction } from './easy-strategy.js';
import {
  MatchState,
  drawStock,
  takeDiscardPile,
  layMeld,
  layMeldsFromSelection,
  skipMeldPhase,
  discardCard,
  checkStockExhaustion,
  revertIncompleteOpening,
  GameActionResult,
} from '../core/turn-manager.js';
import { canTakeDiscardPile, isLegalDiscard, openingPointsIfDiscardTaken } from '../core/rules.js';
import { getTeamId } from '../core/game-state.js';
import { meetsInitialMeldRequirement, teamMeldTablePoints } from '../core/game-status.js';
import { findMeldsInHand } from '../core/melds.js';
import {
  meldPointsWithDiscardTop,
  suggestMeldForRequiredTop,
} from '../core/meld-selection.js';

/** Execute a full AI turn (draw → meld → discard) in one pass. */
export function executeAITurn(state: MatchState): GameActionResult {
  const stockEnd = checkStockExhaustion(state);
  if (stockEnd) return stockEnd;

  const playerIndex = state.currentPlayer;
  const player = state.players[playerIndex];
  const difficulty = player.aiDifficulty ?? 'medium';
  const strategy = createAIStrategy(difficulty);

  const action = strategy.chooseAction(state, playerIndex);
  return applyAIAction(state, action, playerIndex);
}

/** Finish a stuck AI turn (e.g. incomplete staged opening after skip failure). */
export function recoverAITurn(state: MatchState): GameActionResult {
  const playerIndex = state.currentPlayer;
  let current = state;

  if (current.turnPhase === 'draw' && !current.hasDrawnThisTurn) {
    const draw = drawStock(current);
    if (!draw.ok) return draw;
    current = draw.state;
  }

  if (current.turnPhase === 'meld') {
    if (current.requiredMeldCardIds.length > 0) {
      const required = meldRequiredDiscardTop(current, playerIndex);
      if (required.ok) current = required.state;
    }
    const skip = finalizeMeldPhase(current, playerIndex);
    if (!skip.ok) return skip;
    current = skip.state;
  }

  if (current.phase !== 'playing') return { ok: true, state: current };

  if (current.turnPhase === 'discard') {
    const hand = current.players[playerIndex].hand;
    if (hand.length === 0) return { ok: true, state: current };
    return discardCard(
      current,
      pickDiscard(hand, current.discard, current.rules),
    );
  }

  return { ok: false, error: 'AI recovery failed', state: current };
}

function applyAIAction(
  state: MatchState,
  action: AIAction,
  playerIndex: number,
): GameActionResult {
  let current = state;
  let result: GameActionResult;

  if (current.turnPhase === 'draw' && !current.hasDrawnThisTurn) {
    if (action.melds?.length) {
      for (const meld of action.melds) {
        result = layMeld(current, meld.cards);
        if (result.ok) current = result.state;
      }
    }

    if (
      action.type === 'takeDiscard' ||
      (action.type === 'goOut' && aiCanTakeDiscard(current, playerIndex))
    ) {
      result = takeDiscardPile(current);
      if (!result.ok) result = drawStock(current);
    } else {
      result = drawStock(current);
    }
    if (!result.ok) return result;
    current = result.state;
  }

  if (current.turnPhase === 'meld') {
    current = applyPostDrawMelds(current, action, playerIndex);

    if (current.requiredMeldCardIds.length > 0) {
      result = meldRequiredDiscardTop(current, playerIndex);
      if (!result.ok) {
        current = tryCompleteOpeningMelds(current, playerIndex);
        result = meldRequiredDiscardTop(current, playerIndex);
        if (!result.ok) return result;
      }
      current = result.state;
    }

    result = finalizeMeldPhase(current, playerIndex);
    if (!result.ok) return result;
    current = result.state;
  }

  if (current.phase !== 'playing') return { ok: true, state: current };

  if (current.turnPhase !== 'discard') {
    return recoverAITurn(current);
  }

  const hand = current.players[playerIndex].hand;
  if (hand.length === 0) return { ok: true, state: current };

  const discard =
    action.discard ?? pickDiscard(hand, current.discard, current.rules);

  return discardCard(current, discard);
}

function applyPostDrawMelds(
  state: MatchState,
  action: AIAction,
  playerIndex: number,
): MatchState {
  let current = state;

  if (current.requiredMeldCardIds.length > 0) {
    const required = meldRequiredDiscardTop(current, playerIndex);
    if (required.ok) return required.state;
    return current;
  }

  for (const meld of action.melds ?? []) {
    const meldResult = layMeld(current, meld.cards);
    if (meldResult.ok) current = meldResult.state;
  }

  return current;
}

function tryCompleteOpeningMelds(
  state: MatchState,
  playerIndex: number,
): MatchState {
  let current = state;
  const teamId = getTeamId(playerIndex);

  for (let attempt = 0; attempt < 12; attempt++) {
    const team = current.teams[teamId];
    if (team.hasMelded || team.melds.length === 0) break;
    if (meetsInitialMeldRequirement(team, current.rules)) break;

    const hand = current.players[playerIndex].hand;
    const candidates = findMeldsInHand(hand, current.rules.minMeldSize);
    if (candidates.length === 0) break;

    let laid = false;
    for (const meld of candidates) {
      const meldResult = layMeld(current, meld.cards);
      if (meldResult.ok) {
        current = meldResult.state;
        laid = true;
        break;
      }
    }
    if (!laid) break;
  }

  return current;
}

function finalizeMeldPhase(
  state: MatchState,
  playerIndex: number,
): GameActionResult {
  let current = tryCompleteOpeningMelds(state, playerIndex);
  const teamId = getTeamId(playerIndex);
  const team = current.teams[teamId];

  if (
    !team.hasMelded &&
    team.melds.length > 0 &&
    !meetsInitialMeldRequirement(team, current.rules)
  ) {
    current = revertIncompleteOpening(current, playerIndex);
  }

  const skip = skipMeldPhase(current);
  if (!skip.ok && current.teams[teamId].melds.length > 0) {
    current = revertIncompleteOpening(current, playerIndex);
    return skipMeldPhase(current);
  }

  return skip;
}

function pickDiscard(
  hand: Card[],
  discard: Card[],
  rules: MatchState['rules'],
): Card {
  const legal = hand.filter((c) => isLegalDiscard(discard, c, rules));
  const pool = legal.length > 0 ? legal : hand;
  return pool.reduce((a, b) => (a.rank > b.rank ? a : b));
}

function meldRequiredDiscardTop(
  state: MatchState,
  playerIndex: number,
): GameActionResult {
  const player = state.players[playerIndex];
  const team = state.teams[getTeamId(playerIndex)];

  const suggestion = suggestMeldForRequiredTop(
    player.hand,
    state.requiredMeldCardIds,
    team.melds,
    state.rules.minMeldSize,
  );
  if (suggestion) {
    return layMeldsFromSelection(state, suggestion);
  }

  return { ok: false, error: 'AI could not meld required discard top', state };
}

/** Partner AI uses same executor — exported for clarity. */
export function executePartnerAITurn(state: MatchState): GameActionResult {
  return executeAITurn(state);
}

export function getAIActionPreview(state: MatchState, playerIndex: number): AIAction {
  const player = state.players[playerIndex];
  const strategy = createAIStrategy(player.aiDifficulty ?? 'medium');
  return strategy.chooseAction(state, playerIndex);
}

export function aiCanTakeDiscard(state: MatchState, playerIndex: number): boolean {
  const player = state.players[playerIndex];
  const team = state.teams[getTeamId(playerIndex)];
  const top = state.discard[state.discard.length - 1];
  if (!top) return false;
  const topMeldPoints = meldPointsWithDiscardTop(
    player.hand,
    top,
    team.melds,
    state.rules.minMeldSize,
  );
  if (topMeldPoints === 0) return false;
  const openingPoints = openingPointsIfDiscardTaken(
    player.hand,
    state.discard,
    team.melds,
    team.hasMelded,
    state.rules,
  );
  return canTakeDiscardPile(
    player.hand,
    state.discard,
    team.hasMelded,
    openingPoints,
    team.score,
    state.rules,
  );
}
