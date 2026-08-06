import { RefObject } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, DiscardPileStatus } from '../../engine/index';
import { CardBackCosmetic, FontStyleCosmetic } from '../../constants/cosmetics/types';
import { CardBackView } from '../cards/CardBackView';
import { DiscardPileView } from '../cards/DiscardPileView';

interface TableCenterPilesProps {
  stockCount: number;
  discard: Card[];
  discardStatus: DiscardPileStatus;
  discardStatusHint: string;
  cardBack: CardBackCosmetic;
  fontStyle: FontStyleCosmetic;
  discardZoneRef: RefObject<View | null>;
}

export function TableCenterPiles({
  stockCount,
  discard,
  discardStatus,
  discardStatusHint,
  cardBack,
  fontStyle,
  discardZoneRef,
}: TableCenterPilesProps) {
  return (
    <View ref={discardZoneRef} style={styles.row}>
      <View style={styles.pile}>
        <Text style={styles.label}>Stock</Text>
        <Text style={styles.count}>{stockCount}</Text>
        <CardBackView cosmetic={cardBack} width={48} height={66} />
      </View>

      <View style={styles.arrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>

      <View
        style={[
          styles.pile,
          styles.discardPile,
          discardStatus === 'blocked' && styles.discardBlocked,
          discardStatus === 'frozen' && styles.discardFrozen,
        ]}
      >
        <View style={styles.discardHeader}>
          <Text style={styles.label}>Discard</Text>
          <Text style={styles.count}>{discard.length}</Text>
          {discardStatus === 'blocked' && <Text style={styles.badge}>⛔</Text>}
          {discardStatus === 'frozen' && <Text style={styles.badge}>❄</Text>}
        </View>
        <Text style={styles.hint} numberOfLines={2}>
          {discardStatusHint}
        </Text>
        <DiscardPileView
          discard={discard}
          fontStyle={fontStyle}
          width={48}
          height={66}
          emptyPileStyle={styles.emptyPile}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  pile: {
    alignItems: 'center',
    gap: 2,
    minWidth: 72,
  },
  discardPile: {
    borderWidth: 2,
    borderColor: 'rgba(251,191,36,0.35)',
    borderRadius: 12,
    borderStyle: 'dashed',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  discardBlocked: {
    borderColor: 'rgba(248,113,113,0.8)',
    backgroundColor: 'rgba(127,29,29,0.2)',
  },
  discardFrozen: {
    borderColor: 'rgba(125,211,252,0.75)',
    backgroundColor: 'rgba(12,74,110,0.2)',
  },
  discardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  count: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  badge: {
    fontSize: 10,
  },
  hint: {
    color: '#94a3b8',
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 11,
    maxWidth: 100,
    marginBottom: 2,
  },
  arrow: {
    opacity: 0.35,
    paddingBottom: 12,
  },
  arrowText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '300',
  },
  emptyPile: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#64748b',
    borderStyle: 'dashed',
  },
});
