import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface OtherPlayerSeat {
  id: number;
  role: 'P' | 'O';
  name: string;
  cardCount: number;
  isActive: boolean;
}

interface OtherPlayersDropdownProps {
  players: OtherPlayerSeat[];
}

export function OtherPlayersDropdown({ players }: OtherPlayersDropdownProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const summary = players
    .map((p) => `${p.role} ${p.cardCount}`)
    .join(' · ');

  return (
    <View
      style={[
        styles.anchor,
        { top: insets.top + 6, right: Math.max(insets.right, 8) },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Other players hand counts"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {summary}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#94a3b8"
        />
      </Pressable>

      {open && (
        <View style={styles.panel}>
          {players.map((p) => (
            <View
              key={p.id}
              style={[styles.row, p.isActive && styles.rowActive]}
            >
              <Text style={[styles.role, p.role === 'P' && styles.rolePartner]}>
                {p.role}
              </Text>
              <Text style={styles.count}>{p.cardCount} cards</Text>
              {p.isActive && <View style={styles.activeDot} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    zIndex: 200,
    maxWidth: 220,
    alignItems: 'flex-end',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,23,42,0.94)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  triggerOpen: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  triggerText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 160,
  },
  panel: {
    width: '100%',
    minWidth: 168,
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#475569',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71,85,105,0.5)',
  },
  rowActive: {
    backgroundColor: 'rgba(251,191,36,0.12)',
  },
  role: {
    width: 18,
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '800',
  },
  rolePartner: {
    color: '#86efac',
  },
  count: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
});
