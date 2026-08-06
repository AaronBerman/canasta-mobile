import { buildCustomRules } from '../../engine/index';
import { CampaignLevel, CampaignLevelDefinition } from './types';

function tutorial(
  id: number,
  title: string,
  description: string,
  hint: string,
  objective: CampaignLevel['objective'],
  extra?: Partial<CampaignLevelDefinition>,
): CampaignLevelDefinition {
  return {
    id,
    chapter: 'tutorial',
    title,
    description,
    hint,
    objective,
    rulesPreset: 'tutorial',
    aiDifficulties: ['easy', 'easy', 'easy'],
    ...extra,
  };
}

function challenge(
  id: number,
  title: string,
  description: string,
  hint: string,
  objective: CampaignLevel['objective'],
  extra?: Partial<CampaignLevelDefinition>,
): CampaignLevelDefinition {
  const rulesPreset = id <= 25 ? 'relaxed' : 'classic';
  const needsPartnerForGoOut =
    rulesPreset === 'classic' &&
    (objective.type === 'go_out' ||
      objective.type === 'go_out_within_turns' ||
      objective.type === 'score_hand_points');

  return {
    id,
    chapter: 'challenge',
    title,
    description,
    hint,
    objective,
    rulesPreset,
    aiDifficulties: id <= 30 ? ['easy', 'easy', 'medium'] : ['medium', 'medium', 'hard'],
    ...(needsPartnerForGoOut ? { partnerTookDiscard: true } : {}),
    ...extra,
  };
}

export const CAMPAIGN_LEVEL_DEFINITIONS: CampaignLevelDefinition[] = [
  tutorial(1, 'Draw & Discard', 'Every turn starts by drawing, then ends with a discard.',
    'Tap Draw from Stock, then select one card and discard it.',
    { type: 'draw_and_discard' }),

  tutorial(2, 'Your First Meld', 'Three or more cards of the same rank form a meld.',
    'Select three 7s, tap Meld, then draw and discard.',
    { type: 'lay_meld' }),

  tutorial(3, 'Group Selection', 'Tap a rank label above a group to select the whole meld.',
    'Use the group tag to select all matching cards quickly.',
    { type: 'lay_meld' }),

  tutorial(4, 'Initial Meld Points', 'Your first meld of a hand must meet a point minimum.',
    'Aces are worth 20 each — lay three Aces to open.',
    { type: 'lay_initial_meld' }),

  tutorial(5, 'Add to a Pile', 'Add matching cards to melds your team already has on the table.',
    'Select the lone 9 and meld it onto your team\'s 9 pile.',
    { type: 'add_to_meld' },
    { initialMelds: [{ teamId: 0, rank: '9', cardCount: 3 }] }),

  tutorial(6, 'Meld Before Drawing', 'You may lay melds before drawing from stock.',
    'Meld the three 6s first, then draw and discard.',
    { type: 'pre_draw_meld' }),

  tutorial(7, 'Skip Melding', 'Melding is optional after you draw.',
    'Draw, tap Skip Meld, then discard.',
    { type: 'draw_and_discard' }),

  tutorial(8, 'Take the Discard Pile', 'Pick up the pile when the top card helps your meld.',
    'Take the discard pile — you already have two 9s.',
    { type: 'take_discard_pile' },
    { initialMelds: [{ teamId: 0, rank: '9', cardCount: 3 }] }),

  tutorial(9, 'Meld the Top Card', 'After taking the pile you must use the top discard in a meld.',
    'Meld the Q from the pile with your two Queens.',
    { type: 'meld_discard_top' }),

  tutorial(10, 'Wild Cards', 'Jokers and 2s are wild — they stand in for any rank.',
    'Meld 10-10-Wild as a mixed meld.',
    { type: 'use_wild_in_meld' },
    { rewardCosmeticId: 'back-campaign-teal' }),

  tutorial(11, 'Red Threes', 'Red 3s auto-lay to your side pile and you draw a replacement.',
    'Draw from stock — the red 3 handles itself when you pick it up.',
    { type: 'draw_and_discard' }),

  tutorial(12, 'Safe Discards', 'You cannot discard the same rank as the top discard.',
    'Draw, then discard any card except a King (K matches the pile top).',
    { type: 'draw_and_discard' },
    { rulesOverrides: buildCustomRules('tutorial', { oneCardFreezeRule: true }) }),

  tutorial(13, 'Frozen Pile', 'A wild in the pile freezes it. If a wild is on top, the pile cannot be taken.',
    'The pile is frozen with a natural on top — you could take it with a pair, but draw from stock this turn instead.',
    { type: 'draw_and_discard' }),

  tutorial(14, 'Build a Canasta', 'Seven cards in one meld make a canasta — a big bonus.',
    'Complete the 5s to 7 cards for your first canasta.',
    { type: 'complete_canasta', rank: '5' },
    { initialMelds: [{ teamId: 0, rank: '5', cardCount: 3 }] }),

  tutorial(15, 'Going Out', 'Empty your hand by discarding your last card to end the hand.',
    'Your team has a canasta — discard your last card to go out.',
    { type: 'go_out' },
    { initialMelds: [{ teamId: 0, rank: '5', cardCount: 7, natural: true }] }),

  challenge(16, 'Quick Exit', 'Go out within 5 of your turns.',
    'You start with a canasta — meld, draw, and discard efficiently.',
    { type: 'go_out_within_turns', maxTurns: 5 },
    { initialMelds: [{ teamId: 0, rank: '5', cardCount: 7, natural: true }] }),

  challenge(17, 'Canasta Then Out', 'Complete a Jack canasta, then go out.',
    'Use the stock draws to finish 7 Jacks before your final discard.',
    { type: 'go_out' },
    { initialMelds: [{ teamId: 0, rank: 'J', cardCount: 3 }] }),

  challenge(18, 'Double Canasta', 'Make two canastas in one hand before going out.',
    'Build both K and Q piles to 7 cards each.',
    { type: 'make_two_canastas' }),

  challenge(19, 'High Score Hand', 'Go out with at least 500 hand points.',
    'Use Aces and canastas to rack up points before going out.',
    { type: 'score_hand_points', minHandPoints: 500 },
    { initialMelds: [{ teamId: 0, rank: 'A', cardCount: 3 }] }),

  challenge(20, 'Speed Run', 'Go out in 4 turns or fewer.',
    'Every turn counts — meld early and discard to win.',
    { type: 'go_out_within_turns', maxTurns: 4 },
    { initialMelds: [{ teamId: 0, rank: '5', cardCount: 7, natural: true }] },
    { rewardCosmeticId: 'font-campaign-serif' }),

  challenge(21, 'Frozen Take', 'Take a frozen discard pile with a natural pair.',
    'You hold two 10s — take the pile and meld the top 10 with them.',
    { type: 'meld_discard_top' }),

  challenge(22, 'Mixed Canasta', 'Finish a mixed canasta using a wild card.',
    'Get to 7 cards with at least one wild in the pile.',
    { type: 'complete_canasta', rank: '10' },
    { initialMelds: [{ teamId: 0, rank: '10', cardCount: 4 }] }),

  challenge(23, 'Initial 90', 'Open with at least 90 points on classic thresholds.',
    'Lay three Aces and three Kings in one opening (90 pts).',
    { type: 'lay_initial_meld' },
    {
      rulesPreset: 'classic',
      rulesOverrides: buildCustomRules('classic', {
        targetScore: 500,
        initialMeldThresholds: [{ upToScore: Infinity, minPoints: 90 }],
      }),
    }),

  challenge(24, 'Partner Link', 'Go out with classic partner-discard rules enabled.',
    'Your partner took the discard — you can go out now.',
    { type: 'go_out' },
    { rulesPreset: 'classic', rulesOverrides: buildCustomRules('classic', { targetScore: 500 }) },
    { initialMelds: [{ teamId: 0, rank: '7', cardCount: 7, natural: true }] },
    { partnerTookDiscard: true }),

  challenge(25, 'Canasta Required', 'Classic rules: finish a canasta before you go out.',
    'You have five 8s on the table — add two more, then discard to go out.',
    { type: 'go_out' },
    { rulesPreset: 'classic', rulesOverrides: buildCustomRules('classic', { targetScore: 500 }) },
    { initialMelds: [{ teamId: 0, rank: '8', cardCount: 5 }] }),

  challenge(26, 'Three Turns', 'Go out within 3 turns.',
    'Aggressive melding — no wasted draws.',
    { type: 'go_out_within_turns', maxTurns: 3 },
    { initialMelds: [{ teamId: 0, rank: '6', cardCount: 7, natural: true }] }),

  challenge(27, 'Queen Canasta', 'Complete a Queen canasta and go out.',
    'Seven Queens on the table wins the scenario.',
    { type: 'complete_canasta', rank: 'Q' },
    { initialMelds: [{ teamId: 0, rank: 'Q', cardCount: 4 }] }),

  challenge(28, 'King Canasta', 'Complete a King canasta and go out.',
    'Stock the Kings — aim for seven in one pile.',
    { type: 'complete_canasta', rank: 'K' },
    { initialMelds: [{ teamId: 0, rank: 'K', cardCount: 4 }] }),

  challenge(29, 'Ace Run', 'Lay an Ace meld and go out within 6 turns.',
    'High-value opening, then close the hand.',
    { type: 'go_out_within_turns', maxTurns: 6 },
    { initialMelds: [{ teamId: 0, rank: 'A', cardCount: 3 }] }),

  challenge(30, 'Pile Pressure', 'Take the discard pile and go out in the same hand.',
    'You already have a Queen canasta — take the pile, meld if needed, then go out.',
    { type: 'go_out' },
    { initialMelds: [{ teamId: 0, rank: 'Q', cardCount: 7, natural: true }] },
    { rewardCosmeticId: 'table-campaign-dusk' }),

  challenge(31, 'Speed Canasta', 'Speed rules — no canasta required to go out.',
    'Go out fast under speed rules.',
    { type: 'go_out' },
    { rulesPreset: 'speed', rulesOverrides: buildCustomRules('speed', { targetScore: 500 }) }),

  challenge(32, 'Relaxed Rush', 'Go out in 5 turns under relaxed rules.',
    'Partner discard not required — focus on speed.',
    { type: 'go_out_within_turns', maxTurns: 5 },
    { rulesPreset: 'relaxed' },
    { initialMelds: [{ teamId: 0, rank: '9', cardCount: 7, natural: true }] }),

  challenge(33, 'Wild Finish', 'Use a wild to complete a canasta and go out.',
    'The wild completes the seventh card.',
    { type: 'go_out' },
    { initialMelds: [{ teamId: 0, rank: '4', cardCount: 6 }] }),

  challenge(34, 'Table Control', 'Score 300+ hand points and go out.',
    'Build value on the table before going out.',
    { type: 'score_hand_points', minHandPoints: 300 },
    { initialMelds: [{ teamId: 0, rank: '10', cardCount: 3 }] }),

  challenge(35, 'Efficient Melder', 'Go out within 8 turns.',
    'Open, build your table, and empty your hand before turn 9.',
    { type: 'go_out_within_turns', maxTurns: 8 }),

  challenge(36, 'Classic Close', 'Win a hand under full classic rules.',
    'Canasta + partner discard required.',
    { type: 'go_out' },
    { rulesPreset: 'classic', rulesOverrides: buildCustomRules('classic', { targetScore: 500 }) },
    { initialMelds: [{ teamId: 0, rank: '5', cardCount: 7, natural: true }] },
    { partnerTookDiscard: true }),

  challenge(37, 'Four Turn Blitz', 'Go out in 4 turns with a partial canasta.',
    'Draw smart — you need one more meld card.',
    { type: 'go_out_within_turns', maxTurns: 4 },
    { initialMelds: [{ teamId: 0, rank: 'J', cardCount: 6 }] }),

  challenge(38, 'Ten Canasta', 'Complete a 10 canasta and go out.',
    'Seven tens — mixed is fine.',
    { type: 'complete_canasta', rank: '10' },
    { initialMelds: [{ teamId: 0, rank: '10', cardCount: 3 }] }),

  challenge(39, 'Two-Pile Add', 'Add to two existing melds before going out.',
    'Extend both piles, then empty your hand.',
    { type: 'go_out' },
    { initialMelds: [
      { teamId: 0, rank: '7', cardCount: 5 },
      { teamId: 0, rank: '8', cardCount: 5 },
    ] }),

  challenge(40, 'Marathon Hand', 'Score 600+ hand points in one hand.',
    'Canastas and Aces — maximize before going out.',
    { type: 'score_hand_points', minHandPoints: 600 },
    { rewardCosmeticId: 'back-campaign-ember' }),

  challenge(41, 'Discard Dance', 'Take the discard pile when it completes a meld, then go out.',
    'You hold two Jacks — take the pile (top is a Jack) and finish the hand.',
    { type: 'go_out' },
    { initialMelds: [{ teamId: 0, rank: 'J', cardCount: 6 }] }),

  challenge(42, 'Minimal Draws', 'Go out in exactly 3 turns.',
    'Pre-draw meld when you can to save time.',
    { type: 'go_out_within_turns', maxTurns: 3 },
    { initialMelds: [{ teamId: 0, rank: 'K', cardCount: 7, natural: true }] }),

  challenge(43, 'Natural Only', 'Complete a natural canasta (no wilds).',
    'Seven natural cards in one rank.',
    { type: 'complete_canasta', rank: '6' },
    { initialMelds: [{ teamId: 0, rank: '6', cardCount: 4 }] }),

  challenge(44, 'Full Table', 'Make two canastas and go out.',
    'Classic partnership scoring practice.',
    { type: 'make_two_canastas' },
    { rulesPreset: 'classic', rulesOverrides: buildCustomRules('classic', { targetScore: 500 }) }),

  challenge(45, 'Comeback', 'Go out even though the opponents already have a meld.',
    'Open with your Aces and Kings, build from there, then go out.',
    { type: 'go_out' },
    { initialMelds: [{ teamId: 1, rank: '9', cardCount: 3 }] }),

  challenge(46, 'Six Turn Standard', 'Go out within 6 turns under classic rules.',
    'Canasta required — plan your draws.',
    { type: 'go_out_within_turns', maxTurns: 6 },
    { rulesPreset: 'classic', rulesOverrides: buildCustomRules('classic', { targetScore: 500 }) },
    { initialMelds: [{ teamId: 0, rank: 'Q', cardCount: 7, natural: true }] },
    { partnerTookDiscard: true }),

  challenge(47, 'Jack Attack', 'Jack canasta + go out in 7 turns.',
    'Finish Jacks and discard to win.',
    { type: 'go_out_within_turns', maxTurns: 7 },
    { initialMelds: [{ teamId: 0, rank: 'J', cardCount: 4 }] }),

  challenge(48, 'Ace Canasta', 'Build an Ace canasta — the highest natural value.',
    'Seven Aces is worth serious points.',
    { type: 'complete_canasta', rank: 'A' },
    { initialMelds: [{ teamId: 0, rank: 'A', cardCount: 4 }] }),

  challenge(49, 'Penultimate', 'Score 700+ and go out under classic rules.',
    'One step from the campaign finale — make it count.',
    { type: 'score_hand_points', minHandPoints: 700 },
    { rulesPreset: 'classic', rulesOverrides: buildCustomRules('classic', { targetScore: 500 }) },
    { initialMelds: [{ teamId: 0, rank: 'A', cardCount: 7, natural: true }] },
    { partnerTookDiscard: true }),

  challenge(50, 'Campaign Finale', 'Master scenario: canasta, high score, go out in 8 turns.',
    'Everything you\'ve learned — finish the campaign.',
    { type: 'go_out_within_turns', maxTurns: 8 },
    { rulesPreset: 'classic', rulesOverrides: buildCustomRules('classic', { targetScore: 500 }) },
    { initialMelds: [{ teamId: 0, rank: '5', cardCount: 7, natural: true }] },
    { partnerTookDiscard: true },
    { rewardCosmeticId: 'table-campaign-gold' }),
];

export const TOTAL_CAMPAIGN_LEVELS = CAMPAIGN_LEVEL_DEFINITIONS.length;

export function getChapterLabel(chapter: CampaignLevel['chapter']): string {
  return chapter === 'tutorial' ? 'Tutorial' : 'Challenges';
}
