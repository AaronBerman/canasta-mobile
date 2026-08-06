import type { MutableRefObject } from 'react';
import { MatchState, Rank, Card, GameRequirementInfo } from '../../engine/index';
import type { MeldPanelProps } from '../../components/game/GameBoard';

/** Public API returned by useSinglePlayerGame — shared by layout and meld panel hooks. */
export interface SinglePlayerGameHandle {
  state: MatchState | null;
  loading: boolean;
  aiThinking: boolean;
  error: string | null;
  unlockMessages: string[];
  clearUnlockMessages: () => void;
  handGroups: Card[][];
  selectedCardIds: Set<string>;
  newCardIds: Set<string>;
  meldActionLabel: string;
  canMeldSelection: boolean;
  autoIncludedWild: boolean;
  wouldEmptyHand: boolean;
  requirementInfo: GameRequirementInfo | null;
  actionHints: Record<string, string>;
  requiresMeldTarget: boolean;
  mustMeldDiscardTop: boolean;
  canSkipMeld: boolean;
  targetMeldRank: Rank | null;
  selectableTargetRanks: Rank[];
  selectTargetMeld: (rank: Rank) => void;
  stockEmptyAtTurnStart: boolean;
  additionHighlightRanks: Rank[];
  additionCounts: Partial<Record<string, number>>;
  toggleCardSelection: (cardId: string) => void;
  selectMeldGroup: (group: Card[]) => void;
  reorderHand: (fromIndex: number, toIndex: number) => void;
  onAutoGroupHand: () => void;
  isMyTurn: boolean;
  handEnded: boolean;
  meldUiActive: boolean;
  canMeldNow: boolean;
  canTakeDiscard: boolean;
  onDrawStock: () => void;
  onTakeDiscard: () => void;
  onMeldSelected: () => void;
  onSkipMeld: () => void;
  onDiscardCard: (card: Card) => void;
  onDiscardSelected: () => void;
  onUndoTurn: () => void;
  canUndo: boolean;
  turnStuck: boolean;
  onNextHand: () => void;
  onNewMatch: () => void;
  initFromMatch: (match: MatchState) => void;
  showActionHint: (message: string) => void;
}

export interface GameSessionRefs {
  manualOrderRef: MutableRefObject<boolean>;
  lastGroupingKeyRef: MutableRefObject<string>;
  stateRef: MutableRefObject<MatchState | null>;
  onAfterActionRef: MutableRefObject<
    ((prev: MatchState, next: MatchState) => void) | undefined
  >;
  shouldPauseAIRef: MutableRefObject<(() => boolean) | undefined>;
}

export type { MeldPanelProps };
