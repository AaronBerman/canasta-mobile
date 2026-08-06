/** Match bootstrap — kept separate so the mobile bundle avoids multiplayer modules. */
export {
  createSinglePlayerMatch,
  createSinglePlayerGame,
  createCampaignMatch,
  dealNextHand,
  type SinglePlayerConfig,
  type CampaignMatchConfig,
} from '../shared-src/match-factory';
