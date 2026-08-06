import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameRules,
  RULE_PRESETS,
  DEFAULT_RULES,
  buildCustomRules,
  validateRules,
} from '../engine/index';

const RULES_KEY = '@canasta/game-rules';

export interface SavedRulesConfig {
  presetId: string;
  customOverrides: Partial<GameRules> | null;
}

const DEFAULT_CONFIG: SavedRulesConfig = {
  presetId: 'classic',
  customOverrides: null,
};

export async function loadRulesConfig(): Promise<SavedRulesConfig> {
  try {
    const raw = await AsyncStorage.getItem(RULES_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as SavedRulesConfig & {
      customOverrides?: Partial<GameRules> & { requireCanastaToGoOut?: boolean };
    };
    let migrated = false;
    if (parsed.customOverrides?.requireCanastaToGoOut !== undefined) {
      const legacy = parsed.customOverrides;
      parsed.customOverrides = {
        ...legacy,
        canastasRequiredToGoOut:
          legacy.canastasRequiredToGoOut ?? (legacy.requireCanastaToGoOut ? 1 : 0),
      };
      delete (parsed.customOverrides as Record<string, unknown>).requireCanastaToGoOut;
      migrated = true;
    }
    if (migrated) {
      await saveRulesConfig(parsed);
    }
    return parsed;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveRulesConfig(config: SavedRulesConfig): Promise<void> {
  await AsyncStorage.setItem(RULES_KEY, JSON.stringify(config));
}

export async function loadActiveRules(): Promise<GameRules> {
  const config = await loadRulesConfig();
  return resolveRules(config);
}

export function resolveRules(config: SavedRulesConfig): GameRules {
  const preset = RULE_PRESETS[config.presetId] ?? DEFAULT_RULES;
  if (!config.customOverrides) return preset;
  return buildCustomRules(config.presetId as keyof typeof RULE_PRESETS, config.customOverrides);
}

export async function setRulesPreset(presetId: string): Promise<GameRules> {
  const config: SavedRulesConfig = { presetId, customOverrides: null };
  await saveRulesConfig(config);
  return RULE_PRESETS[presetId] ?? DEFAULT_RULES;
}

export async function saveCustomRules(
  basePresetId: string,
  overrides: Partial<GameRules>,
): Promise<{ rules: GameRules; errors: string[] }> {
  const rules = buildCustomRules(basePresetId as keyof typeof RULE_PRESETS, overrides);
  const errors = validateRules(rules);
  if (errors.length === 0) {
    await saveRulesConfig({ presetId: basePresetId, customOverrides: overrides });
  }
  return { rules, errors };
}

export function getPresetList(): { id: string; name: string; description: string }[] {
  return Object.values(RULE_PRESETS).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
  }));
}

export const CUSTOMIZABLE_FIELDS: {
  key: keyof GameRules;
  label: string;
  type: 'boolean' | 'number';
  min?: number;
  max?: number;
  step?: number;
}[] = [
  { key: 'targetScore', label: 'Target score to win', type: 'number', min: 500, max: 10000, step: 500 },
  { key: 'cardsPerHand', label: 'Cards per hand', type: 'number', min: 7, max: 15, step: 1 },
  { key: 'requirePartnerTookDiscard', label: 'Partner must take discard to go out', type: 'boolean' },
  { key: 'canastasRequiredToGoOut', label: 'Canastas required to go out', type: 'number', min: 0, max: 4, step: 1 },
  { key: 'allowTakeDiscardPile', label: 'Allow taking discard pile', type: 'boolean' },
  { key: 'frozenPileEnabled', label: 'Wild cards freeze discard pile', type: 'boolean' },
  { key: 'blackThreeBlocksPile', label: 'Black 3 on top blocks pile', type: 'boolean' },
  { key: 'oneCardFreezeRule', label: 'Block discarding same rank as pile top', type: 'boolean' },
  { key: 'naturalCanastaBonus', label: 'Natural canasta bonus', type: 'number', min: 100, max: 1000, step: 50 },
  { key: 'mixedCanastaBonus', label: 'Mixed canasta bonus', type: 'number', min: 100, max: 1000, step: 50 },
  { key: 'goingOutBonus', label: 'Going out bonus', type: 'number', min: 0, max: 500, step: 25 },
];
