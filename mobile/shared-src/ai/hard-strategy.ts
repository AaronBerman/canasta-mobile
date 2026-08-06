import { Card, isWild } from '../core/cards.js';
import { GameState, getTeamId } from '../core/game-state.js';
import { findMeldsInHand, Meld, meldPointValue } from '../core/melds.js';
import {
  canGoOut,
  canTakeDiscardPile,
  initialMeldRequirement,
  isLegalDiscard,
  openingPointsIfDiscardTaken,
} from '../core/rules.js';
import { AIAction, AIStrategy } from './easy-strategy.js';
import { CardCounter, inferOpponentMelds, pickSafestDiscard, shouldFreezePile } from './card-counter.js';

function potentialMeldsFromHand(hand: Card[]): Meld[] {
  return findMeldsInHand(hand).filter((m) => m.cards.length >= 3);
}

function meldPoints(melds: Meld[]): number {
  return melds.reduce((s, m) => s + meldPointValue(m), 0);
}

/**
 * Hard: card counting, opponent inference, pile freezing,
 * blocking discards, and team score maximization.
 */
export class HardStrategy implements AIStrategy {
  private counter = new CardCounter();

  chooseAction(state: GameState, playerIndex: number): AIAction {
    this.counter.observeState(state);
    const player = state.players[playerIndex];
    const teamId = getTeamId(playerIndex);
    const team = state.teams[teamId];
    const hand = [...player.hand];
    const top = state.discard[state.discard.length - 1];

    const melds = this.selectOptimalMelds(hand, team, state);
    const handWithTop = top ? [...hand, top] : hand;
    const meldsWithTop = this.selectOptimalMelds(handWithTop, team, state);
    const openingTakePoints = openingPointsIfDiscardTaken(
      hand,
      state.discard,
      team.melds,
      team.hasMelded,
      state.rules,
    );

    const opponentLikely = inferOpponentMelds(state, this.counter);
    const oppNeedsTop = top && opponentLikely.includes(top.rank);

    if (
      top &&
      !oppNeedsTop &&
      canTakeDiscardPile(
        hand,
        state.discard,
        team.hasMelded,
        openingTakePoints,
        team.score,
        state.rules,
      ) &&
      this.takeImprovesTeam(meldsWithTop, melds, team)
    ) {
      return { type: 'takeDiscard', melds: meldsWithTop.length > 0 ? meldsWithTop : undefined };
    }

    if (melds.length > 0) {
      const remaining = this.handAfterMelds(hand, melds);
      const combinedMelds = [...team.melds, ...melds];

      if (this.shouldGoOut(remaining, combinedMelds, player, team)) {
        return { type: 'goOut', melds };
      }

      if (this.shouldMeldForTeam(melds, team, state)) {
        return { type: 'meld', melds };
      }
    }

    const discard = this.pickBlockingDiscard(hand, state, teamId);
    return { type: 'drawStock', discard };
  }

  private selectOptimalMelds(hand: Card[], team: GameState['teams'][0], state: GameState): Meld[] {
    const all = potentialMeldsFromHand(hand);
    if (!team.hasMelded) {
      const required = initialMeldRequirement(team.score, state.rules);
      const sorted = all.sort((a, b) => meldPointValue(b) - meldPointValue(a));
      let accumulated = 0;
      const selected: Meld[] = [];
      for (const m of sorted) {
        selected.push(m);
        accumulated += meldPointValue(m);
        if (accumulated >= required) break;
      }
      return accumulated >= required ? selected : [];
    }

    // Prefer melds that advance toward natural canasta
    return all.filter((m) => {
      const existing = team.melds.find((tm) => tm.rank === m.rank);
      if (existing && existing.cards.length + m.cards.length >= 7) return true;
      return m.cards.length >= 3 && !this.meldHelpsOpponents(m, state);
    });
  }

  private meldHelpsOpponents(meld: Meld, state: GameState): boolean {
    const oppTeamId = getTeamId(state.currentPlayer) === 0 ? 1 : 0;
    return this.counter.opponentNeedsRank(state, meld.rank, oppTeamId) > 0.8;
  }

  private takeImprovesTeam(withTop: Meld[], without: Meld[], team: GameState['teams'][0]): boolean {
    const gain = meldPoints(withTop) - meldPoints(without);
    const canastaProgress = withTop.some((m) => {
      const ex = team.melds.find((tm) => tm.rank === m.rank);
      return (ex?.cards.length ?? 0) + m.cards.length >= 7;
    });
    return gain >= 30 || canastaProgress;
  }

  private shouldGoOut(
    remaining: Card[],
    combinedMelds: Meld[],
    player: GameState['players'][0],
    team: GameState['teams'][0],
  ): boolean {
    if (!canGoOut(remaining, combinedMelds, player.partnerTookDiscard)) return false;
    // Delay going out if a natural canasta is one card away
    const nearNatural = combinedMelds.some(
      (m) => m.cards.length === 6 && m.cards.every((c) => !isWild(c)),
    );
    return !nearNatural;
  }

  private shouldMeldForTeam(melds: Meld[], team: GameState['teams'][0], state: GameState): boolean {
    const total = meldPoints(melds);
    const buildsCanasta = melds.some((m) => {
      const ex = team.melds.find((tm) => tm.rank === m.rank);
      return (ex?.cards.length ?? 0) + m.cards.length >= 7;
    });
    if (buildsCanasta) return true;
    if (total < 40 && team.score < 3000) return false;
    return !melds.every((m) => this.meldHelpsOpponents(m, state));
  }

  private handAfterMelds(hand: Card[], melds: Meld[]): Card[] {
    const ids = new Set(melds.flatMap((m) => m.cards.map((c) => c.id)));
    return hand.filter((c) => !ids.has(c.id));
  }

  private pickBlockingDiscard(hand: Card[], state: GameState, teamId: number): Card {
    const legal = hand.filter((c) => isLegalDiscard(state.discard, c));

    // Freeze pile with wild if opponents need top card
    if (shouldFreezePile(state, this.counter, teamId)) {
      const wild = legal.find(isWild);
      if (wild) return wild;
    }

    const pool = legal.length > 0 ? legal : hand;
    return pickSafestDiscard(pool, state, this.counter, teamId);
  }
}
