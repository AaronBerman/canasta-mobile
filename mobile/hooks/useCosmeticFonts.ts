import { useMemo } from 'react';
import { useFonts } from 'expo-font';
import { Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Oswald_700Bold } from '@expo-google-fonts/oswald';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { FontStyleCosmetic } from '../constants/cosmetics/types';

const ALL_COSMETIC_FONTS = {
  Inter_600SemiBold,
  Oswald_700Bold,
  PlayfairDisplay_700Bold,
} as const;

type CosmeticFontFamily = Exclude<FontStyleCosmetic['fontFamily'], 'System'>;

function fontsToLoad(
  fontFamily?: FontStyleCosmetic['fontFamily'] | 'all',
): Record<string, typeof Inter_600SemiBold> {
  if (fontFamily === 'all') return { ...ALL_COSMETIC_FONTS };
  if (!fontFamily || fontFamily === 'System') return {};
  return { [fontFamily]: ALL_COSMETIC_FONTS[fontFamily as CosmeticFontFamily] };
}

/**
 * Load cosmetic card fonts on demand (game / customize screens).
 * Default "System" font needs no loading — keeps home screen startup fast.
 */
export function useCosmeticFonts(
  fontFamily?: FontStyleCosmetic['fontFamily'] | 'all',
): boolean {
  const loader = useMemo(() => fontsToLoad(fontFamily), [fontFamily]);
  const [loaded] = useFonts(loader);
  return !fontFamily || fontFamily === 'System' || loaded;
}
