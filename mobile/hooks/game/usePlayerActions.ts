import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import {
  MatchState,
  Card,
  Rank,
  GameRequirementInfo,
  drawStock,
  takeDiscardPile,
  layMeldsFromSelection,
  skipMeldPhase,
  discardCard,
  isHumanTurn,
  canTakeDiscardAction,
  canMeldNow,
  isPlayerTurnStuck,
  cloneMatchState,
} from '../../engine/index';
import { useToast } from '../../contexts/ToastContext';
import { hapticForAction, type GameHapticAction } from '../../utils/haptics';
import { getActionHints } from '../../utils/action-hints';
import { useTurnUndo } from '../useTurnUndo';

interface UsePlayerActionsOptions {
  state: MatchState | null;
  setState: Dispatch<SetStateAction<MatchState | null>>;
  applyResult: (
    result: { ok: boolean; error?: string; state: MatchState },
    action?: GameHapticAction,
  ) => void;
  /** When set, player actions are sent to the multiplayer server instead of applied locally. */
  sendRemoteAction?: (action: import('../../services/multiplayer-types').MultiplayerAction) => void;
  resetHandLayout: () => void;
  getEffectiveMeldCards: () => Card[];
  getSelectedCards: () => Card[];
  targetMeldRank: Rank | null;
  canMeldSelection: boolean;
  requiresMeldTarget: boolean;
  requiredTopUsable: boolean;
  wouldEmptyHand: boolean;
  canSkipMeld: boolean;
  requirementInfo: GameRequirementInfo | null;
  clearSelection: () => void;
  selectedCardIds: Set<string>;
}

export function usePlayerActions(options: UsePlayerActionsOptions) {
  const { showToast } = useToast();
  const {
    state,
    setState,
    applyResult,
    resetHandLayout,
    getEffectiveMeldCards,
    getSelectedCards,
    targetMeldRank,
    canMeldSelection,
    requiresMeldTarget,
    requiredTopUsable,
    wouldEmptyHand,
    canSkipMeld,
    requirementInfo,
    clearSelection,
    selectedCardIds,
    sendRemoteAction,
  } = options;

  const isMyTurn = state ? isHumanTurn(state) && state.phase === 'playing' : false;
  const handEnded = state?.phase === 'handOver' || state?.phase === 'gameOver';
  const canTakeDiscard = state ? canTakeDiscardAction(state) && isMyTurn : false;
  const meldUiActive = state ? canMeldNow(state) && isMyTurn : false;
  const stockEmptyAtTurnStart =
    !!state &&
    state.phase === 'playing' &&
    state.turnPhase === 'draw' &&
    state.stock.length === 0 &&
    isMyTurn;

  const { canUndo, pushUndoSnapshot, popUndoCheckpoint } = useTurnUndo(
    isMyTurn,
    state?.humanSeat ?? 0,
    state,
  );

  const turnStuck = useMemo(() => {
    if (!state || !isMyTurn) return false;
    return isPlayerTurnStuck(state, state.humanSeat);
  }, [state, isMyTurn]);

  const actionHints = useMemo(() => {
    if (!state || !requirementInfo) return {};
    return getActionHints({
      state,
      isMyTurn,
      canTakeDiscard,
      canMeldSelection,
      selectedCount: selectedCardIds.size,
      requiresMeldTarget,
      mustMeldDiscardTop: (state.requiredMeldCardIds.length ?? 0) > 0,
      canSkipMeld,
      wouldEmptyHand,
      requiredTopUsable,
      requirementInfo,
      stockEmptyAtTurnStart,
    });
  }, [
    state,
    requirementInfo,
    canMeldSelection,
    selectedCardIds.size,
    requiresMeldTarget,
    canSkipMeld,
    wouldEmptyHand,
    requiredTopUsable,
    isMyTurn,
    canTakeDiscard,
    stockEmptyAtTurnStart,
  ]);

  const onDrawStock = useCallback(() => {
    if (!state) return;
    if (sendRemoteAction) {
      sendRemoteAction({ type: 'drawStock' });
      hapticForAction('draw');
      return;
    }
    applyResult(drawStock(state), 'draw');
  }, [state, applyResult, sendRemoteAction]);

  const onTakeDiscard = useCallback(() => {
    if (!state) return;
    if (sendRemoteAction) {
      sendRemoteAction({ type: 'takeDiscardPile' });
      hapticForAction('takeDiscard');
      return;
    }
    applyResult(takeDiscardPile(state), 'takeDiscard');
  }, [state, applyResult, sendRemoteAction]);

  const onMeldSelected = useCallback(() => {
    if (!state) return;
    if (sendRemoteAction) {
      sendRemoteAction({
        type: 'layMelds',
        cardIds: getEffectiveMeldCards().map((c) => c.id),
        targetRank: targetMeldRank,
      });
      hapticForAction('meld');
      return;
    }
    const before = cloneMatchState(state);
    const result = layMeldsFromSelection(state, getEffectiveMeldCards(), targetMeldRank);
    applyResult(result, 'meld');
    if (result.ok) pushUndoSnapshot(before);
  }, [
    state,
    applyResult,
    getEffectiveMeldCards,
    targetMeldRank,
    pushUndoSnapshot,
    sendRemoteAction,
  ]);

  const onSkipMeld = useCallback(() => {
    if (!state) return;
    if (sendRemoteAction) {
      sendRemoteAction({ type: 'skipMeld' });
      hapticForAction('skip');
      return;
    }
    const before = cloneMatchState(state);
    const result = skipMeldPhase(state);
    applyResult(result, 'skip');
    if (result.ok) pushUndoSnapshot(before);
  }, [state, applyResult, pushUndoSnapshot, sendRemoteAction]);

  const onDiscardCard = useCallback(
    (card: Card) => {
      if (!state) return;
      if (sendRemoteAction) {
        sendRemoteAction({ type: 'discard', cardId: card.id });
        hapticForAction('discard');
        return;
      }
      applyResult(discardCard(state, card), 'discard');
    },
    [state, applyResult, sendRemoteAction],
  );

  const onDiscardSelected = useCallback(() => {
    const cards = getSelectedCards();
    if (cards.length === 1) onDiscardCard(cards[0]);
  }, [getSelectedCards, onDiscardCard]);

  const onUndoTurn = useCallback(() => {
    const prev = popUndoCheckpoint();
    if (!prev) return;
    resetHandLayout();
    setState(prev);
    clearSelection();
    showToast('Undid last meld action', 'info');
    hapticForAction('skip');
  }, [popUndoCheckpoint, resetHandLayout, setState, clearSelection, showToast]);

  const showActionHint = useCallback(
    (message: string) => {
      showToast(message, 'info');
      hapticForAction('error');
    },
    [showToast],
  );

  return {
    isMyTurn,
    handEnded,
    meldUiActive,
    canMeldNow: meldUiActive,
    canTakeDiscard,
    stockEmptyAtTurnStart,
    actionHints,
    canUndo,
    turnStuck,
    onDrawStock,
    onTakeDiscard,
    onMeldSelected,
    onSkipMeld,
    onDiscardCard,
    onDiscardSelected,
    onUndoTurn,
    showActionHint,
  };
}
