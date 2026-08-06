import { isWild, MatchState } from '../../engine/index';
import { isCanasta } from '../../engine/index';
import {
  CampaignLevel,
  CampaignObjective,
  CampaignRunStats,
  LevelCompletionResult,
} from './types';

export function objectiveLabel(objective: CampaignObjective): string {
  switch (objective.type) {
    case 'intro_first_hand':
      return 'Draw a card, lay a meld, then discard';
    case 'draw_and_discard':
      return 'Draw a card and discard one';
    case 'lay_meld':
      return 'Lay a valid meld on the table';
    case 'lay_initial_meld':
      return 'Lay your team\'s initial meld (meets point minimum)';
    case 'add_to_meld':
      return 'Add a card to an existing team meld';
    case 'pre_draw_meld':
      return 'Lay a meld before drawing from stock';
    case 'take_discard_pile':
      return 'Take the discard pile';
    case 'meld_discard_top':
      return 'Meld the discard pile top after taking it';
    case 'use_wild_in_meld':
      return 'Lay a meld that includes a wild card';
    case 'complete_canasta':
      return objective.rank
        ? `Complete a canasta of ${objective.rank}s`
        : 'Complete a canasta (7 cards in one meld)';
    case 'go_out':
      return 'Go out by discarding your last card';
    case 'go_out_within_turns':
      return `Go out within ${objective.maxTurns ?? '?'} of your turns`;
    case 'make_two_canastas':
      return 'Complete two canastas in one hand';
    case 'score_hand_points':
      return `Go out scoring at least ${objective.minHandPoints ?? 0} hand points`;
    default:
      return 'Complete the scenario';
  }
}

function humanTeamCanastas(state: MatchState, rank?: string): number {
  const teamId = state.players[state.humanSeat].teamId;
  return state.teams[teamId].melds.filter((m) => {
    if (rank && m.rank !== rank) return false;
    return isCanasta(m);
  }).length;
}

/** Hand ended by going out or by hitting match target after the hand. */
function handEndedWithHumanWin(state: MatchState): boolean {
  if (!isHandFinished(state.phase) || !state.lastHandResult) return false;
  const humanTeam = state.players[state.humanSeat].teamId;
  const { humanWon, winningTeamId, stockExhausted } = state.lastHandResult;
  if (humanWon) return true;
  return !stockExhausted && winningTeamId === humanTeam;
}

function isHandFinished(phase: MatchState['phase']): boolean {
  return phase === 'handOver' || phase === 'gameOver';
}

export function isObjectiveComplete(
  state: MatchState,
  level: CampaignLevel,
  stats: CampaignRunStats,
): boolean {
  const obj = level.objective;
  const teamId = state.players[state.humanSeat].teamId;

  switch (obj.type) {
    case 'intro_first_hand':
      return stats.hasDrawn && stats.hasMelded && stats.hasDiscarded;
    case 'draw_and_discard':
      return stats.hasDrawn && stats.hasDiscarded;
    case 'lay_meld':
      return stats.hasMelded;
    case 'lay_initial_meld':
      return stats.hasInitialMelded || state.teams[teamId].hasMelded;
    case 'add_to_meld':
      return stats.hasAddedToMeld;
    case 'pre_draw_meld':
      return stats.hasPreDrawMelded;
    case 'take_discard_pile':
      return stats.hasTakenDiscard;
    case 'meld_discard_top':
      return stats.hasMeldRequiredTop;
    case 'use_wild_in_meld':
      return stats.hasUsedWild;
    case 'complete_canasta':
      return humanTeamCanastas(state, obj.rank) >= 1;
    case 'make_two_canastas':
      return humanTeamCanastas(state) >= 2;
    case 'go_out':
      return handEndedWithHumanWin(state);
    case 'go_out_within_turns':
      return (
        handEndedWithHumanWin(state) &&
        stats.humanTurns <= (obj.maxTurns ?? 99)
      );
    case 'score_hand_points': {
      if (!handEndedWithHumanWin(state)) return false;
      const pts = state.lastHandResult!.teamScores[teamId];
      return pts >= (obj.minHandPoints ?? 0);
    }
    default:
      return false;
  }
}

export function computeStars(
  state: MatchState,
  level: CampaignLevel,
  stats: CampaignRunStats,
): 1 | 2 | 3 {
  const obj = level.objective;
  if (obj.type === 'go_out_within_turns' && obj.maxTurns) {
    if (stats.humanTurns <= Math.max(1, obj.maxTurns - 2)) return 3;
    if (stats.humanTurns <= obj.maxTurns) return 2;
    return 1;
  }
  if (obj.type === 'score_hand_points' && obj.minHandPoints && state.lastHandResult) {
    const teamId = state.players[state.humanSeat].teamId;
    const pts = state.lastHandResult.teamScores[teamId];
    if (pts >= obj.minHandPoints * 1.4) return 3;
    if (pts >= obj.minHandPoints * 1.1) return 2;
    return 1;
  }
  if (stats.humanTurns <= 3) return 3;
  if (stats.humanTurns <= 6) return 2;
  return 1;
}

export function buildCompletionResult(
  state: MatchState,
  level: CampaignLevel,
  stats: CampaignRunStats,
  wasAlreadyCompleted: boolean,
): LevelCompletionResult {
  const stars = computeStars(state, level, stats);
  return {
    stars,
    newlyUnlockedCosmetic: wasAlreadyCompleted ? undefined : level.rewardCosmeticId,
    unlockedNextLevel: level.id < 50,
  };
}

/** Update run stats after a successful human action. */
export function updateRunStats(
  prev: MatchState,
  next: MatchState,
  stats: CampaignRunStats,
  level: CampaignLevel,
): CampaignRunStats {
  const humanSeat = next.humanSeat;
  const teamId = next.players[humanSeat].teamId;
  const s = { ...stats };

  if (prev.currentPlayer === humanSeat && next.currentPlayer !== humanSeat) {
    s.humanTurns += 1;
    if (prev.players[humanSeat].hand.length > next.players[humanSeat].hand.length) {
      s.hasDiscarded = true;
    }
  }

  if (next.hasDrawnThisTurn && prev.currentPlayer === humanSeat && !prev.hasDrawnThisTurn) {
    s.hasDrawn = true;
  }

  if (prev.requiredMeldCardIds.length === 0 && next.requiredMeldCardIds.length > 0) {
    s.hasTakenDiscard = true;
  }

  const prevMelds = prev.teams[teamId].melds;
  const nextMelds = next.teams[teamId].melds;
  if (nextMelds.length > prevMelds.length) {
    s.hasMelded = true;
    if (!prev.teams[teamId].hasMelded && next.teams[teamId].hasMelded) {
      s.hasInitialMelded = true;
    }
  }

  for (const meld of nextMelds) {
    const prevM = prevMelds.find((m) => m.rank === meld.rank);
    if (prevM && meld.cards.length > prevM.cards.length) {
      s.hasAddedToMeld = true;
    }
    if (meld.cards.some(isWild)) {
      s.hasUsedWild = true;
    }
  }

  if (
    prev.turnPhase === 'draw' &&
    !prev.hasDrawnThisTurn &&
    nextMelds.some((m) => {
      const prevM = prevMelds.find((p) => p.rank === m.rank);
      return (prevM?.cards.length ?? 0) < m.cards.length;
    })
  ) {
    s.hasPreDrawMelded = true;
  }

  if (next.requiredMeldCardIds.length === 0 && prev.requiredMeldCardIds.length > 0) {
    s.hasMeldRequiredTop = true;
  }

  s.canastasCompleted = humanTeamCanastas(next, level.objective.rank);

  return s;
}
