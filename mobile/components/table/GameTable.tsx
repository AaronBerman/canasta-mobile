import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TableSkinCosmetic } from '../../constants/cosmetics/types';

interface GameTableProps {
  skin: TableSkinCosmetic;
  children: ReactNode;
}

export function GameTable({ skin, children }: GameTableProps) {
  return (
    <View style={styles.outer}>
      <View style={[styles.rail, { backgroundColor: skin.railColor }]}>
        <LinearGradient
          colors={skin.gradient}
          style={styles.felt}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <View style={[styles.accentRing, { borderColor: skin.accentColor }]} />
          <View style={styles.content}>{children}</View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    padding: 10,
  },
  rail: {
    flex: 1,
    borderRadius: 24,
    padding: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  felt: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  accentRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
    opacity: 0.35,
  },
  content: {
    flex: 1,
    padding: 12,
  },
});
