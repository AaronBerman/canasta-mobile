import { useRef, useMemo, useCallback } from 'react';
import {
  MatchState,
  GameRules,
  AIDifficulty,
} from '../engine/index';
import { useGameMatch } from './game/useGameMatch';
import { usePlayerHand } from './game/usePlayerHand';
import { usePlayerActions } from './game/usePlayerActions';
import type { GameSessionRefs, SinglePlayerGameHandle } from './game/types';

export type { SinglePlayerGameHandle } from './game/types';

export interface UseSinglePlayerGameOptions {
  aiDifficulties?: [AIDifficulty, AIDifficulty, AIDifficulty];
  rules?: GameRules;
  initialMatch?: MatchState;
  recordProgress?: boolean;
  pauseAI?: boolean;
  shouldPauseAI?: () => boolean;
  onAfterAction?: (prev: MatchState, next: MatchState) => void;
}

export function useSinglePlayerGame(
  options: UseSinglePlayerGameOptions = {},
): SinglePlayerGameHandle {
  const manualOrderRef = useRef(false);
  const lastGroupingKeyRef = useRef('');
  const stateRef = useRef<MatchState | null>(null);
  const onAfterActionRef = useRef(options.onAfterAction);
  const shouldPauseAIRef = useRef(options.shouldPauseAI);

  const refs = useMemo<GameSessionRefs>(
    () => ({
      manualOrderRef,
      lastGroupingKeyRef,
      stateRef,
      onAfterActionRef,
      shouldPauseAIRef,
    }),
    [],
  );

  const handApiRef = useRef<ReturnType<typeof usePlayerHand> | null>(null);

  const onClearSelection = useCallback(() => {
    handApiRef.current?.clearSelection();
    handApiRef.current?.clearNewCardHighlights();
  }, []);

  const match = useGameMatch({
    ...options,
    refs,
    onClearSelection,
  });

  const hand = usePlayerHand(match.state, refs);
  handApiRef.current = hand;

  const actions = usePlayerActions({
    state: match.state,
    setState: match.setState,
    applyResult: match.applyResult,
    resetHandLayout: match.resetHandLayout,
    getEffectiveMeldCards: hand.getEffectiveMeldCards,
    getSelectedCards: hand.getSelectedCards,
    targetMeldRank: hand.targetMeldRank,
    canMeldSelection: hand.canMeldSelection,
    requiresMeldTarget: hand.requiresMeldTarget,
    requiredTopUsable: hand.requiredTopUsable,
    wouldEmptyHand: hand.wouldEmptyHand,
    canSkipMeld: hand.canSkipMeld,
    requirementInfo: hand.requirementInfo,
    clearSelection: hand.clearSelection,
    selectedCardIds: hand.selectedCardIds,
  });

  return {
    state: match.state,
    loading: match.loading,
    aiThinking: match.aiThinking,
    error: match.error,
    unlockMessages: match.unlockMessages,
    clearUnlockMessages: match.clearUnlockMessages,
    handGroups: hand.handGroups,
    selectedCardIds: hand.selectedCardIds,
    newCardIds: hand.newCardIds,
    meldActionLabel: hand.meldActionLabel,
    canMeldSelection: hand.canMeldSelection,
    autoIncludedWild: hand.autoIncludedWild,
    wouldEmptyHand: hand.wouldEmptyHand,
    requirementInfo: hand.requirementInfo,
    actionHints: actions.actionHints,
    requiresMeldTarget: hand.requiresMeldTarget,
    mustMeldDiscardTop: (match.state?.requiredMeldCardIds.length ?? 0) > 0,
    canSkipMeld: hand.canSkipMeld,
    targetMeldRank: hand.targetMeldRank,
    selectableTargetRanks: hand.selectableTargetRanks,
    selectTargetMeld: hand.selectTargetMeld,
    stockEmptyAtTurnStart: actions.stockEmptyAtTurnStart,
    additionHighlightRanks: hand.additionHighlightRanks,
    additionCounts: hand.additionCounts,
    toggleCardSelection: hand.toggleCardSelection,
    selectMeldGroup: hand.selectMeldGroup,
    reorderHand: hand.reorderHand,
    onAutoGroupHand: hand.onAutoGroupHand,
    isMyTurn: actions.isMyTurn,
    handEnded: actions.handEnded,
    meldUiActive: actions.meldUiActive,
    canMeldNow: actions.canMeldNow,
    canTakeDiscard: actions.canTakeDiscard,
    onDrawStock: actions.onDrawStock,
    onTakeDiscard: actions.onTakeDiscard,
    onMeldSelected: actions.onMeldSelected,
    onSkipMeld: actions.onSkipMeld,
    onDiscardCard: actions.onDiscardCard,
    onDiscardSelected: actions.onDiscardSelected,
    onUndoTurn: actions.onUndoTurn,
    canUndo: actions.canUndo,
    turnStuck: actions.turnStuck,
    onNextHand: match.onNextHand,
    onNewMatch: match.onNewMatch,
    initFromMatch: match.initFromMatch,
    showActionHint: actions.showActionHint,
  };
}
