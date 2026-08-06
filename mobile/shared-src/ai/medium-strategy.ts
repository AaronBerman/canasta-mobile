import { Card, cardRankValue, isWild } from '../core/cards.js';
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

function potentialMeldsFromHand(hand: Card[]): Meld[] {
  return findMeldsInHand(hand).filter((m) => m.cards.length >= 3);
}

function meldPoints(melds: Meld[]): number {
  return melds.reduce((s, m) => s + meldPointValue(m), 0);
}

/** Medium: balance melding, canasta building, and basic defensive discards. */
export class MediumStrategy implements AIStrategy {
  chooseAction(state: GameState, playerIndex: number): AIAction {
    const player = state.players[playerIndex];
    const team = state.teams[getTeamId(playerIndex)];
    const hand = [...player.hand];
    const top = state.discard[state.discard.length - 1];

    const melds = this.selectMelds(hand, team.hasMelded, team.score, state.rules);
    const handWithTop = top ? [...hand, top] : hand;
    const meldsWithTop = this.selectMelds(handWithTop, team.hasMelded, team.score, state.rules);
    const openingTakePoints = openingPointsIfDiscardTaken(
      hand,
      state.discard,
      team.melds,
      team.hasMelded,
      state.rules,
    );

    if (
      top &&
      canTakeDiscardPile(
        hand,
        state.discard,
        team.hasMelded,
        openingTakePoints,
        team.score,
        state.rules,
      ) &&
      this.worthTaking(meldsWithTop, melds)
    ) {
      return { type: 'takeDiscard', melds: meldsWithTop.length > 0 ? meldsWithTop : undefined };
    }

    if (melds.length > 0 && this.shouldMeldNow(melds, team)) {
      const remaining = this.handAfterMelds(hand, melds);
      if (canGoOut(remaining, [...team.melds, ...melds], player.partnerTookDiscard)) {
        return { type: 'goOut', melds };
      }
      return { type: 'meld', melds };
    }

    const discard = this.pickDefensiveDiscard(hand, state);
    return { type: 'drawStock', discard };
  }

  private selectMelds(
    hand: Card[],
    hasMelded: boolean,
    teamScore: number,
    rules: GameState['rules'],
  ): Meld[] {
    const all = potentialMeldsFromHand(hand);
    if (!hasMelded) {
      const required = initialMeldRequirement(teamScore, rules);
      let accumulated = 0;
      const selected: Meld[] = [];
      for (const m of all.sort((a, b) => meldPointValue(b) - meldPointValue(a))) {
        selected.push(m);
        accumulated += meldPointValue(m);
        if (accumulated >= required) break;
      }
      return accumulated >= required ? selected : [];
    }
    return all.filter((m) => m.cards.length >= 3);
  }

  private worthTaking(withTop: Meld[], without: Meld[]): boolean {
    return meldPoints(withTop) > meldPoints(without) + 20;
  }

  private shouldMeldNow(melds: Meld[], team: { melds: Meld[] }): boolean {
    const hasNearCanasta = [...team.melds, ...melds].some((m) => m.cards.length >= 5);
    if (hasNearCanasta) return true;
    return melds.some((m) => meldPointValue(m) >= 50);
  }

  private handAfterMelds(hand: Card[], melds: Meld[]): Card[] {
    const ids = new Set(melds.flatMap((m) => m.cards.map((c) => c.id)));
    return hand.filter((c) => !ids.has(c.id));
  }

  private pickDefensiveDiscard(hand: Card[], state: GameState): Card {
    const top = state.discard[state.discard.length - 1];
    const legal = hand.filter((c) => isLegalDiscard(state.discard, c));
    const pool = legal.length > 0 ? legal : hand;

    // Avoid discarding rank matching top; prefer high deadwood
    return pool
      .filter((c) => !top || c.rank !== top.rank || isWild(c))
      .sort((a, b) => cardRankValue(b) - cardRankValue(a))[0] ?? pool[0];
  }
}
