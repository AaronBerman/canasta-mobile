import {
  Card,
  GameRequirementInfo,
  MatchState,
  TurnPhase,
  DiscardPileStatus,
  getDiscardPileStatus,
  describeDiscardPileStatus,
  initialMeldRequirement,
  isDiscardBlockedByBlackThree,
  isDiscardPileFrozen,
  meldPointsWithDiscardTop,
  teamMeldTablePoints,
} from '../engine/index';

export interface ActionHints {
  meld?: string;
  takeDiscard?: string;
  skipMeld?: string;
  discard?: string;
  draw?: string;
}

export interface ActionHintsInput {
  state: MatchState;
  isMyTurn: boolean;
  canTakeDiscard: boolean;
  canMeldSelection: boolean;
  selectedCount: number;
  requiresMeldTarget: boolean;
  mustMeldDiscardTop: boolean;
  canSkipMeld: boolean;
  wouldEmptyHand: boolean;
  requiredTopUsable: boolean;
  requirementInfo: GameRequirementInfo | null;
  stockEmptyAtTurnStart: boolean;
}

function describeTakeDiscardBlock(state: MatchState, humanHand: Card[]): string | undefined {
  const team = state.teams[state.players[state.currentPlayer].teamId];
  const discard = state.discard;

  if (!state.rules.allowTakeDiscardPile || discard.length === 0) {
    return 'Discard pile is empty';
  }
  if (isDiscardBlockedByBlackThree(discard, state.rules)) {
    return 'Pile blocked — top card is a black 3';
  }

  const top = discard[discard.length - 1];
  if (isDiscardPileFrozen(discard, state.rules)) {
    return describeDiscardPileStatus(discard, state.rules);
  }

  const tablePoints = teamMeldTablePoints(team.melds);
  const topMeldPoints = meldPointsWithDiscardTop(
    humanHand,
    top,
    team.melds,
    state.rules.minMeldSize,
  );

  if (topMeldPoints === 0) {
    return 'Need cards in hand to meld with the discard top';
  }

  if (!team.hasMelded) {
    const required = initialMeldRequirement(team.score, state.rules);
    const total = tablePoints + topMeldPoints;
    if (total < required) {
      const staged = tablePoints > 0 ? `${tablePoints} on table + ` : '';
      return `Opening needs ${required}+ pts (${staged}${topMeldPoints} from top = ${total})`;
    }
  }

  return undefined;
}

function describeSkipBlock(
  state: MatchState,
  requirementInfo: GameRequirementInfo | null,
): string | undefined {
  if (state.requiredMeldCardIds.length > 0) {
    return 'Must meld the discard pile top card first';
  }

  const team = state.teams[state.players[state.currentPlayer].teamId];
  if (!team.hasMelded && team.melds.length > 0 && requirementInfo?.initialMeldPoints) {
    const staged = requirementInfo.stagedMeldPoints ?? teamMeldTablePoints(team.melds);
    const required = requirementInfo.initialMeldPoints;
    if (staged < required) {
      return `Need ${required - staged} more pts on table before discarding (${staged}/${required})`;
    }
  }

  return undefined;
}

function describeMeldBlock(input: ActionHintsInput): string | undefined {
  const { selectedCount, requiresMeldTarget, wouldEmptyHand, requiredTopUsable, mustMeldDiscardTop } =
    input;

  if (selectedCount === 0) {
    return 'Select cards to meld — tap a group label to select a rank';
  }
  if (requiresMeldTarget) {
    return 'Tap one of your meld piles to place the wild card(s)';
  }
  if (wouldEmptyHand) {
    return 'Keep 1 card in hand — discard it to go out';
  }
  if (mustMeldDiscardTop && !requiredTopUsable) {
    return 'Include the discard top in this meld — add matching ranks or a wild';
  }
  return 'Selection is not a valid meld — need 3+ of a rank (wilds need naturals)';
}

export function getActionHints(input: ActionHintsInput): ActionHints {
  const {
    state,
    isMyTurn,
    canTakeDiscard,
    canMeldSelection,
    selectedCount,
    canSkipMeld,
    requirementInfo,
    stockEmptyAtTurnStart,
  } = input;

  if (!isMyTurn || state.phase !== 'playing') return {};

  const hints: ActionHints = {};
  const humanHand = state.players[state.humanSeat].hand;
  const turnPhase: TurnPhase = state.turnPhase;

  if (turnPhase === 'draw' && !stockEmptyAtTurnStart) {
    if (!canMeldSelection && state.turnPhase === 'draw' && !state.hasDrawnThisTurn) {
      if (selectedCount > 0) {
        hints.meld = describeMeldBlock(input);
      }
    }
    if (!canTakeDiscard) {
      hints.takeDiscard = describeTakeDiscardBlock(state, humanHand);
    }
  }

  if (turnPhase === 'meld') {
    if (!canMeldSelection && selectedCount > 0) {
      hints.meld = describeMeldBlock(input);
    }
    if (!canSkipMeld) {
      hints.skipMeld = describeSkipBlock(state, requirementInfo);
    }
  }

  if (turnPhase === 'discard') {
    if (selectedCount !== 1) {
      hints.discard =
        selectedCount === 0
          ? 'Select exactly one card to discard'
          : 'Select only one card to discard';
    } else if (requirementInfo?.goOutBlockers.length) {
      hints.discard = requirementInfo.goOutBlockers[0];
    }
  }

  return hints;
}

/** Re-export for screens that need discard status in hints. */
export { getDiscardPileStatus, type DiscardPileStatus };
