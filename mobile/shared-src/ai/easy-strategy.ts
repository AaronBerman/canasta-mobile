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
import { teamMeldTablePoints } from '../core/game-status.js';

export interface AIAction {
  type: 'drawStock' | 'takeDiscard' | 'meld' | 'discard' | 'goOut';
  melds?: Meld[];
  discard?: Card;
}

export interface AIStrategy {
  chooseAction(state: GameState, playerIndex: number): AIAction;
}

function handWithoutCards(hand: Card[], toRemove: Card[]): Card[] {
  const ids = new Set(toRemove.map((c) => c.id));
  return hand.filter((c) => !ids.has(c.id));
}

function potentialMeldsFromHand(hand: Card[]): Meld[] {
  return findMeldsInHand(hand).filter((m) => m.cards.length >= 3);
}

function meldPoints(melds: Meld[]): number {
  return melds.reduce((s, m) => s + meldPointValue(m), 0);
}

/** Easy: meld and go out as soon as viable. */
export class EasyStrategy implements AIStrategy {
  chooseAction(state: GameState, playerIndex: number): AIAction {
    const player = state.players[playerIndex];
    const team = state.teams[getTeamId(playerIndex)];
    const hand = [...player.hand];

    const melds = potentialMeldsFromHand(hand);
    const top = state.discard[state.discard.length - 1];
    const handWithTop = top ? [...hand, top] : hand;
    const meldsWithTop = potentialMeldsFromHand(handWithTop);
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
      )
    ) {
      const afterTake = handWithTop;
      const meldsAfter = potentialMeldsFromHand(afterTake);
      if (canGoOut(afterTake, [...team.melds, ...meldsAfter], player.partnerTookDiscard)) {
        return { type: 'goOut', melds: meldsAfter };
      }
      if (meldsAfter.length > 0) {
        return { type: 'takeDiscard', melds: meldsAfter };
      }
      return { type: 'takeDiscard' };
    }

    if (melds.length > 0) {
      if (!team.hasMelded) {
        const required = initialMeldRequirement(team.score, state.rules);
        const openingTotal = teamMeldTablePoints(team.melds) + meldPoints(melds);
        if (openingTotal < required) {
          const discard = this.pickDiscard(hand, state.discard);
          return { type: 'drawStock', discard };
        }
      }

      const remaining = handWithoutCards(hand, melds.flatMap((m) => m.cards));
      if (canGoOut(remaining, [...team.melds, ...melds], player.partnerTookDiscard)) {
        return { type: 'goOut', melds };
      }
      return { type: 'meld', melds };
    }

    const discard = this.pickDiscard(hand, state.discard);
    return { type: 'drawStock', discard };
  }

  private pickDiscard(hand: Card[], discard: Card[]): Card {
    const legal = hand.filter((c) => isLegalDiscard(discard, c));
    const pool = legal.length > 0 ? legal : hand;
    return pool.reduce((a, b) => (a.rank > b.rank ? a : b));
  }
}
