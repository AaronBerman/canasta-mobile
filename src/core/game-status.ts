import { GameRules, getInitialMeldRequirement, getCanastasRequiredToGoOut } from './game-rules.js';
import { Meld, meldPointValue } from './melds.js';
import { TeamState } from './game-state.js';

export function teamMeldTablePoints(melds: Meld[]): number {
  return melds.reduce((sum, m) => sum + meldPointValue(m), 0);
}

/** True when staged table melds meet the opening point threshold. */
export function meetsInitialMeldRequirement(team: TeamState, rules: GameRules): boolean {
  if (team.hasMelded) return true;
  if (team.melds.length === 0) return false;
  return teamMeldTablePoints(team.melds) >= getInitialMeldRequirement(team.score, rules);
}

export interface GameRequirementInfo {
  /** Points needed for the team's first meld, or null if already melded. */
  initialMeldPoints: number | null;
  /** Points already on the table before the opening is finalized. */
  stagedMeldPoints: number | null;
  canastaCount: number;
  canastasRequired: number;
  canastasStillNeeded: number;
  partnerDiscardRequired: boolean;
  partnerDiscardMet: boolean;
  /** True when one card remains and all go-out rules are satisfied. */
  readyToGoOut: boolean;
  goOutBlockers: string[];
  /** Player has exactly one card — must discard to end the hand. */
  oneCardLeft: boolean;
}

export function countCanastas(melds: Meld[]): number {
  return melds.filter((m) => m.cards.length >= 7).length;
}

export function getGoOutBlockers(
  team: TeamState,
  partnerTookDiscard: boolean,
  rules: GameRules,
): string[] {
  const blockers: string[] = [];
  const required = getCanastasRequiredToGoOut(rules);
  const canastasStillNeeded = Math.max(0, required - countCanastas(team.melds));
  if (canastasStillNeeded > 0) {
    blockers.push(
      canastasStillNeeded === 1
        ? 'Need 1 canasta to go out'
        : `Need ${canastasStillNeeded} canastas to go out`,
    );
  }
  if (rules.requirePartnerTookDiscard && !partnerTookDiscard) {
    blockers.push('Partner must take the discard pile');
  }
  return blockers;
}

export function getGameRequirementInfo(
  team: TeamState,
  playerHandSize: number,
  partnerTookDiscard: boolean,
  rules: GameRules,
): GameRequirementInfo {
  const canastaCount = countCanastas(team.melds);
  const canastasRequired = getCanastasRequiredToGoOut(rules);
  const canastasStillNeeded = Math.max(0, canastasRequired - canastaCount);
  const goOutBlockers = getGoOutBlockers(team, partnerTookDiscard, rules);
  const oneCardLeft = playerHandSize === 1;

  const staged = team.hasMelded ? null : teamMeldTablePoints(team.melds);

  return {
    initialMeldPoints: team.hasMelded
      ? null
      : getInitialMeldRequirement(team.score, rules),
    stagedMeldPoints: staged && staged > 0 ? staged : null,
    canastaCount,
    canastasRequired,
    canastasStillNeeded,
    partnerDiscardRequired: rules.requirePartnerTookDiscard,
    partnerDiscardMet: partnerTookDiscard,
    readyToGoOut: oneCardLeft && goOutBlockers.length === 0,
    goOutBlockers,
    oneCardLeft,
  };
}

/** Short labels for the requirements strip in the UI. */
export function describeRequirementLines(info: GameRequirementInfo): string[] {
  const lines: string[] = [];

  if (info.initialMeldPoints != null) {
    if (info.stagedMeldPoints != null) {
      lines.push(
        `First meld: ${info.stagedMeldPoints}/${info.initialMeldPoints}+ pts on table`,
      );
    } else {
      lines.push(`First meld: ${info.initialMeldPoints}+ pts`);
    }
  }

  if (info.canastasRequired > 0) {
    if (info.canastasStillNeeded === 0) {
      lines.push(`Canastas: ${info.canastaCount} ✓`);
    } else {
      lines.push(
        `Canastas: ${info.canastaCount} — need ${info.canastasStillNeeded} more to go out`,
      );
    }
  } else if (info.canastaCount > 0) {
    lines.push(`Canastas: ${info.canastaCount}`);
  }

  if (info.partnerDiscardRequired) {
    lines.push(
      info.partnerDiscardMet
        ? 'Partner took discard ✓'
        : 'Partner must take discard to go out',
    );
  }

  if (info.readyToGoOut) {
    lines.push('Discard your last card to go out');
  } else if (info.oneCardLeft && info.goOutBlockers.length > 0) {
    lines.push(`Cannot go out: ${info.goOutBlockers[0]}`);
  }

  return lines;
}

export function wouldMeldUseEntireHand(handSize: number, cardsToMeld: number): boolean {
  return handSize > 0 && handSize === cardsToMeld;
}

export function canDiscardToGoOut(
  team: TeamState,
  partnerTookDiscard: boolean,
  rules: GameRules,
): boolean {
  return getGoOutBlockers(team, partnerTookDiscard, rules).length === 0;
}
