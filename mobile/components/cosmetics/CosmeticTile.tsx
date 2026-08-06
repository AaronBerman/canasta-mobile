import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cosmetic, CosmeticCategory } from '../../constants/cosmetics/types';
import { CardBackView } from '../cards/CardBackView';
import { useCosmetics } from '../../stores/cosmetics-store';

interface CosmeticTileProps {
  item: Cosmetic;
  category: CosmeticCategory;
  selected: boolean;
  onSelect: () => void;
}

export function CosmeticTile({ item, category, selected, onSelect }: CosmeticTileProps) {
  const { isOwned, canClaim, unlockWithAd, claimProgressUnlock, equip } = useCosmetics();
  const owned = isOwned(item.id);
  const claimable = canClaim(item.id);
  const locked = !owned;

  async function handlePress() {
    if (owned) {
      await equip(category, item.id);
      onSelect();
      return;
    }

    if (claimable) {
      await claimProgressUnlock(item.id);
      await equip(category, item.id);
      onSelect();
      return;
    }

    if (item.unlock.method === 'rewarded_ad') {
      const msg = await unlockWithAd(item.id);
      if (msg) {
        await equip(category, item.id);
        onSelect();
      }
    }
  }

  return (
    <Pressable
      style={[styles.tile, selected && styles.tileSelected, locked && styles.tileLocked]}
      onPress={handlePress}
    >
      <Preview item={item} />
      <Text style={styles.name}>{item.name}</Text>
      <StatusBadge owned={owned} claimable={claimable} unlockLabel={item.unlock.label} />
      {selected && (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#fbbf24" />
        </View>
      )}
      {locked && !claimable && item.unlock.method === 'rewarded_ad' && (
        <View style={styles.lockOverlay}>
          <Ionicons name="play-circle" size={28} color="#fff" />
          <Text style={styles.lockText}>Watch Ad</Text>
        </View>
      )}
      {locked && !claimable && item.unlock.method !== 'rewarded_ad' && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={24} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

function Preview({ item }: { item: Cosmetic }) {
  if (item.category === 'cardBack') {
    return <CardBackView cosmetic={item} width={72} height={100} />;
  }

  if (item.category === 'fontStyle') {
    const fontFamily = item.fontFamily === 'System' ? undefined : item.fontFamily;
    return (
      <View style={[styles.fontPreview, { backgroundColor: item.previewColors[1] }]}>
        <Text style={[styles.fontRank, { fontFamily, letterSpacing: item.letterSpacing }]}>
          K
        </Text>
        <Text style={[styles.fontSuit, { fontFamily }]}>♠</Text>
      </View>
    );
  }

  return (
    <View style={[styles.tablePreview, { backgroundColor: item.gradient[1] }]}>
      <View style={[styles.tableRail, { backgroundColor: item.railColor }]} />
      <View style={[styles.tableAccent, { backgroundColor: item.accentColor }]} />
    </View>
  );
}

function StatusBadge({
  owned,
  claimable,
  unlockLabel,
}: {
  owned: boolean;
  claimable: boolean;
  unlockLabel: string;
}) {
  if (owned) {
    return <Text style={styles.statusOwned}>Equipped available</Text>;
  }
  if (claimable) {
    return <Text style={styles.statusClaim}>Tap to claim!</Text>;
  }
  return <Text style={styles.statusLocked} numberOfLines={2}>{unlockLabel}</Text>;
}

const styles = StyleSheet.create({
  tile: {
    width: '47%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  tileSelected: {
    borderColor: '#fbbf24',
  },
  tileLocked: {
    opacity: 0.85,
  },
  name: {
    color: '#f8fafc',
    fontWeight: '600',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  statusOwned: {
    color: '#86efac',
    fontSize: 11,
    marginTop: 4,
  },
  statusClaim: {
    color: '#fbbf24',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
  },
  statusLocked: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  fontPreview: {
    width: 72,
    height: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontRank: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  fontSuit: {
    color: '#111827',
    fontSize: 24,
  },
  tablePreview: {
    width: 100,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableRail: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  tableAccent: {
    width: 60,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
});
