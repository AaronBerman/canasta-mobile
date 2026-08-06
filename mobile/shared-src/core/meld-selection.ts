import { Card, isWild, isBlackThree, isRedThree, Rank } from './cards.js';
import { canAddToMeld, isValidMeld, Meld, meldPointValue } from './melds.js';

export interface MeldActionPlan {
  newMelds: Card[][];
  additions: { meldRank: Rank; cards: Card[] }[];
  unused: Card[];
}

/** Rank implied by naturals in a selection — wilds count as this rank when set. */
export function getImpliedRankFromSelection(selected: Card[]): Rank | null {
  const naturals = selected.filter(
    (c) => !isWild(c) && !isBlackThree(c) && !isRedThree(c),
  );
  if (naturals.length === 0) return null;
  const rank = naturals[0].rank;
  return naturals.every((c) => c.rank === rank) ? rank : null;
}

function tryAddCardsToMeld(
  meld: Meld,
  remaining: Card[],
  wildForRank?: Rank | null,
): Card[] {
  const toAdd: Card[] = [];
  let current = [...meld.cards];
  let changed = true;

  while (changed) {
    changed = false;
    for (let i = 0; i < remaining.length; i++) {
      const card = remaining[i];
      if (isWild(card)) {
        if (wildForRank != null && wildForRank !== meld.rank) continue;
      } else if (!isBlackThree(card) && card.rank !== meld.rank) {
        continue;
      }
      if (canAddToMeld({ rank: meld.rank, cards: current }, card)) {
        toAdd.push(card);
        current.push(card);
        remaining.splice(i, 1);
        changed = true;
        break;
      }
    }
  }

  return toAdd;
}

/** Whether the discard top can legally be used in a meld with the current hand. */
export function canUseDiscardTopInMeld(
  hand: Card[],
  top: Card,
  teamMelds: Meld[],
  minMeldSize: number,
): boolean {
  return meldPointsWithDiscardTop(hand, top, teamMelds, minMeldSize) > 0;
}

/** Whether required cards (e.g. discard top) are used in a valid meld plan. */
export function canUseRequiredCardsInPlan(
  selected: Card[],
  requiredCardIds: string[],
  teamMelds: Meld[],
  minMeldSize: number,
  targetMeldRank?: Rank | null,
): boolean {
  if (requiredCardIds.length === 0) return true;
  const plan = planMeldActions(selected, teamMelds, minMeldSize, targetMeldRank);
  if (!isValidMeldPlan(plan, selected.length)) return false;
  return planUsesCardIds(plan, requiredCardIds);
}

/** Best meld point value using discard top + hand (top must be in the meld). */
export function meldPointsWithDiscardTop(
  hand: Card[],
  top: Card,
  teamMelds: Meld[],
  minMeldSize: number,
): number {
  if (isBlackThree(top) || isRedThree(top)) return 0;

  let best = 0;

  if (isWild(top)) {
    for (const meld of teamMelds) {
      if (canAddToMeld(meld, top)) {
        best = Math.max(best, meldPointValue({ rank: meld.rank, cards: [top] }));
      }
    }

    const handNaturals = hand.filter((c) => !isWild(c) && !isBlackThree(c) && !isRedThree(c));
    const ranks = [...new Set(handNaturals.map((c) => c.rank))];
    const handWilds = hand.filter(isWild);

    for (const rank of ranks) {
      const naturals = handNaturals.filter((c) => c.rank === rank);
      for (let w = 0; w <= handWilds.length; w++) {
        const nNeeded = minMeldSize - 1 - w;
        if (nNeeded < 1 || nNeeded > naturals.length) continue;
        const group = [top, ...naturals.slice(0, nNeeded), ...handWilds.slice(0, w)];
        if (isValidMeld(group)) {
          best = Math.max(best, meldPointValue({ rank, cards: group }));
        }
      }
    }
    return best;
  }

  const existing = teamMelds.find((m) => m.rank === top.rank);
  if (existing && canAddToMeld(existing, top)) {
    best = Math.max(best, meldPointValue({ rank: top.rank, cards: [top] }));
  }

  const naturals = hand.filter(
    (c) => c.rank === top.rank && !isWild(c) && !isRedThree(c) && !isBlackThree(c),
  );
  const wilds = hand.filter(isWild);
  for (let w = 0; w <= wilds.length; w++) {
    const nFromHand = minMeldSize - 1 - w;
    if (nFromHand < 0 || nFromHand > naturals.length) continue;
    const group = [top, ...naturals.slice(0, nFromHand), ...wilds.slice(0, w)];
    if (isValidMeld(group)) {
      best = Math.max(best, meldPointValue({ rank: top.rank, cards: group }));
    }
  }

  return best;
}

/** Meld piles that can accept the full current selection. */
export function findMeldsAcceptingSelection(teamMelds: Meld[], selected: Card[]): Rank[] {
  if (selected.length === 0) return [];

  const impliedRank = getImpliedRankFromSelection(selected);

  if (impliedRank) {
    const meld = teamMelds.find((m) => m.rank === impliedRank);
    if (!meld) return [];
    const scratch = [...selected];
    if (tryAddCardsToMeld(meld, scratch, impliedRank).length === selected.length) {
      return [impliedRank];
    }
    return [];
  }

  if (selected.every(isWild)) {
    return teamMelds
      .filter((meld) => {
        const scratch = [...selected];
        return tryAddCardsToMeld(meld, scratch, meld.rank).length === selected.length;
      })
      .map((m) => m.rank);
  }

  return [];
}

/** Wild-only selections need a target pile when multiple melds qualify. */
export function needsMeldTarget(
  selected: Card[],
  teamMelds: Meld[],
  targetMeldRank: Rank | null | undefined,
  minMeldSize: number,
): boolean {
  if (targetMeldRank || selected.length === 0) return false;
  if (getImpliedRankFromSelection(selected)) return false;
  if (!selected.some(isWild)) return false;
  if (selected.every(isWild)) {
    return findMeldsAcceptingSelection(teamMelds, selected).length > 1;
  }

  const plan = planMeldActions(selected, teamMelds, minMeldSize, targetMeldRank);
  if (isValidMeldPlan(plan, selected.length)) return false;

  const orphanWilds = plan.unused.filter(isWild);
  if (orphanWilds.length === 0) return false;
  return findMeldsAcceptingSelection(teamMelds, orphanWilds).length > 1;
}

/** Split selected cards into valid new meld groups, using wilds where allowed. */
export function partitionIntoMelds(
  cards: Card[],
  minMeldSize: number,
  wildForRank?: Rank | null,
): Card[][] {
  if (cards.length === 0) return [];

  const wilds = cards.filter(isWild);
  let availableWilds = wildForRank != null ? [...wilds] : [...wilds];
  const byRank = new Map<Rank, Card[]>();

  for (const card of cards) {
    if (isWild(card) || isBlackThree(card)) continue;
    const group = byRank.get(card.rank) ?? [];
    group.push(card);
    byRank.set(card.rank, group);
  }

  const groups: Card[][] = [];
  const ranks = [...byRank.keys()].sort(
    (a, b) => byRank.get(b)!.length - byRank.get(a)!.length,
  );

  for (const rank of ranks) {
    const naturals = [...byRank.get(rank)!];
    const wildsForGroup: Card[] = [];
    const mayUseWilds = wildForRank == null || wildForRank === rank;

    if (mayUseWilds) {
      while (
        availableWilds.length > 0 &&
        wildsForGroup.length < naturals.length &&
        naturals.length + wildsForGroup.length < minMeldSize
      ) {
        wildsForGroup.push(availableWilds.shift()!);
      }
    }

    let group = [...naturals, ...wildsForGroup];

    if (group.length < minMeldSize) {
      if (mayUseWilds) {
        availableWilds.unshift(...wildsForGroup);
      }
      wildsForGroup.length = 0;

      const needed = minMeldSize - naturals.length;
      if (mayUseWilds && needed > 0 && availableWilds.length >= needed) {
        wildsForGroup.push(...availableWilds.splice(0, needed));
        group = [...naturals, ...wildsForGroup];
      }
    } else if (mayUseWilds) {
      while (availableWilds.length > 0 && wildsForGroup.length < naturals.length) {
        wildsForGroup.push(availableWilds.shift()!);
      }
      group = [...naturals, ...wildsForGroup];
    }

    if (group.length >= minMeldSize && isValidMeld(group)) {
      groups.push(group);
    } else if (mayUseWilds) {
      availableWilds.unshift(...wildsForGroup);
    }
  }

  return groups;
}

/** Plan new melds plus additions to existing team melds from a card selection. */
export function planMeldActions(
  selected: Card[],
  teamMelds: Meld[],
  minMeldSize: number,
  targetMeldRank?: Rank | null,
): MeldActionPlan {
  const remaining = [...selected];
  const additions: { meldRank: Rank; cards: Card[] }[] = [];
  const handledRanks = new Set<Rank>();
  const impliedRank = getImpliedRankFromSelection(selected);
  const wildForRank = targetMeldRank ?? impliedRank ?? null;

  if (wildForRank) {
    const meld = teamMelds.find((m) => m.rank === wildForRank);
    if (meld) {
      const toAdd = tryAddCardsToMeld(meld, remaining, wildForRank);
      if (toAdd.length > 0) {
        additions.push({ meldRank: wildForRank, cards: toAdd });
        handledRanks.add(wildForRank);
      }
    }
  }

  for (const meld of teamMelds) {
    if (handledRanks.has(meld.rank)) continue;
    const rankForWilds = wildForRank ?? meld.rank;
    const toAdd = tryAddCardsToMeld(meld, remaining, rankForWilds);
    if (toAdd.length > 0) {
      additions.push({ meldRank: meld.rank, cards: toAdd });
    }
  }

  const newMelds = partitionIntoMelds(remaining, minMeldSize, wildForRank);
  const usedIds = new Set([
    ...newMelds.flatMap((g) => g.map((c) => c.id)),
    ...additions.flatMap((a) => a.cards.map((c) => c.id)),
  ]);
  const unused = remaining.filter((c) => !usedIds.has(c.id));

  return { newMelds, additions, unused };
}

/** Best valid new-meld card group that includes the discard top. */
export function bestNewMeldWithDiscardTop(
  hand: Card[],
  top: Card,
  minMeldSize: number,
): Card[] | null {
  if (isBlackThree(top) || isRedThree(top)) return null;

  let best: Card[] | null = null;
  let bestPts = 0;

  if (isWild(top)) {
    const handNaturals = hand.filter((c) => !isWild(c) && !isBlackThree(c) && !isRedThree(c));
    const ranks = [...new Set(handNaturals.map((c) => c.rank))];
    const otherWilds = hand.filter((c) => isWild(c) && c.id !== top.id);

    for (const rank of ranks) {
      const naturals = handNaturals.filter((c) => c.rank === rank);
      for (let w = 0; w <= otherWilds.length; w++) {
        const nNeeded = minMeldSize - 1 - w;
        if (nNeeded < 1 || nNeeded > naturals.length) continue;
        const group = [top, ...naturals.slice(0, nNeeded), ...otherWilds.slice(0, w)];
        if (!isValidMeld(group)) continue;
        const pts = meldPointValue({ rank, cards: group });
        if (pts > bestPts) {
          bestPts = pts;
          best = group;
        }
      }
    }
    return best;
  }

  const rank = top.rank;
  const naturals = hand.filter(
    (c) => c.rank === rank && !isWild(c) && !isRedThree(c) && !isBlackThree(c),
  );
  const others = naturals.filter((c) => c.id !== top.id);
  const wilds = hand.filter(isWild);

  for (let w = 0; w <= wilds.length; w++) {
    const nFromHand = minMeldSize - 1 - w;
    if (nFromHand < 0 || nFromHand > others.length) continue;
    const group = [top, ...others.slice(0, nFromHand), ...wilds.slice(0, w)];
    if (!isValidMeld(group)) continue;
    const pts = meldPointValue({ rank, cards: group });
    if (pts > bestPts) {
      bestPts = pts;
      best = group;
    }
  }

  return best;
}

/** Suggest cards to select/meld when the discard top must be used. */
export function suggestMeldForRequiredTop(
  hand: Card[],
  requiredIds: string[],
  teamMelds: Meld[],
  minMeldSize: number,
): Card[] | null {
  const required = hand.filter((c) => requiredIds.includes(c.id));
  if (required.length === 0) return null;
  const top = required[0];

  if (!isWild(top)) {
    const existing = teamMelds.find((m) => m.rank === top.rank);
    if (existing && canAddToMeld(existing, top)) {
      return [top];
    }
  } else {
    for (const meld of teamMelds) {
      if (canAddToMeld(meld, top)) return [top];
    }
  }

  return bestNewMeldWithDiscardTop(hand, top, minMeldSize);
}

/**
 * If the player selected naturals that need a wild to meld (e.g. 6+6), pull a wild
 * from hand automatically.
 */
export function expandSelectionWithHandWilds(
  hand: Card[],
  selected: Card[],
  minMeldSize: number,
): Card[] {
  if (selected.length === 0) return selected;

  const currentPlan = planMeldActions(selected, [], minMeldSize);
  if (isValidMeldPlan(currentPlan, selected.length)) return selected;

  const implied = getImpliedRankFromSelection(selected);
  const selectedIds = new Set(selected.map((c) => c.id));
  const handWilds = hand.filter((c) => isWild(c) && !selectedIds.has(c.id));
  if (handWilds.length === 0) return selected;

  if (implied) {
    const naturals = selected.filter((c) => !isWild(c) && c.rank === implied);
    const wildsInSel = selected.filter(isWild);
    const wildsNeeded = minMeldSize - naturals.length - wildsInSel.length;
    if (wildsNeeded <= 0) return selected;
    if (wildsInSel.length + wildsNeeded > naturals.length) return selected;
    if (handWilds.length < wildsNeeded) return selected;

    const expanded = [...selected, ...handWilds.slice(0, wildsNeeded)];
    const expandedPlan = planMeldActions(expanded, [], minMeldSize);
    if (isValidMeldPlan(expandedPlan, expanded.length)) return expanded;
    return selected;
  }

  for (let w = 1; w <= handWilds.length; w++) {
    const expanded = [...selected, ...handWilds.slice(0, w)];
    const plan = planMeldActions(expanded, [], minMeldSize);
    if (isValidMeldPlan(plan, expanded.length)) return expanded;
  }

  return selected;
}

/** Cards to use for melding (selection + auto wild completion). */
export function effectiveMeldSelection(
  hand: Card[],
  selected: Card[],
  teamMelds: Meld[],
  minMeldSize: number,
  targetMeldRank?: Rank | null,
): Card[] {
  let cards = expandSelectionWithHandWilds(hand, selected, minMeldSize);
  const plan = planMeldActions(cards, teamMelds, minMeldSize, targetMeldRank);
  if (isValidMeldPlan(plan, cards.length)) return cards;

  // Two naturals selected without wild — try pulling wild even if first expand failed
  const implied = getImpliedRankFromSelection(selected);
  if (implied && selected.filter(isWild).length === 0) {
    cards = expandSelectionWithHandWilds(hand, selected, minMeldSize);
  }
  return cards;
}

export function plannedCardCount(plan: MeldActionPlan): number {
  return (
    plan.newMelds.reduce((n, g) => n + g.length, 0) +
    plan.additions.reduce((n, a) => n + a.cards.length, 0)
  );
}

export function planUsesCardIds(plan: MeldActionPlan, cardIds: string[]): boolean {
  const used = new Set([
    ...plan.newMelds.flatMap((g) => g.map((c) => c.id)),
    ...plan.additions.flatMap((a) => a.cards.map((c) => c.id)),
  ]);
  return cardIds.every((id) => used.has(id));
}

export function isValidMeldPlan(plan: MeldActionPlan, selectedCount?: number): boolean {
  if (plan.unused.length > 0) return false;
  const planned = plannedCardCount(plan);
  if (planned === 0) return false;
  if (selectedCount !== undefined && planned !== selectedCount) return false;
  return true;
}

export function countMeldGroupsInSelection(cards: Card[], minMeldSize: number): number {
  return partitionIntoMelds(cards, minMeldSize).length;
}

export function totalMeldPoints(groups: Card[][]): number {
  return groups.reduce((sum, cards) => {
    const rank = cards.find((c) => !isWild(c))!.rank;
    return sum + meldPointValue({ rank, cards });
  }, 0);
}

export function describeMeldPlan(plan: MeldActionPlan, targetMeldRank?: Rank | null): string {
  const parts: string[] = [];
  if (plan.newMelds.length > 0) {
    const mixed = plan.newMelds.filter((g) => g.some(isWild));
    if (mixed.length > 0 && plan.newMelds.length === 1) {
      const g = plan.newMelds[0];
      const wilds = g.filter(isWild).length;
      const rank = g.find((c) => !isWild(c))?.rank;
      if (rank && wilds > 0) {
        parts.push(`mixed ${rank} meld (${g.length - wilds}+${wilds} wild)`);
      } else {
        parts.push(plan.newMelds.length === 1 ? '1 new meld' : `${plan.newMelds.length} new melds`);
      }
    } else {
      const label =
        plan.newMelds.length === 1 ? '1 new meld' : `${plan.newMelds.length} new melds`;
      if (plan.newMelds.length > 1) {
        parts.push(`${label} (${totalMeldPoints(plan.newMelds)} pts)`);
      } else {
        parts.push(label);
      }
    }
  }
  if (plan.additions.length > 0) {
    for (const add of plan.additions) {
      const wilds = add.cards.filter(isWild).length;
      const naturals = add.cards.length - wilds;
      if (wilds > 0 && naturals > 0) {
        parts.push(`add ${add.cards.length} to ${add.meldRank} (${wilds} wild as ${add.meldRank})`);
      } else if (targetMeldRank && plan.additions.length === 1) {
        parts.push(`add ${add.cards.length} to ${add.meldRank}`);
      } else {
        parts.push(`add ${add.cards.length} to ${add.meldRank}`);
      }
    }
  }
  return parts.join(' + ');
}
