import { buildCampaignDeal, CardPick, DealResult } from '../../engine/index';

const R = (rank: CardPick['rank'], suit?: CardPick['suit']): CardPick => ({ rank, suit });
const J = (): CardPick => ({ rank: 'JOKER' });

/** Filler picks — engine fills remaining hand slots randomly. */
const FILL: CardPick[] = [];

function meldRank(rank: CardPick['rank'], count: number): CardPick[] {
  const suits: CardPick['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  return Array.from({ length: count }, (_, i) => R(rank, suits[i % 4]));
}

export function dealIntroFirstHand(): DealResult {
  return buildCampaignDeal({
    hands: [
      [...meldRank('7', 3), R('K', 'spades'), R('4', 'clubs'), R('9', 'diamonds')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('5', 'hearts')],
    stockTop: [R('2', 'clubs')],
  });
}

export function dealDrawAndDiscard(): DealResult {
  return buildCampaignDeal({
    hands: [
      [...meldRank('8', 2), R('K', 'spades'), R('4', 'clubs'), R('9', 'diamonds')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('5', 'hearts')],
    stockTop: [R('2', 'clubs')],
  });
}

/** Red 3 in hand — auto-lays and draws a replacement. */
export function dealRedThreeTutorial(): DealResult {
  return buildCampaignDeal({
    hands: [
      [R('3', 'hearts'), R('8', 'spades'), R('4', 'clubs'), R('9', 'diamonds'), R('K', 'hearts')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('5', 'diamonds')],
  });
}

/** Top discard matches a card in hand — illegal to discard same rank (one-card freeze). */
export function dealSafeDiscardTutorial(): DealResult {
  return buildCampaignDeal({
    hands: [
      [R('K', 'spades'), R('4', 'clubs'), R('9', 'diamonds'), R('6', 'hearts'), R('J', 'clubs')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('K', 'hearts')],
  });
}

/** Wild in the pile freezes it — draw from stock instead of taking. */
export function dealFrozenPileDraw(): DealResult {
  return buildCampaignDeal({
    hands: [
      [R('8', 'spades'), R('4', 'clubs'), R('9', 'diamonds'), R('6', 'hearts')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('5', 'hearts'), J(), R('8', 'diamonds')],
  });
}

/** Frozen pile with a natural pair — take and meld the top card. */
export function dealFrozenTakeAndMeld(): DealResult {
  return buildCampaignDeal({
    hands: [
      [R('10', 'hearts'), R('10', 'diamonds'), R('K', 'spades'), R('4', 'clubs')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [J(), R('5', 'hearts'), R('10', 'clubs')],
  });
}

/** Classic 90-point opening: three Aces + three Kings in hand. */
export function dealInitial90Opening(): DealResult {
  return buildCampaignDeal({
    hands: [
      [
        ...meldRank('A', 3),
        ...meldRank('K', 3),
        R('4', 'spades'),
        R('9', 'clubs'),
      ],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('6', 'hearts')],
  });
}

/** Canasta on table — take discard pile and go out same hand. */
export function dealPilePressureGoOut(): DealResult {
  return buildCampaignDeal({
    hands: [[R('4', 'spades'), R('4', 'diamonds'), R('7', 'clubs')], FILL, FILL, FILL],
    discard: [R('5', 'diamonds'), R('4', 'hearts')],
    stockTop: [R('2', 'spades')],
  });
}

/** Opponent has melded — strong opening hand for a comeback. */
export function dealComebackOpening(): DealResult {
  return buildCampaignDeal({
    hands: [
      [
        ...meldRank('A', 3),
        ...meldRank('K', 3),
        R('5', 'spades'),
        R('9', 'clubs'),
      ],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('6', 'diamonds')],
    stockTop: [R('Q', 'hearts')],
  });
}

/** Discard pile helps complete a meld — good for take-and-go-out scenarios. */
export function dealTakeDiscardGoOut(): DealResult {
  return buildCampaignDeal({
    hands: [
      [R('J', 'hearts'), R('J', 'diamonds'), R('4', 'spades'), R('8', 'clubs')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('5', 'hearts'), R('J', 'clubs')],
  });
}

export function dealFirstMeld(): DealResult {
  return buildCampaignDeal({
    hands: [
      [...meldRank('7', 3), R('K', 'spades'), R('4', 'clubs'), R('9', 'diamonds'), R('J', 'hearts')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('5', 'hearts')],
  });
}

export function dealInitialMeldPoints(): DealResult {
  return buildCampaignDeal({
    hands: [
      [
        R('A', 'hearts'),
        R('A', 'diamonds'),
        R('A', 'clubs'),
        R('5', 'spades'),
        R('5', 'hearts'),
        R('5', 'diamonds'),
        R('9', 'clubs'),
      ],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('10', 'hearts')],
  });
}

export function dealAddToMeld(): DealResult {
  return buildCampaignDeal({
    hands: [[R('9', 'spades'), R('K', 'hearts'), R('4', 'diamonds'), R('2', 'clubs')], FILL, FILL, FILL],
    discard: [R('6', 'clubs')],
  });
}

export function dealPreDrawMeld(): DealResult {
  return buildCampaignDeal({
    hands: [
      [...meldRank('6', 3), R('K', 'spades'), R('4', 'hearts'), R('10', 'diamonds')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('5', 'clubs')],
  });
}

export function dealTakeDiscard(): DealResult {
  return buildCampaignDeal({
    hands: [
      [R('9', 'hearts'), R('9', 'diamonds'), R('K', 'spades'), R('4', 'clubs')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('9', 'clubs'), R('5', 'hearts'), R('8', 'diamonds')],
  });
}

export function dealMeldDiscardTop(): DealResult {
  return buildCampaignDeal({
    hands: [
      [R('Q', 'hearts'), R('Q', 'diamonds'), R('K', 'spades'), R('4', 'clubs')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('Q', 'clubs'), R('5', 'hearts')],
  });
}

export function dealWildMeld(): DealResult {
  return buildCampaignDeal({
    hands: [
      [R('10', 'hearts'), R('10', 'diamonds'), J(), R('K', 'spades'), R('4', 'clubs')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('5', 'hearts')],
  });
}

export function dealCanastaBasics(): DealResult {
  return buildCampaignDeal({
    hands: [
      [...meldRank('5', 4), R('K', 'spades'), R('4', 'hearts')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('8', 'clubs')],
    stockTop: [R('5', 'spades')],
  });
}

export function dealGoOutPractice(): DealResult {
  return buildCampaignDeal({
    hands: [[R('3', 'clubs'), R('K', 'hearts')], FILL, FILL, FILL],
    discard: [R('6', 'diamonds')],
  });
}

export function dealGoOutFast(): DealResult {
  return buildCampaignDeal({
    hands: [
      [R('8', 'spades'), R('4', 'hearts')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('7', 'clubs')],
    stockTop: [R('J', 'diamonds')],
  });
}

export function dealCanastaThenGoOut(): DealResult {
  return buildCampaignDeal({
    hands: [
      [...meldRank('J', 3), R('2', 'spades')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('6', 'hearts')],
    stockTop: [...meldRank('J', 4).slice(0, 1)],
  });
}

export function dealTwoCanastaChallenge(): DealResult {
  return buildCampaignDeal({
    hands: [
      [...meldRank('K', 3), ...meldRank('Q', 3), R('2', 'hearts')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('5', 'diamonds')],
    stockTop: [R('K', 'spades'), R('Q', 'clubs')],
  });
}

export function dealScoreChallenge(minRank: CardPick['rank'] = 'A'): DealResult {
  return buildCampaignDeal({
    hands: [
      [...meldRank(minRank, 3), R('K', 'spades'), R('4', 'diamonds')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('7', 'hearts')],
    stockTop: [R('A', 'spades'), R('A', 'clubs')],
  });
}

export function dealGenericChallenge(levelId: number, rank?: CardPick['rank']): DealResult {
  const ranks: CardPick['rank'][] = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const meldRankPick = rank ?? ranks[levelId % ranks.length];
  return buildCampaignDeal({
    hands: [
      [...meldRank(meldRankPick, 3), R('4', 'hearts'), R('4', 'spades'), R('K', 'diamonds')],
      FILL,
      FILL,
      FILL,
    ],
    discard: [R('6', 'clubs')],
    stockTop: [R(meldRankPick, 'spades')],
  });
}

/** Hand cards that complement common initial-meld setups on the table. */
const LEVEL_HAND_RANK: Partial<Record<number, CardPick['rank']>> = {
  22: '10',
  25: '8',
  27: 'Q',
  28: 'K',
  33: '4',
  37: 'J',
  38: '10',
  39: '7',
  43: '6',
  47: 'J',
  48: 'A',
};

export function getDealForLevel(levelId: number): DealResult {
  switch (levelId) {
    case 1:
      return dealDrawAndDiscard();
    case 2:
      return dealFirstMeld();
    case 3:
      return dealFirstMeld();
    case 4:
      return dealInitialMeldPoints();
    case 5:
      return dealAddToMeld();
    case 6:
      return dealPreDrawMeld();
    case 7:
      return dealDrawAndDiscard();
    case 8:
      return dealTakeDiscard();
    case 9:
      return dealMeldDiscardTop();
    case 10:
      return dealWildMeld();
    case 11:
      return dealRedThreeTutorial();
    case 12:
      return dealSafeDiscardTutorial();
    case 13:
      return dealFrozenPileDraw();
    case 14:
      return dealCanastaBasics();
    case 15:
      return dealGoOutPractice();
    case 16:
      return dealGoOutFast();
    case 17:
      return dealCanastaThenGoOut();
    case 18:
      return dealTwoCanastaChallenge();
    case 19:
      return dealScoreChallenge('A');
    case 20:
      return dealGoOutFast();
    case 21:
      return dealFrozenTakeAndMeld();
    case 23:
      return dealInitial90Opening();
    case 30:
      return dealPilePressureGoOut();
    case 41:
      return dealTakeDiscardGoOut();
    case 45:
      return dealComebackOpening();
    default:
      return dealGenericChallenge(levelId, LEVEL_HAND_RANK[levelId]);
  }
}
