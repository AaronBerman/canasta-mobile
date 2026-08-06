import { describe, it, expect } from 'vitest';
import { createCanastaDeck, deal } from '../src/core/deck.js';
import { isValidMeld, isCanasta } from '../src/core/melds.js';
import { Card, cardRankValue, isWild } from '../src/core/cards.js';
import {
  getPartnerIndex,
  getDefaultPlayerNames,
  getSeatsInTurnOrderAfter,
} from '../src/core/game-state.js';
import { initialMeldRequirement, isDiscardPileFrozen, isLegalDiscard, isDiscardBlockedByBlackThree, canTakeDiscardPile, openingPointsIfDiscardTaken, resolveOpeningDiscardPile, isInvalidOpeningDiscardTop, canGoOut } from '../src/core/rules.js';
import { createSinglePlayerMatch, dealNextHand } from '../src/index.js';
import { EasyStrategy, HardStrategy } from '../src/ai/ai-player.js';
import { drawStock, layMeld, layMeldsFromSelection, skipMeldPhase, discardCard, checkStockExhaustion, takeDiscardPile, canTakeDiscardAction, createMatchFromDeal, canSkipMeldPhase, hasLegalDiscardOption, isPlayerTurnStuck } from '../src/core/turn-manager.js';
import { planMeldActions, findMeldsAcceptingSelection, partitionIntoMelds, isValidMeldPlan, getImpliedRankFromSelection, canUseDiscardTopInMeld, canUseRequiredCardsInPlan, expandSelectionWithHandWilds, bestNewMeldWithDiscardTop, suggestMeldForRequiredTop, effectiveMeldSelection, needsMeldTarget, totalMeldPoints } from '../src/core/meld-selection.js';
import { findMeldsInHand } from '../src/core/melds.js';
import { executeAITurn, recoverAITurn } from '../src/ai/ai-executor.js';
import { CLASSIC_RULES, SPEED_RULES, buildCustomRules } from '../src/core/game-rules.js';
import { groupHandIntoSets, groupHandCards, groupHandByManualOrder } from '../src/core/hand-grouping.js';
import {
  getGameRequirementInfo,
  describeRequirementLines,
  wouldMeldUseEntireHand,
  teamMeldTablePoints,
  meetsInitialMeldRequirement,
} from '../src/core/game-status.js';
import {
  scoreRedThrees,
  getCanastaType,
  canastaTypeLabel,
} from '../src/core/scoring.js';

describe('deck', () => {
  it('creates 108 cards', () => {
    expect(createCanastaDeck()).toHaveLength(108);
  });

  it('deals 11 cards to 4 players', () => {
    const { hands } = deal(4);
    expect(hands).toHaveLength(4);
    hands.forEach((h) => expect(h).toHaveLength(11));
  });
});

describe('card point values', () => {
  it('uses standard canasta meld values', () => {
    expect(cardRankValue({ id: '1', suit: 'spades', rank: '2' })).toBe(20);
    expect(cardRankValue({ id: '2', suit: 'hearts', rank: '3' })).toBe(100);
    expect(cardRankValue({ id: '3', suit: 'clubs', rank: '3' })).toBe(5);
    expect(cardRankValue({ id: '4', suit: 'hearts', rank: '5' })).toBe(5);
    expect(cardRankValue({ id: '5', suit: 'hearts', rank: '7' })).toBe(5);
    expect(cardRankValue({ id: '6', suit: 'hearts', rank: '8' })).toBe(10);
    expect(cardRankValue({ id: '7', suit: 'hearts', rank: '9' })).toBe(10);
    expect(cardRankValue({ id: '8', suit: 'hearts', rank: 'K' })).toBe(10);
    expect(cardRankValue({ id: '9', suit: 'hearts', rank: 'A' })).toBe(20);
    expect(cardRankValue({ id: '10', suit: 'joker', rank: 'JOKER' })).toBe(50);
  });
});

describe('melds', () => {
  it('validates a 3-card natural meld', () => {
    const cards: Card[] = [
      { id: '1', suit: 'hearts', rank: '7' },
      { id: '2', suit: 'diamonds', rank: '7' },
      { id: '3', suit: 'clubs', rank: '7' },
    ];
    expect(isValidMeld(cards)).toBe(true);
  });

  it('detects canasta at 7 cards', () => {
    const cards: Card[] = Array.from({ length: 7 }, (_, i) => ({
      id: String(i),
      suit: 'hearts' as const,
      rank: 'K' as const,
    }));
    expect(isCanasta({ rank: 'K', cards })).toBe(true);
  });
});

describe('rules', () => {
  it('requires 50 points for initial meld at low score', () => {
    expect(initialMeldRequirement(0)).toBe(50);
    expect(initialMeldRequirement(2000)).toBe(90);
    expect(initialMeldRequirement(3500)).toBe(120);
  });

  it('respects custom rules for initial meld', () => {
    expect(initialMeldRequirement(0, SPEED_RULES)).toBe(40);
  });

  it('detects frozen discard pile', () => {
    const wild: Card = { id: 'w', suit: 'joker', rank: 'JOKER' };
    expect(isDiscardPileFrozen([wild])).toBe(true);
    expect(isDiscardPileFrozen([wild], SPEED_RULES)).toBe(false);
    const red: Card = { id: 'r3', suit: 'hearts', rank: '3' };
    expect(isDiscardPileFrozen([red])).toBe(true);
  });

  it('allows discarding same rank when one-card freeze is off', () => {
    const discard: Card[] = [{ id: 'd1', suit: 'clubs', rank: '3' }];
    const card: Card = { id: 'h1', suit: 'spades', rank: '3' };
    expect(isLegalDiscard(discard, card, CLASSIC_RULES)).toBe(true);
  });

  it('blocks discarding same rank when one-card freeze is on', () => {
    const discard: Card[] = [{ id: 'd1', suit: 'clubs', rank: '3' }];
    const card: Card = { id: 'h1', suit: 'spades', rank: '3' };
    const strict = { ...CLASSIC_RULES, oneCardFreezeRule: true };
    expect(isLegalDiscard(discard, card, strict)).toBe(false);
  });

  it('blocks taking pile when black 3 is on top', () => {
    const discard: Card[] = [{ id: 'b3', suit: 'clubs', rank: '3' }];
    const hand: Card[] = [
      { id: '1', suit: 'hearts', rank: '7' },
      { id: '2', suit: 'diamonds', rank: '7' },
      { id: '3', suit: 'clubs', rank: '7' },
    ];
    expect(isDiscardBlockedByBlackThree(discard, CLASSIC_RULES)).toBe(true);
    expect(canTakeDiscardPile(hand, discard, true, 50, 0, CLASSIC_RULES)).toBe(false);
  });

  it('requires natural pair to take wild-frozen pile', () => {
    const discard: Card[] = [
      { id: 'w', suit: 'joker', rank: 'JOKER' },
      { id: '7', suit: 'hearts', rank: '7' },
    ];
    const handOne: Card[] = [{ id: '7a', suit: 'clubs', rank: '7' }];
    const handTwo: Card[] = [
      { id: '7a', suit: 'clubs', rank: '7' },
      { id: '7b', suit: 'spades', rank: '7' },
    ];
    expect(isDiscardPileFrozen(discard, CLASSIC_RULES)).toBe(true);
    expect(canTakeDiscardPile(handOne, discard, true, 50, 0, CLASSIC_RULES)).toBe(false);
    expect(canTakeDiscardPile(handTwo, discard, true, 50, 0, CLASSIC_RULES)).toBe(true);
  });

  it('counts only discard top (not buried cards) toward opening points', () => {
    const buried: Card = { id: 'k1', suit: 'hearts', rank: 'K' };
    const top: Card = { id: '9t', suit: 'spades', rank: '9' };
    const discard = [buried, buried, top];
    const hand: Card[] = [
      { id: '9a', suit: 'clubs', rank: '9' },
      { id: '9b', suit: 'diamonds', rank: '9' },
    ];
    const opening = openingPointsIfDiscardTaken(hand, discard, [], false, CLASSIC_RULES);
    const topOnly = openingPointsIfDiscardTaken(hand, [top], [], false, CLASSIC_RULES);
    expect(opening).toBe(topOnly);
    expect(opening).toBeGreaterThan(0);
  });

  it('does not count discard top toward opening when pile is frozen', () => {
    const wild: Card = { id: 'w', suit: 'joker', rank: 'JOKER' };
    const top: Card = { id: '10t', suit: 'hearts', rank: '10' };
    const discard = [wild, top];
    const hand: Card[] = [
      { id: '10a', suit: 'clubs', rank: '10' },
      { id: '10b', suit: 'spades', rank: '10' },
      { id: '10c', suit: 'diamonds', rank: '10' },
    ];
    const stagedMelds = [
      {
        rank: 'K' as const,
        cards: [
          { id: 'k1', suit: 'hearts', rank: 'K' as const },
          { id: 'k2', suit: 'clubs', rank: 'K' as const },
          { id: 'k3', suit: 'diamonds', rank: 'K' as const },
        ],
      },
    ];

    const frozenOpening = openingPointsIfDiscardTaken(
      hand,
      discard,
      stagedMelds,
      false,
      CLASSIC_RULES,
    );
    const openPileOpening = openingPointsIfDiscardTaken(
      hand,
      [top],
      stagedMelds,
      false,
      CLASSIC_RULES,
    );

    expect(frozenOpening).toBe(30);
    expect(openPileOpening).toBeGreaterThan(frozenOpening);
    expect(
      canTakeDiscardPile(hand, discard, false, frozenOpening, 0, CLASSIC_RULES),
    ).toBe(false);

    const stagedEnough = [
      ...stagedMelds,
      {
        rank: 'Q' as const,
        cards: [
          { id: 'q1', suit: 'hearts', rank: 'Q' as const },
          { id: 'q2', suit: 'clubs', rank: 'Q' as const },
          { id: 'q3', suit: 'diamonds', rank: 'Q' as const },
        ],
      },
    ];
    const frozenWithEnoughTable = openingPointsIfDiscardTaken(
      hand,
      discard,
      stagedEnough,
      false,
      CLASSIC_RULES,
    );
    expect(frozenWithEnoughTable).toBe(60);
    expect(
      canTakeDiscardPile(hand, discard, false, frozenWithEnoughTable, 0, CLASSIC_RULES),
    ).toBe(true);
  });

  it('blocks taking pile when wild is on top', () => {
    const discard: Card[] = [
      { id: '7', suit: 'hearts', rank: '7' },
      { id: 'w', suit: 'joker', rank: 'JOKER' },
    ];
    const hand: Card[] = [
      { id: 'j1', suit: 'joker', rank: 'JOKER' },
      { id: 'j2', suit: 'joker', rank: 'JOKER' },
      { id: '7a', suit: 'clubs', rank: '7' },
      { id: '7b', suit: 'spades', rank: '7' },
    ];
    expect(isDiscardPileFrozen(discard, CLASSIC_RULES)).toBe(true);
    expect(canTakeDiscardPile(hand, discard, true, 50, 0, CLASSIC_RULES)).toBe(false);
  });

  it('turns stock onto discard while opening top is wild or red 3', () => {
    const wild: Card = { id: 'w', suit: 'joker', rank: 'JOKER' };
    const two: Card = { id: '2', suit: 'spades', rank: '2' };
    const red: Card = { id: 'r3', suit: 'hearts', rank: '3' };
    const seven: Card = { id: '7', suit: 'hearts', rank: '7' };

    expect(isInvalidOpeningDiscardTop(wild)).toBe(true);
    expect(isInvalidOpeningDiscardTop(red)).toBe(true);
    expect(isInvalidOpeningDiscardTop(seven)).toBe(false);

    const once = resolveOpeningDiscardPile([seven, two], [wild]);
    expect(once.discard).toEqual([wild, seven]);
    expect(once.stock).toEqual([two]);
    expect(isWild(once.discard[once.discard.length - 1])).toBe(false);

    const chain = resolveOpeningDiscardPile([seven], [wild, two, red]);
    expect(chain.discard).toEqual([wild, two, red, seven]);
    expect(chain.stock).toEqual([]);
  });

  it('applies opening discard resolution when creating a match', () => {
    const wild: Card = { id: 'w', suit: 'joker', rank: 'JOKER' };
    const seven: Card = { id: '7', suit: 'hearts', rank: '7' };
    const eight: Card = { id: '8', suit: 'clubs', rank: '8' };

    const match = createMatchFromDeal(
      {
        hands: [[], [], [], []],
        stock: [seven, eight],
        discard: [wild],
        redThrees: new Map(),
      },
      { humanSeat: 0 },
    );

    expect(match.discard).toEqual([wild, seven]);
    expect(match.stock).toEqual([eight]);
    expect(isWild(match.discard[match.discard.length - 1])).toBe(false);
  });

  it('detects stuck meld when opening points are incomplete', () => {
    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'meld';
    game.hasDrawnThisTurn = true;
    game.teams[0].melds = [
      {
        rank: '5',
        cards: Array.from({ length: 3 }, (_, i) => ({
          id: `5${i}`,
          suit: 'hearts' as const,
          rank: '5' as const,
        })),
      },
    ];
    game.players[0].hand = [{ id: 'k', suit: 'clubs', rank: 'K' }];
    expect(canSkipMeldPhase(game)).toBe(false);
    expect(isPlayerTurnStuck(game, 0)).toBe(true);
  });

  it('detects stuck discard when last card cannot go out', () => {
    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'discard';
    game.teams[0].hasMelded = true;
    game.players[0].hand = [{ id: 'last', suit: 'clubs', rank: '5' }];
    expect(hasLegalDiscardOption(game, 0)).toBe(false);
    expect(isPlayerTurnStuck(game, 0)).toBe(true);
  });
});

describe('single player match', () => {
  it('places partner opposite in turn order for every human seat', () => {
    for (const humanSeat of [0, 1, 2, 3]) {
      const partnerIdx = getPartnerIndex(humanSeat, 4);
      const orderAfterHuman = getSeatsInTurnOrderAfter(humanSeat, 4);
      expect(partnerIdx).toBe(orderAfterHuman[1]);

      const game = createSinglePlayerMatch({
        humanSeat,
        aiDifficulties: ['easy', 'easy', 'easy'],
      });
      expect(game.players[humanSeat].isHuman).toBe(true);
      expect(game.players[partnerIdx].teamId).toBe(game.players[humanSeat].teamId);
      expect(game.players[partnerIdx].name).toBe('Partner');

      const names = getDefaultPlayerNames(humanSeat);
      expect(names[humanSeat]).toBe('You');
      expect(names[partnerIdx]).toBe('Partner');
    }
  });

  it('creates a 4-player match with turn phase', () => {
    const game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['easy', 'easy', 'easy'],
    });
    expect(game.players).toHaveLength(4);
    expect(game.phase).toBe('playing');
    expect(game.turnPhase).toBe('draw');
    expect(game.rules.id).toBe('classic');
  });

  it('runs a draw → skip meld → discard cycle', () => {
    let game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['easy', 'easy', 'easy'],
    });
    const drawResult = drawStock(game);
    expect(drawResult.ok).toBe(true);
    game = drawResult.state;
    expect(game.turnPhase).toBe('meld');

    const skipResult = skipMeldPhase(game);
    expect(skipResult.ok).toBe(true);
    game = skipResult.state;
    expect(game.turnPhase).toBe('discard');

    const card = game.players[0].hand[0];
    const discardResult = discardCard(game, card);
    expect(discardResult.ok).toBe(true);
    expect(discardResult.state.currentPlayer).not.toBe(0);
  });

  it('blocks skip meld until discard top is melded after taking pile', () => {
    let game = createSinglePlayerMatch({ humanSeat: 0 });
    const top: Card = { id: 'top9', suit: 'hearts', rank: '9' };
    game.discard = [top];
    game.turnPhase = 'draw';
    game.currentPlayer = 0;
    game.teams[0].melds = [
      {
        rank: '9',
        cards: [
          { id: '9a', suit: 'clubs', rank: '9' },
          { id: '9b', suit: 'diamonds', rank: '9' },
          { id: '9c', suit: 'spades', rank: '9' },
        ],
      },
    ];
    game.teams[0].hasMelded = true;
    game.players[0].hand = [];

    const take = takeDiscardPile(game);
    expect(take.ok).toBe(true);
    game = take.state;
    expect(game.requiredMeldCardIds).toEqual(['top9']);

    const skip = skipMeldPhase(game);
    expect(skip.ok).toBe(false);

    const meld = layMeldsFromSelection(game, [top]);
    expect(meld.ok).toBe(true);
    game = meld.state;
    expect(game.requiredMeldCardIds).toHaveLength(0);

    const skipAfter = skipMeldPhase(game);
    expect(skipAfter.ok).toBe(true);
  });

  it('draws replacement when red 3 is drawn from stock', () => {
    let game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['easy', 'easy', 'easy'],
    });
    const red: Card = { id: 'red3', suit: 'hearts', rank: '3' };
    const replacement: Card = { id: 'rep', suit: 'clubs', rank: '9' };
    game.stock = [red, replacement, ...game.stock.slice(1)];
    game.players[0].hand = [];
    game.currentPlayer = 0;
    game.turnPhase = 'draw';

    const drawResult = drawStock(game);
    expect(drawResult.ok).toBe(true);
    game = drawResult.state;
    expect(game.teams[0].redThrees.some((c) => c.id === 'red3')).toBe(true);
    expect(game.players[0].hand.some((c) => c.id === 'rep')).toBe(true);
    expect(game.players[0].hand.some((c) => c.id === 'red3')).toBe(false);
  });

  it('turns stock card onto discard and freezes pile when red 3 is discarded', () => {
    const red: Card = { id: 'red3', suit: 'diamonds', rank: '3' };
    const fromStock: Card = { id: 'stock7', suit: 'clubs', rank: '7' };
    let game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['easy', 'easy', 'easy'],
    });
    game.currentPlayer = 0;
    game.turnPhase = 'discard';
    game.players[0].hand = [red, { id: 'k', suit: 'spades', rank: 'K' }];
    game.stock = [fromStock, ...game.stock];
    game.discard = [];

    const result = discardCard(game, red);
    expect(result.ok).toBe(true);
    game = result.state;
    expect(game.discard.map((c) => c.id)).toEqual(['red3', 'stock7']);
    expect(isDiscardPileFrozen(game.discard, CLASSIC_RULES)).toBe(true);
    expect(game.stock.some((c) => c.id === 'stock7')).toBe(false);
    expect(result.state.message).toContain('frozen');
  });

  it('ends the hand when stock is empty at draw', () => {
    let game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['easy', 'easy', 'easy'],
    });
    game.stock = [];
    game.currentPlayer = 0;
    game.turnPhase = 'draw';

    const result = drawStock(game);
    expect(result.ok).toBe(true);
    expect(result.state.phase).toBe('handOver');
    expect(result.state.lastHandResult?.stockExhausted).toBe(true);
  });
});

describe('AI', () => {
  it('easy strategy returns an action', () => {
    const game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['easy', 'easy', 'easy'],
    });
    game.currentPlayer = 1;
    const strategy = new EasyStrategy();
    const action = strategy.chooseAction(game, 1);
    expect(['drawStock', 'takeDiscard', 'meld', 'goOut']).toContain(action.type);
  });

  it('executes a full AI turn', () => {
    let game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['easy', 'easy', 'easy'],
    });
    game.currentPlayer = 1;
    const result = executeAITurn(game);
    expect(result.ok).toBe(true);
    expect(result.state.currentPlayer).not.toBe(1);
  });

  it('recovers AI stuck with incomplete staged opening', () => {
    let game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['easy', 'easy', 'easy'],
    });
    game.currentPlayer = 1;
    game.turnPhase = 'meld';
    game.hasDrawnThisTurn = true;
    game.teams[1].hasMelded = false;
    game.teams[1].melds = [
      {
        rank: '5',
        cards: [
          { id: '5a', suit: 'hearts', rank: '5' },
          { id: '5b', suit: 'clubs', rank: '5' },
          { id: '5c', suit: 'diamonds', rank: '5' },
        ],
      },
    ];
    game.players[1].hand = [
      { id: '9a', suit: 'spades', rank: '9' },
      { id: '9b', suit: 'hearts', rank: '9' },
      { id: '9c', suit: 'clubs', rank: '9' },
      { id: '2a', suit: 'diamonds', rank: '2' },
      { id: 'x1', suit: 'spades', rank: '4' },
      { id: 'x2', suit: 'hearts', rank: '7' },
      { id: 'x3', suit: 'clubs', rank: '8' },
      { id: 'x4', suit: 'diamonds', rank: '10' },
    ];

    const result = recoverAITurn(game);
    expect(result.ok).toBe(true);
    expect(result.state.currentPlayer).not.toBe(1);
    expect(result.state.teams[1].melds).toHaveLength(0);
  });

  it('hard strategy returns an action', () => {
    const game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['hard', 'hard', 'hard'],
    });
    game.currentPlayer = 3;
    const strategy = new HardStrategy();
    const action = strategy.chooseAction(game, 3);
    expect(action.type).toBeDefined();
  });
});

describe('meld selection', () => {
  it('partitions melds with wild cards', () => {
    const cards: Card[] = [
      { id: '1', suit: 'hearts', rank: '7' },
      { id: '2', suit: 'diamonds', rank: '7' },
      { id: 'w', suit: 'spades', rank: '2' },
    ];
    const groups = partitionIntoMelds(cards, 3);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(3);
  });

  it('plans single-card addition to existing meld', () => {
    const teamMelds = [
      {
        rank: '9' as const,
        cards: Array.from({ length: 3 }, (_, i) => ({
          id: `9${i}`,
          suit: 'hearts' as const,
          rank: '9' as const,
        })),
      },
    ];
    const selected: Card[] = [{ id: '9x', suit: 'clubs', rank: '9' }];
    const plan = planMeldActions(selected, teamMelds, 3);
    expect(plan.additions).toHaveLength(1);
    expect(plan.additions[0].cards).toHaveLength(1);
    expect(plan.unused).toHaveLength(0);
    expect(isValidMeldPlan(plan, selected.length)).toBe(true);
  });

  it('allows melding before draw then drawing', () => {
    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'draw';
    game.hasDrawnThisTurn = false;
    game.currentPlayer = 0;
    game.teams[0].hasMelded = true;
    const meldCards: Card[] = [
      { id: '5a', suit: 'hearts', rank: '5' },
      { id: '5b', suit: 'diamonds', rank: '5' },
      { id: '5c', suit: 'clubs', rank: '5' },
    ];
    const keep: Card = { id: '7a', suit: 'spades', rank: '7' };
    game.players[0].hand = [...meldCards, keep];

    const meld = layMeldsFromSelection(game, meldCards);
    expect(meld.ok).toBe(true);
    game = meld.state;
    expect(game.turnPhase).toBe('draw');
    expect(game.hasDrawnThisTurn).toBe(false);
    expect(game.players[0].hand).toHaveLength(1);

    const draw = drawStock(game);
    expect(draw.ok).toBe(true);
    expect(draw.state.turnPhase).toBe('meld');
  });

  it('layMeldsFromSelection adds one card to existing meld', () => {
    const game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'meld';
    game.hasDrawnThisTurn = true;
    game.teams[0].melds = [
      {
        rank: 'K',
        cards: [
          { id: 'k1', suit: 'hearts', rank: 'K' },
          { id: 'k2', suit: 'diamonds', rank: 'K' },
          { id: 'k3', suit: 'clubs', rank: 'K' },
        ],
      },
    ];
    game.teams[0].hasMelded = true;
    const extra: Card = { id: 'k4', suit: 'spades', rank: 'K' };
    game.players[0].hand = [extra];

    const result = layMeldsFromSelection(game, [extra]);
    expect(result.ok).toBe(true);
    expect(result.state.players[0].hand).toHaveLength(0);
    expect(result.state.teams[0].melds[0].cards).toHaveLength(4);
  });

  it('requires target pile for wild-only multi-meld selection', () => {
    const teamMelds = [
      {
        rank: 'K' as const,
        cards: Array.from({ length: 4 }, (_, i) => ({
          id: `k${i}`,
          suit: 'hearts' as const,
          rank: 'K' as const,
        })),
      },
      {
        rank: 'Q' as const,
        cards: Array.from({ length: 4 }, (_, i) => ({
          id: `q${i}`,
          suit: 'hearts' as const,
          rank: 'Q' as const,
        })),
      },
    ];
    const wild: Card[] = [{ id: 'w', suit: 'joker', rank: 'JOKER' }];
    expect(findMeldsAcceptingSelection(teamMelds, wild)).toHaveLength(2);
    const plan = planMeldActions(wild, teamMelds, 3, 'K');
    expect(plan.additions[0].meldRank).toBe('K');
  });

  it('allows multi-rank initial meld with a shared wild', () => {
    const selected: Card[] = [
      { id: 'a1', suit: 'hearts', rank: 'A' },
      { id: 'a2', suit: 'clubs', rank: 'A' },
      { id: 'a3', suit: 'diamonds', rank: 'A' },
      { id: 'q1', suit: 'hearts', rank: 'Q' },
      { id: 'q2', suit: 'clubs', rank: 'Q' },
      { id: 'w', suit: 'joker', rank: 'JOKER' },
    ];
    expect(getImpliedRankFromSelection(selected)).toBeNull();

    const plan = planMeldActions(selected, [], 3);
    expect(plan.newMelds).toHaveLength(2);
    expect(isValidMeldPlan(plan, selected.length)).toBe(true);
    expect(needsMeldTarget(selected, [], null, 3)).toBe(false);
    expect(totalMeldPoints(plan.newMelds)).toBeGreaterThanOrEqual(90);

    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'meld';
    game.currentPlayer = 0;
    game.teams[0].score = 2000;
    game.teams[0].hasMelded = false;
    game.players[0].hand = [...selected, { id: 'extra', suit: 'spades', rank: '5' }];

    const result = layMeldsFromSelection(game, selected);
    expect(result.ok).toBe(true);
    expect(result.state.teams[0].melds).toHaveLength(2);
    expect(result.state.teams[0].hasMelded).toBe(true);
  });

  it('auto-adds a hand wild to complete multi-rank initial meld', () => {
    const hand: Card[] = [
      { id: 'a1', suit: 'hearts', rank: 'A' },
      { id: 'a2', suit: 'clubs', rank: 'A' },
      { id: 'a3', suit: 'diamonds', rank: 'A' },
      { id: 'q1', suit: 'hearts', rank: 'Q' },
      { id: 'q2', suit: 'clubs', rank: 'Q' },
      { id: 'w', suit: 'joker', rank: 'JOKER' },
      { id: 'extra', suit: 'spades', rank: '5' },
    ];
    const selected = hand.slice(0, 5);
    const expanded = expandSelectionWithHandWilds(hand, selected, 3);
    expect(expanded).toHaveLength(6);
    expect(expanded.some(isWild)).toBe(true);
    const plan = planMeldActions(expanded, [], 3);
    expect(isValidMeldPlan(plan, expanded.length)).toBe(true);
    expect(plan.newMelds).toHaveLength(2);
  });

  it('stages melds before draw without meeting the opening threshold', () => {
    const fours: Card[] = [
      { id: '4a', suit: 'hearts', rank: '4' },
      { id: '4b', suit: 'clubs', rank: '4' },
      { id: '4c', suit: 'diamonds', rank: '4' },
    ];
    const tens: Card[] = [
      { id: '10a', suit: 'hearts', rank: '10' },
      { id: '10b', suit: 'clubs', rank: '10' },
      { id: '2w', suit: 'diamonds', rank: '2' },
    ];
    const keep: Card = { id: '7a', suit: 'spades', rank: '7' };

    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'draw';
    game.hasDrawnThisTurn = false;
    game.currentPlayer = 0;
    game.teams[0].score = 2000;
    game.teams[0].hasMelded = false;
    game.players[0].hand = [...fours, ...tens, keep];

    const staged = layMeldsFromSelection(game, [...fours, ...tens]);
    expect(staged.ok).toBe(true);
    expect(staged.state.teams[0].melds).toHaveLength(2);
    expect(staged.state.teams[0].hasMelded).toBe(false);
    expect(teamMeldTablePoints(staged.state.teams[0].melds)).toBe(55);
    expect(meetsInitialMeldRequirement(staged.state.teams[0], CLASSIC_RULES)).toBe(false);
    expect(staged.state.turnPhase).toBe('draw');
  });

  it('allows taking discard when staged melds plus top card meet opening points', () => {
    const fours: Card[] = [
      { id: '4a', suit: 'hearts', rank: '4' },
      { id: '4b', suit: 'clubs', rank: '4' },
      { id: '4c', suit: 'diamonds', rank: '4' },
    ];
    const tens: Card[] = [
      { id: '10a', suit: 'hearts', rank: '10' },
      { id: '10b', suit: 'clubs', rank: '10' },
      { id: '2w', suit: 'diamonds', rank: '2' },
    ];
    const keep: Card = { id: '7a', suit: 'spades', rank: '7' };
    const discardTop: Card = { id: '10top', suit: 'spades', rank: '10' };

    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'draw';
    game.hasDrawnThisTurn = false;
    game.currentPlayer = 0;
    game.teams[0].score = 0;
    game.teams[0].hasMelded = false;
    game.discard = [discardTop];
    game.players[0].hand = [...fours, ...tens, keep];

    const staged = layMeldsFromSelection(game, [...fours, ...tens]);
    expect(staged.ok).toBe(true);
    game = staged.state;

    expect(canTakeDiscardAction(game)).toBe(true);

    const taken = takeDiscardPile(game);
    expect(taken.ok).toBe(true);
    expect(taken.state.requiredMeldCardIds).toContain('10top');
  });

  it('blocks skip when staged opening meld is below the threshold', () => {
    const fours: Card[] = [
      { id: '4a', suit: 'hearts', rank: '4' },
      { id: '4b', suit: 'clubs', rank: '4' },
      { id: '4c', suit: 'diamonds', rank: '4' },
    ];
    const tens: Card[] = [
      { id: '10a', suit: 'hearts', rank: '10' },
      { id: '10b', suit: 'clubs', rank: '10' },
      { id: '2w', suit: 'diamonds', rank: '2' },
    ];
    const keep: Card = { id: '7a', suit: 'spades', rank: '7' };

    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'draw';
    game.hasDrawnThisTurn = false;
    game.currentPlayer = 0;
    game.teams[0].score = 2000;
    game.teams[0].hasMelded = false;
    game.players[0].hand = [...fours, ...tens, keep];

    const staged = layMeldsFromSelection(game, [...fours, ...tens]);
    expect(staged.ok).toBe(true);
    game = staged.state;

    const draw = drawStock(game);
    expect(draw.ok).toBe(true);
    game = draw.state;

    const skip = skipMeldPhase(game);
    expect(skip.ok).toBe(false);
    expect(skip.error).toMatch(/Initial meld needs 90/);
  });

  it('melds wild with naturals of the same rank without a target pile', () => {
    const teamMelds = [
      {
        rank: 'K' as const,
        cards: Array.from({ length: 3 }, (_, i) => ({
          id: `k${i}`,
          suit: 'hearts' as const,
          rank: 'K' as const,
        })),
      },
      {
        rank: 'Q' as const,
        cards: Array.from({ length: 3 }, (_, i) => ({
          id: `q${i}`,
          suit: 'hearts' as const,
          rank: 'Q' as const,
        })),
      },
    ];
    const selected: Card[] = [
      { id: 'k3', suit: 'clubs', rank: 'K' },
      { id: 'w', suit: 'joker', rank: 'JOKER' },
    ];
    expect(getImpliedRankFromSelection(selected)).toBe('K');
    const plan = planMeldActions(selected, teamMelds, 3);
    expect(plan.additions).toHaveLength(1);
    expect(plan.additions[0].meldRank).toBe('K');
    expect(plan.additions[0].cards).toHaveLength(2);
    expect(isValidMeldPlan(plan, selected.length)).toBe(true);
  });

  it('checks discard top can be used in a meld', () => {
    const top: Card = { id: 'top', suit: 'hearts', rank: '9' };
    const hand: Card[] = [
      { id: '9a', suit: 'clubs', rank: '9' },
      { id: '9b', suit: 'diamonds', rank: '9' },
    ];
    expect(canUseDiscardTopInMeld(hand, top, [], 3)).toBe(true);

    const handTooFew: Card[] = [{ id: '9a', suit: 'clubs', rank: '9' }];
    expect(canUseDiscardTopInMeld(handTooFew, top, [], 3)).toBe(false);

    const wildTop: Card = { id: 'wtop', suit: 'joker', rank: 'JOKER' };
    const teamMelds = [
      {
        rank: 'K' as const,
        cards: Array.from({ length: 3 }, (_, i) => ({
          id: `k${i}`,
          suit: 'hearts' as const,
          rank: 'K' as const,
        })),
      },
    ];
    expect(canUseDiscardTopInMeld([], wildTop, teamMelds, 3)).toBe(true);
  });

  it('rejects meld when required discard top cannot be used in selection', () => {
    const top: Card = { id: 'top9', suit: 'hearts', rank: '9' };
    const unrelated: Card = { id: 'k1', suit: 'clubs', rank: 'K' };
    const teamMelds = [
      {
        rank: 'K' as const,
        cards: Array.from({ length: 3 }, (_, i) => ({
          id: `k${i}`,
          suit: 'hearts' as const,
          rank: 'K' as const,
        })),
      },
    ];
    expect(
      canUseRequiredCardsInPlan([top, unrelated], ['top9'], teamMelds, 3),
    ).toBe(false);
    expect(
      canUseRequiredCardsInPlan([top], ['top9'], teamMelds, 3),
    ).toBe(false);
  });

  it('melds 6+6+wild mixed group', () => {
    const hand: Card[] = [
      { id: '6a', suit: 'hearts', rank: '6' },
      { id: '6b', suit: 'clubs', rank: '6' },
      { id: 'w', suit: 'spades', rank: '2' },
    ];
    const selected = hand.slice(0, 2);
    const expanded = expandSelectionWithHandWilds(hand, selected, 3);
    expect(expanded).toHaveLength(3);
    const plan = planMeldActions(expanded, [], 3);
    expect(plan.newMelds).toHaveLength(1);
    expect(plan.newMelds[0].some((c) => c.rank === '2')).toBe(true);
    expect(isValidMeldPlan(plan, expanded.length)).toBe(true);
  });

  it('supports J+J plus discard top for new meld', () => {
    const hand: Card[] = [
      { id: 'top', suit: 'hearts', rank: 'J' },
      { id: 'j1', suit: 'clubs', rank: 'J' },
      { id: 'j2', suit: 'diamonds', rank: 'J' },
    ];
    const top = hand[0];
    const group = bestNewMeldWithDiscardTop(hand, top, 3);
    expect(group).not.toBeNull();
    expect(group!.filter((c) => c.rank === 'J')).toHaveLength(3);

    const suggestion = suggestMeldForRequiredTop(hand, ['top'], [], 3);
    expect(suggestion).toHaveLength(3);
  });

  it('findMeldsInHand includes mixed melds', () => {
    const hand: Card[] = [
      { id: '6a', suit: 'hearts', rank: '6' },
      { id: '6b', suit: 'clubs', rank: '6' },
      { id: 'w', suit: 'joker', rank: 'JOKER' },
    ];
    const melds = findMeldsInHand(hand, 3);
    expect(melds).toHaveLength(1);
    expect(melds[0].cards).toHaveLength(3);
  });
});

describe('game requirements', () => {
  it('shows initial meld requirement before team melds', () => {
    const info = getGameRequirementInfo(
      { id: 0, melds: [], score: 0, redThrees: [], hasMelded: false },
      11,
      false,
      CLASSIC_RULES,
    );
    expect(info.initialMeldPoints).toBe(50);
    expect(describeRequirementLines(info)).toContain('First meld: 50+ pts');
  });

  it('shows staged opening meld progress on the table', () => {
    const info = getGameRequirementInfo(
      {
        id: 0,
        melds: [
          {
            rank: '4',
            cards: [
              { id: '4a', suit: 'hearts', rank: '4' },
              { id: '4b', suit: 'clubs', rank: '4' },
              { id: '4c', suit: 'diamonds', rank: '4' },
            ],
          },
        ],
        score: 2000,
        redThrees: [],
        hasMelded: false,
      },
      8,
      false,
      CLASSIC_RULES,
    );
    expect(info.stagedMeldPoints).toBe(15);
    expect(describeRequirementLines(info)).toContain('First meld: 15/90+ pts on table');
  });

  it('shows canastas still needed to go out', () => {
    const info = getGameRequirementInfo(
      {
        id: 0,
        melds: [{ rank: 'K', cards: Array.from({ length: 4 }, (_, i) => ({ id: `k${i}`, suit: 'hearts' as const, rank: 'K' as const })) }],
        score: 500,
        redThrees: [],
        hasMelded: true,
      },
      5,
      true,
      CLASSIC_RULES,
    );
    expect(info.canastasStillNeeded).toBe(1);
    expect(describeRequirementLines(info).some((l) => l.includes('need 1 more'))).toBe(true);
  });

  it('requires multiple canastas when configured', () => {
    const twoCanastaRules = buildCustomRules('classic', { canastasRequiredToGoOut: 2 });
    const oneCanasta = Array.from({ length: 7 }, (_, i) => ({
      id: `k${i}`,
      suit: 'hearts' as const,
      rank: 'K' as const,
    }));
    const melds = [{ rank: 'K' as const, cards: oneCanasta }];
    expect(canGoOut([{ id: 'x', suit: 'clubs', rank: '2' }], melds, true, twoCanastaRules)).toBe(
      false,
    );
    const info = getGameRequirementInfo(
      { id: 0, melds, score: 500, redThrees: [], hasMelded: true },
      1,
      true,
      twoCanastaRules,
    );
    expect(info.canastasStillNeeded).toBe(1);
    expect(describeRequirementLines(info).some((l) => l.includes('need 1 more to go out'))).toBe(
      true,
    );
  });

  it('migrates legacy requireCanastaToGoOut boolean in buildCustomRules', () => {
    const on = buildCustomRules('speed', { requireCanastaToGoOut: true });
    expect(on.canastasRequiredToGoOut).toBe(1);
    const off = buildCustomRules('classic', { requireCanastaToGoOut: false });
    expect(off.canastasRequiredToGoOut).toBe(0);
  });

  it('blocks melding entire hand', () => {
    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'meld';
    game.teams[0].hasMelded = true;
    game.teams[0].melds = [
      {
        rank: '9',
        cards: Array.from({ length: 3 }, (_, i) => ({
          id: `9${i}`,
          suit: 'hearts' as const,
          rank: '9' as const,
        })),
      },
    ];
    const only: Card = { id: 'only', suit: 'clubs', rank: '9' };
    game.players[0].hand = [only];

    const result = layMeldsFromSelection(game, [only]);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/keep one card/i);
  });

  it('requires canasta before going out on last discard', () => {
    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'discard';
    game.teams[0].hasMelded = true;
    game.players[2].partnerTookDiscard = true;
    const last: Card = { id: 'last', suit: 'clubs', rank: '5' };
    game.players[0].hand = [last];

    const result = discardCard(game, last);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/canasta/i);
  });

  it('allows going out when canasta exists and discarding last card', () => {
    let game = createSinglePlayerMatch({ humanSeat: 0 });
    game.turnPhase = 'discard';
    game.teams[0].hasMelded = true;
    game.teams[0].melds = [
      {
        rank: 'K',
        cards: Array.from({ length: 7 }, (_, i) => ({
          id: `k${i}`,
          suit: 'hearts' as const,
          rank: 'K' as const,
        })),
      },
    ];
    game.players[2].partnerTookDiscard = true;
    const last: Card = { id: 'last', suit: 'clubs', rank: '5' };
    game.players[0].hand = [last];

    const result = discardCard(game, last);
    expect(result.ok).toBe(true);
    expect(result.state.phase).toBe('handOver');
  });

  it('detects when meld would use entire hand', () => {
    expect(wouldMeldUseEntireHand(3, 3)).toBe(true);
    expect(wouldMeldUseEntireHand(3, 2)).toBe(false);
  });
});

describe('hand grouping', () => {
  it('groups cards by rank with wilds separate', () => {
    const hand: Card[] = [
      { id: 'k1', suit: 'hearts', rank: 'K' },
      { id: 'k2', suit: 'clubs', rank: 'K' },
      { id: '7', suit: 'hearts', rank: '7' },
      { id: 'w', suit: 'spades', rank: '2' },
    ];
    const groups = groupHandIntoSets(hand, { minMeldSize: 3 });
    expect(groups).toHaveLength(3);
    expect(groups[0].every((c) => c.rank === 'K')).toBe(true);
    expect(groups[1].every((c) => c.rank === '7')).toBe(true);
    expect(groups[2].every((c) => c.rank === '2')).toBe(true);
  });

  it('prioritizes ranks matching existing team melds', () => {
    const hand: Card[] = [
      { id: '7', suit: 'hearts', rank: '7' },
      { id: 'k1', suit: 'hearts', rank: 'K' },
    ];
    const ordered = groupHandCards(hand, {
      teamMelds: [{ rank: '7', cards: [{ id: 'x', suit: 'clubs', rank: '7' }] }],
    });
    expect(ordered[0].rank).toBe('7');
  });
});

describe('scoring', () => {
  it('scores red threes +100 when team has melded', () => {
    const reds: Card[] = [
      { id: 'r1', suit: 'hearts', rank: '3' },
      { id: 'r2', suit: 'diamonds', rank: '3' },
    ];
    expect(scoreRedThrees(reds, true, CLASSIC_RULES)).toBe(200);
  });

  it('scores red threes -100 each when team never melded', () => {
    const reds: Card[] = [{ id: 'r1', suit: 'hearts', rank: '3' }];
    expect(scoreRedThrees(reds, false, CLASSIC_RULES)).toBe(-100);
  });

  it('doubles red three bonus for all four', () => {
    const reds: Card[] = [
      { id: 'r1', suit: 'hearts', rank: '3' },
      { id: 'r2', suit: 'diamonds', rank: '3' },
      { id: 'r3', suit: 'hearts', rank: '3' },
      { id: 'r4', suit: 'diamonds', rank: '3' },
    ];
    expect(scoreRedThrees(reds, true, CLASSIC_RULES)).toBe(800);
  });

  it('labels natural canasta as red', () => {
    const meld = {
      rank: 'K' as const,
      cards: Array.from({ length: 7 }, (_, i) => ({
        id: String(i),
        suit: 'hearts' as const,
        rank: 'K' as const,
      })),
    };
    expect(canastaTypeLabel(getCanastaType(meld)!)).toBe('Red Canasta');
  });
});

describe('custom rules', () => {
  it('deals using rules.cardsPerHand', () => {
    const game = createSinglePlayerMatch({
      humanSeat: 0,
      aiDifficulties: ['easy', 'easy', 'easy'],
      rules: { ...CLASSIC_RULES, cardsPerHand: 13 },
    });
    expect(game.players[0].hand).toHaveLength(13);
  });
});
