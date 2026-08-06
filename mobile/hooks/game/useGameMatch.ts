import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MatchState,
  createSinglePlayerMatch,
  dealNextHand,
  isAIPlayer,
  checkStockExhaustion,
  executeAITurn,
  recoverAITurn,
  GameRules,
  AIDifficulty,
} from '../../engine/index';
import { loadActiveRules } from '../../services/rules-storage';
import {
  buildAiDifficultiesForMatch,
  loadAIDifficultySettings,
} from '../../services/ai-difficulty-storage';
import { recordSinglePlayerResult } from '../../services/cosmetics-storage';
import { useCosmetics } from '../../stores/cosmetics-store';
import { useToast } from '../../contexts/ToastContext';
import { hapticForAction, type GameHapticAction } from '../../utils/haptics';
import { getAIThinkDelayMs } from '../../utils/ai-timing';
import type { GameSessionRefs } from './types';

export interface UseGameMatchOptions {
  aiDifficulties?: [AIDifficulty, AIDifficulty, AIDifficulty];
  rules?: GameRules;
  initialMatch?: MatchState;
  recordProgress?: boolean;
  pauseAI?: boolean;
  shouldPauseAI?: () => boolean;
  onAfterAction?: (prev: MatchState, next: MatchState) => void;
  onClearSelection?: () => void;
  refs: GameSessionRefs;
}

export function useGameMatch(options: UseGameMatchOptions) {
  const recordProgress = options.recordProgress !== false;
  const pauseAI = options.pauseAI ?? false;
  const { refresh: refreshCosmetics } = useCosmetics();
  const { showError } = useToast();
  const [state, setState] = useState<MatchState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlockMessages, setUnlockMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRecordedHand = useRef(0);

  const { refs } = options;
  const onClearSelectionRef = useRef(options.onClearSelection);
  onClearSelectionRef.current = options.onClearSelection;
  refs.onAfterActionRef.current = options.onAfterAction;
  refs.shouldPauseAIRef.current = options.shouldPauseAI;
  refs.stateRef.current = state;

  const resetHandLayout = useCallback(() => {
    refs.manualOrderRef.current = false;
    refs.lastGroupingKeyRef.current = '';
  }, [refs]);

  const applyResult = useCallback(
    (
      result: { ok: boolean; error?: string; state: MatchState },
      action?: GameHapticAction,
    ) => {
      if (!result.ok) {
        const message = result.error ?? 'Invalid action';
        setError(message);
        showError(message);
        hapticForAction('error');
        return;
      }
      setError(null);
      if (action) hapticForAction(action);

      let prevForCallback: MatchState | null = null;
      setState((prev) => {
        if (
          prev &&
          (prev.phase === 'handOver' || prev.phase === 'gameOver') &&
          result.state.phase === 'playing'
        ) {
          return prev;
        }
        prevForCallback = prev;
        return result.state;
      });

      if (prevForCallback && refs.onAfterActionRef.current) {
        refs.onAfterActionRef.current(prevForCallback, result.state);
      }

      onClearSelectionRef.current?.();
    },
    [showError, refs],
  );

  const initGame = useCallback(async () => {
    setLoading(true);
    if (options.initialMatch) {
      resetHandLayout();
      setState(options.initialMatch);
      setError(null);
      setLoading(false);
      onClearSelectionRef.current?.();
      return;
    }
    const [rules, aiSettings] = await Promise.all([
      options.rules ? Promise.resolve(options.rules) : loadActiveRules(),
      options.aiDifficulties ? Promise.resolve(null) : loadAIDifficultySettings(),
    ]);
    const humanSeat = 0;
    const aiDifficulties =
      options.aiDifficulties ??
      buildAiDifficultiesForMatch(humanSeat, aiSettings!);
    const match = createSinglePlayerMatch({ humanSeat, aiDifficulties, rules });
    resetHandLayout();
    setState(match);
    setError(null);
    setLoading(false);
    onClearSelectionRef.current?.();
  }, [options.aiDifficulties, options.rules, options.initialMatch, resetHandLayout]);

  useEffect(() => {
    initGame();
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [initGame]);

  const handleHandEnd = useCallback(
    async (match: MatchState) => {
      if (!recordProgress || !match.lastHandResult) return;
      if (match.handsPlayed <= lastRecordedHand.current) return;
      lastRecordedHand.current = match.handsPlayed;

      const { humanWon, humanPoints } = match.lastHandResult;
      const { newlyUnlocked } = await recordSinglePlayerResult(humanWon, humanPoints);
      if (newlyUnlocked.length > 0) setUnlockMessages(newlyUnlocked);
      await refreshCosmetics();
    },
    [refreshCosmetics, recordProgress],
  );

  useEffect(() => {
    if (!state || !recordProgress) return;
    if (state.phase === 'handOver' || state.phase === 'gameOver') {
      handleHandEnd(state);
    }
  }, [state, handleHandEnd, recordProgress]);

  useEffect(() => {
    if (pauseAI || refs.shouldPauseAIRef.current?.()) {
      setAiThinking(false);
      return;
    }
    if (!state || state.phase !== 'playing' || !isAIPlayer(state)) {
      setAiThinking(false);
      return;
    }

    const stockEnd = checkStockExhaustion(state);
    if (stockEnd) {
      setAiThinking(false);
      applyResult(stockEnd);
      return;
    }

    const difficulty = state.players[state.currentPlayer].aiDifficulty ?? 'medium';
    const delayMs = getAIThinkDelayMs(difficulty);
    setAiThinking(true);

    aiTimerRef.current = setTimeout(() => {
      setAiThinking(false);
      if (refs.shouldPauseAIRef.current?.()) return;
      const live = refs.stateRef.current;
      if (!live || live.phase !== 'playing' || !isAIPlayer(live)) return;

      let result = executeAITurn(live);
      if (!result.ok) result = recoverAITurn(result.state);
      applyResult(result);
    }, delayMs);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [state, applyResult, pauseAI, refs]);

  useEffect(() => {
    if (!state || state.phase !== 'playing') return;
    if (state.turnPhase !== 'draw' || state.stock.length > 0) return;
    if (state.currentPlayer !== state.humanSeat) return;
    const stockEnd = checkStockExhaustion(state);
    if (stockEnd) applyResult(stockEnd);
  }, [state, applyResult]);

  const onNextHand = useCallback(() => {
    if (!state) return;
    resetHandLayout();
    setState(dealNextHand(state));
    setError(null);
    onClearSelectionRef.current?.();
  }, [state, resetHandLayout]);

  const onNewMatch = useCallback(() => {
    lastRecordedHand.current = 0;
    initGame();
  }, [initGame]);

  const initFromMatch = useCallback(
    (match: MatchState) => {
      resetHandLayout();
      setState(match);
      setError(null);
      setLoading(false);
      onClearSelectionRef.current?.();
    },
    [resetHandLayout],
  );

  return {
    state,
    setState,
    loading,
    aiThinking,
    error,
    unlockMessages,
    clearUnlockMessages: () => setUnlockMessages([]),
    applyResult,
    initGame,
    onNextHand,
    onNewMatch,
    initFromMatch,
    resetHandLayout,
  };
}
