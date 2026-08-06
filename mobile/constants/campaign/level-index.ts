/**
 * Lightweight campaign metadata for the map screen.
 * Does not import deal builders — keeps the campaign list bundle small.
 */
export {
  CAMPAIGN_LEVEL_DEFINITIONS as CAMPAIGN_LEVEL_INDEX,
  TOTAL_CAMPAIGN_LEVELS,
  getChapterLabel,
} from './levels-data';

export type { CampaignLevelDefinition } from './types';
