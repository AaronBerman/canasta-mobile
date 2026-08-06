import { StyleSheet, Text, View } from 'react-native';
import { CardBackView } from '../cards/CardBackView';
import { PlayingCard } from '../cards/PlayingCard';
import { GameTable } from '../table/GameTable';
import { useCosmetics } from '../../stores/cosmetics-store';
import { Card } from '../../engine/index';

const PREVIEW_CARD: Card = { id: 'preview', suit: 'spades', rank: 'K' };

export function CosmeticPreviewPanel() {
  const { selectedCardBack, selectedFontStyle, selectedTableSkin } = useCosmetics();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Live Preview</Text>
      <GameTable skin={selectedTableSkin}>
        <View style={styles.tableLayout}>
          <View style={styles.opponentArea}>
            <CardBackView cosmetic={selectedCardBack} width={48} height={68} />
            <CardBackView cosmetic={selectedCardBack} width={48} height={68} />
          </View>

          <View style={styles.centerArea}>
            <CardBackView cosmetic={selectedCardBack} width={52} height={72} />
            <PlayingCard
              card={PREVIEW_CARD}
              fontStyle={selectedFontStyle}
              width={52}
              height={72}
            />
          </View>

          <View style={styles.playerArea}>
            <PlayingCard
              card={PREVIEW_CARD}
              fontStyle={selectedFontStyle}
              width={56}
              height={78}
            />
            <Text style={styles.hint}>Your hand uses {selectedFontStyle.name}</Text>
          </View>
        </View>
      </GameTable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  opponentArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  centerArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  playerArea: {
    alignItems: 'center',
    gap: 6,
  },
  hint: {
    color: '#e2e8f0',
    fontSize: 11,
    opacity: 0.8,
  },
});
