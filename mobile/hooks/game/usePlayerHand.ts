import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MatchState,
  Rank,
  Card,
  groupHandOrder,
  groupHandIntoSets,
  orderHandByIds,
  handSignature,
  groupHandByManualOrder,
  planMeldActions,
  isValidMeldPlan,
  describeMeldPlan,
  findMeldsAcceptingSelection,
  needsMeldTarget,
  canUseRequiredCardsInPlan,
  effectiveMeldSelection,
  suggestMeldForRequiredTop,
  getGameRequirementInfo,
  getPartnerIndex,
  wouldMeldUseEntireHand,
  teamMeldTablePoints,
} from '../../engine/index';
import type { GameSessionRefs } from './types';

export function usePlayerHand(state: MatchState | null, refs: GameSessionRefs) {
  const [handOrder, setHandOrder] = useState<string[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [targetMeldRank, setTargetMeldRank] = useState<Rank | null>(null);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(() => new Set());
  const prevStateRef = useRef<MatchState | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedCardIds(new Set());
    setTargetMeldRank(null);
  }, []);

  const clearNewCardHighlights = useCallback(() => {
    setNewCardIds(new Set());
  }, []);

  const groupingContext = useMemo(() => {
    if (!state) return null;
    const hand = state.players[state.humanSeat].hand;
    const teamId = state.players[state.humanSeat].teamId;
    const teamMelds = state.teams[teamId].melds;
    const key =
      handSignature(hand) +
      '::' +
      teamMelds.map((m) => `${m.rank}:${m.cards.length}`).join(',');
    return {
      hand,
      options: { teamMelds, minMeldSize: state.rules.minMeldSize },
      key,
    };
  }, [state]);

  useEffect(() => {
    if (!groupingContext) return;

    const { hand, options, key } = groupingContext;
    if (key !== refs.lastGroupingKeyRef.current) {
      refs.lastGroupingKeyRef.current = key;
      refs.manualOrderRef.current = false;
    }

    if (!refs.manualOrderRef.current) {
      setHandOrder(groupHandOrder(hand, options));
      return;
    }

    setHandOrder((prev) => {
      const handIds = new Set(hand.map((c) => c.id));
      const kept = prev.filter((id) => handIds.has(id));
      const keptSet = new Set(kept);
      const added = hand.filter((c) => !keptSet.has(c.id));
      if (added.length === 0) return kept;
      return [...kept, ...groupHandOrder(added, options)];
    });
  }, [groupingContext, refs]);

  const orderedHand = useMemo(() => {
    if (!state) return [];
    return orderHandByIds(state.players[state.humanSeat].hand, handOrder);
  }, [state, handOrder]);

  useEffect(() => {
    if (!state) {
      prevStateRef.current = null;
      return;
    }

    const prev = prevStateRef.current;
    if (prev) {
      const humanSeat = state.humanSeat;

      if (state.handsPlayed !== prev.handsPlayed || state.phase !== prev.phase) {
        setNewCardIds(new Set());
      } else if (state.currentPlayer === humanSeat && prev.currentPlayer !== humanSeat) {
        setNewCardIds(new Set());
      } else if (prev.currentPlayer === humanSeat && state.currentPlayer !== humanSeat) {
        setNewCardIds(new Set());
      } else if (state.currentPlayer === humanSeat && prev.currentPlayer === humanSeat) {
        const prevIds = new Set(prev.players[humanSeat].hand.map((c) => c.id));
        const added = state.players[humanSeat].hand
          .filter((c) => !prevIds.has(c.id))
          .map((c) => c.id);
        if (added.length > 0) {
          setNewCardIds((current) => new Set([...current, ...added]));
        }
      }
    }

    prevStateRef.current = state;
  }, [state]);

  const handGroups = useMemo(() => {
    if (!state || !groupingContext) return [];
    if (!refs.manualOrderRef.current) {
      return groupHandIntoSets(groupingContext.hand, groupingContext.options);
    }
    return groupHandByManualOrder(orderedHand);
  }, [state, groupingContext, orderedHand, refs]);

  const getSelectedCards = useCallback((): Card[] => {
    return orderedHand.filter((c) => selectedCardIds.has(c.id));
  }, [orderedHand, selectedCardIds]);

  const getEffectiveMeldCards = useCallback((): Card[] => {
    if (!state) return [];
    const hand = state.players[state.humanSeat].hand;
    const teamId = state.players[state.humanSeat].teamId;
    return effectiveMeldSelection(
      hand,
      getSelectedCards(),
      state.teams[teamId].melds,
      state.rules.minMeldSize,
      targetMeldRank,
    );
  }, [state, getSelectedCards, targetMeldRank]);

  const meldPlan = useMemo(() => {
    if (!state) return null;
    const teamId = state.players[state.humanSeat].teamId;
    return planMeldActions(
      getEffectiveMeldCards(),
      state.teams[teamId].melds,
      state.rules.minMeldSize,
      targetMeldRank,
    );
  }, [state, getEffectiveMeldCards, targetMeldRank]);

  const selectableTargetRanks = useMemo(() => {
    if (!state) return [] as Rank[];
    const teamId = state.players[state.humanSeat].teamId;
    return findMeldsAcceptingSelection(state.teams[teamId].melds, getSelectedCards());
  }, [state, getSelectedCards]);

  const requiresMeldTarget = useMemo(() => {
    if (!state) return false;
    const teamId = state.players[state.humanSeat].teamId;
    return needsMeldTarget(
      getSelectedCards(),
      state.teams[teamId].melds,
      targetMeldRank,
      state.rules.minMeldSize,
    );
  }, [state, getSelectedCards, targetMeldRank]);

  const requiredTopUsable = useMemo(() => {
    if (!state || state.requiredMeldCardIds.length === 0) return true;
    const teamId = state.players[state.humanSeat].teamId;
    return canUseRequiredCardsInPlan(
      getEffectiveMeldCards(),
      state.requiredMeldCardIds,
      state.teams[teamId].melds,
      state.rules.minMeldSize,
      targetMeldRank,
    );
  }, [state, getEffectiveMeldCards, targetMeldRank]);

  const autoIncludedWild = useMemo(() => {
    const selected = getSelectedCards();
    return getEffectiveMeldCards().length > selected.length;
  }, [getSelectedCards, getEffectiveMeldCards]);

  useEffect(() => {
    if (!state || state.turnPhase !== 'meld') return;
    if (state.requiredMeldCardIds.length === 0) return;
    if (state.currentPlayer !== state.humanSeat) return;

    const human = state.players[state.humanSeat];
    const teamId = human.teamId;
    const suggestion = suggestMeldForRequiredTop(
      human.hand,
      state.requiredMeldCardIds,
      state.teams[teamId].melds,
      state.rules.minMeldSize,
    );
    if (suggestion) {
      setSelectedCardIds(new Set(suggestion.map((c) => c.id)));
    }
  }, [
    state?.requiredMeldCardIds,
    state?.turnPhase,
    state?.currentPlayer,
    state?.humanSeat,
    state?.players,
    state?.teams,
    state?.rules.minMeldSize,
  ]);

  const wouldEmptyHand = useMemo(() => {
    if (!state) return false;
    const handSize = state.players[state.humanSeat].hand.length;
    return wouldMeldUseEntireHand(handSize, getEffectiveMeldCards().length);
  }, [state, getEffectiveMeldCards]);

  const requirementInfo = useMemo(() => {
    if (!state) return null;
    const human = state.players[state.humanSeat];
    const partnerIdx = getPartnerIndex(state.humanSeat, state.players.length);
    return getGameRequirementInfo(
      state.teams[human.teamId],
      human.hand.length,
      state.players[partnerIdx].partnerTookDiscard,
      state.rules,
    );
  }, [state]);

  const canSkipMeld = useMemo(() => {
    if (!state || state.requiredMeldCardIds.length > 0) return false;
    const team = state.teams[state.players[state.humanSeat].teamId];
    if (!team.hasMelded && team.melds.length > 0 && requirementInfo?.initialMeldPoints) {
      const staged =
        requirementInfo.stagedMeldPoints ?? teamMeldTablePoints(team.melds);
      if (staged < requirementInfo.initialMeldPoints) return false;
    }
    return true;
  }, [state, requirementInfo]);

  const canMeldSelection = useMemo(
    () =>
      !!meldPlan &&
      isValidMeldPlan(meldPlan, getEffectiveMeldCards().length) &&
      !requiresMeldTarget &&
      requiredTopUsable &&
      !wouldEmptyHand,
    [
      meldPlan,
      getEffectiveMeldCards,
      requiresMeldTarget,
      requiredTopUsable,
      wouldEmptyHand,
    ],
  );

  const additionHighlightRanks = useMemo(
    () => meldPlan?.additions.map((a) => a.meldRank) ?? [],
    [meldPlan],
  );

  const additionCounts = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    for (const add of meldPlan?.additions ?? []) {
      counts[add.meldRank] = add.cards.length;
    }
    return counts;
  }, [meldPlan]);

  const toggleCardSelection = useCallback((cardId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
    setTargetMeldRank(null);
  }, []);

  const selectMeldGroup = useCallback((group: Card[]) => {
    setTargetMeldRank(null);
    setSelectedCardIds((prev) => {
      const ids = group.map((c) => c.id);
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  }, []);

  const selectTargetMeld = useCallback((rank: Rank) => {
    setTargetMeldRank((prev) => (prev === rank ? null : rank));
  }, []);

  const reorderHand = useCallback(
    (fromIndex: number, toIndex: number) => {
      refs.manualOrderRef.current = true;
      setHandOrder((prev) => {
        const ids = orderHandByIds(
          state?.players[state.humanSeat].hand ?? [],
          prev,
        ).map((c) => c.id);
        const next = [...ids];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [state, refs],
  );

  const onAutoGroupHand = useCallback(() => {
    if (!groupingContext) return;
    refs.manualOrderRef.current = false;
    setHandOrder(groupHandOrder(groupingContext.hand, groupingContext.options));
  }, [groupingContext, refs]);

  return {
    handGroups,
    selectedCardIds,
    newCardIds,
    targetMeldRank,
    meldPlan,
    meldActionLabel: meldPlan ? describeMeldPlan(meldPlan, targetMeldRank) : '',
    canMeldSelection,
    autoIncludedWild,
    requiredTopUsable,
    wouldEmptyHand,
    requirementInfo,
    requiresMeldTarget,
    canSkipMeld,
    selectableTargetRanks,
    selectTargetMeld,
    additionHighlightRanks,
    additionCounts,
    toggleCardSelection,
    selectMeldGroup,
    reorderHand,
    onAutoGroupHand,
    getSelectedCards,
    getEffectiveMeldCards,
    clearSelection,
    clearNewCardHighlights,
    setSelectedCardIds,
    setTargetMeldRank,
  };
}
