import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, cardPointLabel } from '../../engine/index';
import { FontStyleCosmetic } from '../../constants/cosmetics/types';

interface PlayingCardProps {
  card: Card;
  fontStyle: FontStyleCosmetic;
  faceDown?: boolean;
  width?: number;
  height?: number;
  /** Show meld point value on the card face (default true). */
  showPoints?: boolean;
  /** Emphasize cards newly picked up this turn. */
  highlightNew?: boolean;
  /** Rotate the card face (e.g. 90° for sideways wilds on the discard pile). */
  rotationDeg?: number;
}

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  joker: '★',
};

const SUIT_COLOR: Record<string, string> = {
  hearts: '#dc2626',
  diamonds: '#dc2626',
  clubs: '#111827',
  spades: '#111827',
  joker: '#7c3aed',
};

function displayRank(rank: Card['rank']): string {
  if (rank === 'JOKER') return 'Jk';
  return rank;
}

export const PlayingCard = memo(function PlayingCard({
  card,
  fontStyle,
  faceDown = false,
  width = 64,
  height = 90,
  showPoints = true,
  highlightNew = false,
  rotationDeg = 0,
}: PlayingCardProps) {
  if (faceDown) return null;

  const color = SUIT_COLOR[card.suit] ?? '#111827';
  const suit = SUIT_SYMBOL[card.suit] ?? '?';
  const fontFamily = fontStyle.fontFamily === 'System' ? undefined : fontStyle.fontFamily;
  const pointSize = Math.max(8, width * 0.17);
  const rankSize = 16 * fontStyle.rankScale * Math.min(1, width / 64);
  const suitSize = 22 * fontStyle.suitScale * Math.min(1, width / 64);

  const isSideways = rotationDeg % 180 === 90;
  const outerWidth = isSideways ? height : width;
  const outerHeight = isSideways ? width : height;

  const cardFace = (
    <View
      style={[
        styles.card,
        { width, height, borderRadius: width * 0.08 },
        highlightNew && styles.newCard,
        rotationDeg !== 0 && { transform: [{ rotate: `${rotationDeg}deg` }] },
      ]}
    >
      <View style={styles.topRow}>
        <Text
          style={[
            styles.rank,
            {
              color,
              fontFamily,
              fontSize: rankSize,
              letterSpacing: fontStyle.letterSpacing,
            },
          ]}
        >
          {displayRank(card.rank)}
        </Text>
        {showPoints && (
          <Text
            style={[
              styles.points,
              {
                fontSize: pointSize,
                color: card.rank === 'JOKER' || card.rank === '2' ? '#7c3aed' : '#64748b',
              },
            ]}
          >
            {cardPointLabel(card)}
          </Text>
        )}
      </View>
      <Text
        style={[
          styles.suit,
          {
            color,
            fontFamily,
            fontSize: suitSize,
          },
        ]}
      >
        {suit}
      </Text>
    </View>
  );

  if (rotationDeg === 0) return cardFace;

  return (
    <View
      style={{
        width: outerWidth,
        height: outerHeight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {cardFace}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffef7',
    borderWidth: 1,
    borderColor: '#d4d4d8',
    padding: 6,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  newCard: {
    borderWidth: 3,
    borderColor: '#22d3ee',
    shadowColor: '#22d3ee',
    shadowOpacity: 0.55,
    shadowRadius: 5,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 2,
  },
  rank: {
    fontWeight: '700',
    flexShrink: 1,
  },
  points: {
    fontWeight: '800',
    opacity: 0.9,
  },
  suit: {
    alignSelf: 'center',
  },
});
