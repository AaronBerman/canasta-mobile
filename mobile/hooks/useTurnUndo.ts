import { useCallback, useEffect, useRef, useState } from 'react';
import { MatchState, cloneMatchState } from '../engine/index';

const MAX_UNDO_DEPTH = 12;

export function useTurnUndo(isMyTurn: boolean, humanSeat: number, state: MatchState | null) {
  const stackRef = useRef<MatchState[]>([]);
  const prevPlayerRef = useRef<number | null>(null);
  const [stackVersion, setStackVersion] = useState(0);

  const bumpStack = useCallback(() => {
    setStackVersion((v) => v + 1);
  }, []);

  const clearUndoStack = useCallback(() => {
    if (stackRef.current.length === 0) return;
    stackRef.current = [];
    bumpStack();
  }, [bumpStack]);

  const pushUndoSnapshot = useCallback(
    (snapshot: MatchState) => {
      stackRef.current.push(cloneMatchState(snapshot));
      if (stackRef.current.length > MAX_UNDO_DEPTH) {
        stackRef.current.shift();
      }
      bumpStack();
    },
    [bumpStack],
  );

  const popUndoCheckpoint = useCallback((): MatchState | null => {
    const prev = stackRef.current.pop() ?? null;
    bumpStack();
    return prev;
  }, [bumpStack]);

  useEffect(() => {
    if (!state) {
      if (stackRef.current.length > 0) clearUndoStack();
      prevPlayerRef.current = null;
      return;
    }

    const prevPlayer = prevPlayerRef.current;
    prevPlayerRef.current = state.currentPlayer;

    if (state.currentPlayer !== humanSeat) {
      if (stackRef.current.length > 0) clearUndoStack();
      return;
    }

    if (
      prevPlayer !== humanSeat &&
      state.turnPhase === 'draw' &&
      !state.hasDrawnThisTurn &&
      stackRef.current.length > 0
    ) {
      clearUndoStack();
    }
  }, [state, humanSeat, clearUndoStack]);

  const canUndo =
    stackVersion >= 0 &&
    isMyTurn &&
    stackRef.current.length > 0 &&
    !!state &&
    state.phase === 'playing' &&
    (state.turnPhase === 'meld' || state.turnPhase === 'discard');

  return {
    canUndo,
    pushUndoSnapshot,
    popUndoCheckpoint,
    clearUndoStack,
  };
}
