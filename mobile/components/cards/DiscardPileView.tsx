import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card, isRedThree, isWild } from '../../engine/index';
import { FontStyleCosmetic } from '../../constants/cosmetics/types';
import { PlayingCard } from './PlayingCard';

/** Wilds and red 3s freeze the discard pile — shown sideways (90°) like tabletop Canasta. */
export const DISCARD_FREEZE_ROTATION = 90;

export function cardFreezesDiscardPile(card: Card): boolean {
  return isWild(card) || isRedThree(card);
}

/** When the top card is natural, peek at the sideways freeze card beneath it. */
export function findSidewaysFreezeCard(discard: Card[]): Card | undefined {
  if (discard.length < 2) return undefined;
  const top = discard[discard.length - 1];
  if (cardFreezesDiscardPile(top)) return undefined;
  for (let i = discard.length - 2; i >= 0; i--) {
    if (cardFreezesDiscardPile(discard[i])) return discard[i];
  }
  return undefined;
}

interface DiscardPileViewProps {
  discard: Card[];
  fontStyle: FontStyleCosmetic;
  width?: number;
  height?: number;
  emptyPileStyle?: ViewStyle;
}

export function DiscardPileView({
  discard,
  fontStyle,
  width = 52,
  height = 72,
  emptyPileStyle,
}: DiscardPileViewProps) {
  if (discard.length === 0) {
    return (
      <View style={[styles.emptyPile, { width, height }, emptyPileStyle]} />
    );
  }

  const top = discard[discard.length - 1];
  const topRotation = cardFreezesDiscardPile(top) ? DISCARD_FREEZE_ROTATION : 0;
  const sideways = findSidewaysFreezeCard(discard);

  return (
    <View
      style={[
        styles.stack,
        {
          width: width + (sideways ? 18 : 4),
          height: height + (sideways ? 12 : 4),
        },
      ]}
    >
      {sideways && (
        <View style={styles.sidewaysPeek} pointerEvents="none">
          <PlayingCard
            card={sideways}
            fontStyle={fontStyle}
            width={width}
            height={height}
            rotationDeg={DISCARD_FREEZE_ROTATION}
            showPoints={false}
          />
        </View>
      )}
      <View style={styles.topCard}>
        <PlayingCard
          card={top}
          fontStyle={fontStyle}
          width={width}
          height={height}
          rotationDeg={topRotation}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  sidewaysPeek: {
    position: 'absolute',
    left: -6,
    top: 10,
    zIndex: 0,
    opacity: 0.92,
  },
  topCard: {
    zIndex: 1,
  },
  emptyPile: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#64748b',
    borderStyle: 'dashed',
  },
});
