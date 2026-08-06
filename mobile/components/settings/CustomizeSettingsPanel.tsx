import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CosmeticCategory } from '../../constants/cosmetics/types';
import { getCosmeticsByCategory } from '../../constants/cosmetics/catalog';
import { CosmeticPreviewPanel } from '../cosmetics/CosmeticPreviewPanel';
import { CosmeticTile } from '../cosmetics/CosmeticTile';
import { useCosmetics } from '../../stores/cosmetics-store';
import { useCosmeticFonts } from '../../hooks/useCosmeticFonts';

const TABS: { key: CosmeticCategory; label: string }[] = [
  { key: 'cardBack', label: 'Card Backs' },
  { key: 'fontStyle', label: 'Fonts' },
  { key: 'tableSkin', label: 'Table Skins' },
];

export function CustomizeSettingsPanel() {
  const [tab, setTab] = useState<CosmeticCategory>('cardBack');
  const fontsReady = useCosmeticFonts('all');
  const { cosmetics } = useCosmetics();
  const items = getCosmeticsByCategory(tab);

  const selectedId =
    tab === 'cardBack'
      ? cosmetics.selectedCardBackId
      : tab === 'fontStyle'
        ? cosmetics.selectedFontStyleId
        : cosmetics.selectedTableSkinId;

  if (!fontsReady) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sub}>Unlock and equip card backs, fonts, and table skins.</Text>

      <CosmeticPreviewPanel />

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <CosmeticTile
            key={item.id}
            item={item}
            category={tab}
            selected={selectedId === item.id}
            onSelect={() => {}}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  sub: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fbbf24',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#0f172a',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
