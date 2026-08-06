import { CLASSIC_RULES, RELAXED_RULES, SPEED_RULES, TUTORIAL_RULES } from '../../engine/index';
import { CampaignLevel } from './types';
import { getDealForLevel } from './deals';
import {
  CAMPAIGN_LEVEL_DEFINITIONS,
  TOTAL_CAMPAIGN_LEVELS,
  getChapterLabel,
} from './levels-data';

export {
  CAMPAIGN_LEVEL_DEFINITIONS,
  TOTAL_CAMPAIGN_LEVELS,
  getChapterLabel,
} from './levels-data';

export const CAMPAIGN_LEVELS: CampaignLevel[] = CAMPAIGN_LEVEL_DEFINITIONS.map((level) => ({
  ...level,
  buildDeal: () => getDealForLevel(level.id),
}));

export function getCampaignLevel(id: number): CampaignLevel | undefined {
  return CAMPAIGN_LEVELS.find((l) => l.id === id);
}

export function getRulesForLevel(level: CampaignLevel) {
  const base =
    level.rulesPreset === 'tutorial'
      ? TUTORIAL_RULES
      : level.rulesPreset === 'relaxed'
        ? RELAXED_RULES
        : level.rulesPreset === 'speed'
          ? SPEED_RULES
          : CLASSIC_RULES;
  const chosen = level.rulesOverrides ?? base;
  return { ...chosen };
}

/** Campaign levels are single-hand scenarios — never trigger match game-over. */
export function getCampaignRules(level: CampaignLevel) {
  return {
    ...getRulesForLevel(level),
    targetScore: 100_000,
  };
}