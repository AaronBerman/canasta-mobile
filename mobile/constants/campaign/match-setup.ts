import {
  createCampaignMatch,
  MatchState,
  Rank,
  Suit,
  Meld,
  Card,
  getPartnerIndex,
} from '../../engine/index';
import { CampaignLevel } from './types';
import { getCampaignRules } from './levels';
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

function makeTableCard(rank: Rank, index: number, teamId: number): Card {
  return {
    id: `camp-t${teamId}-${rank}-${index}`,
    rank,
    suit: SUITS[index % SUITS.length],
  };
}

function buildInitialMeld(rank: Rank, count: number, teamId: number): Meld {
  return {
    rank,
    cards: Array.from({ length: count }, (_, i) => makeTableCard(rank, i, teamId)),
  };
}

export function startCampaignLevel(level: CampaignLevel): MatchState {
  const deal = level.buildDeal();
  const rules = getCampaignRules(level);
  const teamMap = new Map<number, { melds: Meld[]; hasMelded: boolean }>();
  for (const init of level.initialMelds ?? []) {
    const entry = teamMap.get(init.teamId) ?? { melds: [], hasMelded: false };
    entry.melds.push(buildInitialMeld(init.rank as Rank, init.cardCount, init.teamId));
    entry.hasMelded = true;
    teamMap.set(init.teamId, entry);
  }

  const initialTeams = [...teamMap.entries()].map(([teamId, data]) => ({
    teamId,
    melds: data.melds,
    hasMelded: data.hasMelded,
  }));

  const state = createCampaignMatch({
    humanSeat: 0,
    rules,
    dealResult: deal,
    aiDifficulties: level.aiDifficulties,
    openingMessage: level.openingMessage ?? `Level ${level.id}: ${level.title}`,
    initialTeams,
  });

  if (level.partnerTookDiscard) {
    const partnerIdx = getPartnerIndex(state.humanSeat, state.players.length);
    state.players[partnerIdx].partnerTookDiscard = true;
  }

  state.message = level.hint;
  return state;
}
