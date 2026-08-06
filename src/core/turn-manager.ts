import { Card, isRedThree, isWild, isBlackThree, Rank } from './cards.js';
import { drawFromStock } from './deck.js';
import { GameRules, DEFAULT_RULES, getInitialMeldRequirement } from './game-rules.js';
import {
  GameState,
  PlayerState,
  TeamState,
  getPartnerIndex,
  getTeamId,
  getDefaultPlayerNames,
} from './game-state.js';
import {
  canAddToMeld,
  isValidMeld,
  Meld,
  mergeMelds,
} from './melds.js';
import { isLegalDiscard, canTakeDiscardPile, openingPointsIfDiscardTaken, isDiscardBlockedByBlackThree, isDiscardPileFrozen, resolveOpeningDiscardPile } from './rules.js';
import { scoreHand } from './scoring.js';
import {
  MeldActionPlan,
  partitionIntoMelds,
  planMeldActions,
  isValidMeldPlan,
  needsMeldTarget,
  meldPointsWithDiscardTop,
  canUseRequiredCardsInPlan,
  plannedCardCount,
  effectiveMeldSelection,
  suggestMeldForRequiredTop,
} from './meld-selection.js';
import {
  canDiscardToGoOut,
  getGoOutBlockers,
  wouldMeldUseEntireHand,
  meetsInitialMeldRequirement,
  teamMeldTablePoints,
} from './game-status.js';

export type TurnPhase = 'draw' | 'meld' | 'discard';

export interface HandResult {
  winningTeamId: number;
  teamScores: [number, number];
  humanWon: boolean;
  humanPoints: number;
  stockExhausted?: boolean;
}

export interface MatchState extends GameState {
  rules: GameRules;
  turnPhase: TurnPhase;
  hasDrawnThisTurn: boolean;
  /** Discard-top card ids that must be melded before skipping (after taking the pile). */
  requiredMeldCardIds: string[];
  humanSeat: number;
  message: string;
  lastHandResult: HandResult | null;
  handsPlayed: number;
}

export type GameActionResult =
  | { ok: true; state: MatchState }
  | { ok: false; error: string; state: MatchState };

function cloneState(state: MatchState): MatchState {
  return JSON.parse(JSON.stringify(state)) as MatchState;
}

function removeCardsFromHand(hand: Card[], toRemove: Card[]): Card[] {
  const ids = new Set(toRemove.map((c) => c.id));
  return hand.filter((c) => !ids.has(c.id));
}

function meldPoints(melds: Meld[]): number {
  return teamMeldTablePoints(melds);
}

function trySetHasMelded(team: TeamState, rules: GameRules): void {
  if (team.hasMelded) return;
  if (meetsInitialMeldRequirement(team, rules)) {
    team.hasMelded = true;
  }
}

/** Return staged opening melds to hand when the threshold was not met (AI recovery). */
export function revertIncompleteOpening(
  state: MatchState,
  playerIndex: number,
): MatchState {
  const s = cloneState(state);
  const teamId = getTeamId(playerIndex);
  const team = s.teams[teamId];
  if (team.hasMelded || team.melds.length === 0) return s;
  if (meetsInitialMeldRequirement(team, s.rules)) return s;

  const player = s.players[playerIndex];
  for (const meld of team.melds) {
    player.hand.push(...meld.cards.map((c) => ({ ...c })));
  }
  team.melds = [];
  return s;
}

function groupNaturalByRank(cards: Card[]): Map<Rank, Card[]> {
  const map = new Map<Rank, Card[]>();
  for (const c of cards) {
    if (isWild(c)) continue;
    if (isBlackThree(c)) continue;
    const g = map.get(c.rank) ?? [];
    g.push(c);
    map.set(c.rank, g);
  }
  return map;
}

function resolveRedThrees(state: MatchState, playerIndex: number): MatchState {
  const s = cloneState(state);
  const player = s.players[playerIndex];
  const teamId = getTeamId(playerIndex);
  let changed = true;

  while (changed) {
    changed = false;
    for (let i = 0; i < player.hand.length; i++) {
      const card = player.hand[i];
      if (isRedThree(card)) {
        player.hand.splice(i, 1);
        s.teams[teamId].redThrees.push(card);
        const draw = drawFromStock(s.stock);
        if (draw) {
          s.stock = draw.stock;
          player.hand.push(draw.card);
        }
        changed = true;
        break;
      }
    }
  }

  return s;
}

function redThreesLaidCount(before: number, after: number): number {
  return Math.max(0, after - before);
}

/** After a red 3 is discarded, turn the next stock card face-up onto the pile. */
function turnStockCardOntoDiscard(state: MatchState): MatchState {
  const s = cloneState(state);
  const draw = drawFromStock(s.stock);
  if (draw) {
    s.stock = draw.stock;
    s.discard.push(draw.card);
  }
  return s;
}

export interface CreateMatchConfig {
  humanSeat: number;
  rules?: GameRules;
  playerNames?: [string, string, string, string];
  aiDifficulties?: import('./game-state.js').AIDifficulty[];
  startingPlayer?: number;
  openingMessage?: string;
  initialTeams?: Array<{
    teamId: number;
    melds?: Meld[];
    hasMelded?: boolean;
    score?: number;
  }>;
}

export function createMatchFromDeal(
  dealResult: import('./deck.js').DealResult,
  config: CreateMatchConfig,
): MatchState {
  const rules = config.rules ?? DEFAULT_RULES;
  const names =
    config.playerNames ?? getDefaultPlayerNames(config.humanSeat);
  const aiDifficulties = config.aiDifficulties ?? ['easy', 'medium', 'hard'];
  let aiIdx = 0;

  const players: PlayerState[] = dealResult.hands.map((hand, i) => ({
    id: i,
    name: names[i],
    hand,
    isHuman: i === config.humanSeat,
    aiDifficulty:
      i !== config.humanSeat
        ? aiDifficulties[aiIdx++ % aiDifficulties.length]
        : undefined,
    teamId: i % 2,
    partnerTookDiscard: false,
  }));

  const teams: TeamState[] = [
    { id: 0, melds: [], score: 0, redThrees: [], hasMelded: false },
    { id: 1, melds: [], score: 0, redThrees: [], hasMelded: false },
  ];

  for (const [playerIdx, cards] of dealResult.redThrees) {
    teams[playerIdx % 2].redThrees.push(...cards);
  }

  if (config.initialTeams) {
    for (const init of config.initialTeams) {
      const team = teams[init.teamId];
      if (init.melds) team.melds = init.melds.map((m) => ({ rank: m.rank, cards: [...m.cards] }));
      if (init.hasMelded !== undefined) team.hasMelded = init.hasMelded;
      if (init.score !== undefined) team.score = init.score;
    }
  }

  const startPlayer = config.startingPlayer ?? 0;
  const startName = players[startPlayer].name;

  const { stock, discard } = resolveOpeningDiscardPile(
    dealResult.stock,
    dealResult.discard,
  );

  return {
    phase: 'playing',
    players,
    teams,
    stock,
    discard,
    currentPlayer: startPlayer,
    winnerTeamId: null,
    rules,
    turnPhase: 'draw',
    hasDrawnThisTurn: false,
    requiredMeldCardIds: [],
    humanSeat: config.humanSeat,
    message:
      config.openingMessage ??
      `${startName}'s turn — meld, draw, or take discard`,
    lastHandResult: null,
    handsPlayed: 0,
  };
}

function canTakeDiscard(state: MatchState, hand: Card[]): boolean {
  if (!state.rules.allowTakeDiscardPile || state.discard.length === 0) return false;
  const team = state.teams[getTeamId(state.currentPlayer)];
  const top = state.discard[state.discard.length - 1];
  const topMeldPoints = meldPointsWithDiscardTop(
    hand,
    top,
    team.melds,
    state.rules.minMeldSize,
  );
  if (topMeldPoints === 0) return false;

  const openingPoints = openingPointsIfDiscardTaken(
    hand,
    state.discard,
    team.melds,
    team.hasMelded,
    state.rules,
  );

  return canTakeDiscardPile(
    hand,
    state.discard,
    team.hasMelded,
    openingPoints,
    team.score,
    state.rules,
  );
}

export function findLayableMelds(hand: Card[], state: MatchState): Meld[] {
  const byRank = groupNaturalByRank(hand);
  const melds: Meld[] = [];
  for (const [rank, cards] of byRank) {
    if (cards.length >= state.rules.minMeldSize && isValidMeld(cards)) {
      melds.push({ rank, cards: [...cards] });
    }
  }
  return melds;
}

export function canPlayerGoOut(state: MatchState, player: PlayerState): boolean {
  const team = state.teams[player.teamId];
  const partnerIdx = getPartnerIndex(player.id, state.players.length);
  const partnerTookDiscard = state.players[partnerIdx].partnerTookDiscard;
  if (player.hand.length !== 1) return false;
  return canDiscardToGoOut(team, partnerTookDiscard, state.rules);
}

function goOutDiscardError(state: MatchState, playerIndex: number): string {
  const team = state.teams[getTeamId(playerIndex)];
  const partnerIdx = getPartnerIndex(playerIndex, state.players.length);
  const blockers = getGoOutBlockers(
    team,
    state.players[partnerIdx].partnerTookDiscard,
    state.rules,
  );
  if (blockers.length > 0) return blockers[0];
  return 'Cannot go out';
}

function rejectIfMeldEmptiesHand(
  state: MatchState,
  playerIndex: number,
  cardsToMeld: number,
): GameActionResult | null {
  const handSize = state.players[playerIndex].hand.length;
  if (!wouldMeldUseEntireHand(handSize, cardsToMeld)) return null;
  return {
    ok: false,
    error: 'You must keep one card to discard — meld all but one, then discard to go out',
    state,
  };
}

function applyMeldsToTeam(state: MatchState, playerIndex: number, melds: Meld[]): MatchState {
  const s = cloneState(state);
  const player = s.players[playerIndex];
  const teamId = getTeamId(playerIndex);
  const team = s.teams[teamId];

  for (const meld of melds) {
    const existingIdx = team.melds.findIndex((m) => m.rank === meld.rank);
    if (existingIdx >= 0) {
      let current = team.melds[existingIdx];
      for (const c of meld.cards) {
        if (!canAddToMeld(current, c)) continue;
        player.hand = removeCardsFromHand(player.hand, [c]);
        current = { rank: current.rank, cards: [...current.cards, c] };
      }
      team.melds[existingIdx] = current;
    } else if (isValidMeld(meld.cards)) {
      player.hand = removeCardsFromHand(player.hand, meld.cards);
      team.melds.push(meld);
    }
  }

  if (team.melds.length > 0) trySetHasMelded(team, s.rules);
  return s;
}

function meldedCardIdsFromPlan(plan: MeldActionPlan): string[] {
  return [
    ...plan.newMelds.flatMap((g) => g.map((c) => c.id)),
    ...plan.additions.flatMap((a) => a.cards.map((c) => c.id)),
  ];
}

function applyMeldPlan(state: MatchState, playerIndex: number, plan: MeldActionPlan): MatchState {
  const s = cloneState(state);
  const player = s.players[playerIndex];
  const teamId = getTeamId(playerIndex);
  const team = s.teams[teamId];

  for (const group of plan.newMelds) {
    if (!isValidMeld(group)) continue;
    const rank = group.find((c) => !isWild(c))!.rank;
    player.hand = removeCardsFromHand(player.hand, group);
    const existingIdx = team.melds.findIndex((m) => m.rank === rank);
    if (existingIdx >= 0) {
      team.melds[existingIdx] = {
        rank,
        cards: [...team.melds[existingIdx].cards, ...group],
      };
    } else {
      team.melds.push({ rank, cards: [...group] });
    }
  }

  for (const addition of plan.additions) {
    const existingIdx = team.melds.findIndex((m) => m.rank === addition.meldRank);
    if (existingIdx < 0) continue;
    let current = team.melds[existingIdx];
    for (const c of addition.cards) {
      if (!canAddToMeld(current, c)) continue;
      player.hand = removeCardsFromHand(player.hand, [c]);
      current = { rank: current.rank, cards: [...current.cards, c] };
    }
    team.melds[existingIdx] = current;
  }

  if (team.melds.length > 0) trySetHasMelded(team, s.rules);

  const meldedIds = meldedCardIdsFromPlan(plan);
  s.requiredMeldCardIds = s.requiredMeldCardIds.filter((id) => !meldedIds.includes(id));
  return s;
}

function clearRequiredMeldCards(state: MatchState, meldedIds: string[]): MatchState {
  const s = cloneState(state);
  s.requiredMeldCardIds = s.requiredMeldCardIds.filter((id) => !meldedIds.includes(id));
  return s;
}

export function drawStock(state: MatchState): GameActionResult {
  if (state.turnPhase !== 'draw') {
    return { ok: false, error: 'Not in draw phase', state };
  }
  if (state.stock.length === 0) {
    return finishHand(state, null);
  }
  const draw = drawFromStock(state.stock);
  if (!draw) return finishHand(state, null);

  let s = cloneState(state);
  s.stock = draw.stock;
  s.players[s.currentPlayer].hand.push(draw.card);
  const teamId = getTeamId(s.currentPlayer);
  const redsBefore = s.teams[teamId].redThrees.length;
  s = resolveRedThrees(s, s.currentPlayer);
  const redsLaid = redThreesLaidCount(redsBefore, s.teams[teamId].redThrees.length);
  s.hasDrawnThisTurn = true;
  s.turnPhase = 'meld';
  s.requiredMeldCardIds = [];
  s.message =
    redsLaid > 0
      ? `Red 3 laid — drew replacement${redsLaid > 1 ? ` (${redsLaid} red 3s)` : ''}. Meld or skip`
      : 'Optional: select cards to meld, or skip';
  return { ok: true, state: s };
}

export function takeDiscardPile(state: MatchState): GameActionResult {
  if (state.turnPhase !== 'draw') {
    return { ok: false, error: 'Not in draw phase', state };
  }
  const idx = state.currentPlayer;
  if (!canTakeDiscard(state, state.players[idx].hand)) {
    let error = 'Cannot take discard pile';
    if (isDiscardBlockedByBlackThree(state.discard, state.rules)) {
      error = 'Discard pile is blocked — top card is a black 3';
    } else if (isDiscardPileFrozen(state.discard, state.rules)) {
      const top = state.discard[state.discard.length - 1];
      error = isWild(top)
        ? 'Discard pile is frozen — wild on top (cannot take pile)'
        : `Discard pile is frozen — need ${state.rules.frozenPileNaturalPair} natural ${top.rank}s in hand`;
    }
    return { ok: false, error, state };
  }

  let s = cloneState(state);
  const pile = [...s.discard];
  const top = pile[pile.length - 1];
  s.discard = [];
  s.players[idx].hand.push(...pile);
  const teamId = getTeamId(idx);
  const redsBefore = s.teams[teamId].redThrees.length;
  s = resolveRedThrees(s, idx);
  const redsLaid = redThreesLaidCount(redsBefore, s.teams[teamId].redThrees.length);
  s.hasDrawnThisTurn = true;
  s.turnPhase = 'meld';
  s.requiredMeldCardIds = [top.id];
  s.players[idx].partnerTookDiscard = false;
  const partnerIdx = getPartnerIndex(idx, s.players.length);
  if (getTeamId(partnerIdx) === teamId) {
    s.players[partnerIdx].partnerTookDiscard = true;
  }
  s.message =
    redsLaid > 0
      ? `Took the pile — must meld the top card (${top.rank}). Red 3 laid too.`
      : `Took the pile — you must meld the top ${top.rank} card now`;
  return { ok: true, state: s };
}

export function isPreDrawMeldPhase(state: MatchState): boolean {
  return state.turnPhase === 'draw' && !state.hasDrawnThisTurn;
}

export function canMeldNow(state: MatchState): boolean {
  return state.turnPhase === 'meld' || isPreDrawMeldPhase(state);
}

function meldFollowUpMessage(state: MatchState, detail: string): string {
  const team = state.teams[getTeamId(state.currentPlayer)];
  if (!team.hasMelded && team.melds.length > 0) {
    const required = getInitialMeldRequirement(team.score, state.rules);
    const total = teamMeldTablePoints(team.melds);
    if (total < required) {
      const staged = `${detail} — ${total}/${required} pts on table`;
      if (isPreDrawMeldPhase(state)) {
        return `${staged} — draw or take discard to finish opening`;
      }
      return `${staged} — meld more before discarding`;
    }
  }
  if (isPreDrawMeldPhase(state)) {
    return `${detail} — meld again, or draw / take discard`;
  }
  return `${detail} — meld again or skip to discard`;
}

export function layMeld(state: MatchState, cards: Card[]): GameActionResult {
  if (!canMeldNow(state)) {
    return { ok: false, error: 'Cannot meld now', state };
  }
  const idx = state.currentPlayer;
  const player = state.players[idx];
  const teamId = getTeamId(idx);
  const team = state.teams[teamId];

  if (!cards.every((c) => player.hand.some((h) => h.id === c.id))) {
    return { ok: false, error: 'Selected cards are not in your hand', state };
  }
  if (!isValidMeld(cards) || cards.length < state.rules.minMeldSize) {
    return { ok: false, error: `Invalid meld — need ${state.rules.minMeldSize}+ cards of the same rank`, state };
  }

  const rank = cards.find((c) => !isWild(c))!.rank;
  const meld: Meld = { rank, cards: [...cards] };

  const emptyHand = rejectIfMeldEmptiesHand(state, idx, cards.length);
  if (emptyHand) return emptyHand;

  let s = applyMeldsToTeam(state, idx, [meld]);
  s = clearRequiredMeldCards(s, meld.cards.map((c) => c.id));
  s.message = meldFollowUpMessage(s, 'Meld laid');

  return { ok: true, state: s };
}

/** End the hand when the stock is empty at the start of a draw phase. */
export function checkStockExhaustion(state: MatchState): GameActionResult | null {
  if (state.phase !== 'playing' || state.turnPhase !== 'draw') return null;
  if (state.stock.length > 0) return null;
  return finishHand(state, null);
}

/** Lay new melds and/or add cards to existing team melds from a selection. */
export function layMeldsFromSelection(
  state: MatchState,
  cards: Card[],
  targetMeldRank?: Rank | null,
): GameActionResult {
  if (!canMeldNow(state)) {
    return { ok: false, error: 'Cannot meld now', state };
  }

  const idx = state.currentPlayer;
  const player = state.players[idx];
  const teamId = getTeamId(idx);
  const team = state.teams[teamId];

  if (!cards.every((c) => player.hand.some((h) => h.id === c.id))) {
    return { ok: false, error: 'Selected cards are not in your hand', state };
  }

  const effectiveCards = effectiveMeldSelection(
    player.hand,
    cards,
    team.melds,
    state.rules.minMeldSize,
    targetMeldRank,
  );

  const plan = planMeldActions(
    effectiveCards,
    team.melds,
    state.rules.minMeldSize,
    targetMeldRank,
  );

  if (!isValidMeldPlan(plan, effectiveCards.length)) {
    if (needsMeldTarget(cards, team.melds, targetMeldRank, state.rules.minMeldSize)) {
      return {
        ok: false,
        error: 'Tap a meld pile to choose where to add your wild card(s)',
        state,
      };
    }
    if (plan.newMelds.length === 0 && plan.additions.length === 0) {
      return {
        ok: false,
        error: `Select valid melds (${state.rules.minMeldSize}+ of a rank, wilds need matching naturals) or cards to add to existing piles`,
        state,
      };
    }
    return {
      ok: false,
      error: 'Some selected cards cannot be melded — adjust selection',
      state,
    };
  }

  if (
    state.requiredMeldCardIds.length > 0 &&
    !canUseRequiredCardsInPlan(
      effectiveCards,
      state.requiredMeldCardIds,
      team.melds,
      state.rules.minMeldSize,
      targetMeldRank,
    )
  ) {
    return {
      ok: false,
      error:
        'Your meld must include the discard pile top card in a valid meld — add matching cards or wilds as needed',
      state,
    };
  }

  for (const group of plan.newMelds) {
    if (!isValidMeld(group) || group.length < state.rules.minMeldSize) {
      return { ok: false, error: 'Invalid new meld in selection', state };
    }
  }

  for (const addition of plan.additions) {
    const existing = team.melds.find((m) => m.rank === addition.meldRank);
    if (!existing) {
      return { ok: false, error: `No ${addition.meldRank} meld on your team`, state };
    }
    let current = existing;
    for (const c of addition.cards) {
      if (!canAddToMeld(current, c)) {
        return { ok: false, error: `Cannot add ${c.rank} to ${addition.meldRank} meld`, state };
      }
      current = { rank: current.rank, cards: [...current.cards, c] };
    }
  }

  const emptyHand = rejectIfMeldEmptiesHand(state, idx, plannedCardCount(plan));
  if (emptyHand) return emptyHand;

  let s = applyMeldPlan(state, idx, plan);

  const parts: string[] = [];
  if (plan.newMelds.length > 0) {
    parts.push(`${plan.newMelds.length} meld${plan.newMelds.length > 1 ? 's' : ''} laid`);
  }
  if (plan.additions.length > 0) {
    const n = plan.additions.reduce((sum, a) => sum + a.cards.length, 0);
    parts.push(`added ${n} card${n > 1 ? 's' : ''} to pile${plan.additions.length > 1 ? 's' : ''}`);
  }
  s.message = meldFollowUpMessage(s, parts.join(', '));

  return { ok: true, state: s };
}

export function canSkipMeldPhase(state: MatchState): boolean {
  if (state.turnPhase !== 'meld') return false;
  if (state.requiredMeldCardIds.length > 0) return false;
  const team = state.teams[getTeamId(state.currentPlayer)];
  if (!team.hasMelded && team.melds.length > 0) {
    if (!meetsInitialMeldRequirement(team, state.rules)) return false;
  }
  return true;
}

/** True when the current player has at least one legal discard. */
export function hasLegalDiscardOption(state: MatchState, playerIndex: number): boolean {
  if (state.turnPhase !== 'discard') return false;
  const player = state.players[playerIndex];
  for (const card of player.hand) {
    if (!isLegalDiscard(state.discard, card, state.rules)) continue;
    if (player.hand.length === 1 && !canPlayerGoOut(state, player)) continue;
    return true;
  }
  return false;
}

/** Player cannot skip meld or discard — undo is needed to continue. */
export function isPlayerTurnStuck(state: MatchState, playerIndex: number): boolean {
  if (state.phase !== 'playing' || state.currentPlayer !== playerIndex) return false;
  if (state.turnPhase === 'meld') return !canSkipMeldPhase(state);
  if (state.turnPhase === 'discard') return !hasLegalDiscardOption(state, playerIndex);
  return false;
}

export function cloneMatchState(state: MatchState): MatchState {
  return cloneState(state);
}

export function skipMeldPhase(state: MatchState): GameActionResult {
  if (state.turnPhase !== 'meld') {
    return { ok: false, error: 'Not in meld phase', state };
  }
  if (state.requiredMeldCardIds.length > 0) {
    return {
      ok: false,
      error: 'You must meld the discard pile top card before continuing',
      state,
    };
  }

  const s = cloneState(state);
  const team = s.teams[getTeamId(s.currentPlayer)];
  if (!team.hasMelded && team.melds.length > 0) {
    if (!meetsInitialMeldRequirement(team, s.rules)) {
      const required = getInitialMeldRequirement(team.score, s.rules);
      const total = teamMeldTablePoints(team.melds);
      return {
        ok: false,
        error: `Initial meld needs ${required}+ points on the table (${total} so far) — meld more before discarding`,
        state,
      };
    }
    team.hasMelded = true;
  }

  s.turnPhase = 'discard';
  s.message = 'Select a card to discard';
  return { ok: true, state: s };
}

export function discardCard(state: MatchState, card: Card): GameActionResult {
  if (state.turnPhase !== 'discard') {
    return { ok: false, error: 'Not in discard phase', state };
  }
  const idx = state.currentPlayer;
  const player = state.players[idx];
  if (!player.hand.some((h) => h.id === card.id)) {
    return { ok: false, error: 'Card not in hand', state };
  }
  if (!isLegalDiscard(state.discard, card, state.rules)) {
    return {
      ok: false,
      error: state.rules.oneCardFreezeRule
        ? 'Illegal discard — cannot match the top discard rank'
        : 'Illegal discard',
      state,
    };
  }

  const isLastCard = player.hand.length === 1;
  if (isLastCard && !canPlayerGoOut(state, player)) {
    return {
      ok: false,
      error: goOutDiscardError(state, idx),
      state,
    };
  }

  let s = cloneState(state);
  s.players[idx].hand = removeCardsFromHand(s.players[idx].hand, [card]);
  s.discard.push(card);

  let redThreeNote = '';
  if (isRedThree(card)) {
    s = turnStockCardOntoDiscard(s);
    const top = s.discard[s.discard.length - 1];
    redThreeNote =
      top && top.id !== card.id
        ? 'Discard pile frozen (red 3 — stock card turned up). '
        : 'Discard pile frozen (red 3). ';
  }

  if (s.players[idx].hand.length === 0) return finishHand(s, idx);

  const result = endTurn(s);
  if (result.ok && result.state && redThreeNote) {
    result.state.message = redThreeNote + result.state.message;
  }
  return result;
}

function endTurn(state: MatchState): GameActionResult {
  const s = cloneState(state);
  s.currentPlayer = (s.currentPlayer + 1) % s.players.length;
  s.turnPhase = 'draw';
  s.hasDrawnThisTurn = false;
  s.requiredMeldCardIds = [];

  const stockEnd = checkStockExhaustion(s);
  if (stockEnd) return stockEnd;

  const next = s.players[s.currentPlayer];
  s.message = `${next.name}'s turn — meld, draw, or take discard`;
  return { ok: true, state: s };
}

function finishHand(state: MatchState, goingOutPlayer: number | null): GameActionResult {
  const s = cloneState(state);
  const rules = s.rules;

  const team0Left = s.players.filter((p) => p.teamId === 0).flatMap((p) => p.hand);
  const team1Left = s.players.filter((p) => p.teamId === 1).flatMap((p) => p.hand);

  const team0WentOut = goingOutPlayer !== null && getTeamId(goingOutPlayer) === 0;
  const team1WentOut = goingOutPlayer !== null && getTeamId(goingOutPlayer) === 1;

  const score0 = scoreHand(
    s.teams[0].melds,
    s.teams[0].redThrees,
    team0WentOut ? [] : team0Left,
    team0WentOut,
    s.teams[0].hasMelded,
    rules,
  );
  const score1 = scoreHand(
    s.teams[1].melds,
    s.teams[1].redThrees,
    team1WentOut ? [] : team1Left,
    team1WentOut,
    s.teams[1].hasMelded,
    rules,
  );

  const winningTeamId =
    goingOutPlayer !== null
      ? getTeamId(goingOutPlayer)
      : score0.total >= score1.total
        ? 0
        : 1;

  s.teams[0].score += score0.total;
  s.teams[1].score += score1.total;
  s.handsPlayed += 1;

  const humanTeamId = getTeamId(s.humanSeat);
  const stockExhausted = goingOutPlayer === null;
  s.lastHandResult = {
    winningTeamId,
    teamScores: [score0.total, score1.total],
    humanWon: winningTeamId === humanTeamId,
    humanPoints: humanTeamId === 0 ? score0.total : score1.total,
    stockExhausted,
  };

  if (s.teams[0].score >= rules.targetScore || s.teams[1].score >= rules.targetScore) {
    s.phase = 'gameOver';
    s.winnerTeamId = s.teams[0].score >= s.teams[1].score ? 0 : 1;
    s.message = stockExhausted
      ? `Game over — stock exhausted. Team ${s.winnerTeamId! + 1} wins the match`
      : `Game over! Team ${s.winnerTeamId + 1} wins the match`;
    return { ok: true, state: s };
  }

  s.phase = 'handOver';
  s.message = stockExhausted
    ? `Hand over — stock exhausted (Team ${winningTeamId + 1} scored higher)`
    : `Hand over — Team ${winningTeamId + 1} went out`;
  return { ok: true, state: s };
}

export function startNextHand(
  state: MatchState,
  dealResult: import('./deck.js').DealResult,
): MatchState {
  const s = cloneState(state);
  const names = s.players.map((p) => p.name) as [string, string, string, string];
  const aiDiffs = s.players.filter((p) => p.aiDifficulty).map((p) => p.aiDifficulty!);

  const fresh = createMatchFromDeal(dealResult, {
    humanSeat: s.humanSeat,
    rules: s.rules,
    playerNames: names,
    aiDifficulties:
      aiDiffs.length >= 3
        ? ([aiDiffs[0], aiDiffs[1], aiDiffs[2]] as [
            typeof aiDiffs[0],
            typeof aiDiffs[0],
            typeof aiDiffs[0],
          ])
        : undefined,
  });

  fresh.teams[0].score = s.teams[0].score;
  fresh.teams[1].score = s.teams[1].score;
  fresh.handsPlayed = s.handsPlayed;
  fresh.lastHandResult = null;
  fresh.phase = 'playing';
  return fresh;
}

export function isHumanTurn(state: MatchState): boolean {
  return state.players[state.currentPlayer].isHuman;
}

export function isAIPlayer(state: MatchState): boolean {
  return !state.players[state.currentPlayer].isHuman;
}

export function canTakeDiscardAction(state: MatchState): boolean {
  return (
    state.turnPhase === 'draw' &&
    canTakeDiscard(state, state.players[state.currentPlayer].hand)
  );
}

export function getSelectedMeldRank(cards: Card[]): Rank | null {
  if (cards.length === 0) return null;
  const naturals = cards.filter((c) => !isWild(c));
  if (naturals.length === 0) return null;
  const rank = naturals[0].rank;
  return naturals.every((c) => c.rank === rank) ? rank : null;
}

export function addToExistingMeld(
  state: MatchState,
  meldRank: Rank,
  cards: Card[],
): GameActionResult {
  if (!canMeldNow(state)) {
    return { ok: false, error: 'Cannot meld now', state };
  }
  const idx = state.currentPlayer;
  const team = state.teams[getTeamId(idx)];
  const existing = team.melds.find((m) => m.rank === meldRank);
  if (!existing) return { ok: false, error: 'No meld of that rank on your team', state };

  const player = state.players[idx];
  if (!cards.every((c) => player.hand.some((h) => h.id === c.id))) {
    return { ok: false, error: 'Cards not in hand', state };
  }

  let current = existing;
  for (const c of cards) {
    if (!canAddToMeld(current, c)) {
      return { ok: false, error: 'Cannot add card to this meld', state };
    }
    current = { rank: current.rank, cards: [...current.cards, c] };
  }

  const emptyHand = rejectIfMeldEmptiesHand(state, idx, cards.length);
  if (emptyHand) return emptyHand;

  let s = applyMeldsToTeam(state, idx, [{ rank: meldRank, cards: [...cards] }]);
  s = clearRequiredMeldCards(s, cards.map((c) => c.id));
  s.message = meldFollowUpMessage(
    s,
    `Added ${cards.length} card${cards.length > 1 ? 's' : ''} to ${meldRank} meld`,
  );

  return { ok: true, state: s };
}