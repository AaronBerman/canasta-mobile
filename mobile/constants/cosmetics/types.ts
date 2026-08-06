export type CosmeticCategory = 'cardBack' | 'fontStyle' | 'tableSkin';

/** How a cosmetic can be unlocked. */
export type UnlockMethod =
  | 'default'
  | 'rewarded_ad'
  | 'single_player_win'
  | 'single_player_milestone'
  | 'campaign_level';

export interface UnlockRequirement {
  method: UnlockMethod;
  /** Human-readable label shown in the customize screen. */
  label: string;
  /** Wins needed for single_player_win, or milestone id for milestone unlocks. */
  threshold?: number;
}

export interface CosmeticBase {
  id: string;
  name: string;
  description: string;
  category: CosmeticCategory;
  unlock: UnlockRequirement;
  previewColors: string[];
}

export interface CardBackCosmetic extends CosmeticBase {
  category: 'cardBack';
  pattern: 'classic' | 'diamond' | 'waves' | 'stars' | 'royal' | 'midnight';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface FontStyleCosmetic extends CosmeticBase {
  category: 'fontStyle';
  fontFamily: 'System' | 'PlayfairDisplay_700Bold' | 'Inter_600SemiBold' | 'Oswald_700Bold';
  rankScale: number;
  suitScale: number;
  letterSpacing: number;
}

export interface TableSkinCosmetic extends CosmeticBase {
  category: 'tableSkin';
  feltStyle: 'classic' | 'midnight' | 'royal' | 'desert' | 'ocean' | 'vintage';
  gradient: [string, string, string];
  railColor: string;
  accentColor: string;
}

export type Cosmetic = CardBackCosmetic | FontStyleCosmetic | TableSkinCosmetic;

export interface PlayerCosmetics {
  unlockedIds: string[];
  selectedCardBackId: string;
  selectedFontStyleId: string;
  selectedTableSkinId: string;
}

export interface UnlockAttemptResult {
  success: boolean;
  cosmeticId: string;
  message: string;
}

export const DEFAULT_COSMETICS: PlayerCosmetics = {
  unlockedIds: ['back-classic', 'font-system', 'table-classic-green'],
  selectedCardBackId: 'back-classic',
  selectedFontStyleId: 'font-system',
  selectedTableSkinId: 'table-classic-green',
};

export const STORAGE_KEY = '@canasta/cosmetics';
