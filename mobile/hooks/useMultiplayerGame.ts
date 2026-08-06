import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MatchState } from '../engine/index';
import { useGameMatch } from './game/useGameMatch';
import { usePlayerHand } from './game/usePlayerHand';
import { usePlayerActions } from './game/usePlayerActions';
import type { GameSessionRefs, SinglePlayerGameHandle } from './game/types';
import {
  MultiplayerClient,
  Lobby,
  MultiplayerAction,
  ServerMessage,
  DEFAULT_MULTIPLAYER_URL,
} from '../services/multiplayer-client';
import { useToast } from '../contexts/ToastContext';

export interface UseMultiplayerGameOptions {
  serverUrl?: string;
  onGameStarted?: () => void;
}

export interface MultiplayerGameHandle extends SinglePlayerGameHandle {
  lobby: Lobby | null;
  roomCode: string | null;
  seatId: number | null;
  playerId: string | null;
  connected: boolean;
  gameStarted: boolean;
  createRoom: (displayName: string) => Promise<string>;
  joinRoom: (code: string, displayName: string) => Promise<void>;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  disconnect: () => void;
}

type PendingOp =
  | { kind: 'create'; resolve: (code: string) => void; reject: (err: Error) => void }
  | { kind: 'join'; resolve: () => void; reject: (err: Error) => void };

export function useMultiplayerGame(
  options: UseMultiplayerGameOptions = {},
): MultiplayerGameHandle {
  const { showError } = useToast();
  const clientRef = useRef<MultiplayerClient | null>(null);
  const pendingRef = useRef<PendingOp | null>(null);
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [seatId, setSeatId] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const manualOrderRef = useRef(false);
  const lastGroupingKeyRef = useRef('');
  const stateRef = useRef<MatchState | null>(null);
  const onAfterActionRef = useRef<((prev: MatchState, next: MatchState) => void) | undefined>(
    undefined,
  );
  const shouldPauseAIRef = useRef<(() => boolean) | undefined>(() => true);

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
    refs,
    onClearSelection,
    recordProgress: false,
    pauseAI: true,
    shouldPauseAI: () => true,
  });

  const hand = usePlayerHand(match.state, refs);
  handApiRef.current = hand;

  const onGameStartedRef = useRef(options.onGameStarted);
  onGameStartedRef.current = options.onGameStarted;

  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'roomCreated':
          setRoomCode(msg.code);
          setPlayerId(msg.playerId);
          setSeatId(msg.seatId);
          if (pendingRef.current?.kind === 'create') {
            pendingRef.current.resolve(msg.code);
            pendingRef.current = null;
          }
          break;
        case 'roomJoined':
          setRoomCode(msg.code);
          setPlayerId(msg.playerId);
          setSeatId(msg.seatId);
          if (pendingRef.current?.kind === 'join') {
            pendingRef.current.resolve();
            pendingRef.current = null;
          }
          break;
        case 'lobbyUpdate':
          setLobby(msg.lobby);
          break;
        case 'gameStarted':
          setGameStarted(true);
          onGameStartedRef.current?.();
          break;
        case 'stateSync':
          match.initFromMatch(msg.state);
          break;
        case 'error':
          if (pendingRef.current) {
            pendingRef.current.reject(new Error(msg.message));
            pendingRef.current = null;
          } else {
            showError(msg.message);
          }
          break;
        default:
          break;
      }
    },
    [match, showError],
  );

  const connectOnce = useCallback(async () => {
    if (clientRef.current?.connected) return clientRef.current;
    const client = new MultiplayerClient();
    const url = options.serverUrl ?? DEFAULT_MULTIPLAYER_URL;
    await client.connect(url, handleServerMessage);
    clientRef.current = client;
    setConnected(true);
    return client;
  }, [handleServerMessage, options.serverUrl]);

  const sendRemoteAction = useCallback(
    (action: MultiplayerAction) => {
      try {
        clientRef.current?.send({ type: 'action', payload: action });
        onClearSelection();
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Not connected');
      }
    },
    [onClearSelection, showError],
  );

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
    sendRemoteAction: gameStarted ? sendRemoteAction : undefined,
  });

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  const createRoom = useCallback(
    async (displayName: string): Promise<string> => {
      const client = await connectOnce();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (pendingRef.current?.kind === 'create') {
            pendingRef.current.reject(new Error('Room creation timed out'));
            pendingRef.current = null;
          }
        }, 8000);
        pendingRef.current = {
          kind: 'create',
          resolve: (code) => {
            clearTimeout(timeout);
            resolve(code);
          },
          reject: (err) => {
            clearTimeout(timeout);
            reject(err);
          },
        };
        client.send({ type: 'createRoom', displayName, playerCount: 4 });
      });
    },
    [connectOnce],
  );

  const joinRoom = useCallback(
    async (code: string, displayName: string): Promise<void> => {
      const client = await connectOnce();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (pendingRef.current?.kind === 'join') {
            pendingRef.current.reject(new Error('Join timed out'));
            pendingRef.current = null;
          }
        }, 8000);
        pendingRef.current = {
          kind: 'join',
          resolve: () => {
            clearTimeout(timeout);
            resolve();
          },
          reject: (err) => {
            clearTimeout(timeout);
            reject(err);
          },
        };
        client.send({ type: 'joinRoom', code: code.toUpperCase(), displayName });
      });
    },
    [connectOnce],
  );

  const setReady = useCallback((ready: boolean) => {
    clientRef.current?.send({ type: 'setReady', ready });
  }, []);

  const startGame = useCallback(() => {
    clientRef.current?.send({ type: 'startGame' });
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setConnected(false);
    setLobby(null);
    setRoomCode(null);
    setGameStarted(false);
  }, []);

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
    lobby,
    roomCode,
    seatId,
    playerId,
    connected,
    gameStarted,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    disconnect,
  };
}
