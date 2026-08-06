import { CampaignLevel } from './types';
import { dealIntroFirstHand } from './deals';

/** ~60-second guided hand before the campaign map (not counted in the 50 levels). */
export const INTRO_TUTORIAL_LEVEL: CampaignLevel = {
  id: 0,
  chapter: 'tutorial',
  title: 'Quick Start',
  description: 'One guided hand — draw, meld, discard — in about a minute.',
  hint: 'Tap the stock to draw. Select your three 7s, tap Meld, then discard any card.',
  objective: { type: 'intro_first_hand' },
  rulesPreset: 'tutorial',
  aiDifficulties: ['easy', 'easy', 'easy'],
  openingMessage: 'Welcome to Canasta Table! Complete one turn: draw → meld → discard.',
  buildDeal: () => dealIntroFirstHand(),
};
