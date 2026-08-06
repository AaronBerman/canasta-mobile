import { describe, expect, it } from 'vitest';
import { discardCard, MatchState } from '../../engine/index';
import { createEmptyRunStats } from './types';
import { isObjectiveComplete } from './objectives';
import { getCampaignLevel, getCampaignRules, getRulesForLevel } from './levels';
import { startCampaignLevel } from './match-setup';

function mockHandEndState(phase: 'handOver' | 'gameOver'): MatchState {
  const level = getCampaignLevel(15)!;
  return {
    phase,
    humanSeat: 0,
    players: [
      { id: 0, name: 'You', hand: [], isHuman: true, teamId: 0, partnerTookDiscard: false },
      { id: 1, name: 'O1', hand: [], teamId: 1, partnerTookDiscard: false },
      { id: 2, name: 'Partner', hand: [], teamId: 0, partnerTookDiscard: false },
      { id: 3, name: 'O2', hand: [], teamId: 1, partnerTookDiscard: false },
    ],
    teams: [
      { id: 0, melds: [], score: 500, redThrees: [], hasMelded: true },
      { id: 1, melds: [], score: 0, redThrees: [], hasMelded: false },
    ],
    stock: [],
    discard: [],
    currentPlayer: 0,
    winnerTeamId: phase === 'gameOver' ? 0 : null,
    rules: getCampaignRules(level),
    turnPhase: 'discard',
    hasDrawnThisTurn: true,
    requiredMeldCardIds: [],
    message: '',
    lastHandResult: {
      winningTeamId: 0,
      teamScores: [385, 0],
      humanWon: true,
      humanPoints: 385,
      stockExhausted: false,
    },
    handsPlayed: 1,
  };
}

describe('campaign objectives', () => {
  it('level 15 go_out completes when match hits target (gameOver)', () => {
    const level = getCampaignLevel(15);
    expect(level).toBeDefined();

    const stats = createEmptyRunStats();
    stats.hasDiscarded = true;

    expect(
      isObjectiveComplete(mockHandEndState('handOver'), level!, stats),
    ).toBe(true);
    expect(
      isObjectiveComplete(mockHandEndState('gameOver'), level!, stats),
    ).toBe(true);
  });

  it('level 15 completes after discarding the last card', () => {
    const level = getCampaignLevel(15)!;
    let state = startCampaignLevel(level);
    state.turnPhase = 'discard';
    state.teams[0].hasMelded = true;

    const last = state.players[0].hand.find((c) => c.rank !== '3') ?? state.players[0].hand[0];
    state.players[0].hand = [last];

    const result = discardCard(state, last);
    expect(result.ok).toBe(true);
    expect(result.state.phase).toBe('handOver');
    expect(result.state.lastHandResult?.humanWon).toBe(true);

    const stats = createEmptyRunStats();
    expect(isObjectiveComplete(result.state, level, stats)).toBe(true);
  });
});
