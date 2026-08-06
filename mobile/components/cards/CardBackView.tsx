import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardBackCosmetic } from '../../constants/cosmetics/types';

interface CardBackProps {
  cosmetic: CardBackCosmetic;
  width?: number;
  height?: number;
}

export function CardBackView({ cosmetic, width = 64, height = 90 }: CardBackProps) {
  return (
    <View style={[styles.wrapper, { width, height, borderRadius: width * 0.08 }]}>
      <LinearGradient
        colors={[cosmetic.primaryColor, cosmetic.secondaryColor, cosmetic.primaryColor]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <PatternOverlay pattern={cosmetic.pattern} accent={cosmetic.accentColor} />
      <View style={[styles.border, { borderColor: cosmetic.accentColor, borderRadius: width * 0.08 }]} />
    </View>
  );
}

function PatternOverlay({ pattern, accent }: { pattern: CardBackCosmetic['pattern']; accent: string }) {
  switch (pattern) {
    case 'classic':
      return (
        <View style={styles.patternCenter}>
          <View style={[styles.diamond, { borderColor: accent }]} />
        </View>
      );
    case 'diamond':
      return (
        <View style={styles.patternGrid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={[styles.miniDiamond, { borderColor: accent }]} />
          ))}
        </View>
      );
    case 'waves':
      return (
        <View style={styles.patternCenter}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.wave, { borderColor: accent, marginTop: i * 6 }]}
            />
          ))}
        </View>
      );
    case 'stars':
      return (
        <View style={styles.patternGrid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i} style={[styles.star, { backgroundColor: accent }]} />
          ))}
        </View>
      );
    case 'royal':
      return (
        <View style={styles.patternCenter}>
          <View style={[styles.crown, { borderColor: accent }]} />
          <View style={[styles.royalLine, { backgroundColor: accent }]} />
        </View>
      );
    case 'midnight':
      return (
        <View style={styles.patternGrid}>
          {Array.from({ length: 16 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: accent, opacity: 0.3 + (i % 3) * 0.2 },
              ]}
            />
          ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
  },
  patternCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
  },
  diamond: {
    width: 28,
    height: 28,
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  miniDiamond: {
    width: 10,
    height: 10,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
    opacity: 0.7,
  },
  wave: {
    width: 40,
    height: 20,
    borderTopWidth: 2,
    borderRadius: 20,
    opacity: 0.6,
  },
  star: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
  crown: {
    width: 30,
    height: 16,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  royalLine: {
    width: 36,
    height: 2,
    marginTop: 6,
    opacity: 0.8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
